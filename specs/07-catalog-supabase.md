# 07-catalog-supabase

**Estado:** Aprobado
**Dependencias:** 04-supabase-setup, 05-asteroides-integration, 06-leaderboard
**Fecha:** 2026-06-15
**Objetivo:** Migrar el catálogo de juegos de `lib/data.ts` a una tabla Supabase,
mostrar estadísticas reales (partidas y mejor score) en biblioteca y detalle,
separar la navegación del card (→ detalle) del botón JUGAR (→ partida), y
mostrar el leaderboard del detalle leyendo de la tabla `scores`.

---

## Scope

### Dentro del scope

- Crear tabla `games` en Supabase con migración SQL e INSERT de los 9 juegos actuales
- Crear `lib/supabase/games.ts` — `getGames()` y `getGame(id)`
- Agregar a `lib/supabase/scores.ts` — `getAllGameStats()` y `getGameStats(gameId)`
- Crear RPCs SQL: `get_all_game_stats` y `get_game_stats`
- `app/games/page.tsx` → Server Component wrapper + Client subcomponent `GamesGrid.tsx`:
  - Card click → `/games/[id]` (detalle)
  - Botón JUGAR → `/games/[id]/play` (partida directa)
  - `MEJOR PUNTUACIÓN` en card lee `best_score` de Supabase (0 si no hay scores)
- `app/games/[id]/page.tsx` → leaderboard desde `getGameTop10()`, stats desde `getGameStats()`
- `app/hall-of-fame/page.tsx` → obtiene lista de juegos desde `getGames()` en lugar de `lib/data.ts`
- `app/page.tsx` (home) → Server Component; mini-rail usa `getGames()`; partes interactivas
  extraídas a `components/HomeContent.tsx`
- Eliminar de `lib/data.ts`: array `GAMES`, array `CATS`, `seededScores`, `PLAYERS`
- `CATS` se mantiene como constante local en `GamesGrid.tsx`
- Tipos `Game`, `ScoreRow`, `SavedScore` se mueven a `lib/types.ts`

### Fuera del scope

- Actualización en tiempo real del best score en biblioteca (solo en page load)
- Panel de administración para gestionar juegos desde la UI
- La sección "Actividad en vivo" y "TOP JUGADORES · HOY" de home (permanece hardcodeada)
- Autenticación de usuarios
- Migración de scores en localStorage a Supabase
- Moderación de contenido de juegos

---

## Modelo de datos

### Tabla Supabase: `games`

```sql
CREATE TABLE games (
  id         text PRIMARY KEY,
  title      text NOT NULL,
  short_desc text NOT NULL,
  long_desc  text NOT NULL,
  cat        text NOT NULL CHECK (cat IN ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover      text NOT NULL,
  color      text NOT NULL CHECK (color IN ('cyan', 'magenta', 'green', 'yellow')),
  sort_order int  NOT NULL DEFAULT 0
);

INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order) VALUES
  ('bloque-buster', 'BLOQUE BUSTER', 'Rebota la pelota y destruye muros de neón.', 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?', 'ARCADE', 'cover-bricks', 'cyan', 1),
  ('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.', 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.', 'PUZZLE', 'cover-tetro', 'magenta', 2),
  ('serpentina', 'SERPENTINA', 'Crece sin morder tu propia cola.', 'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.', 'ARCADE', 'cover-snake', 'green', 3),
  ('gloton', 'GLOTÓN', 'Devora puntos y escapa de los fantasmas.', 'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.', 'ARCADE', 'cover-glot', 'yellow', 4),
  ('invasores', 'INVASORES', 'Defiende el planeta de filas alienígenas.', 'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.', 'SHOOTER', 'cover-invaders', 'green', 5),
  ('rocas', 'ROCAS', 'Pulveriza asteroides en gravedad cero.', 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.', 'SHOOTER', 'cover-rocas', 'yellow', 6),
  ('asteroides', 'ASTEROIDES', 'Pulveriza rocas espaciales en gravedad cero.', 'Tu nave triangular flota en el vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Recoge el power-up 3x para triplicar tu cadencia de fuego.', 'SHOOTER', 'cover-rocas', 'yellow', 7),
  ('ranaria', 'RANARIA', 'Cruza la autopista de pixeles.', 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.', 'ARCADE', 'cover-rana', 'green', 8),
  ('duelo-pixel', 'DUELO PIXEL', 'Dos paletas. Una pelota. Reflejos máximos.', 'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.', 'VERSUS', 'cover-duelo', 'cyan', 9);
```

### RPCs SQL nuevas

```sql
CREATE OR REPLACE FUNCTION get_game_stats(p_game_id text)
RETURNS TABLE(best_score int, total_plays int) AS $$
  SELECT COALESCE(MAX(score), 0)::int, COUNT(*)::int
  FROM scores WHERE game_id = p_game_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_all_game_stats()
RETURNS TABLE(game_id text, best_score int, total_plays int) AS $$
  SELECT game_id, MAX(score)::int, COUNT(*)::int
  FROM scores GROUP BY game_id;
$$ LANGUAGE sql STABLE;
```

### Tipos TypeScript (`lib/types.ts`)

```ts
export type GameCat = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "green" | "yellow";

export interface Game {
  id: string;
  title: string;
  short_desc: string;
  long_desc: string;
  cat: GameCat;
  cover: string;
  color: GameColor;
  sort_order: number;
}

export interface GameWithStats extends Game {
  best_score: number;
  total_plays: number;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}
```

### API de `lib/supabase/games.ts`

```ts
export async function getGames(): Promise<Game[]>;
export async function getGame(id: string): Promise<Game | null>;
```

### Adiciones a `lib/supabase/scores.ts`

```ts
export async function getAllGameStats(): Promise<
  { game_id: string; best_score: number; total_plays: number }[]
>;

export async function getGameStats(
  gameId: string
): Promise<{ best_score: number; total_plays: number }>;
```

---

## Plan de implementación

1. **Crear migración SQL** — `supabase/migrations/20260615_games.sql` con la tabla
   `games`, los 9 INSERTs completos y las dos RPCs `get_game_stats` y
   `get_all_game_stats`. Aplicar con el MCP de Supabase.

2. **Crear `lib/types.ts`** — Mover `Game`, `ScoreRow`, `SavedScore` desde
   `lib/data.ts` y agregar `GameWithStats`, `GameCat`, `GameColor`. Actualizar todos
   los imports que apuntaban a `@/lib/data`.

3. **Crear `lib/supabase/games.ts`** — Implementar `getGames()` y `getGame(id)`
   usando el cliente server de `lib/supabase/server.ts`.

4. **Agregar a `lib/supabase/scores.ts`** — Implementar `getAllGameStats()` vía
   `.rpc('get_all_game_stats')` y `getGameStats(gameId)` vía
   `.rpc('get_game_stats', { p_game_id: gameId })`.

5. **Limpiar `lib/data.ts`** — Eliminar `GAMES`, `CATS`, `PLAYERS`, `seededScores`.
   Eliminar el archivo si no quedan exports usados en otros módulos.

6. **Refactorizar `app/games/page.tsx`** — Convertir a Server Component:
   - Llama en paralelo `getGames()` y `getAllGameStats()`; combina en `GameWithStats[]`
     (games sin scores → `best_score: 0, total_plays: 0`).
   - Extrae la lógica interactiva (filtros, search, `onMouseMove`) a nuevo
     `app/games/GamesGrid.tsx` (`'use client'`), que recibe `games: GameWithStats[]`
     como prop.
   - En `GamesGrid.tsx`: `CATS` pasa a ser constante local. Card click →
     `router.push('/games/${id}')`. Botón JUGAR → `router.push('/games/${id}/play')`
     con `e.stopPropagation()`. `MEJOR PUNTUACIÓN` muestra `game.best_score`.

7. **Actualizar `app/games/[id]/page.tsx`** — Llamar en paralelo `getGame(id)`,
   `getGameTop10(id)` y `getGameStats(id)`. Si `getGame` retorna `null` → `notFound()`.
   Mostrar en `stat-strip`: `stats.total_plays` (Partidas) y `stats.best_score`
   (Mejor global). Leaderboard usa los resultados de `getGameTop10` en lugar de
   `seededScores`. Si `getGameTop10` retorna array vacío, mostrar estado vacío con
   mensaje "SIN PUNTUACIONES AÚN".

8. **Refactorizar `app/page.tsx`** (home) — Convertir a Server Component:
   - Llama `getGames()` y toma `.slice(0, 6)` para el mini-rail.
   - Extrae todo el JSX interactivo (`useRouter`, `useReveal`, botones, secciones) a
     nuevo `components/HomeContent.tsx` (`'use client'`), que recibe
     `previewGames: Game[]` como prop.
   - `page.tsx` solo importa `HomeContent` y pasa los datos.

9. **Actualizar `app/hall-of-fame/page.tsx`** — Reemplazar el import de `GAMES` de
   `lib/data.ts` por `getGames()` de `lib/supabase/games.ts`. El resto de la lógica
   no cambia.

10. **Verificar sin regresiones** — `tsc --noEmit` limpio; rutas `/`, `/games`,
    `/games/asteroides/play`, `/about`, `/hall-of-fame` funcionan sin errores.

---

## Criterios de aceptación

- [ ] La tabla `games` existe en Supabase con los 9 juegos insertados
- [ ] Las RPCs `get_game_stats` y `get_all_game_stats` existen en Supabase
- [ ] `lib/types.ts` exporta `Game`, `GameWithStats`, `ScoreRow`, `SavedScore`
- [ ] `lib/supabase/games.ts` exporta `getGames()` y `getGame(id)`
- [ ] `lib/supabase/scores.ts` exporta `getAllGameStats()` y `getGameStats(gameId)`
- [ ] `lib/data.ts` no exporta `GAMES`, `CATS` ni `seededScores`
- [ ] En `/games`, hacer clic en el card navega a `/games/[id]`
- [ ] En `/games`, hacer clic en el botón JUGAR navega directamente a `/games/[id]/play`
- [ ] `MEJOR PUNTUACIÓN` en cada card de biblioteca muestra el valor real de Supabase (0 si sin scores)
- [ ] En `/games/[id]`, el leaderboard muestra datos reales de `scores`, no generados
- [ ] En `/games/[id]`, si no hay scores el leaderboard muestra "SIN PUNTUACIONES AÚN"
- [ ] En `/games/[id]`, "Partidas" muestra el COUNT real de scores para ese juego
- [ ] En `/games/[id]`, "Mejor global" muestra el MAX real de scores para ese juego
- [ ] `/hall-of-fame` obtiene la lista de juegos desde Supabase, no desde `lib/data.ts`
- [ ] El mini-rail de `/` muestra los primeros 6 juegos de Supabase
- [ ] `tsc --noEmit` pasa limpio
- [ ] No hay regresiones en `/`, `/games`, `/games/asteroides/play`, `/about`, `/hall-of-fame`

---

## Decisiones tomadas y descartadas

| Decisión                           | Elegido                                       | Descartado                                            | Motivo                                                            |
| ---------------------------------- | --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Fuente de verdad para juegos       | Supabase tabla `games`                        | `lib/data.ts` como fuente                             | Administración centralizada en BD; agregar juego = INSERT         |
| Juegos sin scores                  | Stats vacías (0 partidas, 0 pts)              | Fallback a valores de `lib/data.ts`                   | Evita mezclar datos ficticios con datos reales                    |
| `MEJOR PUNTUACIÓN` en card         | Dinámico desde Supabase                       | Estático de `lib/data.ts`                             | Consistencia con la BD como única fuente de verdad                |
| Filtro de categorías en biblioteca | Constante local en `GamesGrid.tsx`            | Columna `cats` en tabla `games`                       | `CATS` es un valor de display fijo, no varía por juego            |
| Arquitectura de `/games`           | Server Component wrapper + Client `GamesGrid` | Mantener como Client Component con fetch en useEffect | Evita flash de contenido vacío; alineado con App Router           |
| Arquitectura de `/` (home)         | Server Component + Client `HomeContent`       | Mantener como Client Component con client Supabase    | Consistencia con App Router; el nivel de página no necesita hooks |
| Stats de juegos en biblioteca      | Single RPC `get_all_game_stats` + merge JS    | N queries individuales por juego                      | Una sola round-trip a BD independiente de cuántos juegos haya     |
| "Partidas realizadas"              | COUNT(\*) de filas en `scores`                | Columna separada en tabla `games`                     | Fuente única de verdad; sin riesgo de desincronización            |

---

## Riesgos identificados

- **RLS en tabla `games`** — Sin Row Level Security, cualquier cliente puede modificar
  el catálogo. Mitigación: habilitar RLS con política de solo lectura pública
  (`SELECT` para todos, sin `INSERT`/`UPDATE`/`DELETE` desde cliente).
- **Refactor del home** — Convertir `app/page.tsx` a Server Component requiere extraer
  todos los hooks a `HomeContent.tsx`. Si algún hook o efecto se pierde en la
  extracción, la página home puede romperse silenciosamente. Mitigación: probar la
  ruta `/` en el navegador es criterio explícito de aceptación.
