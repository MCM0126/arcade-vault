# Arcade Vault

Plataforma online para jugar y competir por la mayor cantidad de puntos. Catálogo de juegos en Supabase; solo los juegos con entrada en `lib/games/registry.ts` son jugables — los demás aparecen como "coming soon".

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19.2**
- **TypeScript** — strict, alias `@/*`
- **Tailwind CSS v4** — configurado vía `@theme` en `app/globals.css`
- **Supabase** — catálogo (`games`), puntajes (`scores`), RPCs de estadísticas

## Juegos jugables

| ID           | Título     | Skins              |
| ------------ | ---------- | ------------------ |
| `asteroides` | ASTEROIDES | classic/neon/retro |
| `caida`      | CAÍDA      | —                  |
| `snake`      | SNAKE      | —                  |

## Workflow de desarrollo

Sigue **Spec Driven Design**: toda feature se documenta como spec en `specs/NN-<slug>.md` antes de implementarse.

```bash
npx skills@latest add Klerith/fernando-skills   # instala /spec y /spec-impl
```

Agentes y skills locales del proyecto: ver `CLAUDE.md`.

## Comandos

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Build de producción (Turbopack)
npm run start    # Servidor de producción
npm run lint     # ESLint
```
