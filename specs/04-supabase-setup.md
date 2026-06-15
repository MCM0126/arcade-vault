# 04-supabase-setup

**Estado:** Implementado
**Dependencias:** ninguna (infraestructura base independiente)
**Fecha:** 2026-06-14
**Objetivo:** Instalar y configurar el cliente de Supabase (browser y SSR) como infraestructura base reutilizable para futuros specs de auth, base de datos y real-time.

---

## Scope

### Dentro del scope

- Instalar `@supabase/supabase-js` y `@supabase/ssr`
- Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` a `.env.template`
- Crear `lib/supabase/client.ts` — cliente browser (singleton con `createBrowserClient`)
- Crear `lib/supabase/server.ts` — cliente server (función con `createServerClient` + cookies,
  para Server Components y API routes)
- Crear `proxy.ts` — refresca la cookie de sesión en cada request (requerido por `@supabase/ssr`
  para que el cliente server funcione correctamente; sin lógica de auth)

### Fuera del scope

- Implementación de auth (login, signup, OAuth, logout)
- Tablas de base de datos o queries
- Subscripciones real-time
- Context/Provider de sesión
- Tipos TypeScript generados desde el schema de Supabase

---

## Modelo de datos

No se introducen estructuras nuevas. Este spec solo instala paquetes y crea
archivos de configuración del cliente; no toca ni crea tablas en Supabase.

---

## Plan de implementación

1. **Instalar dependencias** — `npm install @supabase/supabase-js @supabase/ssr`.
   El `package.json` queda actualizado.

2. **Variables de entorno** — Agregar a `.env.template`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

   El usuario copia `.env.template` a `.env.local` y pega los valores desde
   el dashboard de Supabase → Project Settings → API.

3. **Crear `lib/supabase/client.ts`** — Exporta `createClient()` usando
   `createBrowserClient` de `@supabase/ssr`. Solo se usa en componentes
   `'use client'`.

4. **Crear `lib/supabase/server.ts`** — Exporta `createClient()` async usando
   `createServerClient` de `@supabase/ssr` con `cookies()` de `next/headers`.
   Solo se usa en Server Components y API routes.

5. **Crear `proxy.ts`** — Usa `createServerClient` para leer y escribir la cookie
   de sesión en cada request. Refresca el token si está próximo a expirar.
   Runtime: `nodejs` (no `edge`, per Next.js 16).

---

## Criterios de aceptación

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `package.json`
- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `lib/supabase/client.ts` exporta `createClient()` y compila sin errores
- [ ] `lib/supabase/server.ts` exporta `createClient()` async y compila sin errores
- [ ] `proxy.ts` existe en la raíz del proyecto y refresca la cookie de sesión
- [ ] `tsc --noEmit` pasa limpio
- [ ] No hay regresiones en ninguna ruta existente (`/`, `/games`, `/about`, `/auth`, `/hall-of-fame`)

---

## Decisiones tomadas y descartadas

| Decisión                  | Elegido                   | Descartado                        | Motivo                                                                                           |
| ------------------------- | ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Paquete SSR               | `@supabase/ssr`           | `@supabase/auth-helpers-nextjs`   | `auth-helpers` está deprecado; `@supabase/ssr` es el reemplazo oficial                           |
| Ubicación de los clientes | `lib/supabase/` (carpeta) | `lib/supabase.ts` (archivo único) | Separa browser vs server explícitamente; evita importar código de server en el cliente           |
| Proxy vs sin proxy        | Con `proxy.ts`            | Sin proxy                         | Sin él, el token SSR nunca se refresca y el cliente server queda roto tras la primera expiración |
| Runtime del proxy         | `nodejs`                  | `edge`                            | Next.js 16 no soporta `edge` en `proxy.ts`                                                       |
| Auth, BD, real-time       | Fuera de scope            | En este spec                      | Este spec es solo infraestructura; cada área tendrá su propio spec                               |
