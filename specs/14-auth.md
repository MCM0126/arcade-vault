# 14-auth

**Estado:** Implementado
**Dependencias:** 04-supabase-setup, 06-leaderboard, 07-catalog-supabase
**Fecha:** 2026-06-18
**Objetivo:** Integrar Supabase Auth (email/password + Google + GitHub) con pantalla de registro/login real, tabla de perfiles de usuario, scores vinculados a cuenta autenticada, y estado de sesión reflejado en la navegación.

---

## Scope

### Dentro del scope

- Reescribir `app/auth/page.tsx` con flujo real de Supabase Auth:
  - Tab "Iniciar sesión": email + contraseña
  - Tab "Crear cuenta": email + contraseña + username (3–10 chars, único)
  - Botones OAuth: Google y GitHub (funcionales)
  - Botón "Jugar como invitado" (sin cuenta, sin guardar scores)
- Crear `app/auth/callback/route.ts` para manejar redirects de verificación de email y OAuth
- Migración: crear tabla `profiles` si no existe (`id` FK → `auth.users`, `username` único 3–10 chars, `avatar_url` nullable, `created_at`)
- Migración: añadir columna `user_id` (FK → `auth.users`, nullable) a la tabla `scores`; actualizar la RLS de insert para requerir autenticación
- Crear `lib/supabase/auth.ts`: helpers `signIn`, `signUp` (crea perfil tras registro), `signOut`, `getSession`, `getProfile`
- Actualizar `lib/supabase/scores.ts`: `insertScore` recibe `userId` + `playerName` viene del perfil, no de un campo libre
- Actualizar `components/Nav.tsx`: reemplazar localStorage por sesión Supabase; mostrar username del perfil y botón "Cerrar sesión"
- Actualizar `GamePlayer.tsx`: al game-over, si el usuario no está autenticado mostrar un prompt "Regístrate para guardar tu score" con link a `/auth`; si está autenticado, el nombre se toma del perfil automáticamente

### Fuera del scope

- Recuperación de contraseña (forgot password) — spec futuro
- Perfil de usuario editable (cambiar username, avatar) — spec futuro
- RLS adicional más allá de la política de insert en `scores`
- Historial de scores por usuario — spec futuro
- Configuración de las OAuth apps en el dashboard de Supabase (prerrequisito del operador)
- Migración de scores existentes (sin `user_id`) — quedan con `user_id = null`

---

## Modelo de datos

### Tabla `profiles` (nueva, si no existe)

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text        NOT NULL UNIQUE
                          CHECK (char_length(username) BETWEEN 3 AND 10),
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Tabla `scores` (cambio)

```sql
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "scores_insert_public" ON scores;

CREATE POLICY "scores_insert_auth" ON scores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
```

### Tipo TypeScript nuevo (`lib/supabase/types.ts`)

```ts
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}
```

---

## Plan de implementación

Cada paso deja el sistema compilando y funcional.

### Paso 1 — Migración: tabla `profiles`

Crear `supabase/migrations/20260618_profiles.sql` con el DDL de `profiles` (ver modelo de datos). Aplicar con `supabase db push` o MCP `apply_migration`.

### Paso 2 — Migración: `user_id` en `scores`

Crear `supabase/migrations/20260618_scores_user_id.sql` con el `ALTER TABLE` y el reemplazo de la política de insert. Aplicar.

### Paso 3 — `lib/supabase/auth.ts` (nuevo)

Implementar usando el cliente browser (`createClient` de `lib/supabase/client.ts`):

```ts
signIn(email, password); // supabase.auth.signInWithPassword
signUp(email, password, username); // supabase.auth.signUp → insert en profiles
signInWithOAuth(provider); // supabase.auth.signInWithOAuth({ provider, redirectTo: '/auth/callback' })
signOut(); // supabase.auth.signOut
getSession(); // supabase.auth.getSession
getProfile(userId); // SELECT * FROM profiles WHERE id = userId
```

`signUp` debe insertar en `profiles` inmediatamente después del `auth.signUp` exitoso. Si la inserción de perfil falla, el spec no define rollback automático — se loguea el error y el usuario puede reintentar desde su perfil futuro.

### Paso 4 — `app/auth/callback/route.ts` (nuevo)

```ts
// GET /auth/callback?code=...
// Intercambia el code por sesión con supabase.auth.exchangeCodeForSession(code)
// Redirige a /auth?verified=1 (email) o / (OAuth)
```

Para OAuth: si el usuario no tiene perfil aún (primer login), redirigir a una vista inline dentro de `/auth` donde elige su username antes de continuar. (**Nota:** en este spec el callback redirige siempre a `/auth?oauth=1`; la página de auth detecta la sesión activa sin perfil y muestra el paso de elección de username.)

### Paso 5 — `app/auth/page.tsx` (reescribir)

Usar `createClient` del cliente browser. Estados posibles de la página:

| Estado            | Condición                | Vista                                        |
| ----------------- | ------------------------ | -------------------------------------------- |
| `login`           | no sesión, tab=in        | Form email + password + OAuth + Invitado     |
| `register`        | no sesión, tab=up        | Form email + password + username + OAuth     |
| `choose-username` | sesión activa sin perfil | Form solo username (post-OAuth primer login) |
| `verified`        | `?verified=1` en URL     | Banner "Cuenta verificada — inicia sesión"   |
| `redirect`        | sesión activa con perfil | `router.replace('/')` inmediato              |

Errores de Supabase Auth se mapean a mensajes legibles en español:

- `Invalid login credentials` → "Email o contraseña incorrectos"
- `User already registered` → "Ya existe una cuenta con ese email"
- `Email not confirmed` → "Debes verificar tu email antes de entrar"

### Paso 6 — `lib/supabase/scores.ts`

Actualizar `insertScore`:

```ts
export async function insertScore(
  gameId: string,
  playerName: string,
  score: number,
  userId: string // requerido; la RLS ya bloquea si no coincide con auth.uid()
): Promise<void>;
```

El `playerName` lo aporta el llamador (viene del perfil). La columna `user_id` se incluye en el insert.

### Paso 7 — `components/Nav.tsx`

Reemplazar la lógica de localStorage por:

```ts
const supabase = createClient();
// En useEffect: getSession() + onAuthStateChange para mantener el estado sincronizado
// Leer username desde profiles (llamar a getProfile)
// handleSignOut llama a signOut() de lib/supabase/auth.ts
```

El dropdown del usuario muestra el `username` del perfil. "Cerrar sesión" llama a `signOut()` y redirige a `/`.

### Paso 8 — `GamePlayer.tsx`

Al llegar al game-over, antes de mostrar el modal de score:

1. Llamar a `getSession()`.
2. **Sin sesión:** en lugar del modal de score, mostrar un banner dentro del game-over: "¿Quieres guardar tu puntuación? [Crear cuenta] [Iniciar sesión]" (ambos links a `/auth`). El score no se guarda.
3. **Con sesión:** llamar a `getProfile(userId)` para obtener el `username`, luego llamar a `insertScore(gameId, username, score, userId)`. El nombre ya no es editable por el usuario — viene del perfil.

---

## Criterios de aceptación

- [ ] Un usuario nuevo puede registrarse con email/password + username y recibe un email de verificación de Supabase
- [ ] Tras verificar el email, la página de auth muestra el banner "Cuenta verificada" y permite iniciar sesión
- [ ] Un usuario registrado puede iniciar sesión con email/password y queda autenticado de forma persistente (recarga de página mantiene la sesión)
- [ ] El Nav muestra el `username` del perfil cuando hay sesión activa, y "Cerrar sesión" destruye la sesión y limpia el estado
- [ ] OAuth Google: clic en botón → redirect a Google → vuelta a `/auth/callback` → sesión activa; si es primer login, se pide username antes de continuar
- [ ] OAuth GitHub: mismo flujo que Google
- [ ] Un usuario autenticado que llega al game-over ve su username pre-cargado y el score se guarda con `user_id` en la tabla
- [ ] Un invitado que llega al game-over ve el banner de registro/login y el score NO se guarda
- [ ] La tabla `profiles` tiene RLS: cualquiera puede leer, solo el propio usuario puede insertar/actualizar su perfil
- [ ] La tabla `scores` tiene RLS insert que solo permite filas donde `user_id = auth.uid()`; el SELECT sigue siendo público
- [ ] Los scores existentes en la BD (con `user_id = null`) siguen apareciendo en el leaderboard sin errores

---

## Decisiones tomadas y descartadas

| Decisión                                                        | Alternativa descartada                     | Motivo                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Auth con Supabase Auth (no custom)                              | Auth manual con JWT propio                 | Supabase ya es el backend; evitar duplicar infraestructura                                                       |
| Username en tabla `profiles` separada de `auth.users`           | Usar `user_metadata` de Supabase           | `profiles` es consultable desde RLS y RPCs sin acceso privilegiado                                               |
| `user_id` nullable en scores                                    | NOT NULL                                   | Scores anteriores a este spec quedan en la BD con `null`; borrarlos sería destructivo                            |
| RLS insert requiere `auth.uid() = user_id`                      | Trigger para llenar user_id en el servidor | El cliente envía `user_id` explícitamente; el trigger sería más robusto pero añade complejidad de migración      |
| Post-verificación redirige a `/auth?verified=1` (no auto-login) | Auto-login directo tras verificación       | Supabase no soporta auto-login en el flujo de email confirmation sin PKCE; la opción simple es redirigir a login |
| Guests pueden jugar pero no guardar scores                      | Guests no pueden jugar sin cuenta          | Barrera de entrada mínima — el arcade siempre fue jugable sin registro                                           |
| OAuth primer login → pedir username inline en `/auth`           | Ruta separada `/auth/username`             | Menos rutas, flujo más contenido                                                                                 |

---

## Riesgos identificados

- **Desincronización de sesión entre tabs:** `onAuthStateChange` en Nav lo mitiga, pero si el usuario cierra sesión en otra pestaña, la tab activa seguirá mostrando su nombre hasta la próxima interacción. Aceptado como comportamiento razonable.
- **OAuth apps no configuradas en Supabase dashboard:** Los botones de Google/GitHub fallarán silenciosamente si las credenciales OAuth no están en el proyecto de Supabase. Esto es un prerrequisito operativo fuera del scope del spec.
- **Username único colisionando en OAuth primer login:** Si el username elegido ya existe, el insert en `profiles` falla con error de unique constraint. La página de auth debe capturar este error y mostrar "Ese nombre ya está en uso, elige otro".
