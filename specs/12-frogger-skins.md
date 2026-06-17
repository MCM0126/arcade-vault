# 12-frogger-skins

**Estado:** Aprobado
**Dependencias:** 09-asteroides-skins (arquitectura del sistema de skins), frogger-integration
**Fecha:** 2026-06-17
**Objetivo:** Implementar los 3 skins (neon, retro, classic) para `frogger`.

---

## Roles de color de `frogger`

Extraidos de `lib/games/frogger.ts` (colores hardcodeados actuales):

| Rol              | Elemento visual                                 | Color actual en el motor |
| ---------------- | ----------------------------------------------- | ------------------------ |
| `fondo-safe`     | Zonas seguras (fila inicio y fila central)      | `#1a4a1a`                |
| `fondo-road`     | Asfalto de la carretera (filas 8-12)            | `#1a1a1a`                |
| `fondo-river`    | Agua del rio (filas 1-6)                        | `#0a2a5a`                |
| `fondo-goal`     | Fila de metas (fila 0)                          | `#0a3a0a`                |
| `lane-divider`   | Lineas discontinuas entre carriles de carretera | `#444444`                |
| `goal-mouth`     | Interior del cuadro de cada meta                | `#0d5c0d`                |
| `goal-border`    | Borde dorado que enmarca cada meta              | `#ffd700`                |
| `goal-frog`      | Silueta de rana en una meta ya ocupada          | `#5aff5a`                |
| `car-a`          | Coche variante A (rojo)                         | `#e63946`                |
| `car-b`          | Coche variante B (amarillo)                     | `#ffd166`                |
| `car-c`          | Coche variante C (azul)                         | `#118ab2`                |
| `car-wheel`      | Ruedas de los coches                            | `#222222`                |
| `truck-body`     | Carroceria del camion                           | `#6b6b6b`                |
| `truck-cab`      | Cabina del camion                               | `#999999`                |
| `truck-wheel`    | Ruedas del camion                               | `#222222`                |
| `log-body`       | Tronco flotante (fill redondeado)               | `#7c4a1e`                |
| `log-grain`      | Lineas de grano del tronco                      | `#5a3310`                |
| `turtle-body`    | Cuerpo de la tortuga (circulo grande)           | `#2d8a2d`                |
| `turtle-ring`    | Anillo interior de la tortuga                   | `#1a5c1a`                |
| `frog-body`      | Cuerpo de la rana (elipse)                      | `#39d939`                |
| `frog-eye-white` | Blanco del ojo de la rana                       | `#ffffff`                |
| `frog-eye-pupil` | Pupila del ojo de la rana                       | `#000000`                |
| `frog-leg`       | Patas extendidas durante el salto               | `#39d939`                |
| `hud-bg`         | Franja semitransparente del HUD                 | `rgba(0,0,0,0.6)`        |
| `hud-text`       | Texto de score y nivel                          | `#ffffff`                |
| `hud-life`       | Circulos de vida restantes                      | `#39d939`                |
| `timer-bar-bg`   | Fondo de la barra de tiempo                     | `#333333`                |
| `timer-ok`       | Barra de tiempo cuando queda >50%               | `#39d939`                |
| `timer-warn`     | Barra de tiempo cuando queda 25-50%             | `#ffd166`                |
| `timer-danger`   | Barra de tiempo cuando queda <25%               | `#e63946`                |
| `pause-bg`       | Overlay semitransparente al pausar              | `rgba(0,0,0,0.55)`       |
| `pause-text`     | Texto "EN PAUSA"                                | `#ffd166`                |

---

## Paletas

### Criterios de diseno

- **classic** — los valores actuales del motor tal cual. Verde natural para
  zonas seguras, asfalto oscuro para la carretera, azul marino para el rio.
  La rana es verde lima brillante (`#39d939`). Tres colores de coches para
  diferenciarlos visualmente. Troncos en marron madera y tortugas en verde
  oscuro. Evoca el arcade original de Frogger (1981).

- **neon** — estetica cyberpunk fluorescente sobre fondo casi negro.
  El rio se convierte en un canal de plasma cian oscuro. La rana es verde
  electrico intenso. Los coches se transforman en vehiculos luminosos:
  magenta, amarillo neon y cian. Los troncos son en carbon oscuro con
  borde visible. Las tortugas en verde neon fluorescente. El HUD usa colores
  de la plataforma (`--cyan`, `--yellow`, `--magenta`).

- **retro** — paleta limitada estilo CGA/NES/arcade anos 80. Fondo negro
  absoluto. Carretera gris muy oscuro. Rio en azul CGA puro (`#0000aa`).
  La rana en verde CGA (`#00aa00`). Coches en los 3 colores primarios CGA:
  rojo, amarillo y cian. Troncos en marron CGA. Tortugas en verde brillante
  CGA. HUD en blanco puro, vidas en verde. Paleta de 8 colores maximo.

### Tabla de paletas

| Rol              | classic            | neon                | retro              |
| ---------------- | ------------------ | ------------------- | ------------------ |
| `fondo-safe`     | `#1a4a1a`          | `#051a05`           | `#000000`          |
| `fondo-road`     | `#1a1a1a`          | `#0a0a0a`           | `#111111`          |
| `fondo-river`    | `#0a2a5a`          | `#020d1a`           | `#0000aa`          |
| `fondo-goal`     | `#0a3a0a`          | `#031403`           | `#000000`          |
| `lane-divider`   | `#444444`          | `#1a3a1a`           | `#555555`          |
| `goal-mouth`     | `#0d5c0d`          | `#0a3d0a`           | `#005500`          |
| `goal-border`    | `#ffd700`          | `#f5ff00`           | `#ffff00`          |
| `goal-frog`      | `#5aff5a`          | `#00ff88`           | `#00ff00`          |
| `car-a`          | `#e63946`          | `#ff006e`           | `#ff0000`          |
| `car-b`          | `#ffd166`          | `#f5ff00`           | `#ffff00`          |
| `car-c`          | `#118ab2`          | `#00f5ff`           | `#00aaaa`          |
| `car-wheel`      | `#222222`          | `#111111`           | `#000000`          |
| `truck-body`     | `#6b6b6b`          | `#1a1a2e`           | `#555555`          |
| `truck-cab`      | `#999999`          | `#3a3a5e`           | `#aaaaaa`          |
| `truck-wheel`    | `#222222`          | `#111111`           | `#000000`          |
| `log-body`       | `#7c4a1e`          | `#2a1a08`           | `#aa5500`          |
| `log-grain`      | `#5a3310`          | `#1a0d04`           | `#7f3f00`          |
| `turtle-body`    | `#2d8a2d`          | `#00cc44`           | `#00aa00`          |
| `turtle-ring`    | `#1a5c1a`          | `#008833`           | `#005500`          |
| `frog-body`      | `#39d939`          | `#39ff14`           | `#00ff00`          |
| `frog-eye-white` | `#ffffff`          | `#e0ffe0`           | `#ffffff`          |
| `frog-eye-pupil` | `#000000`          | `#001a00`           | `#000000`          |
| `frog-leg`       | `#39d939`          | `#39ff14`           | `#00ff00`          |
| `hud-bg`         | `rgba(0,0,0,0.6)`  | `rgba(0,5,0,0.75)`  | `rgba(0,0,0,0.8)`  |
| `hud-text`       | `#ffffff`          | `#00f5ff`           | `#ffffff`          |
| `hud-life`       | `#39d939`          | `#39ff14`           | `#00ff00`          |
| `timer-bar-bg`   | `#333333`          | `#111111`           | `#333333`          |
| `timer-ok`       | `#39d939`          | `#39ff14`           | `#00ff00`          |
| `timer-warn`     | `#ffd166`          | `#f5ff00`           | `#ffff00`          |
| `timer-danger`   | `#e63946`          | `#ff006e`           | `#ff0000`          |
| `pause-bg`       | `rgba(0,0,0,0.55)` | `rgba(0,10,0,0.70)` | `rgba(0,0,0,0.75)` |
| `pause-text`     | `#ffd166`          | `#f5ff00`           | `#ffff00`          |

### Notas de paleta

**classic** — identico a los literales del motor original. Verde oscuro natural
para las zonas de seguridad, asfalto casi negro, azul marino para el agua.
La rana en verde lima (`#39d939`) con alto contraste sobre todos los fondos.
Los tres coches tienen colores diferenciados (rojo/amarillo/azul). Troncos en
marron madera real. Bordes de meta en dorado.

**neon** — el rio se convierte en un abismo de plasma casi negro con el agua
apenas visible. La rana es verde radioactivo (`#39ff14`, el verde neon
canonico). Los coches usan magenta (`#ff006e`), amarillo neon (`#f5ff00`) y
cian electrico (`#00f5ff`) — los tres colores primarios de la estetica
cyberpunk. Los camiones en azul marino oscuro con cabina indigo, evocando
vehiculos futuristas. Los troncos en carbon casi negro (el rio neon no tiene
madera: tiene plataformas oscuras). Las tortugas en verde neon brillante
(`#00cc44`). El HUD usa cian de la plataforma (`--cyan: #00f5ff`).

**retro** — ocho colores maximo, estilo CGA palette 1 + verde fosforescente.
Fondo negro absoluto en zonas de meta y seguridad. Carretera gris oscuro.
Rio en azul CGA puro (`#0000aa`). Rana en verde CGA (`#00ff00`). Coches en
rojo/amarillo/cian CGA puros. Troncos en naranja-marron CGA (`#aa5500`).
Tortugas en verde CGA medio. HUD en blanco puro, vidas en verde CGA.
El timer de peligro en rojo puro CGA.

---

## Arquitectura del sistema de skins

La arquitectura completa esta definida en `specs/09-asteroides-skins.md`.
Este spec solo anade la paleta de `frogger` al registro existente en
`lib/games/skins.ts` y refactoriza su motor para leer colores de la paleta
inyectada. El contrato `GameCanvasProps` ya incluye `skin?: SkinId` y
`GameHandle` ya incluye `setSkin?(skin: SkinId): void` — no se requieren
cambios en `lib/games/types.ts`.

La estrategia de cambio de skin en caliente es **live swap** (igual que en
`asteroides`): la paleta se almacena en un objeto mutable que el loop de
render lee en cada frame. Cambiar el skin via `setSkin()` actualiza ese
objeto sin interrumpir la partida.

---

## Scope

### Dentro del scope

- Las 3 paletas para `frogger`: classic, neon, retro.
- La constante `FROGGER_SKINS` en `lib/games/skins.ts`.
- El refactor de `lib/games/frogger.ts`: aceptar `skin?: SkinId` como
  tercer parametro, exponer `setSkin` en `GameHandle`, leer todos los
  colores de la paleta activa en lugar de literales hardcodeados.
- El canvas `app/games/[id]/play/FroggerCanvas.tsx`: pasar `skin` al
  motor al montar, y llamar `setSkin` en caliente cuando cambie el prop.

### Fuera del scope

- Otros juegos del catalogo.
- Resize responsivo del canvas de Frogger.
- Persistencia de preferencia por juego (la clave global
  `arcade-vault:skin` ya existe desde el spec de asteroides).
- Tests automatizados de regresion visual.

---

## Plan de implementacion

### Archivo 1: `lib/games/skins.ts` (modificar)

Anadir la constante `FROGGER_SKINS` con las 3 paletas despues de
`ASTEROIDES_SKINS`. Exportarla.

### Archivo 2: `lib/games/frogger.ts` (refactor)

- Importar `FROGGER_SKINS`, `DEFAULT_SKIN`, `SkinId` desde `./skins`.
- Anadir `skin?: SkinId` como tercer parametro de `startFrogger`.
- Crear un objeto mutable `activePalette` inicializado con
  `FROGGER_SKINS[skin ?? DEFAULT_SKIN]`.
- Pasar `activePalette` como parametro a cada funcion de dibujo:
  `drawZones`, `drawGoals`, `drawEntity`, `drawFrog`, `drawHUD` y la
  seccion de overlay de pausa dentro de `draw()`.
- Cada funcion de dibujo recibe `palette: GamePalette` y usa
  `palette['<rol>']` en lugar del literal hardcodeado.
- Exponer `setSkin(s: SkinId) { Object.assign(activePalette, FROGGER_SKINS[s]); }`
  en el `GameHandle` retornado.

### Archivo 3: `app/games/[id]/play/FroggerCanvas.tsx` (modificar)

- Importar `SkinId` desde `@/lib/games/skins`.
- Leer el prop `skin` de `GameCanvasProps`.
- Guardar la skin inicial en un ref (`skinRef`) y pasarla a
  `startFrogger(canvas, callbacks, skinRef.current)`.
- Anadir `useEffect([skin])` que llama `handleRef.current?.setSkin?.(skin)`
  para hot-swap sin reinicio.

---

## Criterios de aceptacion

- `frogger` ofrece los 3 skins; classic es el default.
- Las 3 paletas son legibles sobre fondo oscuro (rana, HUD y entidades con
  contraste adecuado sobre sus fondos de zona respectivos).
- Cambiar el skin en el selector persiste entre sesiones (localStorage,
  manejado por `GamePlayer.tsx`).
- El cambio de skin es en caliente: no interrumpe la partida en curso.
- `tsc --noEmit` limpio; sin regresiones en el gameplay.
- Los otros juegos (`asteroides`, `caida`) no sufren regresiones.

---

## Decisiones tomadas y descartadas

| Decision                     | Elegido                                       | Descartado                            | Motivo                                                                                                   |
| ---------------------------- | --------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Color de rana en neon        | `#39ff14` (verde radioactivo)                 | `#00ff88` (verde menta de asteroides) | `#39ff14` es el verde neon canonico; mas saturado y propio del personaje protagonista                    |
| Color del rio en neon        | `#020d1a` (casi negro azulado)                | Azul electrico brillante              | El rio neon profundo hace que los troncos/tortugas neon destaquen mas sobre el; mejor legibilidad        |
| Troncos en neon              | `#2a1a08` (carbon oscuro)                     | Marron claro                          | El contraste tronco-oscuro sobre rio-oscuro se resuelve con la forma; evitar colores claros que compitan |
| Color del rio en retro       | `#0000aa` (azul CGA puro)                     | `#0055aa` (azul suavizado)            | Fidelidad a la paleta CGA modo 4; maximo contraste con la rana verde sobre agua                          |
| Coches en retro              | Rojo/amarillo/cian CGA puros                  | Mismos colores que classic            | Paleta retro requiere colores planos de 4-bit; los colores CGA son canonicos para esa estetica           |
| Estrategia de cambio de skin | Live swap (Object.assign sobre activePalette) | Restart on change                     | Igual que asteroides; no interrumpe la partida; la paleta viaja por referencia en cada frame             |
| `types.ts`                   | Sin cambios (ya tiene `skin?` y `setSkin?`)   | Reescribir el contrato                | El contrato ya fue extendido en el spec de asteroides; frogger solo implementa lo que ya esta definido   |
