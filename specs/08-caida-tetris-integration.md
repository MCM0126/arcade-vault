# 08-caida-tetris-integration

**Estado:** Aprobado
**Dependencias:** 05-asteroides-integration, 06-leaderboard, 07-catalog-supabase
**Fecha:** 2026-06-15
**Objetivo:** Integrar el juego "CAÍDA" (id: `caida`, tipo Tetris) a Arcade Vault
portando el canvas HTML5/JS de referencia (`references/started-games/03-tetris/`)
como módulo TypeScript en la ruta `/games/caida/play`, con HUD React sincronizado
vía callbacks, pieza fantasma (ghost piece), previsualización de la siguiente
pieza, modal de fin de juego de la plataforma, y botones táctiles para móvil.

---

## Hallazgo clave

La tabla `games` **ya contiene una fila para este juego**, insertada en
`supabase/migrations/20260615_games.sql`:

```sql
('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.',
 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y
 limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10
 líneas.', 'PUZZLE', 'cover-tetro', 'magenta', 2)
```

La clase de cover `.cover-tetro` **ya existe** en `app/globals.css` (línea 423).
→ **No se necesita ninguna migración SQL ni CSS nuevos.** Este spec es
puramente de integración del motor + UI de juego, usando el `id` `caida` ya
catalogado.

---

## Scope

### Dentro del scope

- Crear `lib/games/caida.ts` — port TypeScript del motor de Tetris de
  referencia (`references/started-games/03-tetris/game.js`), que exporta
  `startCaida(canvas, nextCanvas, callbacks): GameHandle`
- Crear `app/games/[id]/play/CaidaCanvas.tsx` — componente React `'use client'`
  con `forwardRef<GameCanvasHandle, GameCanvasProps>`, dos `<canvas>` (tablero
  300×600 + previsualización 120×120), touch buttons overlay, y
  `useImperativeHandle` exponiendo `restart()`
- Agregar entrada `"caida": CaidaCanvas` en `lib/games/registry.ts` (una línea)
- **Excepción acotada y documentada:** modificar el stat "Vidas" del HUD en
  `app/games/[id]/play/GamePlayer.tsx` para que, cuando `game.id === "caida"`,
  se muestre como "LÍNEAS" con valor numérico en lugar de corazones (ver
  sección _Decisiones_ para el razonamiento)

### Fuera del scope

- Cualquier migración SQL nueva — la fila `caida` ya existe en
  `20260615_games.sql`
- Cualquier clase CSS de cover nueva — `.cover-tetro` ya existe
- Modificar o reemplazar juegos existentes (`asteroides`)
- Controles responsivos del canvas (escala de coordenadas) — el tablero es
  300×600 fijo, la previsualización 120×120 fija
- Score persistido en Supabase (ya implementado genéricamente en spec 06)
- Autenticación real
- Tests automatizados
- Panel de administración para gestionar juegos
- Toggle de tema claro/oscuro del juego de referencia (la plataforma ya tiene
  su propio tema — se elimina por completo del port)

---

## Modelo de datos

### Tabla `games` — sin cambios

La fila `caida` ya existe (ver _Hallazgo clave_). No se requiere INSERT.

### `lib/games/caida.ts` — API pública

```ts
import type { GameCallbacks, GameHandle } from "./types";

export type CaidaCallbacks = GameCallbacks;
export type CaidaHandle = GameHandle;

export function startCaida(
  canvas: HTMLCanvasElement,
  nextCanvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle;
```

> **Desviación de la firma estándar:** se añade un segundo parámetro
> `nextCanvas` para la previsualización de la siguiente pieza (el juego de
> referencia ya usa un `<canvas id="next-canvas">` separado de 120×120). Es la
> única forma de preservar esa función sin reinventar un sistema de iconos.
> Todos los demás juegos de un solo canvas no se ven afectados — esta firma es
> específica de `caida.ts`.

### Componente React — interfaz

```ts
// app/games/[id]/play/CaidaCanvas.tsx
import type { GameCanvasHandle, GameCanvasProps } from "@/lib/games/types";

// forwardRef<GameCanvasHandle, GameCanvasProps>
// expone: restart()
```

### Callbacks — mapeo semántico

| Callback estándar        | Significado en CAÍDA                  | Notas                                                                                                                                                              |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onScore(score)`         | Puntuación total                      | Igual que el original (`LINE_SCORES × level` + drops)                                                                                                              |
| `onLevel(level)`         | Nivel actual                          | `floor(lines / 10) + 1`, igual que el original                                                                                                                     |
| `onLives(lines)`         | **Reutilizado para LÍNEAS limpiadas** | No hay concepto de "vidas" en Tetris; se reutiliza el callback existente para no extender la interfaz genérica. Requiere el ajuste de HUD descrito en _Decisiones_ |
| `onGameOver(finalScore)` | Fin de partida                        | Disparado cuando `spawn()` colisiona inmediatamente                                                                                                                |

### Botones táctiles

| Label | `code` (KeyboardEvent) | Acción            |
| ----- | ---------------------- | ----------------- |
| ◄     | `ArrowLeft`            | mover izquierda   |
| ▲     | `ArrowUp`              | rotar (wall kick) |
| ►     | `ArrowRight`           | mover derecha     |
| ▼     | `ArrowDown`            | soft drop         |
| DROP  | `Space`                | hard drop         |

(`P`/pausa del juego original se elimina del motor — la pausa ahora la
controla la plataforma vía `setPaused()`, igual que en Asteroides.)

---

## Plan de implementación

### 1. `lib/games/caida.ts` — Port TypeScript

Portar `references/started-games/03-tetris/game.js` (~305 líneas) aplicando
los transforms de `.claude/skills/add-game/recipe.md`:

- **Transform 1** — `canvas` y `nextCanvas` llegan por parámetro a
  `startCaida()`; eliminar `document.getElementById('board')`,
  `getElementById('next-canvas')`, etc. Todo el estado (`board`, `current`,
  `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`,
  `dropAccum`, `animId`) vive en la closure de `startCaida`
- **Transform 2** — `document.addEventListener('keydown', onKeyDown)`
  (el original ya usa `document`, no `window` — solo falta guardar la
  referencia de la función para poder hacer
  `document.removeEventListener` en `cleanup()`)
- **Transform 3** — flag `paused` ya existe en el original
  (`togglePause()`), pero se reemplaza la implementación: en lugar de
  alternar internamente con la tecla `P` y mostrar/ocultar el `#overlay`
  del DOM, se expone `setPaused(p)` en el `GameHandle`. El loop sigue
  llamando a `draw()` cuando está en pausa para pintar el overlay
  "EN PAUSA" directamente en el canvas (`ctx.fillText`), y omite el avance
  de `dropAccum`/auto-drop cuando `paused === true`. **Eliminar** el branch
  `KeyP` del listener de teclado
- **Transform 4** — disparar callbacks en los puntos exactos:
  - `callbacks.onScore(score)` — en cada lugar donde `updateHUD()` se
    llamaba en el original (tras `clearLines()`, `hardDrop()`,
    `softDrop()`)
  - `callbacks.onLevel(level)` — dentro de `clearLines()`, cuando
    `level` cambia
  - `callbacks.onLives(lines)` — mismo punto que `onScore`/`onLevel`
    (reutilizado para el conteo de líneas, ver tabla de mapeo semántico)
  - `callbacks.onGameOver(score)` — dentro de `endGame()`
  - En `initGame()` (renombrar `init()`), disparar valores iniciales:
    `onScore(0)`, `onLives(0)`, `onLevel(1)`
- **Transform 5** — `restart()` llama a `initGame()` sin cancelar/relanzar
  `animId` si ya está corriendo (el original sí cancela y relanza en
  `init()` — ajustar para no detener el RAF si ya existe un loop activo)
- **Transform 6** — tipado explícito: `Board = number[][]`,
  `Piece = { type: number; shape: number[][]; x: number; y: number }`,
  tipar todas las funciones (`collide`, `rotateCW`, `tryRotate`, `merge`,
  `clearLines`, `ghostY`, `hardDrop`, `softDrop`, `lockPiece`, `spawn`,
  `drawBlock`, `drawGrid`, `draw`, `drawNext`, `endGame`, `loop`)
- **Transform 7 (HUD-DOM → callbacks)** — eliminar **todas** las
  referencias a `scoreEl`, `linesEl`, `levelEl`, `overlay`,
  `overlayTitle`, `overlayScore`, `restartBtn`,
  `document.getElementById(...)`. La función `updateHUD()` desaparece;
  sus tres asignaciones (`scoreEl.textContent = ...`, etc.) se reemplazan
  por las llamadas a callbacks descritas en Transform 4. El
  `endGame()` ya no toca `overlay`/`overlayTitle` — solo llama a
  `callbacks.onGameOver(score)` y cancela el RAF
- **HUD interno en canvas** — dado que el juego original mostraba
  score/lines/level fuera del canvas (sidebar DOM), y el criterio de
  aceptación exige que "el canvas también dibuje su propio HUD interno",
  añadir un bloque de texto (`ctx.fillText`) en la esquina superior del
  tablero principal con `SCORE`, `LÍNEAS`, `NIVEL` usando los mismos
  valores que se envían por callback. La previsualización de la siguiente
  pieza se sigue dibujando en `nextCanvas` con `drawNext()`, prácticamente
  sin cambios respecto al original
- **Eliminar** el bloque completo de toggle de tema claro/oscuro
  (`themeToggle`, `applyTheme`, `localStorage.getItem('tetris-theme')`) —
  no aplica a la plataforma
- **Eliminar** la dependencia de `getComputedStyle(document.body)` en
  `drawGrid()` — reemplazar `--grid-line` por un color fijo
  (`'rgba(255,255,255,0.06)'` o similar, acorde a la paleta oscura de
  Arcade Vault)

Retornar `{ cleanup, setPaused, restart }` (satisface `GameHandle`).

### 2. `app/games/[id]/play/CaidaCanvas.tsx` — Componente React

```tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { startCaida } from "@/lib/games/caida";
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
  { label: "DROP", code: "Space", row: 1 },
];

function dispatch(code: string, type: "keydown" | "keyup") {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const CaidaCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ callbacks, paused }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleRef = useRef<GameHandle | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      const nextCanvas = nextCanvasRef.current;
      if (!canvas || !nextCanvas) return;
      const handle = startCaida(canvas, nextCanvas, callbacks);
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

    // Renderizar tablero (300x600) + previsualización (120x120) + botones táctiles
    return (
      <div className="asteroids-wrap">
        <div className="caida-board-wrap">
          <canvas
            ref={canvasRef}
            width={300}
            height={600}
            className="asteroids-canvas"
          />
          <canvas
            ref={nextCanvasRef}
            width={120}
            height={120}
            className="caida-next-canvas"
          />
        </div>
        <div className="touch-controls">
          {/* row 0: ◄ ▲ ►, row 1: ▼ DROP */}
        </div>
      </div>
    );
  }
);

CaidaCanvas.displayName = "CaidaCanvas";
export default CaidaCanvas;
```

Nota: Usar `/frontend-design` para decidir el layout exacto de
`.caida-board-wrap` (tablero + previsualización lado a lado o apilados) y si
se necesitan estilos nuevos o se reutilizan `.asteroids-wrap` / `.touch-controls`.

### 3. `lib/games/registry.ts` — Agregar una línea

```ts
import CaidaCanvas from "@/app/games/[id]/play/CaidaCanvas";

export const GAME_CANVASES: Partial<Record<string, CanvasComponent>> = {
  asteroides: AsteroidsCanvas,
  caida: CaidaCanvas, // ← nueva entrada
};
```

### 4. `app/games/[id]/play/GamePlayer.tsx` — Ajuste acotado del HUD

Cambiar únicamente el bloque del stat "Vidas" (líneas 86–89) para que, cuando
`game.id === "caida"`, muestre el label "LÍNEAS" y el valor numérico crudo en
lugar de la repetición de corazones:

```tsx
<div className="hud-stat lives">
  <div className="l">{game.id === "caida" ? "Líneas" : "Vidas"}</div>
  <div className="v">
    {game.id === "caida" ? lives : "♥ ".repeat(lives).trim() || "—"}
  </div>
</div>
```

No se modifica ninguna otra parte del componente — el resto del flujo
(callbacks, modal de game over, `restart()`) funciona sin cambios.

### 5. `supabase/migrations/` — Sin cambios

No se crea ninguna migración nueva (ver _Hallazgo clave_).

### 6. `app/globals.css` — Sin cambios

`.cover-tetro` ya existe. Si el layout de `CaidaCanvas.tsx` requiere clases
nuevas (`.caida-board-wrap`, `.caida-next-canvas`), añadirlas siguiendo el
patrón visual existente — consultar `/frontend-design`.

### 7. `public/caida/` — No aplica

El juego de referencia no usa assets binarios (todo es `ctx.fillRect` con
colores hexadecimales).

---

## Criterios de aceptación

- [ ] El juego `caida` aparece en `/games` en la biblioteca con su card y cover `.cover-tetro`
- [ ] La card muestra "MEJOR PUNTUACIÓN" (0 hasta que se registre el primer score)
- [ ] Hacer clic en la card navega a `/games/caida` (detalle)
- [ ] El botón JUGAR en la card navega a `/games/caida/play`
- [ ] `/games/caida` muestra la página de detalle sin errores
- [ ] `/games/caida` muestra "SIN PUNTUACIONES AÚN" en el leaderboard (estado inicial)
- [ ] `/games/caida/play` carga el tablero 300×600 y la previsualización 120×120 con el juego real funcionando
- [ ] El HUD HTML de la plataforma muestra puntuación y nivel en tiempo real; el stat de "Vidas" se renderiza como "LÍNEAS" con valor numérico para este juego
- [ ] El canvas dibuja su propio HUD interno (score, líneas, nivel) y la previsualización de la siguiente pieza
- [ ] La pieza fantasma (ghost piece) se sigue dibujando a `alpha 0.2`
- [ ] El botón PAUSA detiene el game loop (auto-drop); el canvas muestra overlay "EN PAUSA"
- [ ] REANUDAR reactiva el loop correctamente sin perder el estado del tablero
- [ ] Al perder (pieza nueva colisiona al spawnear), aparece el modal HTML con el score final
- [ ] El modal muestra un input de nombre del jugador (deshabilitado si vacío)
- [ ] "GUARDAR PUNTUACIÓN" llama `saveScoreAction` y escribe en Supabase
- [ ] "JUGAR DE NUEVO" reinicia el tablero sin desmontar los canvas
- [ ] "VOLVER AL VAULT" navega a `/`
- [ ] Los botones táctiles (◄ ▲ ► ▼ DROP) controlan el juego correctamente
- [ ] Después de guardar un score, `/games/caida` muestra el score en el leaderboard
- [ ] El juego aparece en `/hall-of-fame` en el global top 20 y en su sección top 10
- [ ] `tsc --noEmit` pasa limpio
- [ ] Sin regresiones en `/`, `/games`, `/games/asteroides/play`, `/about`, `/hall-of-fame`

---

## Decisiones tomadas y descartadas

| Decisión                                  | Elegido                                                                     | Descartado                                                      | Motivo                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID del juego                              | `caida` (ya existe en `games`)                                              | Crear nuevo `id` (p. ej. `tetris`)                              | La fila ya está catalogada con `cover-tetro` y descripción que coincide exactamente con este motor; reutilizarla evita una migración SQL duplicada    |
| Migración SQL                             | Ninguna nueva                                                               | INSERT nuevo                                                    | El registro `caida` ya fue insertado en `20260615_games.sql`                                                                                          |
| Previsualización de siguiente pieza       | Segundo `<canvas>` (`nextCanvas`) pasado a `startCaida()`                   | Callback `onNextPiece(shape)` que delega el dibujo a React      | Preserva la lógica de dibujo del original (`drawNext()`) sin reescribirla en el componente; menor riesgo de divergencia visual                        |
| Stat "Vidas" → "Líneas"                   | Reutilizar `onLives` + ajuste condicional de 2 líneas en `GamePlayer.tsx`   | Extender `GameCallbacks` con `onLines`                          | Evita modificar la interfaz genérica usada por todos los juegos; el ajuste en `GamePlayer.tsx` es mínimo y queda documentado como excepción explícita |
| HUD interno del canvas                    | Dibujar score/líneas/nivel con `ctx.fillText` en el tablero principal       | Mantener sidebar DOM como en el original                        | El motor no debe tocar el DOM (Transform 7); el criterio de aceptación exige HUD interno en canvas, igual que Asteroides                              |
| Tecla de pausa (`KeyP`)                   | Eliminada del motor; pausa controlada por `setPaused()` desde la plataforma | Mantener `KeyP` interno además del control externo              | Evita doble fuente de verdad sobre el estado de pausa (igual que el patrón de Asteroides)                                                             |
| Tema claro/oscuro del juego de referencia | Eliminado por completo                                                      | Portar el toggle                                                | La plataforma ya tiene su propio sistema de tema; el toggle del juego de referencia es redundante y fuera de scope                                    |
| Color de la grilla (`drawGrid`)           | Color fijo `rgba(255,255,255,0.06)`                                         | Leer `getComputedStyle(document.body)`                          | El motor no debe depender del DOM/CSS del documento anfitrión                                                                                         |
| Restart                                   | `handle.restart()` sin desmontar canvas ni cancelar el RAF activo           | Cancelar y relanzar `animId` en cada restart (como el original) | Evita parpadeo; consistente con el patrón de Asteroides                                                                                               |
| Canvas size                               | 300×600 (tablero) + 120×120 (siguiente pieza), fijos                        | Resize responsivo                                               | Evita complejidad de escalar coordenadas de la grilla 10×20                                                                                           |
| Registro de juegos                        | Línea en `lib/games/registry.ts`                                            | Rama en `GamePlayer.tsx` (más allá del ajuste puntual del stat) | El registro generaliza el dispatch del canvas; el resto de `GamePlayer.tsx` no necesita cambios                                                       |

---

## Riesgos identificados

- **RLS** — La tabla `games` solo permite SELECT público; la tabla `scores` permite INSERT público. Sin moderación de nombres (queda para spec de moderación).
- **HUD acoplado al DOM** — Asegurarse de eliminar TODAS las referencias a `getElementById`/`querySelector`/`localStorage` en el motor portado; una referencia olvidada silencia el error en dev pero rompe en SSR/build.
- **Dos canvases en un solo componente** — `startCaida()` requiere ambos refs (`canvas`, `nextCanvas`) montados antes de inicializar; si `nextCanvasRef.current` es `null` en el primer render, el `useEffect` debe abortar sin lanzar (ya cubierto por el `if (!canvas || !nextCanvas) return;`).
- **Reutilización semántica de `onLives`** — Si en el futuro se añade un juego con vidas reales Y necesidad de mostrar líneas simultáneamente, este patrón de "reutilizar un callback con otro significado" no escala; en ese caso habría que extender `GameCallbacks` formalmente. Aceptable para este spec porque es el único caso actual.
- **Wall kicks y rotación cerca de los bordes** — `tryRotate()` usa kicks `[0, -1, 1, -2, 2]`; verificar que el tipado estricto no rompa el comportamiento original al portar a TS (especialmente la mutación de `current.shape`/`current.x`).
