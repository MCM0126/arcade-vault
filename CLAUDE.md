# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online gaming platform where users play and compete for the highest scores. Development follows **Spec Driven Design** using `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills).

## Commands

```bash
npm run dev      # Start dev server (Turbopack, outputs to .next/dev)
npm run build    # Production build (Turbopack)
npm run start    # Start production server
npm run lint     # Run ESLint (uses eslint CLI directly, not next lint)
```

## Stack

- **Next.js 16** — App Router only; no Pages Router
- **React 19.2** — View Transitions, `useEffectEvent`, React Compiler (opt-in via `reactCompiler: true` in `next.config.ts`)
- **TypeScript** — strict mode, path alias `@/*` → project root
- **Tailwind CSS v4** — configured via `@theme` in CSS, not `tailwind.config.js`; import with `@import "tailwindcss"`

## Next.js 16 Breaking Changes

**Async Request APIs** — `cookies()`, `headers()`, `params`, `searchParams` are fully async; synchronous access no longer exists:
```ts
const cookieStore = await cookies()
const { id } = await params  // route params must be awaited
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
