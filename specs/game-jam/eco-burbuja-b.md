# ECO BURBUJA — Opción B (tema: "Bubble Shooter — dispara y agrupa burbujas de color para reventarlas")

**Estado:** Draft
**Dependencias:** 05-asteroides-integration, 06-leaderboard, 07-catalog-supabase
**Fecha:** 2026-06-16
**Tema de origen:** Bubble Shooter — dispara y agrupa burbujas de color para reventarlas.
**id propuesto:** `eco-burbuja`
**Variante:** Combo por patrón de objetivo ("eco de figura"): cada cierto número de disparos aparece una silueta objetivo en la grilla; completarla con el color correcto antes de que expire otorga un bono de puntaje grande y limpia filas extra, en lugar de premiar la velocidad de encadenado.

## Concepto en una frase

Apunta y dispara burbujas de color hacia una grilla superior para formar grupos de 3+ del mismo color y reventarlos, persiguiendo además siluetas objetivo periódicas que recompensan la planificación.

## Por qué encaja con el tema

El tema exige la mecánica literal de "dispara y agrupa burbujas de color para reventarlas" — igual que la Opción A, esto es el núcleo de Puzzle Bobble / Bust-a-Move traducido directamente. El giro de esta variante introduce una capa narrativa de "eco de figura": cada tanto, una silueta translúcida del mismo color objetivo aparece superpuesta en una región de la grilla, como si fuera el "eco" o recuerdo de un patrón pasado que el jugador debe reconstruir, dando un objetivo secundario de planificación en vez de reflejos puros.

## Mecánica núcleo

- El jugador controla un cañón en la base del canvas que apunta con el mouse o las flechas izquierda/derecha; dispara una burbuja de color hacia arriba en la dirección apuntada, rebotando en las paredes laterales.
- La burbuja se adhiere a la primera burbuja de la grilla que toca. Si al adherirse forma un grupo conectado de 3 o más burbujas del mismo color, todo el grupo revienta.
- **Score:** cada burbuja reventada otorga 10 puntos base × el tamaño del grupo. Las burbujas huérfanas que caen otorgan 5 puntos cada una.
- **Mecánica de combo distinta (vs. Opción A):** cada 5 disparos exitosos (que formaron grupo), aparece una "silueta eco" — un contorno punteado de 4-6 celdas de un color específico, superpuesto sobre celdas ya ocupadas de la grilla, con una cuenta atrás visible de 10 disparos para completarla. Si el jugador logra que todas las celdas de la silueta terminen siendo del color objetivo (reventando y volviendo a rellenar esa zona con el color correcto) antes de que expire la cuenta atrás, se otorga un bono fijo de 150 puntos y se eliminan 2 filas completas de la grilla como recompensa. Si expira sin completarse, no hay penalización pero tampoco bono — la silueta simplemente desaparece y el contador de disparos para la siguiente empieza de nuevo.
- **Condición de derrota:** igual base que la mecánica núcleo — si una burbuja de la grilla cruza la línea roja cercana al cañón, fin de partida. A diferencia de la Opción A, la grilla baja una fila cada 8 disparos sin formar grupo (no 6), porque el ritmo de esta variante es más pausado al exigir planificación espacial.
- **Progresión de dificultad:** cada 3 siluetas-eco completadas (no por filas reventadas como en la Opción A), se añade un color nuevo a la paleta activa y las siluetas siguientes ocupan más celdas (de 4-6 a 6-9), exigiendo patrones más grandes.

## Controles

| Acción            | Tecla                   | Botón táctil       |
| ----------------- | ----------------------- | ------------------ |
| Apuntar izquierda | Flecha Izquierda        | ◄                  |
| Apuntar derecha   | Flecha Derecha          | ►                  |
| Disparar          | Espacio / Click         | FIRE               |
| Apuntar (fino)    | Mouse move sobre canvas | — (drag en canvas) |

## Elementos visuales

- Paleta: igual base que Opción A (fondo oscuro con tinte verdoso, burbujas saturadas), pero la silueta-eco se dibuja con un trazo punteado semitransparente (`ctx.setLineDash`) en el color objetivo, pulsando suavemente (oscilación de `globalAlpha` con `Math.sin`) para distinguirla de las burbujas normales.
- Formas: burbujas como `ctx.arc` con degradado radial; cañón como triángulo con línea de mira punteada; silueta-eco como contorno de celdas hexagonales sin relleno, más un pequeño contador numérico de disparos restantes flotando sobre la zona.
- HUD interno del canvas: indicador de "ECO ACTIVO" con el color objetivo y los disparos restantes para completarlo, visible solo mientras hay una silueta activa; línea roja de derrota cerca del cañón.

## Estados del juego

`init → playing → (paused) → eco-silueta-activa (estado real con temporizador de disparos, sí afecta el cálculo de score al resolverse) → gameover`. A diferencia de la Opción A (donde "eco" es un efecto visual pasivo), aquí "eco-silueta-activa" es un estado de juego real con su propia condición de éxito/expiración que se evalúa explícitamente.

## Inspiración y diferenciación

Inspirado en Puzzle Bobble / Bust-a-Move para la mecánica núcleo, con un guiño a mecánicas de "patrón objetivo contrarreloj" vistas en puzzles tipo Picross/Lumines (reconstruir una figura con piezas de color). Se diferencia de la Opción A en que el combo no depende de la velocidad de encadenado sino de la lectura espacial de la grilla; también se diferencia del resto del catálogo por las mismas razones que la Opción A (no hay mecánica de match-by-color ni de patrón-objetivo en ningún juego actual).

## Scope

### Dentro del scope

- Mismo motor base que la Opción A: grilla con offset hexagonal, física de disparo con rebote, flood fill por color para detectar grupos, flood fill desde el techo para huérfanas.
- Sistema de silueta-eco: generación periódica de una región objetivo dentro de la grilla existente, contador de disparos restantes, evaluación de si las celdas de la región coinciden con el color objetivo al expirar o en cada resolución de grupo.
- HUD interno en canvas (silueta activa + contador) + HUD HTML de la plataforma sincronizado vía callbacks.
- Botones táctiles ◄ ► FIRE más soporte de mouse/drag para apuntar en desktop.
- Pausa con overlay "EN PAUSA" dibujado en canvas.
- Modal de game over de la plataforma + flujo de guardado de score vía Supabase.
- Componente `EcoBurbujaCanvas.tsx` y entrada en `lib/games/registry.ts` (comparte el mismo `id` de catálogo que la Opción A — son alternativas, no conviven).

### Fuera del scope

- Resize responsivo del canvas (tamaño fijo 480×640).
- Autenticación real.
- Tests automatizados.
- Panel de administración para gestionar juegos.
- Modo multijugador o versus.
- Sonido (efectos de "pop" y de aparición de silueta quedan fuera de este spec).
- Selección manual de qué celdas conforman la silueta por parte del jugador — la posición de la silueta es siempre generada por el motor, no editable.

## Modelo de datos

```sql
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order) VALUES
  ('eco-burbuja', 'ECO BURBUJA', 'Dispara, agrupa y reconstruye patrones de eco antes de que se esfumen.', 'Apunta tu cañón y dispara burbujas de color hacia la grilla superior. Forma grupos de tres o más para reventarlos, y mantén un ojo en las siluetas de eco que aparecen periódicamente: reconstrúyelas con el color correcto antes de que expiren para ganar bonos grandes y limpiar filas extra.', 'PUZZLE', 'cover-eco-burbuja', 'green', 10);
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

Firma estándar de un solo canvas, igual que la Opción A — no se requiere segundo canvas. La silueta-eco se dibuja superpuesta en el mismo canvas principal.

### Mapeo semántico de callbacks

| Callback estándar        | Significado en ECO BURBUJA (Opción B)                                                                                           | Notas                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `onScore(score)`         | Puntuación total (incluye bonos de silueta completada)                                                                          | Se dispara tras cada explosión, caída de huérfanas, y bono de silueta                                |
| `onLives(lives)`         | **Reutilizado para disparos restantes antes de la bajada forzada** (cuenta regresiva 8→0, distinto del umbral de 6 en Opción A) | Mismo ajuste de HUD que `caida` y que la Opción A (mostrar "FILAS" o "DISPAROS" en vez de corazones) |
| `onLevel(level)`         | Nivel de dificultad (sube cada 3 siluetas-eco completadas, no por filas como en Opción A)                                       |                                                                                                      |
| `onGameOver(finalScore)` | Disparado cuando una burbuja de la grilla cruza la línea roja                                                                   |                                                                                                      |

## Plan de implementación

1. **Estado en closure de `startEcoBurbuja`:** grilla (`Bubble[][]`), cañón, proyectil activo, `score`, `shotsUntilDrop` (umbral 8), `level`, `paused`, `gameOver`, `rafId`, y el estado nuevo específico de esta variante: `activeSilhouette: { cells: {row,col}[]; targetColor: string; shotsRemaining: number } | null`, `shotsSinceLastSilhouette`.
2. **Transform 1** — canvas por parámetro, sin `document.getElementById`.
3. **Transform 2** — listeners de teclado y mouse en `document`/`canvas`, referencias guardadas para `cleanup()`.
4. **Transform 3** — flag `paused`; cuando está activo, el loop sigue dibujando overlay "EN PAUSA" pero no avanza física, ni el contador de disparos de la silueta activa.
5. **Transform 4** — callbacks en los puntos exactos:
   - `onScore` tras cada resolución de grupo, caída de huérfanas, y al completar una silueta (bono de 150).
   - `onLives` tras cada disparo (decrementa `shotsUntilDrop`) y tras cada bajada de fila (se resetea a 8).
   - `onLevel` cada 3 siluetas completadas (incrementa, agranda el rango de tamaño de la próxima silueta y puede añadir un color nuevo).
   - `onGameOver` cuando una burbuja de la grilla supera la línea de derrota.
   - En `initGame()`: disparar `onScore(0)`, `onLives(8)`, `onLevel(1)`.
6. **Lógica núcleo a implementar desde cero (comparte base con Opción A, diverge en el punto 6c):**
   - 6a. Generación de grilla inicial y física de proyectil — igual que Opción A (rebote en paredes, snap a celda hexagonal).
   - 6b. Flood fill por color para grupos ≥3 y flood fill desde el techo para huérfanas — igual que Opción A.
   - 6c. **Específico de esta variante:** cada vez que `shotsSinceLastSilhouette` alcanza 5, elegir aleatoriamente una región contigua de 4-6 celdas ya ocupadas en la grilla (BFS desde una celda semilla aleatoria) y un color objetivo (no necesariamente el color actual de esas celdas); guardar como `activeSilhouette` con `shotsRemaining = 10`. En cada disparo que resuelve un grupo, decrementar `shotsRemaining`; revisar si todas las celdas de `activeSilhouette.cells` tienen actualmente `color === targetColor` — si sí, otorgar el bono (150 pts + eliminar 2 filas completas desde arriba) y limpiar `activeSilhouette`. Si `shotsRemaining` llega a 0 sin cumplirse, limpiar `activeSilhouette` sin bono ni penalización.
7. **Transform 5** — `restart()` reinicializa todo el estado (incluyendo `activeSilhouette = null`) sin cancelar el `rafId` activo.
8. **Transform 6** — tipado explícito: `Bubble`, `Projectile`, `Silhouette = { cells: GridCoord[]; targetColor: string; shotsRemaining: number }`, todas las funciones tipadas (`generateSilhouette`, `evaluateSilhouette`, `floodFillColor`, `floodFillFromCeiling`, `resolveGroup`, `update`, `draw`, `loop`).
9. **Componente React** `app/games/[id]/play/EcoBurbujaCanvas.tsx` — idéntico en estructura al de la Opción A (mismo tamaño de canvas 480×640, mismos botones táctiles, mismo soporte de mouse/drag); solo cambia el módulo de motor importado (`startEcoBurbuja` de esta variante).
10. **`lib/games/registry.ts`** — añadir `eco-burbuja: EcoBurbujaCanvas` al mapa `GAME_CANVASES` (mutuamente excluyente con la Opción A; el usuario implementa una u otra, no ambas bajo el mismo id).
11. **`GamePlayer.tsx`** — mismo ajuste puntual que Opción A para el stat "Vidas" → "DISPAROS" (o "FILAS", a decidir en la implementación) cuando `game.id === "eco-burbuja"`.

## Criterios de aceptación

- [ ] El juego `eco-burbuja` aparece en `/games` con su card y cover `.cover-eco-burbuja`
- [ ] `/games/eco-burbuja` muestra la página de detalle sin errores
- [ ] `/games/eco-burbuja/play` carga el canvas 480×640 con el cañón, la grilla inicial y el juego real funcionando
- [ ] Disparar con flechas + espacio y con mouse/click ambos funcionan correctamente
- [ ] Formar un grupo de 3+ del mismo color lo revienta y otorga puntos; las huérfanas caen y otorgan puntos adicionales
- [ ] Cada 5 disparos exitosos aparece una silueta-eco visible (contorno punteado pulsante) con su contador de disparos restantes
- [ ] Completar la silueta con el color correcto antes de que expire otorga el bono de 150 puntos y elimina 2 filas; el HUD interno y el HTML reflejan el bono inmediatamente
- [ ] Si la silueta expira sin completarse, desaparece sin penalización y el ciclo de "cada 5 disparos" se reinicia correctamente
- [ ] El HUD HTML de la plataforma muestra score, nivel y el stat reutilizado ("FILAS"/"DISPAROS") en tiempo real
- [ ] Tras 8 disparos sin formar grupo, la grilla baja una fila y el contador se reinicia
- [ ] Si una burbuja cruza la línea roja, se dispara el modal de game over con el score final
- [ ] El botón PAUSA detiene el loop (incluyendo el contador de la silueta activa); el canvas muestra overlay "EN PAUSA"
- [ ] JUGAR DE NUEVO reinicia el juego (incluyendo cualquier silueta activa) sin desmontar el canvas
- [ ] GUARDAR PUNTUACIÓN escribe en Supabase con `game: 'eco-burbuja'`
- [ ] Los botones táctiles (◄ ► FIRE) están visibles y funcionales en dispositivos touch
- [ ] `tsc --noEmit` pasa limpio
- [ ] Sin regresiones en el resto de juegos del catálogo

## Decisiones tomadas y descartadas

| Decisión                                   | Elegido                                                             | Descartado                                       | Motivo                                                                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                       | `eco-burbuja` (mismo que Opción A)                                  | Sufijo distinto en el id de catálogo             | Son alternativas del mismo concepto; el usuario solo implementará una, no tiene sentido reservar dos ids de catálogo                                                                                                                         |
| `cat` / `color`                            | `PUZZLE` / `green` (idéntico a Opción A)                            | Diferenciar color entre variantes                | El color identifica al concepto final en el catálogo, no a la variante de desarrollo; cambiarlo aquí generaría confusión si el usuario decide mezclar ideas de ambas opciones                                                                |
| Giro de esta variante (B)                  | Combo por patrón espacial ("silueta-eco") que premia planificación  | Combo por tiempo/velocidad (ver Opción A)        | Ofrece un perfil de jugador distinto: quien prefiere leer la grilla y planear en vez de reaccionar rápido; mantiene ambas opciones igual de atractivas para públicos distintos                                                               |
| Umbral de disparos antes de bajada forzada | 8 disparos                                                          | 6 disparos (como en Opción A)                    | El ritmo de esta variante es deliberadamente más pausado porque exige tiempo de lectura espacial para identificar y completar la silueta; un umbral igual al de la Opción A penalizaría injustamente la planificación                        |
| Generación de la silueta-eco               | Región contigua aleatoria de celdas ya ocupadas (BFS desde semilla) | Región completamente vacía a rellenar desde cero | Usar celdas ya ocupadas (que deben "convertirse" al color objetivo mediante resolución de grupos) es más coherente con la mecánica de match-3 existente que pedir rellenar huecos vacíos, que requeriría una mecánica de colocación distinta |
| Progresión de dificultad                   | Por siluetas completadas (cada 3)                                   | Por filas reventadas (como en Opción A)          | Mantiene la métrica de progreso anclada al objetivo central de esta variante (completar patrones), igual que Opción A ancla su progreso a su propia métrica de eco (filas reventadas)                                                        |
| Penalización por silueta expirada          | Ninguna (solo se pierde la oportunidad del bono)                    | Penalización de puntos o bajada de fila forzada  | Evita castigar doblemente al jugador que ya está bajo presión por la grilla ascendente; el riesgo/recompensa ya está en el bono perdido, no necesita un castigo adicional                                                                    |

## Riesgos identificados

- **RLS** — mismas condiciones que el resto del catálogo: `games` solo SELECT público, `scores` solo INSERT público, sin moderación de nombres.
- **HUD acoplado al DOM** — mismo cuidado que Opción A: el motor no debe usar `getElementById`/`querySelector`, todo vía callbacks.
- **Detección de grupos por flood fill en grilla hexagonal con offset** — mismo riesgo que Opción A, es la base compartida del motor.
- **Generación de silueta sobre una grilla cambiante** — si la región elegida para la silueta es modificada (reventada por completo) antes de que el jugador la note, el contador seguiría corriendo sobre celdas que ya no existen; el motor debe revalidar que las celdas de `activeSilhouette.cells` sigan ocupadas en cada chequeo, y descartar la silueta con gracia (sin bono ni penalización) si la región fue destruida externamente.
- **Balance del bono de 150 puntos + 2 filas** — valor de diseño inicial; si resulta demasiado generoso o demasiado tacaño respecto al ritmo de score normal, requerirá ajuste tras playtesting (mismo tipo de riesgo que la ventana de 1.5s en Opción A, pero aquí el parámetro es el tamaño del bono en vez de un tiempo).
- **Complejidad combinada de dos sistemas de grilla mutantes** (resolución de grupos + evaluación de silueta en paralelo) — mayor superficie de bugs que la Opción A porque hay dos lógicas leyendo y modificando el mismo estado de grilla en el mismo frame; se recomienda evaluar la silueta siempre _después_ de resolver completamente la cascada de grupos/huérfanas del disparo actual, nunca a mitad de la resolución.
