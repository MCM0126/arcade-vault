# 09-asteroides-skins

**Estado:** Aprobado
**Dependencias:** 05-asteroides-integration
**Fecha:** 2026-06-17
**Objetivo:** Diseñar los 3 skins (neon, retro, classic) para `asteroides`,
legibles sobre el fondo oscuro de la plataforma, con selector y persistencia
para el jugador.

---

## Roles de color de `asteroides`

Extraídos de `lib/games/asteroids.ts` (colores hardcodeados actuales):

| Rol                   | Elemento visual                                             | Color actual en el motor |
| --------------------- | ----------------------------------------------------------- | ------------------------ |
| `fondo`               | `ctx.fillRect` del canvas completo                          | `#000`                   |
| `nave`                | Triángulo de la nave (stroke)                               | `#0ff`                   |
| `bala`                | Círculo de la bala (fill)                                   | `#0ff`                   |
| `asteroide`           | Polígono del asteroide (stroke)                             | `#aaa`                   |
| `particula-explosion` | Explosión de asteroide (fill, color default)                | `#fa0`                   |
| `particula-nave`      | Explosión al morir la nave (fill, color forzado)            | `#0ff`                   |
| `powerup-borde-a`     | Borde del power-up en frames pares (parpadeo A)             | `#ff0`                   |
| `powerup-borde-b`     | Borde del power-up en frames impares (parpadeo B)           | `#fa0`                   |
| `powerup-texto`       | Texto "3×" del power-up                                     | `#ff0`                   |
| `hud-primario`        | Score, NIVEL, vidas y overlay "EN PAUSA" (texto canvas HUD) | `#0ff`                   |
| `hud-powerup-activo`  | Texto "3× FUEGO" cuando el power-up está activo             | `#ff0`                   |
| `overlay-pausa-fondo` | Rect semitransparente del overlay de pausa                  | `rgba(0,0,0,0.55)`       |

---

## Paletas

### Criterios de diseño

- **classic** — los valores actuales del motor tal cual; son el punto de
  partida ya validado visualmente en la plataforma.
- **neon** — máxima saturación y brillo, coherente con `--cyan`, `--magenta`,
  `--yellow` y `--green` de `app/globals.css` y las utilidades `.neon-*`.
  Cada elemento tiene un color propio y diferenciado para reforzar la lectura
  de la escena.
- **retro** — paleta de 4-5 colores estilo CGA/Arcade 80s. Fondo negro
  absoluto, colores planos sin gradiente, máximo contraste binario. Inspirada
  en la paleta CGA modo 4 paleta 1 (cian / magenta / blanco) y el verde
  fosforescente de monitores de fósforo.

### Tabla de paletas

| Rol                   | classic            | neon                | retro              |
| --------------------- | ------------------ | ------------------- | ------------------ |
| `fondo`               | `#000000`          | `#05050f`           | `#000000`          |
| `nave`                | `#00ffff`          | `#00f5ff`           | `#ffffff`          |
| `bala`                | `#00ffff`          | `#ff006e`           | `#ffffff`          |
| `asteroide`           | `#aaaaaa`          | `#8888cc`           | `#00ffff`          |
| `particula-explosion` | `#ffaa00`          | `#f5ff00`           | `#ff00ff`          |
| `particula-nave`      | `#00ffff`          | `#00f5ff`           | `#ffffff`          |
| `powerup-borde-a`     | `#ffff00`          | `#00ff88`           | `#ffff00`          |
| `powerup-borde-b`     | `#ffaa00`          | `#00cc66`           | `#ff00ff`          |
| `powerup-texto`       | `#ffff00`          | `#00ff88`           | `#ffff00`          |
| `hud-primario`        | `#00ffff`          | `#00f5ff`           | `#00ff00`          |
| `hud-powerup-activo`  | `#ffff00`          | `#f5ff00`           | `#ffff00`          |
| `overlay-pausa-fondo` | `rgba(0,0,0,0.55)` | `rgba(0,5,20,0.70)` | `rgba(0,0,0,0.75)` |

### Notas de paleta

**classic** — idéntico a los literales del motor. Azul-cian uniforme para
nave, bala, HUD y explosión de nave; naranja-ámbar para explosiones de
asteroides; amarillo para power-ups.

**neon** — fondo ligeramente más profundo que negro puro para acentuar el
glow. La nave y el HUD usan el `--cyan` de la plataforma (`#00f5ff`). Las
balas cambian a `--magenta` (`#ff006e`) para diferenciarlas visualmente de la
nave. Los asteroides toman un violeta-azulado suave (`#8888cc`) que los
destaca sin competir con la nave. Las explosiones de asteroides usan
`--yellow` (`#f5ff00`). Los power-ups usan `--green` (`#00ff88`) para
contraste máximo con el resto de la escena.

**retro** — fondo negro puro. Nave y bala en blanco puro (`#ffffff`) como en
los Asteroids originales de Atari (vector display). Asteroides en cian
(`#00ffff`) estilo CGA paleta 1. Explosiones en magenta (`#ff00ff`) CGA. HUD
en verde fosforescente (`#00ff00`) de monitor fósforo P1. Power-ups alternan
amarillo/magenta para el parpadeo característico arcade.

---

## Arquitectura del sistema de skins

Esta sección aplica a todos los juegos de Arcade Vault. Como `asteroides` es
el primer juego en recibir skins, aquí se especifica la arquitectura completa.
Los specs de skins de otros juegos solo añadirán su tabla de paletas y
referenciarán este documento.

### 1. Tipo `SkinId` y registro de paletas — `lib/games/skins.ts`

Crear el archivo `lib/games/skins.ts`:

```ts
export type SkinId = "neon" | "retro" | "classic";

export const DEFAULT_SKIN: SkinId = "classic";

// Paleta de un juego: mapea nombre de rol a valor hex/rgba.
export type GamePalette = Record<string, string>;

// Registro de paletas por juego.
// Cada entrada tiene los 3 skins; 'classic' es el default.
export type GameSkins = Record<SkinId, GamePalette>;
```

Las paletas concretas de cada juego se añaden a este archivo como constantes
exportadas:

```ts
export const ASTEROIDES_SKINS: GameSkins = {
  classic: { ... },
  neon:    { ... },
  retro:   { ... },
};
```

El `classic` de cada juego se inicializa con los literales actuales del motor
(ver tabla de paletas arriba). El motor lee sus colores exclusivamente de la
paleta inyectada — no queda ningún literal hardcodeado en el motor portado.

### 2. Extensión del contrato en `lib/games/types.ts`

Añadir `skin` como prop opcional con default `'classic'` en `GameCanvasProps`:

```ts
import type { SkinId } from "./skins";

export interface GameCanvasProps {
  callbacks: GameCallbacks;
  paused: boolean;
  skin?: SkinId; // nuevo — default: 'classic'
}
```

La firma del motor se extiende con un tercer parámetro opcional:

```ts
// lib/games/asteroids.ts — nueva firma
export function startAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  skin?: SkinId // nuevo — default: 'classic'
): GameHandle;
```

Dentro del motor, en la función `initGame()` (o al inicio de `startAsteroids`),
se resuelve la paleta una sola vez:

```ts
import { ASTEROIDES_SKINS, DEFAULT_SKIN } from "./skins";
// ...
const palette = ASTEROIDES_SKINS[skin ?? DEFAULT_SKIN];
```

Cada literal de color en `draw()`, `Bullet.draw()`, `Asteroid.draw()`, etc.
se reemplaza por `palette['<nombre-de-rol>']`.

**Nota sobre el cambio de skin en caliente:** si la paleta se resuelve una sola
vez al arrancar el juego, cambiar el skin requiere llamar `restart()`. El
selector UI debe comunicar este comportamiento al jugador ("El skin se aplica
en la próxima partida" o bien relanzar el juego al cambiar). Una alternativa
es pasar la paleta como referencia mutable (objeto `ref`) para que el loop
siempre lea el valor actualizado sin reiniciar — decisión de implementación
a tomar en el spec de implementación.

### 3. Flujo completo de la paleta desde la UI hasta el canvas

```
localStorage / Supabase
        ↓
  SkinSelector (componente UI)
        ↓ prop `skin: SkinId`
  <AsteroidsCanvas skin={skin} ... />     (GameCanvasProps extendido)
        ↓ parámetro
  startAsteroids(canvas, callbacks, skin)  (motor)
        ↓
  ASTEROIDES_SKINS[skin]                  (lib/games/skins.ts)
        ↓
  palette['nave'], palette['bala'], ...   (ctx.strokeStyle / ctx.fillStyle)
```

### 4. Selector de skin para el jugador

Ubicación propuesta: dentro de `app/games/[id]/play/GamePlayer.tsx`, visible
antes o durante la partida (p. ej. en el HUD o en un panel desplegable antes
de iniciar).

El selector muestra 3 opciones: Classic, Neon, Retro. Puede implementarse
como un grupo de botones con preview de color (un cuadrado de muestra del
`nave` y `fondo` de cada skin para que el jugador sepa lo que elige).

### 5. Persistencia de la preferencia del jugador

**Default: `localStorage`.**

```ts
// Leer preferencia al montar GamePlayer
const saved = localStorage.getItem("arcade-vault:skin") as SkinId | null;
const [skin, setSkin] = useState<SkinId>(saved ?? DEFAULT_SKIN);

// Guardar al cambiar
function handleSkinChange(s: SkinId) {
  setSkin(s);
  localStorage.setItem("arcade-vault:skin", s);
}
```

La preferencia es global entre juegos (un solo valor persiste para todos).
Si en el futuro se quiere preferencia por juego, la clave puede ser
`arcade-vault:skin:<game-id>`.

**Alternativa Supabase:** si el usuario está autenticado, guardar en la tabla
`profiles` (o una tabla `preferences`) con RLS por usuario. Esto sincroniza
la preferencia entre dispositivos. Queda fuera del scope de este spec —
`localStorage` es suficiente para la MVP de skins.

### 6. Reactividad y ciclo de vida del motor

El cambio de skin **no debe romper** `cleanup()` ni `setPaused()`. Las dos
estrategias son:

- **Restart on change** — el selector llama `handle.restart()` al cambiar.
  Simple; el jugador pierde la partida en curso. Aceptable si se avisa en la
  UI.
- **Live swap** — la paleta se inyecta como un objeto por referencia (`ref`)
  que el loop lee en cada frame. No interrumpe la partida. Más complejo.

La decisión final queda para el spec de implementación. Este spec de diseño
no impone una estrategia.

---

## Scope

### Dentro del scope

- Las 3 paletas (`classic`, `neon`, `retro`) para `asteroides`.
- El refactor de `lib/games/asteroids.ts` para leer colores de la paleta
  inyectada en lugar de literales hardcodeados.
- La creación de `lib/games/skins.ts` con el tipo `SkinId`, `GameSkins` y
  la constante `ASTEROIDES_SKINS`.
- La extensión de `GameCanvasProps` y `startAsteroids` con el parámetro `skin`.
- El selector de skin en la UI (`GamePlayer.tsx` o componente propio).
- La persistencia de la preferencia en `localStorage`.

### Fuera del scope

- Skins de otros juegos del catálogo (`caida`, futuros) — cada uno tendrá
  su propio spec cuando se indique.
- Resize responsivo del canvas de Asteroides.
- Autenticación real / persistencia de preferencia en Supabase (anotado como
  alternativa futura).
- Tests automatizados de regresión visual.
- Panel de administración.

---

## Plan de implementación

### Archivo 1: `lib/games/skins.ts` (nuevo)

- Definir y exportar `SkinId`, `DEFAULT_SKIN`, `GamePalette`, `GameSkins`.
- Definir y exportar `ASTEROIDES_SKINS` con los 3 objetos de paleta (roles
  y hex de la tabla anterior).

### Archivo 2: `lib/games/types.ts` (modificar)

- Importar `SkinId` desde `./skins`.
- Añadir `skin?: SkinId` a `GameCanvasProps`.

### Archivo 3: `lib/games/asteroids.ts` (refactor)

- Importar `ASTEROIDES_SKINS`, `DEFAULT_SKIN`, `SkinId` desde `./skins`.
- Añadir `skin?: SkinId` como tercer parámetro de `startAsteroids`.
- Al inicio de `startAsteroids`, resolver: `const palette = ASTEROIDES_SKINS[skin ?? DEFAULT_SKIN]`.
- Reemplazar todos los literales de color por `palette['<rol>']`:
  - `Bullet.draw`: `ctx.fillStyle = palette['bala']`
  - `Asteroid.draw`: `ctx.strokeStyle = palette['asteroide']`
  - `Ship.draw`: `ctx.strokeStyle = palette['nave']`
  - `Particle` constructor: pasar `palette['particula-explosion']` como
    default; mantener el override `palette['particula-nave']` en `killShip`.
  - `PowerUp.draw`: `palette['powerup-borde-a']` / `palette['powerup-borde-b']` / `palette['powerup-texto']`
  - `draw()` (función principal): fondo → `palette['fondo']`, HUD texto →
    `palette['hud-primario']`, "3× FUEGO" → `palette['hud-powerup-activo']`,
    overlay pausa fondo → `palette['overlay-pausa-fondo']`, overlay pausa
    texto → `palette['hud-primario']`.

### Archivo 4: `app/games/[id]/play/AsteroidsCanvas.tsx` (modificar)

- Añadir `skin?: SkinId` a las props (ya viene de `GameCanvasProps` extendido).
- Pasar `skin` a `startAsteroids(canvas, callbacks, skin)`.

### Archivo 5: `app/games/[id]/play/GamePlayer.tsx` (modificar)

- Añadir estado `skin: SkinId` con lectura inicial desde `localStorage`.
- Renderizar el componente `<SkinSelector>` (ver archivo 6).
- Pasar `skin` a `<AsteroidsCanvas skin={skin} ... />`.
- Al cambiar skin, guardar en `localStorage` y opcionalmente llamar
  `handle.restart()` (según la estrategia elegida en implementación).

### Archivo 6: `app/games/[id]/play/SkinSelector.tsx` (nuevo)

- Componente cliente que recibe `skin: SkinId`, `onChange: (s: SkinId) => void`.
- Muestra 3 botones: Classic / Neon / Retro.
- Cada botón tiene un mini-preview: un `<div>` cuadrado con el color `nave`
  sobre fondo `fondo` del skin correspondiente.
- Usar `/frontend-design` para la apariencia exacta del selector.

---

## Criterios de aceptación

- [ ] `asteroides` ofrece los 3 skins: classic, neon, retro.
- [ ] `classic` es el skin por defecto (sin preferencia guardada, el juego
      carga con la paleta original).
- [ ] Las 3 paletas son legibles sobre fondo oscuro: contraste nave/fondo,
      bala/fondo y HUD/fondo supera 4.5:1 en cada skin.
- [ ] El selector de skin es visible en la pantalla de juego.
- [ ] Cambiar el skin persiste la preferencia: al recargar la página, el
      skin seleccionado sigue activo.
- [ ] `tsc --noEmit` pasa limpio.
- [ ] Sin regresiones en el gameplay (velocidad, colisiones, power-ups).
- [ ] `caida` y todos los demás juegos no sufren regresiones.

---

## Decisiones tomadas y descartadas

| Decisión                          | Elegido                                         | Descartado                                            | Motivo                                                                                                                       |
| --------------------------------- | ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Nombre del tipo de skin           | `SkinId = 'neon' \| 'retro' \| 'classic'`       | `ThemeId`, `PaletteId`                                | "Skin" es el término que usa el usuario y la industria; evita confusión con el sistema de tema oscuro/claro de la plataforma |
| Paleta como objeto plano por rol  | `Record<string, string>` con nombres semánticos | Array de colores por posición / CSS variables         | Los nombres semánticos hacen el código del motor auto-documentado y el diff de cambios legible                               |
| Ubicación del registro de paletas | `lib/games/skins.ts` (nuevo archivo)            | Incrustado en cada motor / en `lib/games/registry.ts` | Separación de responsabilidades; el motor no mezcla lógica de juego con datos de paleta                                      |
| Default del skin                  | `classic` (colores actuales del motor)          | `neon` como default                                   | `classic` es lo que el jugador conoce; no rompe la experiencia existente                                                     |
| Persistencia                      | `localStorage` (global, sin auth)               | Supabase `preferences` (requiere auth)                | Cero dependencias de backend; funciona sin sesión activa                                                                     |
| Cambio de skin en caliente        | Decisión diferida al spec de implementación     | Forzar restart / forzar live swap                     | Ambas estrategias son válidas; la elección depende del UX deseado, mejor decidir con el contexto de implementación           |
| Color de bala en neon             | `#ff006e` (magenta de la plataforma)            | Mantener cian igual que la nave                       | Diferencia visualmente naves de balas; reduce confusión en pantalla con muchas balas                                         |
| Color de asteroides en retro      | `#00ffff` (cian CGA)                            | `#aaaaaa` (gris, igual que classic)                   | El gris sobre negro tiene poco contraste; el cian CGA es más fiel a la estética retro y tiene contraste adecuado             |
| Color del HUD en retro            | `#00ff00` (verde fosforescente)                 | `#00ffff` (cian, igual que nave)                      | Diferencia el HUD de los elementos de juego; evoca monitor fósforo P1 de la era arcade                                       |

---

## Riesgos identificados

- **Literales en constructores de clase** — `Bullet`, `Asteroid`, `Ship` y
  `Particle` son clases con métodos `draw()` propios. La paleta debe llegar
  a cada instancia bien por parámetro del constructor o bien por referencia
  al mismo objeto `palette` de la closure de `startAsteroids`. La segunda
  opción (closure compartida) es más limpia pero requiere revisar que las
  instancias de `Particle` creadas en `explode()` usen el color correcto del
  skin activo, no el literal `#fa0` hardcodeado.
- **Constructor de `Particle` acepta `color` como parámetro** — la llamada
  `new Particle(x, y, color)` ya propaga el color. El refactor es pasar
  `palette['particula-explosion']` y `palette['particula-nave']` en esas
  llamadas, sin cambiar la clase en sí.
- **`tsc` con literales de rol** — si se usan strings literales como claves
  (`palette['nave']`), TypeScript no valida que ese rol exista en `GamePalette`
  (que es `Record<string, string>`). Para atrapar errores en tiempo de
  compilación, considerar tipar `GamePalette` con las claves como union type
  — decisión a tomar en implementación.
- **Regresión visual en `classic`** — si el refactor cambia un literal por
  un nombre de rol incorrecto, el skin `classic` mostraría el color equivocado
  sin error en consola. Probar visualmente `classic` contra el comportamiento
  actual antes de mergear.
