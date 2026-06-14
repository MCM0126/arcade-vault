# 01-mvp-screens

**Estado:** Implementado  
**Dependencias:** ninguna (spec inicial)  
**Fecha:** 2026-06-13  
**Objetivo:** Implementar las 5 pantallas del MVP de Arcade Vault (Biblioteca, Detalle, Reproductor, Auth, Salón de la Fama) en Next.js 16 con App Router, TypeScript y Tailwind v4.

---

## Scope

### Dentro del scope
- Datos mock en TypeScript (`lib/data.ts`) con los 8 juegos y la función `seededScores`
- Rutas App Router:
  - `/` → Biblioteca (catálogo con búsqueda y filtro por categoría)
  - `/games/[id]` → Detalle del juego + leaderboard simulado
  - `/games/[id]/play` → Reproductor (simulación CRT, HUD, modal fin de partida)
  - `/auth` → Login / Registro (mock, persiste `{name}` en localStorage)
  - `/hall-of-fame` → Salón de la Fama (podio + tabla, por juego)
- Componente `Nav` con menú mobile responsive
- Persistencia de puntuación en localStorage (`av_scores`)
- Global CSS ya migrado; Tailwind para layout y utilidades adicionales

### Fuera del scope
- Backend real (BD, API routes, server actions) — queda para un spec posterior
- Autenticación real (NextAuth, OAuth con Google/GitHub) — queda para un spec posterior
- Lógica de juego real — el reproductor es visual/simulado
- Internacionalización
- Tests automatizados

---

## Modelo de datos

### `lib/data.ts`

```ts
export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'VERSUS'
  cover: string        // clase CSS del cover background
  color: 'cyan' | 'magenta' | 'green' | 'yellow'
  best: number
  plays: string
}

export interface ScoreRow {
  rank: number
  name: string
  score: number
  date: string         // formato dd/mm/yyyy
}

export interface SavedScore {
  game: string         // Game.id
  score: number
  name: string
  at: number           // Date.now()
}

export const GAMES: Game[]           // 8 juegos del template
export const CATS: string[]          // ['TODOS', 'ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS']
export function seededScores(seed: number, count?: number): ScoreRow[]
```

### localStorage
- `av_user` → `{ name: string }` o `null`
- `av_scores` → `SavedScore[]`

---

## Plan de implementación

Cada paso deja el sistema en estado funcional y deployable.

1. **Datos mock** — Crear `lib/data.ts` con `GAMES`, `CATS` y `seededScores` tipados.

2. **Layout raíz** — Actualizar `app/layout.tsx`: importar fuentes (Press Start 2P, Courier Prime, JetBrains Mono), montar el componente `Nav`, y el `<footer>` global.

3. **Componente Nav** — Crear `components/Nav.tsx`: logo, links de escritorio, menú mobile (hamburger + panel lateral), botón auth, coin counter. Lee `av_user` de localStorage vía hook.

4. **Biblioteca** — `app/page.tsx`: hero section, buscador, chips de categoría, grid de `GameCard` con efecto tilt. Navega a `/games/[id]` al seleccionar.

5. **Detalle** — `app/games/[id]/page.tsx`: cover, tags, descripción larga, stat-strip, botones de acción, leaderboard lateral con `seededScores`.

6. **Reproductor** — `app/games/[id]/play/page.tsx`: HUD (jugador, puntuación, vidas, nivel), pantalla CRT con animación de enemigos, botones pausa/fin/salir, modal de fin de partida con guardado en localStorage.

7. **Auth** — `app/auth/page.tsx`: tabs login/registro, campos usuario/email/contraseña, botón "Jugar como invitado", botones sociales (decorativos). Persiste `{name}` en `av_user`.

8. **Hall of Fame** — `app/hall-of-fame/page.tsx`: selector de juego (chips), podio top-3, tabla completa, fila resaltada del usuario si está logueado.

---

## Criterios de aceptación

- [ ] `/` muestra el grid de 8 juegos; el buscador filtra por nombre y los chips por categoría
- [ ] Seleccionar un juego navega a `/games/[id]` y muestra su cover, descripción y leaderboard
- [ ] El botón "JUGAR AHORA" en detalle navega a `/games/[id]/play`
- [ ] El reproductor muestra el HUD con puntuación que sube automáticamente, pausa funciona, "FIN" abre el modal
- [ ] El modal de fin de partida permite guardar el score; queda registrado en `av_scores` en localStorage
- [ ] `/auth` permite ingresar un nombre y hacer click en "ENTRAR AL VAULT"; el Nav muestra el nombre del usuario
- [ ] "Jugar como invitado" también cierra la pantalla de auth y vuelve a la biblioteca
- [ ] El botón del usuario en Nav hace sign out y limpia `av_user`
- [ ] `/hall-of-fame` muestra el podio y la tabla; cambiar el chip de juego actualiza los datos
- [ ] Si el usuario está logueado, `/hall-of-fame` muestra su fila resaltada al final de la tabla
- [ ] La navegación mobile (hamburger) funciona en viewport < 768px
- [ ] No hay errores de TypeScript (`tsc --noEmit` pasa limpio)

---

## Decisiones tomadas y descartadas

| Decisión | Elegido | Descartado | Motivo |
|---|---|---|---|
| Routing | App Router con rutas de archivo (`/games/[id]`) | Hash routing client-side como el template | URLs limpias, SSR-ready, compatible con Next.js 16 |
| Auth | Mock con localStorage | NextAuth / OAuth real | MVP; auth real queda para spec posterior cuando se integre BD |
| Persistencia de datos | Constantes TypeScript en `lib/data.ts` | JSON en `public/`, base de datos | Suficiente para MVP; BD queda para spec posterior |
| Estilos | Global CSS existente + Tailwind para utilidades | Reescribir todo en Tailwind | El CSS custom tiene ~700 líneas de efectos neon/CRT muy específicos; reescribirlos en Tailwind sería trabajo sin valor para el MVP |
| Juego | Simulación visual (CRT decorativo, score automático) | Lógica de juego real | Fuera del alcance del MVP de pantallas |
| Nombres de archivos | Inglés | Español (juegos/, salon/) | Convención del proyecto |

---

## Riesgos identificados

- **`params` async en Next.js 16** — En `app/games/[id]/page.tsx` y `app/games/[id]/play/page.tsx`, `params` debe ser awaitable (`const { id } = await params`). Olvidarlo genera un error en runtime sin warning claro en build.

- **localStorage en SSR** — Todos los componentes que lean `av_user` o `av_scores` deben declararse `'use client'`. Si alguno corre en el servidor, rompe en producción (funciona en dev por hidratación).

- **Fuentes** — El template carga Press Start 2P y JetBrains Mono desde CDN de Google. En Next.js se deben importar con `next/font/google` en el layout para evitar FOUT y cumplir con la política de privacidad de Next.js.
