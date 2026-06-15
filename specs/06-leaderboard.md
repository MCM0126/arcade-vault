# 06-leaderboard

**Estado:** Aprobado
**Dependencias:** 04-supabase-setup, 05-asteroides-integration
**Fecha:** 2026-06-15
**Objetivo:** Implementar leaderboard en `/hall-of-fame` con top 20 global y top 10
por juego, guardando cada score junto al nombre del jugador directamente en Supabase.

---

## Scope

### Dentro del scope

- Crear tabla `scores` en Supabase (migración SQL)
- Crear `lib/supabase/scores.ts` — funciones `insertScore` y `getLeaderboard`
- Modificar el modal de "GUARDAR PUNTUACIÓN" en `GamePlayer.tsx`:
  - Agregar input de texto para nombre del jugador
  - Al confirmar, enviar score a Supabase (reemplaza guardado en localStorage)
- Crear/reemplazar `app/hall-of-fame/page.tsx` como Server Component:
  - Sección global: top 20 scores (mejor score por jugador × juego, ordenado por score desc)
  - Sección por juego: una tabla top 10 por cada juego en `lib/data.ts`
- Generar tipos TypeScript desde el schema de Supabase (`lib/supabase/types.ts`)

### Fuera del scope

- Autenticación de usuarios
- Actualización en tiempo real (real-time subscriptions)
- Paginación de la tabla (solo top N)
- Edición o eliminación de scores
- Moderación de nombres (filtro de contenido)
- Migración de scores previos en localStorage a Supabase
- Tabla por juego en la página de detalle `/games/[id]`

---

## Modelo de datos

### Tabla Supabase: `scores`

```sql
CREATE TABLE scores (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id     text        NOT NULL,
  player_name text        NOT NULL,
  score       integer     NOT NULL CHECK (score >= 0),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX scores_game_id_idx ON scores (game_id);
```

### Queries principales (en `lib/supabase/scores.ts`)

**Global top 20** — mejor score por combinación jugador × juego, top 20 globales:

```sql
SELECT game_id, player_name, MAX(score) AS best_score
FROM scores
GROUP BY game_id, player_name
ORDER BY best_score DESC
LIMIT 20
```

**Top 10 por juego**:

```sql
SELECT player_name, MAX(score) AS best_score
FROM scores
WHERE game_id = $1
GROUP BY player_name
ORDER BY best_score DESC
LIMIT 10
```

### API de `lib/supabase/scores.ts`

```ts
export async function insertScore(
  gameId: string,
  playerName: string,
  score: number
): Promise<void>;

export async function getGlobalTop20(): Promise<
  { game_id: string; player_name: string; best_score: number }[]
>;

export async function getGameTop10(
  gameId: string
): Promise<{ player_name: string; best_score: number }[]>;
```

### Cambio en `GamePlayer.tsx`

Se agrega un `useState<string>` para `playerName`. El input aparece en el modal
de game over antes del botón "GUARDAR PUNTUACIÓN". Al guardar se llama
`insertScore(game.id, playerName, score)` y se elimina el guardado en localStorage.

---

## Plan de implementación

1. **Crear migración SQL** — Crear `supabase/migrations/20260615_scores.sql` con
   la tabla `scores` e índice `scores_game_id_idx`. Aplicar con el MCP de Supabase.

2. **Generar tipos TypeScript** — Ejecutar `supabase gen types typescript` (o vía MCP)
   y guardar en `lib/supabase/types.ts`. El resto del código importa desde ahí.

3. **Crear `lib/supabase/scores.ts`** — Implementar `insertScore`, `getGlobalTop20`
   y `getGameTop10` usando el cliente server de `lib/supabase/server.ts`.

4. **Modificar `GamePlayer.tsx`** — Agregar `useState<string>('')` para `playerName`.
   En el modal de game over, insertar un `<input>` de texto para el nombre antes del
   botón "GUARDAR PUNTUACIÓN". Al hacer clic en guardar, llamar `insertScore` y
   eliminar el bloque de `localStorage`. El botón queda deshabilitado si `playerName`
   está vacío.

5. **Crear `app/hall-of-fame/page.tsx`** como Server Component — Llamar en paralelo
   `getGlobalTop20()` y `getGameTop10(id)` para cada juego en `GAMES`. Renderizar:
   - Tabla global: columnas `Juego | Jugador | Score`
   - Una sección por juego con su tabla top 10: columnas `Jugador | Score`

6. **Verificar sin regresiones** — `tsc --noEmit` limpio; rutas `/`, `/games`,
   `/games/asteroides/play` y `/about` funcionan sin errores.

---

## Criterios de aceptación

- [ ] La tabla `scores` existe en Supabase con columnas `id`, `game_id`, `player_name`,
      `score`, `created_at`
- [ ] `lib/supabase/types.ts` contiene los tipos generados desde el schema
- [ ] `lib/supabase/scores.ts` exporta `insertScore`, `getGlobalTop20` y `getGameTop10`
- [ ] El modal de game over en `/games/asteroides/play` muestra un input de nombre
      antes del botón "GUARDAR PUNTUACIÓN"
- [ ] El botón "GUARDAR PUNTUACIÓN" está deshabilitado si el input de nombre está vacío
- [ ] Al guardar, el score se inserta en Supabase y no se escribe en localStorage
- [ ] `/hall-of-fame` carga sin errores y muestra la tabla global top 20
- [ ] `/hall-of-fame` muestra una sección top 10 por cada juego en `lib/data.ts`
- [ ] Si no hay scores, las tablas muestran un estado vacío (no error)
- [ ] `tsc --noEmit` pasa limpio
- [ ] No hay regresiones en `/`, `/games`, `/games/asteroides/play`, `/about`

---

## Decisiones tomadas y descartadas

| Decisión                      | Elegido                                   | Descartado                      | Motivo                                                                        |
| ----------------------------- | ----------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Persistencia de scores        | Supabase                                  | localStorage                    | Datos compartidos entre dispositivos y usuarios                               |
| Identificación del jugador    | Nombre ingresado manualmente              | Auth / apodo automático         | Sin fricción de registro; el jugador elige cómo aparecer                      |
| Scores duplicados             | Mostrar solo el mejor por jugador × juego | Mostrar todos                   | Leaderboard más limpio y justo                                                |
| Actualización del leaderboard | Server Component (carga en visita)        | Real-time subscriptions         | Menor complejidad; real-time queda para un spec propio                        |
| Ubicación del leaderboard     | Solo en `/hall-of-fame`                   | Global + tabla en `/games/[id]` | Mantiene el scope acotado; la tabla por juego en detalle queda para otro spec |
| Queries de leaderboard        | `GROUP BY` + `MAX(score)` en servidor     | Vista materializada / RPC       | Suficiente para top N; sin complejidad operacional extra                      |
| Migración de localStorage     | No se migran scores previos               | Migrar al primer load           | Scores previos son de desarrollo; no hay usuarios reales aún                  |

---

## Riesgos identificados

- **RLS no configurado** — Sin Row Level Security en la tabla `scores`, cualquier
  cliente puede insertar o leer scores arbitrarios. Mitigación mínima para este spec:
  habilitar RLS con política pública de lectura (`SELECT` para todos) y escritura
  abierta (`INSERT` para todos, sin `UPDATE`/`DELETE`). Control de abuso queda para
  un spec de moderación.
- **Nombres largos o vacíos** — El input debe tener `maxLength` (p.ej. 30 chars) y
  el botón deshabilitado si está vacío (ya cubierto en criterios de aceptación).
