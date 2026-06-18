# 15-security-hardening

**Estado:** Draft
**Dependencias:** 04-supabase-setup, 14-auth
**Fecha:** 2026-06-18
**Objetivo:** Aplicar las medidas de seguridad del checklist identificado: corregir warnings de funciones Supabase (search_path mutable y permisos SECURITY DEFINER), configurar políticas de autenticación vía MCP, añadir headers HTTP de seguridad en Next.js, reforzar la validación del password en el flujo de registro, y documentar el patrón de protección de rutas en proxy.ts.

---

## Scope

### Dentro del scope

- **Nota RLS (documentación):** RLS ya está habilitado en `games` y `scores` desde los specs 04 y 14. Esta sección documenta qué es, por qué es crítico y qué pasaría sin él — queda como referencia permanente en el spec.
- **Corrección de `search_path` mutable:** añadir `SET search_path = public, pg_catalog` en 5 funciones: `handle_new_user`, `get_global_top20`, `get_game_top10`, `get_game_stats`, `get_all_game_stats`.
- **Revocar EXECUTE en funciones SECURITY DEFINER:** revocar permisos de ejecución a roles `anon` y `authenticated` en `handle_new_user` y `rls_auto_enable`.
- **Configuración de auth Supabase vía MCP:**
  - Longitud mínima de contraseña: 8 caracteres
  - Protección de contraseñas filtradas (HaveIBeenPwned)
  - Complejidad requerida: lowercase, uppercase, dígitos y símbolos
  - Rate limiting de signups por IP (anti-bot)
- **Headers de seguridad HTTP** en `next.config.ts`: el plan incluye una tabla con cada header propuesto; el usuario decide cuáles aplicar.
- **Validación de contraseña con regex** en `app/auth/page.tsx` (feedback en tiempo real) y en `lib/supabase/auth.ts` (validación antes de llamar a Supabase).
- **Protección de rutas en `proxy.ts`:** añadir lógica de redirect a `/auth` para rutas protegidas cuando no hay sesión activa. Se define un array `PROTECTED_PATHS` (inicialmente `['/profile']`) para uso futuro — el flujo de invitados del spec 14 no se altera.

### Fuera del scope

- Content Security Policy (CSP) — requiere auditoría de fuentes de scripts y estilos; merece spec propio.
- HSTS — se configura en CDN o reverse proxy, no en Next.js.
- Proteger rutas de juego (`/games/:id/play`) — los invitados siguen pudiendo jugar sin cuenta (spec 14).
- Auditoría de seguridad más allá del checklist identificado.
- Cambios adicionales en lógica de auth o scores.

---

## Modelo de datos

No se crean tablas nuevas. Los cambios son correcciones sobre funciones existentes y nuevas constantes de configuración en código.

### Funciones SQL modificadas (patrón de corrección)

Cada función recibe `SECURITY DEFINER SET search_path = public, pg_catalog` para fijar el `search_path` y eliminar el warning. Ejemplo:

```sql
CREATE OR REPLACE FUNCTION public.get_game_top10(...)
  RETURNS ...
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
  -- cuerpo sin cambios
$$;
```

Se aplica el mismo patrón a: `handle_new_user`, `get_global_top20`, `get_game_stats`, `get_all_game_stats`.

### Constantes de configuración (código)

**`proxy.ts` — rutas protegidas:**

```ts
const PROTECTED_PATHS = ["/profile"];
```

**`lib/supabase/auth.ts` — regex de contraseña:**

```ts
// lowercase + uppercase + dígito + símbolo, mínimo 8 chars
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
```

---

## Plan de implementación

Cada paso deja el sistema compilando y funcional.

### Nota sobre Row Level Security (RLS)

> **¿Qué es RLS?** Row Level Security es una característica de PostgreSQL (y Supabase) que controla, a nivel de base de datos, qué filas puede leer, insertar, actualizar o eliminar cada rol (`anon`, `authenticated`, `service_role`). Las políticas se definen en SQL y son evaluadas por el motor de base de datos — no por el código de la aplicación.
>
> **¿Por qué es crítico?** Sin RLS, cualquier usuario que acceda a la API de Supabase puede leer o escribir cualquier fila de cualquier tabla, incluso si el código de la app no lo expone. Un atacante que conozca el endpoint podría extraer todos los scores, perfiles o datos del catálogo con una sola petición HTTP.
>
> **¿Qué pasaría sin él?**
>
> - `games`: cualquiera podría insertar juegos falsos o modificar los existentes vía API directa.
> - `scores`: cualquiera podría insertar scores falsos en nombre de otro usuario, o leer datos que deberían ser privados.
>
> **Estado actual:** RLS está habilitado en `games` (spec 04, lectura pública) y `scores` (specs 04 + 14, lectura pública, insert solo autenticado con `user_id = auth.uid()`). No se requiere acción en este spec.

### Paso 1 — Migración: corrección de `search_path` en 5 funciones

Crear `supabase/migrations/20260618_fix_search_path.sql`.

Para cada función, leer su definición actual desde Supabase y reescribirla con `CREATE OR REPLACE FUNCTION ... SECURITY DEFINER SET search_path = public, pg_catalog`. El cuerpo de cada función no cambia.

Funciones a corregir:

1. `public.handle_new_user()`
2. `public.get_global_top20()`
3. `public.get_game_top10(game_id_param uuid)`
4. `public.get_game_stats(game_id_param uuid)`
5. `public.get_all_game_stats()`

Aplicar con MCP `apply_migration`. Verificar en Supabase Advisor que los warnings `function_search_path_mutable` desaparecen.

### Paso 2 — Migración: revocar EXECUTE en `handle_new_user` y `rls_auto_enable`

Crear `supabase/migrations/20260618_revoke_execute.sql`:

```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
```

**Por qué:** `handle_new_user` es un trigger function — no necesita ser invocable directamente via REST API (`/rest/v1/rpc/handle_new_user`). Dejar el permiso abierto permite que cualquier visitante anónimo la ejecute como RPC, potencialmente alterando la tabla `profiles`. Lo mismo aplica a `rls_auto_enable`, que es una utilidad de setup sin uso operativo continuo.

Aplicar con MCP `apply_migration`. Verificar que los warnings `anon_security_definer_function_executable` y `authenticated_security_definer_function_executable` desaparecen.

### Paso 3 — Configuración de auth Supabase vía MCP

Aplicar los siguientes ajustes usando el MCP de Supabase:

| Configuración              | Valor                                      | Por qué                                                                              |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Minimum password length    | 8                                          | Contraseñas cortas son trivialmente bruteforceables                                  |
| Leaked password protection | Habilitado                                 | Compara contra HaveIBeenPwned; bloquea contraseñas comprometidas en brechas públicas |
| Password requirements      | Lowercase + Uppercase + Digits + Symbols   | Aumenta la entropía; reduce efectividad de ataques de diccionario                    |
| Rate limit signups per IP  | Habilitado (valor por defecto de Supabase) | Previene registro masivo automatizado (bots)                                         |

### Paso 4 — Headers de seguridad en `next.config.ts`

El implementador debe presentar la siguiente tabla al usuario y aplicar únicamente los headers marcados con **S**:

| Header                   | Valor recomendado                          | Por qué se necesita                                                     | Consecuencia sin él                                                                               | S/N |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --- |
| `X-Content-Type-Options` | `nosniff`                                  | Previene que el browser "adivine" el MIME type de las respuestas        | El browser puede interpretar un archivo de texto como script ejecutable, abriendo la puerta a XSS |     |
| `X-Frame-Options`        | `DENY`                                     | Impide que la app sea embebida en un `<iframe>` externo                 | Habilita ataques de clickjacking: un iframe invisible superpuesto sobre botones reales            |     |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`          | Controla qué URL se envía como `Referer` al navegar a dominios externos | URLs con parámetros sensibles pueden filtrarse a sitios de terceros via el header Referer         |     |
| `X-DNS-Prefetch-Control` | `off`                                      | Desactiva el pre-fetch de DNS del browser                               | El browser puede revelar a qué dominios apunta la app antes de que el usuario los visite          |     |
| `Permissions-Policy`     | `camera=(), microphone=(), geolocation=()` | Desactiva APIs sensibles del browser que Arcade Vault no utiliza        | Un script XSS podría activar cámara, micrófono o ubicación si no están bloqueados explícitamente  |     |

Estructura en `next.config.ts`:

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // ... solo los headers aprobados por el usuario
];

// En la config de Next.js:
headers: async () => [{ source: "/(.*)", headers: securityHeaders }];
```

### Paso 5 — Validación de contraseña en código

**`lib/supabase/auth.ts`:**

Exportar `PASSWORD_REGEX` y validar antes de llamar a `supabase.auth.signUp`:

```ts
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

// En signUp, antes de llamar a Supabase:
if (!PASSWORD_REGEX.test(password)) {
  throw new Error(
    "La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos."
  );
}
```

**`app/auth/page.tsx`:**

Importar `PASSWORD_REGEX` y usarla para mostrar feedback en tiempo real bajo el campo de contraseña durante el registro. Mostrar el estado de cada requisito (✓/✗):

- Mínimo 8 caracteres
- Una mayúscula
- Una minúscula
- Un número
- Un símbolo

### Paso 6 — Protección de rutas en `proxy.ts`

Añadir la lógica de redirect después de `getUser()`:

```ts
const PROTECTED_PATHS = ["/profile"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(/* config existente */);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // lógica de refresh de cookies existente
  return response;
}
```

**Por qué después de `getUser()`:** El check de rutas protegidas ocurre tras refrescar la sesión para evitar falsos negativos por cookies expiradas que aún son válidas en el servidor.

---

## Criterios de aceptación

- [ ] Supabase Advisor no muestra warnings de `function_search_path_mutable` para ninguna de las 5 funciones
- [ ] Supabase Advisor no muestra warnings de `anon_security_definer_function_executable` ni `authenticated_security_definer_function_executable` para `handle_new_user` y `rls_auto_enable`
- [ ] El dashboard de Supabase Auth muestra: longitud mínima 8, leaked password ON, complejidad ON (lowercase + uppercase + digits + symbols), rate limiting ON
- [ ] Los headers de seguridad aprobados aparecen en las respuestas HTTP (verificable con DevTools → Network → Response Headers o `curl -I`)
- [ ] Al registrarse con una contraseña sin mayúsculas (ej. `test1234!`), el formulario muestra error sin llamar a Supabase
- [ ] Al registrarse con una contraseña sin símbolo (ej. `Test1234`), el formulario muestra error sin llamar a Supabase
- [ ] Una contraseña válida (ej. `Test1234!`) pasa la validación y el registro procede
- [ ] Navegar a `/profile` sin sesión activa redirige a `/auth`
- [ ] Navegar a `/games/snake/play` sin sesión activa NO redirige (invitados pueden jugar)
- [ ] `proxy.ts` sigue refrescando las cookies de sesión de Supabase en cada request (comportamiento previo se mantiene)

---

## Decisiones tomadas y descartadas

| Decisión                                                                               | Alternativa descartada                              | Motivo                                                                                                                                      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| REVOKE EXECUTE en lugar de SECURITY INVOKER para `handle_new_user` y `rls_auto_enable` | Cambiar a SECURITY INVOKER                          | Ambas son trigger/utility functions — no necesitan ser invocables via REST. Revocar es más simple y no requiere modificar la lógica interna |
| `rls_auto_enable`: revocar acceso sin eliminar la función                              | Eliminar la función                                 | No existe certeza de que no se use en algún proceso manual; revocar el acceso público es suficiente                                         |
| `PROTECTED_PATHS = ['/profile']` aunque la página no existe aún                        | No implementar el patrón hasta que la página exista | El patrón queda disponible sin costo; cuando se implemente `/profile` solo hay que verificar que esté en la lista                           |
| Validación de contraseña en cliente Y en `auth.ts`                                     | Solo confiar en el dashboard de Supabase            | La regex da feedback inmediato al usuario (UX); Supabase lo refuerza en el servidor (seguridad). Defensa en profundidad                     |
| Un solo spec para todas las medidas                                                    | Separar Next.js y Supabase en specs distintos       | Las medidas son complementarias y de tamaño similar; un spec unificado reduce la carga de tracking                                          |
| Configuración de auth vía MCP                                                          | Pasos manuales en el dashboard                      | El MCP permite reproducibilidad; los pasos manuales son propensos a omisiones                                                               |

---

## Riesgos identificados

- **`rls_auto_enable` con dependencias desconocidas:** Si algún proceso externo la llama directamente, el REVOKE romperá ese proceso. Verificar en Supabase logs que no hay llamadas recientes a `rls_auto_enable` vía RPC antes de aplicar la migración.
- **Regex más estricta que contraseñas existentes:** Usuarios con cuentas ya creadas con contraseñas débiles no se ven afectados (la validación solo aplica al formulario de registro y change-password futuro). No hay acción requerida sobre datos existentes.
