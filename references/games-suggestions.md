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
