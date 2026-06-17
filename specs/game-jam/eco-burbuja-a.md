# ECO BURBUJA — Opción A (tema: "Bubble Shooter — dispara y agrupa burbujas de color para reventarlas")

**Estado:** Draft
**Dependencias:** 05-asteroides-integration, 06-leaderboard, 07-catalog-supabase
**Fecha:** 2026-06-16
**Tema de origen:** Bubble Shooter — dispara y agrupa burbujas de color para reventarlas.
**id propuesto:** `eco-burbuja`
**Variante:** Combo por reacción en cadena dentro de una ventana de tiempo corta ("eco"): cada burbuja reventada emite un pulso que, si detona otro grupo antes de que el pulso se apague, multiplica el puntaje en cascada.

## Concepto en una frase

Apunta y dispara burbujas de color hacia una grilla superior para formar grupos de 3+ del mismo color y reventarlos antes de que la pila descienda hasta el cañón.

## Por qué encaja con el tema

El tema pide explícitamente la mecánica de "dispara y agrupa burbujas de color para reventarlas" — es la traducción 1:1 del bubble shooter clásico (Puzzle Bobble / Bust-a-Move) a la mecánica núcleo. El giro de "eco" añade una capa propia: cada explosión deja una resonancia visual (un anillo que se expande y se apaga) que recompensa encadenar disparos rápidos, dándole identidad sonora/visual sin alejarse del original.

## Mecánica núcleo

- El jugador controla un cañón en la base del canvas que apunta con el mouse o las flechas izquierda/derecha; dispara una burbuja de color hacia arriba en la dirección apuntada, rebotando en las paredes laterales.
- La burbuja se adhiere a la primera burbuja de la grilla que toca. Si al adherirse forma un grupo conectado de 3 o más burbujas del mismo color, todo el grupo revienta.
- **Score:** cada burbuja reventada otorga 10 puntos base × el tamaño del grupo. Si una segunda explosión ocurre dentro de los 1.5s siguientes (el "eco" — visualizado como un anillo expansivo que se desvanece en ese lapso), el multiplicador de combo sube en +1 (×2, ×3, ×4...) y se aplica a la siguiente explosión; si no llega a tiempo, el combo se resetea a ×1.
- Las burbujas "huérfanas" (desconectadas del techo tras una explosión) caen y también otorgan puntos (5 por burbuja) y cuentan para el combo de eco.
- **Condición de derrota:** la grilla desciende una fila cada vez que el jugador acumula 6 disparos sin formar grupo; si una burbuja de la grilla cruza la línea roja cercana al cañón, fin de partida.
- **Progresión de dificultad:** cada 8 filas reventadas en total se añade un color nuevo a la paleta activa (empieza con 3 colores, sube hasta 6), lo que reduce la probabilidad estadística de encontrar grupos fáciles.

## Controles

| Acción            | Tecla                   | Botón táctil       |
| ----------------- | ----------------------- | ------------------ |
| Apuntar izquierda | Flecha Izquierda        | ◄                  |
| Apuntar derecha   | Flecha Derecha          | ►                  |
| Disparar          | Espacio / Click         | FIRE               |
| Apuntar (fino)    | Mouse move sobre canvas | — (drag en canvas) |

## Elementos visuales

- Paleta: fondo casi negro con tinte verdoso sutil (`color: green`), burbujas en colores saturados (cyan, magenta, amarillo, verde, naranja, blanco) que contrastan contra el fondo oscuro.
- Formas: todas las burbujas son `ctx.arc` con un degradado radial simple (`createRadialGradient`) para dar volumen; el cañón es un triángulo (`path`) con una línea de mira punteada; el anillo de "eco" es un `ctx.arc` de radio creciente con `globalAlpha` decreciente.
- HUD interno del canvas: contador de combo activo ("ECO ×3") en la esquina superior derecha con el anillo de cuenta regresiva visual, y la línea roja de derrota cerca del cañón.

## Estados del juego

`init → playing → (paused) → eco-activo (sub-estado visual, no bloquea input) → gameover`. El estado "eco-activo" es puramente de feedback (ventana de combo corriendo); el jugador sigue disparando normalmente durante él.

## Inspiración y diferenciación

Inspirado directamente en Puzzle Bobble / Bust-a-Move (agrupar y reventar burbujas de color). Se diferencia de `caida` (Tetris, PUZZLE/magenta) en que no hay piezas geométricas ni rotación: la mecánica es de puntería y agrupación por color, no de encaje espacial. También se diferencia de `asteroides`/`rocas` (SHOOTER) en que el objetivo no es destruir proyectiles enemigos sino formar grupos — el "disparo" es una herramienta de puzzle, no de combate. Ningún juego del catálogo actual usa mecánica de match-by-color con grilla fija.

## Scope

### Dentro del scope

- Diseño del motor desde cero: grilla de burbujas (offset hexagonal por fila), física de disparo con rebote en paredes, detección de grupos conectados (flood fill por color), detección de burbujas huérfanas (flood fill desde el techo) y su caída con gravedad simple.
- Sistema de combo de eco: temporizador de 1.5s por anillo, multiplicador visible en HUD interno.
- HUD interno en canvas (combo, línea de derrota) + HUD HTML de la plataforma sincronizado vía callbacks (score, vidas reinterpretadas, nivel).
- Botones táctiles ◄ ► FIRE más soporte de mouse/drag para apuntar en desktop.
- Pausa con overlay "EN PAUSA" dibujado en canvas.
- Modal de game over de la plataforma + flujo de guardado de score vía Supabase (igual que `caida`/`asteroides`).
- Componente `EcoBurbujaCanvas.tsx` y entrada en `lib/games/registry.ts`.

### Fuera del scope

- Resize responsivo del canvas (tamaño fijo 480×640).
- Autenticación real.
- Tests automatizados.
- Panel de administración para gestionar juegos.
- Modo multijugador o versus (esta variante es un solo jugador contra la grilla).
- Sonido (efectos de "pop" quedan fuera de este spec; se anota como posible follow-up).

## Modelo de datos

```sql
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order) VALUES
  ('eco-burbuja', 'ECO BURBUJA', 'Dispara, agrupa y encadena reacciones de burbujas.', 'Apunta tu cañón y dispara burbujas de color hacia la grilla superior. Forma grupos de tres o más para reventarlos, y encadena explosiones dentro de la ventana de eco para disparar multiplicadores en cascada antes de que la pila te alcance.', 'PUZZLE', 'cover-eco-burbuja', 'green', 10);
```

### `lib/games/ecoBurbuja.ts` — API pública

```ts
import type { GameCallbacks, GameHandle } from "./types";

export type EcoBurbujaCallbacks = GameCallbacks;
export type EcoBurbujaHandle = GameHandle;

export function startEcoBurbuja(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle;
```

Firma estándar de un solo canvas — no se requiere desviación tipo `caida` (no hay previsualización de "siguiente pieza"; el color de la próxima burbuja a disparar se muestra como un pequeño círculo junto al cañón, dentro del mismo canvas).

### Mapeo semántico de callbacks

| Callback estándar        | Significado en ECO BURBUJA                                                                                                              | Notas                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `onScore(score)`         | Puntuación total (incluye multiplicador de combo)                                                                                       | Se dispara tras cada explosión y tras cada caída de huérfanas                                                 |
| `onLives(lives)`         | **Reutilizado para filas restantes antes de la línea de derrota** (cuenta regresiva 6→0, se reinicia tras cada disparo que forma grupo) | Requiere el mismo ajuste de HUD que `caida` (mostrar "FILAS" en vez de corazones) — documentado en Decisiones |
| `onLevel(level)`         | Nivel de dificultad (sube cada 8 filas reventadas en total, controla cuántos colores están activos)                                     |                                                                                                               |
| `onGameOver(finalScore)` | Disparado cuando una burbuja de la grilla cruza la línea roja                                                                           |                                                                                                               |

## Plan de implementación

1. **Estado en closure de `startEcoBurbuja`:** grilla (`Bubble[][]` con offset par/impar por fila), cañón (`angle`, `nextColor`), proyectil activo (`{x, y, vx, vy, color} | null`), lista de anillos de eco activos (`{x, y, radius, alpha}[]`), `score`, `combo`, `comboTimer`, `rowsUntilDrop`, `level`, `paused`, `gameOver`, `rafId`.
2. **Transform 1** — canvas llega por parámetro; `ctx = canvas.getContext('2d')!` dentro de la función. Sin `document.getElementById`.
3. **Transform 2** — `document.addEventListener('keydown'/'keyup', ...)` para flechas y espacio, más `canvas.addEventListener('mousemove'/'click', ...)` para apuntar/disparar con mouse; todas las referencias guardadas para `cleanup()`.
4. **Transform 3** — flag `paused`; el loop sigue dibujando (incluyendo el overlay "EN PAUSA" con `ctx.fillText`) pero no avanza física ni temporizadores de eco cuando `paused === true`.
5. **Transform 4** — callbacks en los puntos exactos:
   - `onScore` tras cada resolución de grupo (explosión + huérfanas).
   - `onLives` tras cada disparo (decrementa `rowsUntilDrop`) y tras cada bajada de fila (se resetea a 6).
   - `onLevel` cuando se añade un color nuevo a la paleta activa.
   - `onGameOver` cuando una burbuja de la grilla supera la línea de derrota en `update()`.
   - En `initGame()`: disparar `onScore(0)`, `onLives(6)`, `onLevel(1)`.
6. **Lógica núcleo a implementar desde cero:**
   - Generación de grilla inicial (3-4 filas con offset hexagonal, colores aleatorios de la paleta activa).
   - Física de proyectil: movimiento lineal con rebote en paredes (`vx *= -1` al chocar), detección de colisión por distancia contra centros de burbujas de la grilla y contra el techo.
   - Snap a celda hexagonal más cercana al colisionar.
   - Flood fill por color (BFS/DFS sobre vecinos hexagonales) para detectar grupo ≥3; si califica, marcar para remover.
   - Flood fill desde el techo para detectar burbujas desconectadas tras la remoción; las no alcanzadas caen con velocidad simple (`y += gravity`) hasta salir del canvas, otorgando puntos.
   - Sistema de eco: al resolver un grupo, push de un anillo `{x, y, radius: 0, alpha: 1, deadline: now + 1500}`; en cada frame, crecer radio y decrecer alpha; si una nueva explosión ocurre con `now < deadline` de algún anillo activo, incrementar `combo` antes de calcular el score de esa explosión, luego reiniciar el temporizador del nuevo anillo.
7. **Transform 5** — `restart()` reinicializa toda la grilla y el estado sin cancelar el `rafId` activo.
8. **Transform 6** — tipado explícito: `Bubble = { color: string; row: number; col: number } | null`, `Projectile`, `EchoRing`, todas las funciones de utilidad (`hexNeighbors`, `floodFillColor`, `floodFillFromCeiling`, `resolveGroup`, `spawnProjectile`, `update`, `draw`, `loop`) tipadas.
9. **Componente React** `app/games/[id]/play/EcoBurbujaCanvas.tsx`: `forwardRef<GameCanvasHandle, GameCanvasProps>`, un solo `<canvas width={480} height={640}>`, overlay de botones táctiles (◄ ► FIRE) con `dispatchEvent(KeyboardEvent)` sintético igual que Asteroides, y soporte nativo de `onPointerMove`/`onClick` sobre el canvas para apuntar con el dedo/mouse directamente.
10. **`lib/games/registry.ts`** — añadir `eco-burbuja: EcoBurbujaCanvas` al mapa `GAME_CANVASES`.
11. **`GamePlayer.tsx`** — aplicar el mismo ajuste puntual que `caida` para el stat "Vidas" → mostrar "FILAS" con el valor numérico cuando `game.id === "eco-burbuja"`.

## Criterios de aceptación

- [ ] El juego `eco-burbuja` aparece en `/games` con su card y cover `.cover-eco-burbuja`
- [ ] `/games/eco-burbuja` muestra la página de detalle sin errores
- [ ] `/games/eco-burbuja/play` carga el canvas 480×640 con el cañón, la grilla inicial y el juego real funcionando
- [ ] Disparar con flechas + espacio y con mouse/click ambos funcionan correctamente
- [ ] Formar un grupo de 3+ del mismo color lo revienta y otorga puntos
- [ ] Las burbujas huérfanas caen tras una explosión y otorgan puntos adicionales
- [ ] El anillo de eco se dibuja, crece y se desvanece en ~1.5s; una segunda explosión dentro de ese lapso incrementa el multiplicador de combo visible en el HUD interno
- [ ] El HUD HTML de la plataforma muestra score, nivel, y el stat "FILAS" (no corazones) en tiempo real
- [ ] Tras 6 disparos sin formar grupo, la grilla baja una fila y el contador de filas se reinicia
- [ ] Si una burbuja cruza la línea roja, se dispara el modal de game over con el score final
- [ ] El botón PAUSA detiene el loop; el canvas muestra overlay "EN PAUSA"; REANUDAR continúa sin perder estado
- [ ] JUGAR DE NUEVO reinicia el juego sin desmontar el canvas
- [ ] GUARDAR PUNTUACIÓN escribe en Supabase con `game: 'eco-burbuja'`
- [ ] Los botones táctiles (◄ ► FIRE) están visibles y funcionales en dispositivos touch
- [ ] `tsc --noEmit` pasa limpio
- [ ] Sin regresiones en el resto de juegos del catálogo

## Decisiones tomadas y descartadas

| Decisión                   | Elegido                                                                                | Descartado                                                                                                 | Motivo                                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | `eco-burbuja`                                                                          | `burbujeo` (sugerido por game-planner), `bubble-shooter`                                                   | Mantiene continuidad con la sesión game-jam anterior sobre el mismo tema; el nombre comunica el giro de "eco" desde el catálogo                                                                                             |
| `cat`                      | `PUZZLE`                                                                               | `ARCADE`                                                                                                   | La mecánica de agrupar por color y resolver la grilla es de naturaleza puzzle (como Puzzle Bobble), no de reflejos puros                                                                                                    |
| `color`                    | `green`                                                                                | `cyan` (saturado por `bloque-buster`/`duelo-pixel`), `magenta` (ya usado por `caida`, único PUZZLE actual) | `green` solo aparece en ARCADE (`serpentina`, `invasores`); no hay ningún PUZZLE green, llena un hueco real de categoría×color                                                                                              |
| Forma del motor            | Un solo `<canvas>`, sin segundo canvas para "siguiente burbuja"                        | Segundo canvas tipo `caida`/`nextCanvas`                                                                   | El color de la próxima burbuja es un solo círculo pequeño, no justifica la complejidad de un canvas adicional                                                                                                               |
| Giro de esta variante (A)  | Combo de "eco" por tiempo: explosiones encadenadas dentro de 1.5s multiplican el score | Combo por patrón (ver Opción B)                                                                            | Un combo basado en reflejos/tiempo encaja mejor con jugadores que priorizan velocidad y da feedback visual inmediato (anillo); se reserva la variante de patrón para Opción B, que premia planificación en vez de velocidad |
| Reutilización de `onLives` | Para "filas restantes antes de bajada forzada"                                         | Extender `GameCallbacks` con un campo nuevo                                                                | Sigue el precedente de `caida` (reutilizar `onLives` para "líneas"); evita tocar el contrato genérico                                                                                                                       |
| Condición de derrota       | Línea fija cerca del cañón, la grilla baja cada 6 disparos sin grupo                   | Derrota por tiempo límite global                                                                           | Una derrota espacial (grilla creciente) es más fiel al género bubble shooter clásico que un cronómetro duro                                                                                                                 |

## Riesgos identificados

- **RLS** — `games` solo permite SELECT público y `scores` solo INSERT público; sin moderación de nombres, igual que el resto del catálogo.
- **HUD acoplado al DOM** — el motor no debe usar `getElementById`/`querySelector`; todo pasa por callbacks, siguiendo Transform 7 del recipe aunque este juego no tiene un original del que portar.
- **Detección de grupos por flood fill en grilla hexagonal con offset** — es la pieza de mayor riesgo de bugs sutiles (vecinos mal calculados en filas pares/impares); requiere tests manuales exhaustivos en los bordes de la grilla antes de marcar el spec como completo.
- **Colisión proyectil-grilla por distancia euclidiana** — a velocidades altas el proyectil puede "atravesar" una burbuja en un solo frame (tunneling); mitigar con un paso de integración más fino (sub-stepping) si se detecta en pruebas.
- **Balance del combo de eco** — la ventana de 1.5s es un valor de diseño inicial; puede requerir ajuste tras playtesting para no ser ni trivialmente fácil ni imposible de alcanzar.
- **Reutilización semántica de `onLives`** — mismo riesgo documentado en `08-caida-tetris-integration.md`: si un futuro juego necesita vidas reales y otro contador simultáneo, este patrón no escala y habría que extender `GameCallbacks` formalmente.
