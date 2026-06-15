# Recipe: Port transforms para integrar un juego canvas a Arcade Vault

Este archivo documenta los transforms exactos que convirtieron `references/started-games/02-asteroids/game.js`
en `lib/games/asteroids.ts`. Usar como checklist al redactar el spec de un juego nuevo.

---

## Transform 1 — Quitar globals del DOM

**Antes (JS original):**

```js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
```

**Después (TS, dentro de `start<Game>`):**

```ts
export function start<Game>(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle {
  const ctx = canvas.getContext("2d")!;
  // ... todo el estado del juego en closure
}
```

El canvas llega por parámetro desde el componente React que monta el `<canvas>` con `useRef`.

---

## Transform 2 — Mover listeners de `window` a `document`, guardar referencias

**Antes:**

```js
window.addEventListener('keydown', e => { ... });
window.addEventListener('keyup', e => { ... });
```

**Después:**

```ts
function onKeyDown(e: Event) { ... }
function onKeyUp(e: Event) { ... }

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
```

Las referencias `onKeyDown`/`onKeyUp` se guardan en la closure para poder quitarlas en `cleanup()`:

```ts
cleanup() {
  cancelAnimationFrame(rafId);
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
}
```

> **Mouse input (tipo Arkanoid):** Si el juego usa `mousemove`/`click`, también mover a `document` (o al propio `canvas`) y guardar la referencia para `cleanup()`.

---

## Transform 3 — Añadir flag `paused`

```ts
let paused = false;

function loop() {
  if (!paused) update();
  draw(); // draw sigue corriendo para mostrar el overlay
  rafId = requestAnimationFrame(loop);
}
```

En `draw()`, añadir overlay al final (se dibuja encima de todo):

```ts
if (paused) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0ff";
  ctx.font = "bold 42px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EN PAUSA", W / 2, H / 2);
}
```

Exponer en el handle:

```ts
setPaused(p: boolean) { paused = p; }
```

---

## Transform 4 — Disparar callbacks en los puntos exactos de cambio de estado

| Evento         | Callback                      | Momento                                   |
| -------------- | ----------------------------- | ----------------------------------------- |
| Score sube     | `callbacks.onScore(score)`    | Justo después de incrementar `score`      |
| Vida se pierde | `callbacks.onLives(lives)`    | Justo después de decrementar `lives`      |
| Nuevo nivel    | `callbacks.onLevel(level)`    | Al inicio de `nextLevel()` / `initGame()` |
| Game over      | `callbacks.onGameOver(score)` | Cuando `lives <= 0` o condición de fin    |

En `initGame()` disparar los valores iniciales:

```ts
callbacks.onScore(0);
callbacks.onLives(<vidas_iniciales>);
callbacks.onLevel(1);
```

---

## Transform 5 — `restart()` sin desmontar el canvas

```ts
restart() { initGame(); }
```

`initGame()` reinicia todas las variables de estado y relanza los callbacks iniciales.
El `rafId` sigue corriendo — no se interrumpe el game loop, simplemente se reinician los datos.

---

## Transform 6 — Tipado explícito TypeScript

- Clases con propiedades tipadas.
- Funciones de helpers con tipos de retorno.
- `startAsteroids(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameHandle`.
- Import de interfaces genéricas:
  ```ts
  import type { GameCallbacks, GameHandle } from "./types";
  ```

---

## Transform 7 — HUD acoplado al DOM (tipo Tetris)

El juego original puede actualizar el HUD escribiendo en elementos DOM:

```js
document.getElementById("score").textContent = score;
document.getElementById("overlay").style.display = "block";
```

**Reemplazar completamente** con callbacks:

```ts
// Antes: document.getElementById('score').textContent = score;
callbacks.onScore(score);

// Antes: mostrar overlay de game over en DOM
callbacks.onGameOver(score); // la plataforma abre el modal HTML
```

Eliminar toda referencia a `getElementById`, `querySelector`, y manipulación de estilos DOM
en el motor. El motor solo conoce el `<canvas>` y los `callbacks`.

---

## Transform 8 — Assets binarios (tipo Arkanoid)

Si el juego carga imágenes o audio:

1. **Copiar** los archivos a `public/<id>/` (p. ej. `public/arkanoid/spritesheet.png`, `public/arkanoid/sounds/bounce.mp3`).
2. **Reescribir rutas** en el motor:
   - Antes: `new Image(); img.src = 'assets/spritesheet-breakout.png'`
   - Después: `img.src = '/arkanoid/spritesheet.png'` (ruta desde `public/`)
3. **Gatear el arranque** tras la carga:
   ```ts
   export function start<Game>(canvas, callbacks): GameHandle {
     const img = new Image();
     img.onload = () => {
       initGame();
       rafId = requestAnimationFrame(loop);
     };
     img.src = "/<id>/spritesheet.png";
     // ...
   }
   ```
4. Si hay múltiples assets, usar `Promise.all` o un contador de carga antes de llamar `initGame()`.

---

## Transform 9 — Múltiples scripts con globals compartidos (tipo Arkanoid)

Si el juego original carga `assets/spritesheet.js` + `levels.js` + `game.js` en orden:

- Los tres scripts comparten variables globales (`SPRITES`, `LEVELS`, etc.).
- En el port TypeScript, convertirlos en **módulos**:
  - `lib/games/<id>/spritesheet.ts` — exporta `loadSpritesheet()`, `drawSprite()`, etc.
  - `lib/games/<id>/levels.ts` — exporta `LEVELS: Level[]`.
  - `lib/games/<id>/index.ts` (o `lib/games/<id>.ts`) — importa los anteriores y exporta `start<Game>`.
- Eliminar el patrón IIFE y reemplazar por `export const` / `export function`.

---

## Checklist por tipo de juego

### Juego autocontenido (estilo Asteroids ✓)

- [x] Transform 1 — canvas por parámetro
- [x] Transform 2 — listeners en document + cleanup
- [x] Transform 3 — flag paused + overlay
- [x] Transform 4 — callbacks en puntos exactos
- [x] Transform 5 — restart sin desmontar
- [x] Transform 6 — tipado TS

### Juego con HUD-DOM (estilo Tetris)

- Todo lo anterior, más:
- [ ] Transform 7 — reemplazar DOM manipulation con callbacks

### Juego con assets (estilo Arkanoid)

- Todo lo anterior, más:
- [ ] Transform 8 — assets a `public/`, rutas actualizadas, arranque con espera
- [ ] Transform 9 — multi-script → módulos TS (si aplica)
