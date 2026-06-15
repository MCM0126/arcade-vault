# NN-<id>

**Estado:** Draft
**Dependencias:** 05-asteroides-integration, 06-leaderboard, 07-catalog-supabase
**Fecha:** YYYY-MM-DD
**Objetivo:** Integrar el juego "<TITLE>" (id: `<id>`) a la plataforma Arcade Vault
portando el canvas HTML5/JS de referencia como módulo TypeScript en la ruta
`/games/<id>/play`, con HUD React sincronizado vía callbacks, modal de fin de
juego de la plataforma, y botones táctiles para móvil.

---

## Scope

### Dentro del scope

- Crear `lib/games/<id>.ts` — port TypeScript del juego de referencia que exporta
  `start<Game>(canvas, callbacks): GameHandle`
- Crear `app/games/[id]/play/<Game>Canvas.tsx` — componente React `'use client'`
  con `forwardRef<GameCanvasHandle, GameCanvasProps>`, touch buttons overlay,
  y `useImperativeHandle` exponiendo `restart()`
- Agregar entrada `"<id>": <Game>Canvas` en `lib/games/registry.ts` (una línea)
- Insertar fila en la tabla `games` de Supabase vía migración SQL
- [si cover nuevo] Agregar clase `.cover-<id>` en `app/globals.css`
- [si assets binarios] Copiar PNG/MP3 a `public/<id>/` y actualizar rutas

### Fuera del scope

- Modificar o reemplazar juegos existentes
- Controles responsivos del canvas (escala de coordenadas) — el canvas es <W>×<H> fijo
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
  '<id>',
  '<TITLE>',
  '<short_desc>',
  '<long_desc>',
  '<cat>',        -- ARCADE | PUZZLE | SHOOTER | VERSUS
  '<cover>',      -- nombre de clase CSS de cover
  '<color>',      -- cyan | magenta | green | yellow
  <sort_order>
);
```

### `lib/games/<id>.ts` — API pública

```ts
import type { GameCallbacks, GameHandle } from "./types";

// Re-export con nombre específico del juego (alias, sin duplicar la interfaz)
export type <Game>Callbacks = GameCallbacks;
export type <Game>Handle = GameHandle;

export function start<Game>(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle;
```

### Componente React — interfaz

```ts
// app/games/[id]/play/<Game>Canvas.tsx
import type { GameCanvasHandle, GameCanvasProps } from "@/lib/games/types";

// forwardRef<GameCanvasHandle, GameCanvasProps>
// expone: restart()
```

### Botones táctiles

| Label | `code` (KeyboardEvent) |
| ----- | ---------------------- |
| ◄     | `ArrowLeft`            |
| ▲     | `ArrowUp`              |
| ►     | `ArrowRight`           |
| FIRE  | `Space`                |

_(Ajustar según las teclas reales del juego)_

---

## Plan de implementación

### 1. `lib/games/<id>.ts` — Port TypeScript

Copiar la lógica de `references/started-games/<carpeta>/game.js` aplicando los
transforms documentados en `.claude/skills/add-game/recipe.md`:

- **Transform 1** — canvas por parámetro (eliminar `getElementById`)
- **Transform 2** — listeners `keydown`/`keyup` en `document`, guardados para `cleanup()`
- **Transform 3** — flag `paused`; el loop omite `update()` pero dibuja overlay "EN PAUSA"
- **Transform 4** — disparar `onScore`/`onLives`/`onLevel`/`onGameOver` en los puntos exactos
- **Transform 5** — `restart()` llama `initGame()` sin interrumpir el `rafId`
- **Transform 6** — tipado explícito TypeScript en clases y funciones
- [si HUD-DOM] **Transform 7** — reemplazar `getElementById`/`textContent` con callbacks
- [si assets] **Transform 8** — rutas a `public/<id>/`, arranque con `img.onload`
- [si multi-script] **Transform 9** — globals compartidos → módulos TS importados

Retornar `{ cleanup, setPaused, restart }` (satisface `GameHandle`).

### 2. `app/games/[id]/play/<Game>Canvas.tsx` — Componente React

```tsx
'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { start<Game> } from '@/lib/games/<id>';
import type { GameHandle, GameCanvasHandle, GameCanvasProps } from '@/lib/games/types';

const TOUCH_BUTTONS = [
  { label: '◄', code: 'ArrowLeft', row: 0 },
  { label: '▲', code: 'ArrowUp',   row: 0 },
  { label: '►', code: 'ArrowRight', row: 0 },
  { label: 'FIRE', code: 'Space',  row: 1 },
];

function dispatch(code: string, type: 'keydown' | 'keyup') {
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

const <Game>Canvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ callbacks, paused }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const handleRef = useRef<GameHandle | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const handle = start<Game>(canvas, callbacks);
      handleRef.current = handle;
      return () => handle.cleanup();
    }, []); // callbacks es estable (useMemo en el padre)

    useEffect(() => {
      handleRef.current?.setPaused(paused);
    }, [paused]);

    useImperativeHandle(ref, () => ({
      restart() { handleRef.current?.restart(); },
    }));

    // Renderizar canvas + overlay de botones táctiles
    return (
      <div className="asteroids-wrap"> {/* reusar clase o crear nueva */}
        <canvas ref={canvasRef} width={<W>} height={<H>} className="asteroids-canvas" />
        <div className="touch-controls">
          {/* row 0 y row 1 de TOUCH_BUTTONS */}
        </div>
      </div>
    );
  }
);

<Game>Canvas.displayName = '<Game>Canvas';
export default <Game>Canvas;
```

Nota: Usar `/frontend-design` para decidir si se necesitan estilos nuevos para el wrapper
o si se reusan `.asteroids-wrap` / `.asteroids-canvas` / `.touch-controls`.

### 3. `lib/games/registry.ts` — Agregar una línea

```ts
import <Game>Canvas from '@/app/games/[id]/play/<Game>Canvas';

export const GAME_CANVASES: Record<string, CanvasComponent> = {
  asteroides: AsteroidsCanvas,
  '<id>': <Game>Canvas,   // ← nueva entrada
};
```

### 4. `supabase/migrations/<YYYYMMDD>_<id>.sql`

```sql
-- Agrega el juego <id> al catálogo de Arcade Vault
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order)
VALUES ('<id>', '<TITLE>', '<short_desc>', '<long_desc>', '<cat>', '<cover>', '<color>', <sort_order>);
```

Aplicar con el MCP de Supabase (`apply_migration`).

### 5. `app/globals.css` _(solo si `cover` es nuevo)_

Agregar `.cover-<id>` siguiendo el patrón visual de los covers existentes.
Consultar `/frontend-design` para elegir paleta y gradiente acorde al juego.

### 6. `public/<id>/` _(solo si hay assets binarios)_

Copiar los archivos de `references/started-games/<carpeta>/assets/` a `public/<id>/`.
Actualizar todas las rutas en `lib/games/<id>.ts`.

---

## Criterios de aceptación

- [ ] El juego `<id>` aparece en `/games` en la biblioteca con su card
- [ ] La card muestra `MEJOR PUNTUACIÓN` (0 hasta que se registre el primer score)
- [ ] Hacer clic en la card navega a `/games/<id>` (detalle)
- [ ] El botón JUGAR en la card navega a `/games/<id>/play`
- [ ] `/games/<id>` muestra la página de detalle sin errores
- [ ] `/games/<id>` muestra "SIN PUNTUACIONES AÚN" en el leaderboard (estado inicial)
- [ ] `/games/<id>/play` carga el canvas con el juego real funcionando
- [ ] El HUD HTML de la plataforma muestra score, vidas y nivel actualizados en tiempo real
- [ ] El canvas también dibuja su propio HUD interno (score, nivel, vidas)
- [ ] El botón PAUSA detiene el game loop; el canvas muestra overlay "EN PAUSA"
- [ ] REANUDAR reactiva el loop correctamente
- [ ] Al perder todas las vidas, aparece el modal HTML con el score final
- [ ] El modal muestra un input de nombre del jugador (deshabilitado si vacío)
- [ ] "GUARDAR PUNTUACIÓN" llama `saveScoreAction` y escribe en Supabase
- [ ] "JUGAR DE NUEVO" reinicia el juego sin desmontar el canvas
- [ ] "VOLVER AL VAULT" navega a `/`
- [ ] Los botones táctiles (overlay) controlan el juego correctamente
- [ ] Después de guardar un score, `/games/<id>` muestra el score en el leaderboard
- [ ] El juego aparece en `/hall-of-fame` en el global top 20 y en su sección top 10
- [ ] `tsc --noEmit` pasa limpio
- [ ] Sin regresiones en `/`, `/games`, `/games/asteroides/play`, `/about`, `/hall-of-fame`

---

## Decisiones tomadas y descartadas

| Decisión           | Elegido                                          | Descartado               | Motivo                                                                   |
| ------------------ | ------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------ |
| ID del juego       | `<id>` (nuevo)                                   | —                        | —                                                                        |
| Integración        | Módulo TypeScript con canvas ref                 | `<iframe>`               | Integración completa con HUD y modal de la plataforma                    |
| HUD                | Doble (canvas + HTML) sincronizado vía callbacks | Solo canvas / Solo HTML  | Consistencia con el patrón establecido en spec 05                        |
| Game over          | Callback → modal HTML de la plataforma           | Overlay en canvas        | Consistencia con el patrón establecido en spec 05                        |
| Touch input        | `dispatchEvent(KeyboardEvent)` sintético         | API imperativa           | Cero cambios en la lógica del juego; mismo patrón que Asteroides         |
| Restart            | `handle.restart()` sin desmontar canvas          | Desmontar y remontar     | Evita parpadeo y re-inicialización del contexto 2D                       |
| Canvas size        | <W>×<H> fijo, `max-width: 100%` CSS              | Resize responsivo        | Evita complejidad de escalar coordenadas                                 |
| Registro de juegos | Línea en `lib/games/registry.ts`                 | Rama en `GamePlayer.tsx` | El registro generaliza el dispatch; `GamePlayer.tsx` no necesita cambiar |

---

## Riesgos identificados

- **RLS** — La tabla `games` solo permite SELECT público; la tabla `scores` permite INSERT público. Sin moderación de nombres (queda para spec de moderación).
- **Assets binarios** — Si el juego tiene PNG/MP3, deben estar en `public/` antes del build; el motor no puede importar ficheros fuera de `public/` en runtime.
- **HUD acoplado al DOM** — Asegurarse de eliminar TODAS las referencias a `getElementById` / `querySelector` en el motor portado; una referencia olvidada silencia el error en dev pero rompe en SSR.
- **Múltiples scripts con globals** — Verificar que no queden variables globales implícitas al convertir a módulos TS (usar `strict` y `noImplicitAny`).
