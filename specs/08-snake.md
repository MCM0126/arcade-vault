# 08-snake

**Estado:** Aprobado
**Dependencias:** 05-asteroides-integration, 06-leaderboard, 07-catalog-supabase
**Fecha:** 2026-06-15
**Objetivo:** Integrar el juego "SNAKE" (id: `snake`) a Arcade Vault portando la
mecánica clásica de Snake (grilla, crecimiento por fruta, muerte por colisión)
como módulo TypeScript en la ruta `/games/snake/play`, usando el atlas de
frutas reales (`references/assets/snake-assets/fruits.png` + `sprites.js`)
como sprites de comida, con HUD React sincronizado vía callbacks, modal de fin
de juego de la plataforma, y botones táctiles para móvil.

---

## Scope

### Dentro del scope

- Crear `lib/games/snake.ts` — motor TypeScript del juego que exporta
  `startSnake(canvas, callbacks): GameHandle`
- Crear `app/games/[id]/play/SnakeCanvas.tsx` — componente React `'use client'`
  con `forwardRef<GameCanvasHandle, GameCanvasProps>`, touch buttons overlay
  (4 direcciones), y `useImperativeHandle` exponiendo `restart()`
- Agregar entrada `"snake": SnakeCanvas` en `lib/games/registry.ts` (una línea)
- Copiar `references/assets/snake-assets/fruits.png` a `public/snake/fruits.png`
- Portar `references/assets/snake-assets/sprites.js` (atlas `window.SPRITE_ATLAS`)
  a un objeto TypeScript tipado dentro de `lib/games/snake.ts` (sin `window` global)
- Insertar fila nueva en la tabla `games` de Supabase vía migración SQL
  (id `snake`; la fila existente `serpentina` no se toca)

### Fuera del scope

- Reutilizar o migrar la fila `serpentina` ya presente en `games`
  (queda huérfana, sin motor — no es responsabilidad de este spec)
- Crear una clase `.cover-*` nueva — se reutiliza `.cover-snake`, ya definida
  en `app/globals.css`
- Modificar o reemplazar juegos existentes
- Controles responsivos del canvas (escala de coordenadas) — el canvas es
  800×600 fijo, grilla de 40×30 celdas de 20px
- Score persistido en Supabase (ya implementado genéricamente en spec 06)
- Autenticación real
- Tests automatizados
- Panel de administración para gestionar juegos

---

## Modelo de datos

### INSERT en la tabla `games`

```sql
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order)
VALUES (
  'snake',
  'SNAKE',
  'Crece comiendo fruta sin morder tu propia cola.',
  'Guía una serpiente de neón por la grilla devorando frutas reales del huerto pixelado. Cada fruta te alarga y acelera tu ritmo. Un giro en falso contra tu propia cola y todo termina.',
  'ARCADE',
  'cover-snake',
  'green',
  10
);
```

### `lib/games/snake.ts` — API pública

```ts
import type { GameCallbacks, GameHandle } from "./types";

export function startSnake(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle;
```

### Atlas de frutas — tipado

```ts
interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FRUIT_SPRITES: Record<string, SpriteRect> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  // ...resto de las 22 frutas de sprites.js, copiadas literalmente
};

const FRUIT_NAMES = Object.keys(FRUIT_SPRITES);
```

La imagen fuente (`public/snake/fruits.png`) se carga una vez con `Image()` +
`onload` antes de iniciar el loop (igual que el patrón de assets de Arkanoid).

### Componente React — interfaz

```ts
// app/games/[id]/play/SnakeCanvas.tsx
import type { GameCanvasHandle, GameCanvasProps } from "@/lib/games/types";

// forwardRef<GameCanvasHandle, GameCanvasProps>
// expone: restart()
```

### Botones táctiles

| Label | `code` (KeyboardEvent) |
| ----- | ---------------------- |
| ◄     | `ArrowLeft`            |
| ▲     | `ArrowUp`              |
| ▼     | `ArrowDown`            |
| ►     | `ArrowRight`           |

(Snake no usa disparo — sin botón FIRE.)

---

## Mecánica del juego

- **Grilla:** 40 columnas × 30 filas, celdas de 20px sobre canvas 800×600.
- **Movimiento:** la serpiente avanza una celda por tick en la dirección
  actual; cola de input para evitar reversa instantánea sobre sí misma
  (si la última tecla presionada es la opuesta a la dirección actual, se
  ignora hasta el siguiente tick).
- **Comida:** en cada tick sin comida se elige una fruta aleatoria de las 22
  del atlas (`FRUIT_NAMES`) y se ubica en una celda libre de la grilla;
  se dibuja con `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, 20, 20)`.
- **Crecimiento:** al comer, la cola no se recorta ese tick (la serpiente
  crece 1 celda) y se dispara `callbacks.onScore(score)`.
- **Colisión con borde:** game over instantáneo (estilo Snake clásico/Nokia).
- **Colisión con la propia cola:** game over instantáneo.
- **Vidas:** no existen vidas reales en Snake clásico. Se simula con
  `lives = 1`: `callbacks.onLives(1)` en `initGame()`, `callbacks.onLives(0)`
  inmediatamente antes de `callbacks.onGameOver(score)`.
- **Nivel / velocidad:** `level` sube 1 cada 5 frutas comidas;
  `callbacks.onLevel(level)` se dispara en cada subida. Cada nivel reduce el
  intervalo del tick de movimiento (la serpiente se mueve más rápido),
  con un piso mínimo para mantener el juego jugable.
- **Snake (cuerpo):** dibujado con rectángulos/bloques sólidos verde neón
  (`ctx.fillRect`) — sin sprite de imagen; la cabeza se distingue con un
  tono más claro o un borde.

---

## Plan de implementación

### 1. `lib/games/snake.ts` — Motor TypeScript

Implementar desde cero (no hay `references/started-games/` para Snake)
siguiendo los transforms generales de `.claude/skills/add-game/recipe.md`
adaptados a un motor nuevo en vez de un port:

- **Transform 1** — canvas recibido por parámetro (`startSnake(canvas, callbacks)`),
  todo el estado en closure, sin `getElementById`.
- **Transform 2** — listeners `keydown` en `document`, guardados para `cleanup()`.
  Solo se necesita `keydown` (cambio de dirección instantáneo); no hay `keyup`
  que gestionar más allá de los botones táctiles.
- **Transform 3** — flag `paused`; el loop de render sigue dibujando el
  estado actual y el overlay "EN PAUSA" cuando `paused === true`, pero el
  tick de movimiento se omite.
- **Transform 4** — disparar callbacks en los puntos exactos:
  - `onScore(score)` al comer fruta
  - `onLives(1)` en `initGame()`, `onLives(0)` antes de `onGameOver`
  - `onLevel(level)` en `initGame()` (nivel 1) y en cada subida cada 5 frutas
  - `onGameOver(score)` al chocar con borde o con la propia cola
- **Transform 5** — `restart()` llama `initGame()` sin interrumpir el `rafId`/timer.
- **Transform 6** — tipado explícito: `SpriteRect`, `Point`, clase o estructura
  para el cuerpo de la serpiente (array de `{x, y}` en coordenadas de grilla).
- **Transform 8 (assets)** — cargar `img.src = "/snake/fruits.png"`; arrancar
  el loop solo dentro de `img.onload`. El atlas de coordenadas (`FRUIT_SPRITES`)
  se copia literalmente desde `sprites.js`, convertido a `const` TS tipada
  (eliminar el global `window.SPRITE_ATLAS`).

Notas de timing: como el movimiento de Snake es por tick discreto (no por
frame), usar `requestAnimationFrame` para el render continuo (incluyendo el
overlay de pausa) y un acumulador de tiempo interno que dispare el "tick" de
movimiento cada `tickIntervalMs` (decreciente con el nivel), en vez de
`setInterval` separado — así un solo `rafId` cubre todo y `cleanup()` solo
necesita un `cancelAnimationFrame`.

Retornar `{ cleanup, setPaused, restart }` (satisface `GameHandle`).

### 2. `app/games/[id]/play/SnakeCanvas.tsx` — Componente React

```tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { startSnake } from "@/lib/games/snake";
import type {
  GameHandle,
  GameCanvasHandle,
  GameCanvasProps,
} from "@/lib/games/types";

const TOUCH_BUTTONS = [
  { label: "◄", code: "ArrowLeft", row: 0 },
  { label: "▲", code: "ArrowUp", row: 0 },
  { label: "►", code: "ArrowRight", row: 0 },
  { label: "▼", code: "ArrowDown", row: 1 },
];

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const SnakeCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ callbacks, paused }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleRef = useRef<GameHandle | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const handle = startSnake(canvas, callbacks);
      handleRef.current = handle;
      return () => handle.cleanup();
    }, []); // callbacks es estable (useMemo en el padre)

    useEffect(() => {
      handleRef.current?.setPaused(paused);
    }, [paused]);

    useImperativeHandle(ref, () => ({
      restart() {
        handleRef.current?.restart();
      },
    }));

    // canvas 800x600 + overlay de botones táctiles (4 direcciones, sin FIRE)
    return (
      <div className="asteroids-wrap">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="asteroids-canvas"
        />
        <div className="touch-controls">
          {/* row 0: ◄ ▲ ►, row 1: ▼ centrado */}
        </div>
      </div>
    );
  }
);

SnakeCanvas.displayName = "SnakeCanvas";
export default SnakeCanvas;
```

Reutilizar `.asteroids-wrap` / `.asteroids-canvas` / `.touch-controls` /
`.touch-btn` ya definidas en `globals.css` — Snake no necesita un wrapper
visual nuevo, solo un layout de 4 botones direccionales en vez de 3+FIRE.
Consultar `/frontend-design` solo si el layout de 4 botones direccionales
requiere un arreglo distinto al de Asteroides (p. ej. cruceta).

### 3. `lib/games/registry.ts` — Agregar una línea

```ts
import SnakeCanvas from "@/app/games/[id]/play/SnakeCanvas";

export const GAME_CANVASES: Partial<Record<string, CanvasComponent>> = {
  asteroides: AsteroidsCanvas,
  snake: SnakeCanvas, // ← nueva entrada
};
```

### 4. `supabase/migrations/20260615_snake.sql`

```sql
-- Agrega el juego snake al catálogo de Arcade Vault
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order)
VALUES ('snake', 'SNAKE', 'Crece comiendo fruta sin morder tu propia cola.', 'Guía una serpiente de neón por la grilla devorando frutas reales del huerto pixelado. Cada fruta te alarga y acelera tu ritmo. Un giro en falso contra tu propia cola y todo termina.', 'ARCADE', 'cover-snake', 'green', 10);
```

Aplicar con el MCP de Supabase (`apply_migration`).

### 5. `app/globals.css`

Sin cambios — `.cover-snake` ya existe (línea 440-451) y se reutiliza
directamente para el id `snake`.

### 6. `public/snake/`

Copiar `references/assets/snake-assets/fruits.png` →
`public/snake/fruits.png`. El atlas de coordenadas (`sprites.js`) no se copia
como archivo: se transcribe como constante TypeScript tipada dentro de
`lib/games/snake.ts`.

---

## Criterios de aceptación

- [ ] El juego `snake` aparece en `/games` en la biblioteca con su card
- [ ] La card muestra `MEJOR PUNTUACIÓN` (0 hasta que se registre el primer score)
- [ ] Hacer clic en la card navega a `/games/snake` (detalle)
- [ ] El botón JUGAR en la card navega a `/games/snake/play`
- [ ] `/games/snake` muestra la página de detalle sin errores
- [ ] `/games/snake` muestra "SIN PUNTUACIONES AÚN" en el leaderboard (estado inicial)
- [ ] `/games/snake/play` carga el canvas con el juego real funcionando
- [ ] Las frutas se dibujan con los sprites reales de `fruits.png` (no rectángulos)
- [ ] Comer fruta alarga la serpiente y aumenta el score
- [ ] Chocar contra el borde del tablero termina la partida
- [ ] Chocar contra la propia cola termina la partida
- [ ] La velocidad aumenta perceptiblemente cada 5 frutas comidas
- [ ] El HUD HTML de la plataforma muestra score, vidas (1→0) y nivel actualizados en tiempo real
- [ ] El canvas también dibuja su propio HUD interno (score, nivel)
- [ ] El botón PAUSA detiene el movimiento; el canvas muestra overlay "EN PAUSA"
- [ ] REANUDAR reactiva el movimiento correctamente
- [ ] Al chocar, aparece el modal HTML con el score final
- [ ] El modal muestra un input de nombre del jugador (deshabilitado si vacío)
- [ ] "GUARDAR PUNTUACIÓN" llama `saveScoreAction` y escribe en Supabase
- [ ] "JUGAR DE NUEVO" reinicia el juego sin desmontar el canvas
- [ ] "VOLVER AL VAULT" navega a `/`
- [ ] Los botones táctiles (4 direcciones) controlan el juego correctamente
- [ ] Después de guardar un score, `/games/snake` muestra el score en el leaderboard
- [ ] El juego aparece en `/hall-of-fame` en el global top 20 y en su sección top 10
- [ ] `tsc --noEmit` pasa limpio
- [ ] Sin regresiones en `/`, `/games`, `/games/asteroides/play`, `/about`, `/hall-of-fame`

---

## Decisiones tomadas y descartadas

| Decisión               | Elegido                                          | Descartado                          | Motivo                                                                                     |
| ---------------------- | ------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| ID del juego           | `snake` (nuevo)                                  | Reusar `serpentina`                 | El usuario prefirió un id nuevo en vez de la fila placeholder ya existente                 |
| Fila `serpentina`      | Queda huérfana, sin tocar                        | Eliminarla o renombrarla            | Fuera de scope; no romper datos/migraciones existentes sin pedido explícito                |
| Cover                  | Reusar `.cover-snake` existente                  | Crear `.cover-snake-v2`             | Ya estaba pensada visualmente para este juego; cero costo de CSS nuevo                     |
| Comida                 | Fruta aleatoria de 22 sprites por bocado         | Una sola fruta fija (manzana)       | Aprovecha el atlas completo, más variedad visual sin costo de complejidad                  |
| Cuerpo de la serpiente | Bloques vectoriales verde neón (`fillRect`)      | Pedir sprite adicional al usuario   | El atlas solo trae frutas; consistente con la estética retro-arcade de la plataforma       |
| Colisión con borde     | Muerte instantánea                               | Wrap-around (teletransporte)        | Snake clásico (Nokia); decisión explícita del usuario                                      |
| Vidas/Nivel            | `lives=1` fijo, `level` = tier de velocidad      | Omitir callbacks o vidas reales     | Satisface la interfaz `GameCallbacks` común a todos los juegos sin inventar mecánica falsa |
| Game loop              | Un solo `rafId` con acumulador de tick interno   | `setInterval` separado para el tick | Un solo punto de cleanup; evita drift entre render y lógica                                |
| Integración            | Módulo TypeScript con canvas ref                 | `<iframe>`                          | Integración completa con HUD y modal de la plataforma                                      |
| HUD                    | Doble (canvas + HTML) sincronizado vía callbacks | Solo canvas / Solo HTML             | Consistencia con el patrón establecido en spec 05                                          |
| Game over              | Callback → modal HTML de la plataforma           | Overlay en canvas                   | Consistencia con el patrón establecido en spec 05                                          |
| Touch input            | `dispatchEvent(KeyboardEvent)` sintético         | API imperativa                      | Cero cambios en la lógica del juego; mismo patrón que Asteroides                           |
| Restart                | `handle.restart()` sin desmontar canvas          | Desmontar y remontar                | Evita parpadeo y re-inicialización del contexto 2D                                         |
| Canvas size            | 800×600 fijo, grilla 40×30 de 20px               | Resize responsivo                   | Evita complejidad de escalar coordenadas; consistente con Asteroides                       |
| Registro de juegos     | Línea en `lib/games/registry.ts`                 | Rama en `GamePlayer.tsx`            | El registro generaliza el dispatch; `GamePlayer.tsx` no necesita cambiar                   |

---

## Riesgos identificados

- **Fila `serpentina` huérfana** — queda en la tabla `games` sin motor
  implementado. Si en el futuro se intenta jugar `/games/serpentina/play`,
  el registro no tendrá entrada y `GamePlayer.tsx` debe manejar ese caso
  (ya lo hace, por ser `Partial<Record<...>>`), pero es una inconsistencia
  visible en el catálogo que el usuario decidió aceptar.
- **Carga de imagen antes de iniciar** — si `fruits.png` falla en cargar o
  tarda, el juego no debe arrancar con sprites rotos; usar `img.onload`
  como gate (igual que el patrón de assets de Arkanoid).
- **Timing de tick vs frame** — combinar render por frame y movimiento por
  tick en un solo `rafId` requiere cuidado con el acumulador de tiempo para
  no acoplar la velocidad de la serpiente al framerate del dispositivo.
- **RLS** — La tabla `games` solo permite SELECT público; la tabla `scores`
  permite INSERT público. Sin moderación de nombres (queda para spec de
  moderación).
