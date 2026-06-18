# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online gaming platform where users play and compete for the highest scores. Development follows **Spec Driven Design** using `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills).

## Stack

- **Next.js 16** — App Router only; no Pages Router
- **React 19.2** — View Transitions, `useEffectEvent`, React Compiler (opt-in via `reactCompiler: true` in `next.config.ts`)
- **TypeScript** — strict mode, path alias `@/*` → project root
- **Tailwind CSS v4** — configured via `@theme` in CSS, not `tailwind.config.js`; import with `@import "tailwindcss"`
- **Supabase** — Postgres backend for the game catalog and leaderboard; client/server helpers in `lib/supabase/`

# Skills

Usa siempre `/frontend-design` para diseñar la interfaz del usuario.

Project-local skills live in `.claude/skills/`:

- **`/add-game <carpeta o descripción>`** — reads a game source (typically from `references/started-games/`), asks identity-confirmation questions, and writes a Draft spec at `specs/NN-<id>.md`. Never writes code — that's `/spec-impl`'s job.
- **`/spec`** / **`/spec-impl`** — Spec Driven Design workflow (from Klerith/fernando-skills): `/spec` drafts a spec, `/spec-impl` implements an approved one.

# Agents

Project-local agents live in `.claude/agents/`:

- **`game-planner`** — recomienda el próximo juego a agregar a la plataforma. Ver `.claude/agents/game-planner.md`.
- **`game-jam`** — genera 2 specs alternativos de un juego nuevo a partir de un tema. Ver `.claude/agents/game-jam.md`.
- **`skin-designer`** — diseña e implementa los 3 skins (neon, retro, classic) para un juego. Ver `.claude/agents/skin-designer.md`.
- **`mobile-porter`** — audita y corrige el layout móvil y los controles táctiles. Ver `.claude/agents/mobile-porter.md`.
- **`game-performance-booster`** — optimiza el performance de un juego (React layer + game loop). Ver `.claude/agents/game-performance-booster.md`.
- **`audit-code`** — audita la seguridad de la BD (RLS, search_path, permisos SECURITY DEFINER) y la app Next.js (headers HTTP, validación de contraseña, protección de rutas). Ver `.claude/agents/audit-code.md`.

## Architecture

### Game integration pattern

Each playable game follows the same contract, defined in `lib/games/types.ts`:

- A game module exports `start<Game>(canvas, callbacks): GameHandle` (`cleanup`, `setPaused`, `restart`).
- A React canvas component (`app/games/[id]/play/<Game>Canvas.tsx`) accepts `GameCanvasProps` (`callbacks`, `paused`) and exposes `GameCanvasHandle` (`restart`) via `forwardRef`/`useImperativeHandle`.
- `lib/games/registry.ts` maps the game's `id` to its Canvas component — this is the **only** file that needs a new entry to wire up a game; `GamePlayer.tsx` reads from it and renders nothing if the id is missing.

Implemented games: see `references/implemented-games.md`. The full catalog is seeded in Supabase, but only games with a registry entry are playable — others show as "coming soon."

Currently playable: `asteroides`, `caida`, `snake`, `frogger`.

Reference game sources used as ports live under `references/started-games/` (asteroids, tetris, arkanoid) and are not part of the shipped app.

### Skin system

`lib/games/skins.ts` — shared skin definitions (classic, neon, retro) used by game engines. Each skin provides a full color palette. The active skin is persisted in `localStorage` and can be changed in real time without restarting the game session.

Skin status per game: see `references/game-with-themes.md`.

Currently skinned: `asteroides` (all 3 skins implemented, spec `specs/09-asteroides-skins.md`). `frogger` skins spec aprobado (`specs/12-frogger-skins.md`), pendiente de marcar como implementado en `references/game-with-themes.md`.

### Mobile touch controls

Touch controls follow the spec in `specs/10-mobile-touch-controls.md`:

- Controls rendered **below** the canvas, never as an overlay.
- Visible only when `pointer: coarse` (touch devices); hidden on desktop.
- Each game's canvas component handles its own touch button layout.

### Supabase integration

- `lib/supabase/client.ts` / `server.ts` — browser/server Supabase clients (uses `PUBLISHABLE_KEY`, not `ANON_KEY`)
- `lib/supabase/games.ts` — catalog reads (`games` table) + per-game/all-game stats via Postgres RPCs (`get_game_stats`, `get_all_game_stats`)
- `lib/supabase/scores.ts` — leaderboard score inserts/reads (`scores` table)
- Migrations in `supabase/migrations/`: `games` table (catalog, RLS public-read), `scores` table (RLS public read+insert), stats RPCs
- Auth lives in `app/auth/page.tsx`; network-layer auth interception goes in `proxy.ts` (Next.js 16 — see breaking changes below), not `middleware.ts`

### Specs

All feature work is documented as a spec in `specs/NN-<slug>.md` before implementation (Spec Driven Design). Existing specs cover: MVP screens, home/about pages, Supabase setup, Asteroides integration, leaderboard, catalog migration to Supabase, Caída (Tetris-style) integration, Asteroides skins, mobile touch controls, Gamepad MK-II touch redesign (`11`), Frogger skins (`12`), and React render optimization (`13`).

## Next.js 16 Breaking Changes

**Async Request APIs** — `cookies()`, `headers()`, `params`, `searchParams` are fully async; synchronous access no longer exists:

```ts
const cookieStore = await cookies();
const { id } = await params; // route params must be awaited
```

**`middleware` → `proxy`** — network-layer interceptors live in `proxy.ts`, not `middleware.ts`. The `edge` runtime is not supported in proxy; use `nodejs` only. Old `middleware` still works if you need edge runtime.

**PPR** — `experimental_ppr` segment config is removed. Use `cacheComponents` in `next.config.ts` instead.

**`revalidateTag`** — now requires a second `cacheLife` profile argument.

**Parallel Routes** — `default.js` is required in every parallel route slot or the router throws.

**Turbopack default** — both `next dev` and `next build` use Turbopack. Custom `webpack` config in `next.config.ts` will break the build; migrate to `turbopack` top-level config or pass `--webpack` flag.

## Tailwind v4 Notes

- No `tailwind.config.js` — configure design tokens inside `app/globals.css` using `@theme`
- PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss`
- CSS variables for colors use `--color-*` naming and are defined with `@theme inline`
