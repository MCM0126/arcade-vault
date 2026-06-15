---
name: add-game
description: Integra un juego nuevo a Arcade Vault siguiendo el patrón de los specs 05/06/07. Lee la fuente del juego (de references/started-games o el que entregue el usuario), hace preguntas de identidad, y genera un spec completo en specs/NN-<id>.md (Estado Draft) listo para revisar y luego implementar con /spec-impl. No escribe código.
disable-model-invocation: true
argument-hint: "<carpeta en references/started-games | descripción del juego>"
allowed-tools: Bash(ls:*), Bash(cat:*), Bash(find:*), Bash(git status:*), Read, Write, Glob, Grep
---

# Skill: /add-game

Soy el asistente de integración de juegos para Arcade Vault.
El usuario me invoca con `/add-game $ARGUMENTS`.

## Mi trabajo

Generar **un spec detallado** (estado: Draft) en `specs/NN-<id>.md` que describe exactamente cómo portar e integrar el juego a la plataforma. **No escribo código** — eso lo hace `/spec-impl` después de que el usuario apruebe el spec.

---

## Paso 1 — Localizar y analizar la fuente del juego

Si `$ARGUMENTS` coincide con una carpeta en `references/started-games/` (p. ej. `03-tetris`):

```
ls references/started-games/<carpeta>/
cat references/started-games/<carpeta>/index.html
cat references/started-games/<carpeta>/game.js
# Si hay múltiples scripts: leerlos todos
# Si hay assets/: anotar qué ficheros binarios existen (PNG, MP3…)
```

Si `$ARGUMENTS` no nombra una carpeta conocida, pedir al usuario que pegue el código fuente o la descripción del juego antes de continuar.

Una vez leída la fuente, documentar mentalmente:

| Aspecto            | Qué anotar                                                             |
| ------------------ | ---------------------------------------------------------------------- |
| Canvas             | Tamaño (W × H), `getContext('2d')`                                     |
| Clases/estructuras | Nombres, métodos `update()`/`draw()`                                   |
| Game loop          | `requestAnimationFrame`, `setInterval`, `animId`/`rafId` para cancelar |
| Input              | `window` vs `document`; `e.code` vs `e.key`; mouse o solo teclado      |
| HUD                | ¿Dibujado en canvas o acoplado a elementos DOM (`#score`, `#overlay`)? |
| Assets binarios    | PNG/MP3/JS extras → deben moverse a `public/<id>/`                     |
| Estado game-over   | ¿Cómo termina el juego? ¿Qué variable/condición lo indica?             |
| Múltiples scripts  | ¿Usan globals compartidos? ¿En qué orden se cargan?                    |

---

## Paso 2 — Definir la identidad del juego

Preguntar al usuario lo que no sea obvio por el código:

- **`id`** — kebab-case, único en la tabla `games` (ej. `caida-tetris`, `arkanoid`)
- **`title`** — nombre en mayúsculas para la UI (ej. `ARKANOID`)
- **`short_desc`** — tagline de una línea (≤ 80 chars)
- **`long_desc`** — descripción completa para la página de detalle (2-3 frases)
- **`cat`** — una de: `ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`
- **`color`** — una de: `cyan`, `magenta`, `green`, `yellow`
- **`cover`** — clase CSS de cover:
  - Reutilizar existente si aplica (ver `app/globals.css` para `.cover-*` disponibles)
  - O proponer nombre para una nueva clase (p. ej. `cover-arkanoid`)
- **`sort_order`** — siguiente entero disponible (consultar `SELECT MAX(sort_order) FROM games` o inferir de los 9 juegos actuales: max es 9)

---

## Paso 3 — Determinar el número de spec

```
ls specs/
```

Tomar el NN máximo existente + 1, con cero a la izquierda (p. ej. si el último es `07-...` → nuevo es `08`).

---

## Paso 4 — Generar el spec

Leer `recipe.md` (en este mismo directorio) como guía de transforms y `spec-template.md` como esqueleto, y producir el archivo `specs/NN-<id>.md` completamente relleno para ESTE juego.

El spec debe incluir:

### 4a. Cabecera

```
# NN-<id>
**Estado:** Draft
**Dependencias:** 05-asteroides-integration, 06-leaderboard, 07-catalog-supabase
**Fecha:** <hoy>
**Objetivo:** Integrar el juego "<TITLE>" (id: `<id>`) a Arcade Vault…
```

### 4b. Scope

- **Dentro del scope**: los archivos concretos a crear/modificar
- **Fuera del scope**: lo que explícitamente NO se hace (resize responsivo, auth, tests, etc.)

### 4c. Modelo de datos

**INSERT exacto para Supabase:**

```sql
INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order)
VALUES ('<id>', '<TITLE>', '<short_desc>', '<long_desc>', '<cat>', '<cover>', '<color>', <sort_order>);
```

**API pública del motor** (adaptar nombres al juego):

```ts
export interface <Game>Callbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onGameOver(finalScore: number): void;
}
// (alias de GameCallbacks de lib/games/types.ts)

export function start<Game>(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks
): GameHandle;
```

### 4d. Plan de implementación (file-by-file)

Usar los transforms de `recipe.md` para describir CADA cambio necesario:

1. **`lib/games/<id>.ts`** — Port TypeScript del juego:
   - Imports: `import type { GameCallbacks, GameHandle } from "./types";`
   - Transforms aplicados (listar los del recipe que aplican a ESTE juego)
   - Notas sobre el HUD si está acoplado al DOM
   - Notas sobre assets si los hay

2. **`app/games/[id]/play/<Game>Canvas.tsx`** — Componente React:
   - `'use client'`, `forwardRef<GameCanvasHandle, GameCanvasProps>`
   - `useImperativeHandle` exponiendo `restart()`
   - Touch buttons que despachan `KeyboardEvent` sintético (mapear teclas del juego)
   - Nota sobre si el componente necesita cargar assets antes de montar el motor

3. **`lib/games/registry.ts`** — Agregar **una línea**:

   ```ts
   import <Game>Canvas from "@/app/games/[id]/play/<Game>Canvas";
   // ...
   export const GAME_CANVASES = {
     asteroides: AsteroidsCanvas,
     "<id>": <Game>Canvas,   // ← esta línea
   };
   ```

4. **`supabase/migrations/<YYYYMMDD>_<id>.sql`** — Solo el INSERT:

   ```sql
   INSERT INTO games (id, title, short_desc, long_desc, cat, cover, color, sort_order)
   VALUES (...);
   ```

   (La tabla `games` y los RLS ya existen desde `20260615_games.sql`.)

5. **`app/globals.css`** _(solo si `cover` es nuevo)_ — Agregar clase `.cover-<id>` con gradiente/color siguiendo el patrón visual de los covers existentes. Usar `/frontend-design` para decidir la paleta.

6. **`public/<id>/`** _(solo si hay assets binarios)_ — Mover PNG/MP3 aquí y actualizar rutas en el motor.

### 4e. Criterios de aceptación

Adaptar y completar la lista del `spec-template.md`. Incluir siempre:

- [ ] El juego `<id>` aparece en `/games` con su card y mejor puntuación
- [ ] `/games/<id>` muestra la página de detalle sin errores
- [ ] `/games/<id>/play` carga el canvas con el juego real funcionando
- [ ] El HUD HTML (puntuación, vidas, nivel) se sincroniza con el motor vía callbacks
- [ ] El canvas también dibuja su propio HUD interno
- [ ] PAUSA detiene el loop; canvas muestra overlay "EN PAUSA"
- [ ] REANUDAR reactiva el loop
- [ ] Al perder, aparece el modal de game over con input de nombre del jugador
- [ ] "GUARDAR PUNTUACIÓN" escribe en Supabase vía `saveScoreAction`
- [ ] "JUGAR DE NUEVO" reinicia sin desmontar el canvas
- [ ] Los botones táctiles (overlay) controlan el juego
- [ ] El leaderboard de `/games/<id>` muestra datos reales de `scores`
- [ ] El juego aparece en `/hall-of-fame` (global top 20 y sección propia top 10)
- [ ] `tsc --noEmit` pasa limpio
- [ ] Sin regresiones en `/`, `/games`, `/games/asteroides/play`, `/about`, `/hall-of-fame`

### 4f. Decisiones y riesgos

Documentar las decisiones de diseño relevantes para ESTE juego (cobertura de assets, HUD-DOM vs callbacks, escalado del canvas, etc.) y riesgos identificados.

---

## Paso 5 — Cerrar

Escribir el spec en `specs/NN-<id>.md` con `**Estado: Draft**`.

Mostrar al usuario:

```
✅ Spec generado: specs/NN-<id>.md

Próximos pasos:
1. Revisa el spec — ajusta identidad, transforms y criterios según necesites.
2. Cambia "Estado: Draft" → "Estado: Aprobado".
3. Ejecuta /spec-impl NN-<id> para iniciar la implementación.
```

No escribir ningún archivo de código. No crear ramas git.
