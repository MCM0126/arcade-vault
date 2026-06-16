# Sugerencias de juegos — Arcade Vault

> **Mantenido por el agente `game-planner`.** No editar manualmente sin
> avisarle al agente primero — este archivo es su memoria de qué ya evaluó,
> sugirió o descartó. Si necesitas mover una fila de estado a mano (por
> ejemplo, marcar algo como `Aprobado`), hazlo, pero dile al agente en la
> próxima sesión para que no quede desincronizado.

## Sugeridos (pendientes de decisión)

Candidatos que el agente evaluó y recomendó, esperando que el usuario decida
si se aprueban, se descartan o se quedan en espera.

| Fecha | Juego sugerido | Género | Color | Fuente | Notas |
| ----- | -------------- | ------ | ----- | ------ | ----- |
| 2026-06-16 | bloque-buster (arkanoid) | ARCADE | cyan | `references/started-games/04-arkanoid` | Única fuente portable sin spec/motor; llena hueco de color cyan y reemplaza el mock `bloque-buster` del catálogo (rompe-bloques, canvas único 800x600, controles teclado/mouse, basado en score). |
| 2026-06-16 | enlace | PUZZLE | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Conecta fichas de colores trazando líneas con combos antes de que el tablero se llene; mecánica de trazado de líneas no cubierta en catálogo. |
| 2026-06-16 | espejos | PUZZLE | magenta | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Redirige un rayo de luz girando espejos contrarreloj; concepto de reflejo/redirección de luz inédito en el catálogo. |
| 2026-06-16 | burbujeo | PUZZLE | green | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Bubble shooter: dispara y agrupa burbujas de color para reventarlas; no hay equivalente match/bubble en catálogo. |
| 2026-06-16 | cadena-x | PUZZLE | yellow | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Match-3 deslizando filas/columnas contrarreloj; llena hueco de puzzle tipo Bejeweled/Candy Crush. |
| 2026-06-16 | laberintia | PUZZLE | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Traza el camino único en un laberinto procedural antes de que se cierre; concepto de laberinto no cubierto. |
| 2026-06-16 | artillero | SHOOTER | green | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Cañón fijo rotado con mouse derribando meteoritos/drones que caen; distinto de invasores (oleadas en formación) y de rocas/asteroides (nave libre en gravedad cero). |
| 2026-06-16 | blindaje | SHOOTER | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Defensa de base central contra oleadas desde los 4 lados con rotación 360°; mecánica de defensa radial distinta del scroll vertical de invasores. |
| 2026-06-16 | tunel-laser | SHOOTER | yellow | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Nave avanza por túnel infinito disparando y esquivando obstáculos laterales; variante de scroll shooter sin física de gravedad cero, distinta de rocas/asteroides. |
| 2026-06-16 | escuadron | SHOOTER | magenta | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Nave con power-ups multidireccionales contra jefes por puntaje; mecánica de boss-rush no cubierta por invasores/asteroides. |
| 2026-06-16 | escalador | ARCADE | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Trepa plataformas ascendentes infinitas mientras el suelo persigue (tipo Doodle Jump); concepto de plataformas verticales no cubierto. |
| 2026-06-16 | esquivador | ARCADE | magenta | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Esquiva lluvia interminable de obstáculos por carriles con velocidad creciente; lane-dodger de supervivencia infinita, distinto de ranaria (cruce con meta y río). |
| 2026-06-16 | recolector | ARCADE | yellow | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Atrapa gemas que caen del cielo con una cesta antes de tocar el suelo; catcher game clásico no cubierto en catálogo. |
| 2026-06-16 | martillero | ARCADE | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Whack-a-mole: golpea topos que asoman al azar antes de escapar; mecánica de reacción/clic no cubierta. |
| 2026-06-16 | choque-tron | VERSUS | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Duelo de motos de luz con estela infinita (Tron); primer versus de colisión por estela, distinto de duelo-pixel (pong). |
| 2026-06-16 | esgrima-neon | VERSUS | magenta | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Duelo de esgrima a 3 toques; mecánica de combate por turnos/reflejos no cubierta en VERSUS. |
| 2026-06-16 | carrera-sumo | VERSUS | yellow | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Dos círculos se empujan en un dojo circular hasta sacar al rival; versus de empuje/ring no cubierto. |
| 2026-06-16 | tiro-blanco-dual | VERSUS | cyan | concepto nuevo | Brainstorm 20-ideas (concepto nuevo, sin fuente portable). Francotiradores por turnos contra blancos que aparecen al azar, con CPU de precisión ajustable; mecánica de turnos y puntería no cubierta. |

## Aceptados / en desarrollo

Candidatos aprobados por el usuario. Ya tienen (o están generando) un spec en
`specs/` vía `/add-game`, pero aún no están implementados.

| Fecha | Juego | Género | Color | Fuente | Spec | Notas |
| ----- | ----- | ------ | ----- | ------ | ---- | ----- |

## Implementados

Juegos que ya están jugables en la plataforma (motor en `lib/games/` +
entrada en el catálogo de Supabase).

| Fecha      | Juego          | Género  | Color   | Fuente                                  | Spec    | Notas                                  |
| ---------- | -------------- | ------- | ------- | --------------------------------------- | ------- | -------------------------------------- |
| 2026-06-15 | asteroides     | SHOOTER | yellow  | `references/started-games/02-asteroids` | spec 05 | Base histórica, anterior a este agente |
| 2026-06-15 | caida (tetris) | PUZZLE  | magenta | `references/started-games/03-tetris`    | spec 08 | Base histórica, anterior a este agente |

## Descartados

Candidatos evaluados y rechazados (no encajan, duplican un género/género ya
cubierto, o el usuario decidió no integrarlos).

| Fecha | Juego | Género | Color | Fuente | Motivo |
| ----- | ----- | ------ | ----- | ------ | ------ |
| 2026-06-16 | galaxia | SHOOTER | magenta | concepto nuevo | Brainstorm 20-ideas. Nave fija con oleadas descendiendo en formación disparando patrones simples; duplica conceptualmente a `invasores` (Space Invaders) ya en catálogo. |
| 2026-06-16 | saltarin | ARCADE | green | concepto nuevo | Brainstorm 20-ideas. Cronometrar saltos para cruzar calle con tráfico; duplica conceptualmente a `ranaria` (Frogger) ya en catálogo. |
| 2026-06-16 | tenis-de-muro | VERSUS | green | concepto nuevo | Brainstorm 20-ideas. Pong + Breakout combinados (cada jugador defiende un muro de ladrillos con una bola que rebota); fusiona dos conceptos ya cubiertos (`duelo-pixel`/pong en catálogo y `bloque-buster`/arkanoid ya en tabla Sugeridos). |
