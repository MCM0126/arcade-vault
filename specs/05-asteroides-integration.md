# 05-asteroides-integration

**Estado:** Implementado
**Dependencias:** 01-mvp-screens (GamePlayer.tsx, lib/data.ts)
**Fecha:** 2026-06-15
**Objetivo:** Agregar el juego "ASTEROIDES" (id: `asteroides`) a la plataforma Arcade
Vault integrando el canvas HTML5/JS de referencia como módulo TypeScript en la ruta
`/games/asteroides/play`, con HUD React sincronizado vía callbacks, modal de fin de
juego de la plataforma, y botones táctiles para móvil.

---

## Scope

### Dentro del scope

- Agregar entrada `asteroides` a `lib/data.ts` (cat: SHOOTER, color: yellow, similar a `rocas`)
- Crear `lib/games/asteroids.ts` — port TypeScript del juego de referencia que exporta
  `startAsteroids(canvas, callbacks): AsteroidsHandle`
- Crear `app/games/[id]/play/AsteroidsCanvas.tsx` — componente React que monta el canvas,
  pasa callbacks al módulo, y renderiza botones táctiles overlay
- Modificar `app/games/[id]/play/GamePlayer.tsx` — cuando `game.id === 'asteroides'`,
  renderizar `<AsteroidsCanvas>` en lugar del CRT mock; los callbacks actualizan el HUD HTML
- Los botones táctiles (◄ ► ▲ FIRE) despachan synthetic `KeyboardEvent` en `document`
- El canvas conserva su HUD interno (puntaje, nivel, vidas dibujados en canvas)
- El HUD HTML de la plataforma también muestra score/vidas/nivel sincronizados vía callbacks
- PAUSA pausa el game loop; el canvas dibuja overlay "EN PAUSA"
- GAME OVER dispara callback que abre el modal HTML de la plataforma con score final
- GUARDAR PUNTUACIÓN guarda en localStorage con `game: 'asteroides'`
- JUGAR DE NUEVO reinicia el juego via handle sin desmontar el canvas

### Fuera del scope

- Modificar o reemplazar el juego `rocas` (permanece como mock)
- Controles responsivos del canvas (escala de coordenadas) — el canvas es 800×600 fijo
- Score persistido en Supabase (queda para un spec de backend)
- Autenticación real
- Tests automatizados

---

## Modelo de datos

### Entrada nueva en `lib/data.ts`

```ts
{
  id: 'asteroides',
  title: 'ASTEROIDES',
  short: 'Pulveriza rocas espaciales en gravedad cero.',
  long: 'Tu nave triangular flota en el vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Recoge el power-up 3x para triplicar tu cadencia de fuego.',
  cat: 'SHOOTER',
  cover: 'cover-rocas',   // reutiliza el cover existente
  color: 'yellow',
  best: 41200,
  plays: '15.6K',
}
```

### `lib/games/asteroids.ts` — API pública

```ts
export interface AsteroidsCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onGameOver(finalScore: number): void;
}

export interface AsteroidsHandle {
  cleanup(): void;
  setPaused(paused: boolean): void;
  restart(): void;
}

export function startAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks
): AsteroidsHandle;
```

### Estado React en `GamePlayer.tsx`

No se agregan props nuevas al componente. Los callbacks de `AsteroidsCallbacks`
actualizan los `useState` existentes: `score`, `lives`, `level`. `onGameOver`
llama `setScore(finalScore)` y `setOver(true)`, lo que abre el modal actual.

---

## Plan de implementación

1. **Agregar `asteroides` a `lib/data.ts`** — Insertar la nueva entrada en el array
   `GAMES` (después de `rocas`). El juego aparece en `/games` y en `/hall-of-fame`
   de inmediato.

2. **Crear `lib/games/asteroids.ts`** — Port TypeScript del juego de referencia:
   - Copiar todas las clases (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`)
     y funciones (`wrap`, `dist`, `rand`, `randInt`, `spawnAsteroids`, `initGame`,
     `nextLevel`, `explode`, `killShip`, `update`, `draw`, `loop`) con tipos explícitos.
   - Reemplazar `const canvas = document.getElementById('canvas')` y `const ctx` globales
     por parámetros locales dentro de `startAsteroids`.
   - Reemplazar `window.addEventListener('keydown'/'keyup')` por listeners en `document`,
     guardados en variables para poder removerlos en `cleanup()`.
   - Añadir variable `paused: boolean`; el loop salta `update()` cuando `paused === true`
     y dibuja un overlay "EN PAUSA" sobre el canvas.
   - Disparar callbacks en los momentos exactos:
     - `onScore` → cada vez que `score` aumenta (al destruir asteroide)
     - `onLives` → cuando `lives` decrece (al morir la nave)
     - `onLevel` → cuando se llama `nextLevel()`
     - `onGameOver` → cuando `state` pasa a `'gameover'`; el loop deja de llamar
       `initGame()` automáticamente y espera `restart()`
   - `restart()` llama `initGame()` internamente y reactiva el loop.
   - Retornar `{ cleanup, setPaused, restart }`.

3. **Crear `app/games/[id]/play/AsteroidsCanvas.tsx`** — Componente `'use client'`:
   - Props: `{ callbacks: AsteroidsCallbacks; paused: boolean }`.
   - `useRef<HTMLCanvasElement | null>(null)` para el elemento canvas.
   - `useRef<AsteroidsHandle | null>(null)` para guardar el handle.
   - `useEffect([], [])` — al montar: llama `startAsteroids(canvas, callbacks)`,
     guarda el handle; retorna `handle.cleanup`.
   - `useEffect([paused])` — llama `handle.setPaused(paused)`.
   - Canvas: `<canvas ref={...} width={800} height={600} style={{ maxWidth: '100%' }} />`
   - Botones táctiles (overlay absoluto sobre el canvas, solo en dispositivos touch):
     ```
     ◄  ▲  ►
           FIRE
     ```
     Cada botón: `onPointerDown` → `document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))`
     `onPointerUp` / `onPointerLeave` → `keyup`.
   - Exponer `restart()` vía `forwardRef` + `useImperativeHandle`.

4. **Modificar `app/games/[id]/play/GamePlayer.tsx`**:
   - Importar `AsteroidsCanvas` y `AsteroidsCallbacks`.
   - Construir `callbacks` con `useMemo` que referencia los setters de estado.
   - En el bloque del CRT, añadir condición:
     ```tsx
     {
       game.id === "asteroides" ? (
         <AsteroidsCanvas ref={astRef} callbacks={callbacks} paused={paused} />
       ) : (
         <div className="crt">...</div>
       );
     }
     ```
   - El botón "JUGAR DE NUEVO" en el modal llama `astRef.current?.restart()` además
     de resetear el estado React.
   - Los demás flujos (PAUSA, SALIR, guardar en localStorage) no cambian.

---

## Criterios de aceptación

- [ ] El juego "ASTEROIDES" aparece en `/games` en la biblioteca
- [ ] `/games/asteroides` muestra la página de detalle sin errores
- [ ] `/games/asteroides/play` carga el canvas con el juego real funcionando
- [ ] El HUD HTML de la plataforma muestra score, vidas y nivel actualizados en tiempo real
- [ ] El canvas también dibuja su propio HUD interno (score, nivel, vidas)
- [ ] El botón PAUSA detiene el game loop; el canvas muestra overlay "EN PAUSA"
- [ ] REANUDAR reactiva el loop correctamente
- [ ] Al perder todas las vidas, aparece el modal HTML de la plataforma con el score final
- [ ] GUARDAR PUNTUACIÓN escribe en localStorage con `game: 'asteroides'`
- [ ] JUGAR DE NUEVO reinicia el juego sin desmontar el canvas
- [ ] SALIR navega a `/games/asteroides`
- [ ] Los 4 botones táctiles (◄ ► ▲ FIRE) están visibles en dispositivos touch
- [ ] Los botones táctiles controlan la nave correctamente
- [ ] El juego `rocas` y todos los demás no sufren regresiones
- [ ] `tsc --noEmit` pasa limpio

---

## Decisiones tomadas y descartadas

| Decisión              | Elegido                                          | Descartado                       | Motivo                                                    |
| --------------------- | ------------------------------------------------ | -------------------------------- | --------------------------------------------------------- |
| ID del juego          | `asteroides` (nuevo)                             | Reutilizar `rocas`               | El usuario confirmó que es un juego nuevo independiente   |
| Integración del juego | Módulo TypeScript con canvas ref                 | `<iframe>`                       | Integración completa con HUD y modal de la plataforma     |
| HUD                   | Doble (canvas + HTML) sincronizado vía callbacks | Solo canvas / Solo HTML          | El usuario confirmó doble HUD con notificaciones React    |
| Game over             | Callback → modal HTML de la plataforma           | Overlay dibujado en canvas       | El usuario prefiere el modal de la plataforma             |
| Touch input           | `dispatchEvent(KeyboardEvent)` sintético         | `touchKeys` ref / API imperativa | Cero cambios en la lógica del juego; más simple           |
| JUGAR DE NUEVO        | `handle.restart()` sin desmontar canvas          | Desmontar y remontar componente  | Evita parpadeo y re-inicialización del contexto 2D        |
| Canvas size           | 800×600 fijo, `max-width: 100%` CSS              | Resize responsivo de coordenadas | Evita complejidad de escalar coordenadas del juego        |
| Cover del juego       | Reutilizar `cover-rocas`                         | Cover nuevo                      | El juego es visualmente idéntico; no requiere asset nuevo |
