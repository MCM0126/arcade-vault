# 02-home-page

**Estado:** Implementado
**Dependencias:** 01-mvp-screens (requiere las rutas y lib/data.ts existentes)
**Fecha:** 2026-06-13
**Objetivo:** Implementar la Home page en `/` como landing page de Arcade Vault, moviendo la Biblioteca actual a `/games`.

---

## Scope

### Dentro del scope
- Mover `app/page.tsx` (Biblioteca) a `app/games/page.tsx`
- Actualizar `components/Nav.tsx`: link "Biblioteca" apunta a `/games`, agregar link "Inicio" apuntando a `/`
- Crear `app/page.tsx` con la Home page completa basada en `references/templates/home-about/home.jsx`
- Hook `useReveal` (IntersectionObserver) para animaciones de entrada por scroll
- Componente `FloatingSilhouettes` (SVGs pixel-art decorativos en el hero)
- Componente `FeatureIcon` (iconos pixel SVG: GAMEPAD, FREE, TROPHY, ROCKET)
- Secciones del Home (en orden):
  1. **Hero** — título grande, eyebrow, subtítulo, 2 CTAs, scroll indicator
  2. **¿Por qué Arcade Vault?** — grid de 4 feature-cards con icono, título y descripción
  3. **Juegos disponibles ahora** — rail de 6 mini-cards con cover CSS, link a `/games/[id]`
  4. **Stats** — banda oscura con 3 bloques: "12+", "MILES", "GLOBAL"
  5. **Actividad en vivo** — ticker de últimas puntuaciones + top 5 jugadores del día (mock estático)
  6. **Precios** — card de plan único "$0 / SIEMPRE" + FAQ de 3 preguntas
  7. **Final CTA** — título "¿LISTO PARA JUGAR?" + botón "INSERTAR MONEDA →"
- Todos los datos de actividad y top jugadores: mock estático hardcodeado en el componente
- Los 6 juegos del mini-rail: tomados de `GAMES` de `lib/data.ts`

### Fuera del scope
- Página "Acerca de" (about.jsx del template) — queda para un spec posterior
- Datos de actividad en tiempo real o conectados a localStorage
- Animaciones adicionales más allá de `reveal` y los floats del hero
- Tests automatizados

---

## Modelo de datos

No se introducen estructuras nuevas.

- Los 6 juegos del mini-rail se importan de `GAMES: Game[]` ya definido en `lib/data.ts`
- Los datos de actividad (ticker y top jugadores) son constantes inline en el componente, sin tipo nuevo ni persistencia

---

## Plan de implementación

1. **Mover la Biblioteca** — Renombrar `app/page.tsx` a `app/games/page.tsx`. Ajustar imports si usan rutas relativas.

2. **Actualizar Nav** — En `components/Nav.tsx`, cambiar el `href` del link "Biblioteca" de `/` a `/games`. Agregar link "Inicio" apuntando a `/`.

3. **Crear `hooks/useReveal.ts`** — Custom hook que monta un `IntersectionObserver` sobre todos los elementos `.reveal` del DOM, agrega la clase `in` al entrar al viewport (threshold 0.12) y hace `disconnect` en el cleanup.

4. **Crear `components/FloatingSilhouettes.tsx`** — Componente decorativo con los 8 SVGs pixel-art del hero (alien, nave, Pac-Man, cruz, OVNI, moneda, corazón, D-pad). `aria-hidden="true"`.

5. **Crear `components/FeatureIcon.tsx`** — SVG pixel-art por `kind`: GAMEPAD | FREE | TROPHY | ROCKET. Retorna `null` si `kind` desconocido.

6. **Crear `app/page.tsx` (Home)** — Componente `'use client'` que ensambla todas las secciones en orden: Hero → Why → Games Preview → Stats → Activity → Pricing → Final CTA. Importa `useReveal`, `FloatingSilhouettes`, `FeatureIcon`, `GAMES`, y usa `next/link` / `next/navigation` para navegación.

7. **Verificar CSS** — Confirmar que las clases del Home (`.home-hero`, `.home-silos`, `.feature-grid`, `.mini-rail`, `.home-stats`, `.activity-grid`, `.home-final`, `.reveal`, etc.) ya existen en `app/globals.css`. Si falta alguna, agregarla.

---

## Criterios de aceptación

- [ ] `/` muestra la Home page (hero, secciones, final CTA) — ya no muestra la Biblioteca
- [ ] `/games` muestra la Biblioteca con el mismo comportamiento que antes
- [ ] El Nav tiene link "Inicio" (→ `/`) y "Biblioteca" (→ `/games`); ambos marcan `active` correctamente
- [ ] El hero muestra las 3 líneas del título, eyebrow, subtítulo, y 2 CTAs funcionales: "EXPLORAR JUEGOS" → `/games`, "CREAR CUENTA" → `/auth`
- [ ] Los 8 SVG flotantes del hero animan con `float` CSS y son `aria-hidden`
- [ ] Las 4 feature-cards de "¿Por qué Arcade Vault?" muestran su icono pixel SVG y descripción
- [ ] El mini-rail muestra exactamente 6 juegos (primeros 6 de `GAMES`) con su cover CSS; al hacer click navega a `/games/[id]`
- [ ] La banda de stats muestra los 3 bloques: "12+", "MILES", "GLOBAL"
- [ ] La sección de actividad muestra el ticker de puntuaciones y el top-5 de jugadores (mock estático)
- [ ] La sección de precios muestra el plan "$0 / SIEMPRE" y las 3 preguntas FAQ; el botón "EMPEZAR GRATIS →" navega a `/auth`
- [ ] El final CTA "INSERTAR MONEDA →" navega a `/games`
- [ ] Las secciones con clase `.reveal` entran con animación al hacer scroll (opacity 0→1, translateY 24px→0)
- [ ] No hay errores de TypeScript (`tsc --noEmit` pasa limpio)
- [ ] No hay regresiones en `/games`, `/games/[id]`, `/games/[id]/play`, `/auth`, `/hall-of-fame`

---

## Decisiones tomadas y descartadas

| Decisión | Elegido | Descartado | Motivo |
|---|---|---|---|
| Posición de la Biblioteca | `/games` | Mantenerla en `/` | `/` queda libre para la landing page; URL semánticamente correcta |
| Datos de actividad | Mock estático inline | `seededScores` de lib/data.ts | La actividad no es de juegos en particular; mock suficiente para el MVP |
| Datos del mini-rail | `GAMES` de lib/data.ts | Mock duplicado | Evita duplicación; los datos ya existen |
| Contenido visual | Español | Inglés | Decisión de producto: el usuario ve siempre español |
| Animación reveal | `useReveal` hook con IntersectionObserver | CSS puras / sin animación | Fidelidad con el template; mejor UX en scroll |
| Componentes nuevos | `FloatingSilhouettes` y `FeatureIcon` separados | Inline en page.tsx | Legibilidad; el hero y los iconos tienen suficiente markup propio |

---

## Riesgos identificados

- **`'use client'` obligatorio** — El hook `useReveal` usa `useEffect` y `document.querySelectorAll`; el componente Home debe ser `'use client'`. Si se olvida, rompe en SSR.
- **Rutas de navegación internas** — Los links deben usar `<Link href="...">` de `next/link`, no `<a>` ni `router.push`, para mantener la navegación client-side del App Router.
- **Clases CSS del Home** — El `globals.css` actual fue portado del template del spec 01 (Biblioteca). Hay que verificar que las clases exclusivas del Home (`.home-hero`, `.home-silos`, `.mini-rail`, `.home-stats`, `.activity-grid`, `.pricing-grid`, `.home-final`, `.reveal`) estén incluidas; si no, agregarlas en el paso 7.
