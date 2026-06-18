# 13-react-render-optimization

**Estado:** Aprobado
**Dependencias:** — (modifica GamePlayer.tsx y los tres canvas components existentes)
**Fecha:** 2026-06-17
**Objetivo:** Eliminar los re-renders de React innecesarios durante el gameplay en todos los juegos activos de Arcade Vault.

---

## Scope

### Dentro del scope

- Convertir `score`, `lives`, `level` en `GamePlayer` de `useState` a `useRef` + actualización
  directa del DOM (sin pasar por reconciliación de React).
- Añadir `finalScore` como estado React exclusivamente para capturar la puntuación
  en el momento del game-over (alimenta el modal de puntuación final).
- Refactorizar el mock CRT: fusionar la lógica de level-up dentro del `setInterval`
  para eliminar el `useEffect` reactivo sobre `score`.
- Aplicar `React.memo` a los tres canvas components activos: `AsteroidsCanvas`,
  `CaidaCanvas`, `FroggerCanvas`.
- Adaptar `restart()` para resetear los refs antes de que el engine arranque.

### Fuera del scope

- `paused`, `over`, `saved`, `name`, `skin` permanecen como estado React
  (triggers legítimos o de baja frecuencia; algunos son props del canvas).
- Optimizaciones del motor canvas (offscreen canvas, dirty rects, caching del fondo
  estático) — queda para spec futuro si se necesita.
- Snake: no tiene canvas component registrado; se le aplica cuando se integre.
- Tests automatizados de regresión de performance.

---

## Modelo de datos

No se introducen nuevas estructuras. Los cambios son sustituciones dentro de `GamePlayer.tsx`:

| Antes                                   | Después                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `const [score, setScore] = useState(0)` | `const scoreRef = useRef(0)` + `const scoreElRef = useRef<HTMLDivElement>(null)`              |
| `const [lives, setLives] = useState(3)` | `const livesRef = useRef(3)` + `const livesElRef = useRef<HTMLDivElement>(null)`              |
| `const [level, setLevel] = useState(1)` | `const levelRef = useRef(1)` + `const levelElRef = useRef<HTMLDivElement>(null)`              |
| —                                       | `const [finalScore, setFinalScore] = useState(0)` _(nuevo — solo para el modal de game-over)_ |

---

## Plan de implementación

### Paso 1 — `GamePlayer.tsx`: eliminar estados HUD y añadir refs

Eliminar:

```ts
const [score, setScore] = useState(0);
const [lives, setLives] = useState(3);
const [level, setLevel] = useState(1);
```

Añadir:

```ts
const scoreRef = useRef(0);
const livesRef = useRef(3);
const levelRef = useRef(1);
const scoreElRef = useRef<HTMLDivElement>(null);
const livesElRef = useRef<HTMLDivElement>(null);
const levelElRef = useRef<HTMLDivElement>(null);
const [finalScore, setFinalScore] = useState(0);
```

---

### Paso 2 — `GamePlayer.tsx`: actualizar `callbacks`

```ts
const callbacks = useMemo<GameCallbacks>(
  () => ({
    onScore: (s) => {
      scoreRef.current = s;
      if (scoreElRef.current)
        scoreElRef.current.textContent = s.toLocaleString("es-ES");
    },
    onLives: (l) => {
      livesRef.current = l;
      if (livesElRef.current)
        livesElRef.current.textContent =
          game.id === "caida"
            ? String(l)
            : "♥ ".repeat(Math.max(0, l)).trim() || "—";
    },
    onLevel: (lv) => {
      levelRef.current = lv;
      if (levelElRef.current)
        levelElRef.current.textContent = String(lv).padStart(2, "0");
    },
    onGameOver: (s) => {
      setFinalScore(s);
      setOver(true);
    },
  }),
  []
);
```

`scoreRef`, `livesRef`, `levelRef`, `scoreElRef`, `livesElRef`, `levelElRef` y `game.id`
son estables durante todo el ciclo de vida del componente, por lo que capturarlos en un
closure con deps `[]` es seguro.

---

### Paso 3 — `GamePlayer.tsx`: actualizar el JSX del HUD

Añadir `ref` y valores iniciales estáticos a los tres elementos de valor del HUD:

```tsx
{
  /* Puntuación */
}
<div className="v" ref={scoreElRef}>
  0
</div>;

{
  /* Vidas / Líneas */
}
<div className="v" ref={livesElRef}>
  {game.id === "caida" ? "3" : "♥ ♥ ♥"}
</div>;

{
  /* Nivel */
}
<div className="v" ref={levelElRef}>
  01
</div>;
```

En el modal de game-over, sustituir `{score.toLocaleString("es-ES")}`
por `{finalScore.toLocaleString("es-ES")}`.

---

### Paso 4 — `GamePlayer.tsx`: actualizar `restart()`

```ts
const restart = () => {
  scoreRef.current = 0;
  livesRef.current = 3;
  levelRef.current = 1;
  setPaused(false);
  setOver(false);
  setSaved(false);
  setFinalScore(0);
  astRef.current?.restart();
};
```

El engine llamará a `onScore(0)`, `onLives(3)` y `onLevel(1)` dentro de su propio
`restart()`, que actualizarán los refs y el DOM; los resets anteriores garantizan
coherencia si algún callback llega antes de que el engine arranque.

---

### Paso 5 — `GamePlayer.tsx`: refactorizar el mock CRT

Eliminar el `useEffect` reactivo sobre `score`:

```ts
// ELIMINAR:
useEffect(() => {
  if (Canvas) return;
  if (score > 0 && score % 2500 < 100) setLevel((l) => l + 1);
}, [Canvas, score]);
```

Reemplazar el `setInterval` del mock CRT por una versión que use refs y DOM directo,
con la lógica de level-up integrada:

```ts
useEffect(() => {
  if (Canvas || over || paused) return;
  const t = setInterval(() => {
    const next = scoreRef.current + Math.floor(10 + Math.random() * 90);
    scoreRef.current = next;
    if (scoreElRef.current)
      scoreElRef.current.textContent = next.toLocaleString("es-ES");
    if (next > 0 && next % 2500 < 100) {
      const nextLevel = levelRef.current + 1;
      levelRef.current = nextLevel;
      if (levelElRef.current)
        levelElRef.current.textContent = String(nextLevel).padStart(2, "0");
    }
  }, 220);
  return () => clearInterval(t);
}, [Canvas, over, paused]);
```

---

### Paso 6 — Canvas components: aplicar `React.memo`

En `AsteroidsCanvas.tsx`, `CaidaCanvas.tsx` y `FroggerCanvas.tsx`, envolver
el `forwardRef` en `React.memo`:

```tsx
const FroggerCanvas = React.memo(
  forwardRef<GameCanvasHandle, GameCanvasProps>(
    ({ callbacks, paused, skin }, ref) => {
      // ... cuerpo sin cambios
    }
  )
);
FroggerCanvas.displayName = "FroggerCanvas";
export default FroggerCanvas;
```

Aplicar el mismo patrón en `AsteroidsCanvas` y `CaidaCanvas`.

---

## Criterios de aceptación

- [ ] Durante el gameplay normal (sin pausar, sin fin de partida), `GamePlayer` no
      dispara re-renders de React al actualizar score, lives o level (verificable en
      React DevTools Profiler).
- [ ] `AsteroidsCanvas`, `CaidaCanvas` y `FroggerCanvas` no se re-renderizan cuando
      cambia el score/lives/level.
- [ ] El HUD (score, lives, nivel) se actualiza en tiempo real durante el gameplay.
- [ ] El modal de game-over muestra la puntuación correcta capturada en el momento
      del fin de partida.
- [ ] `restart()` resetea el HUD a los valores iniciales correctamente.
- [ ] El mock CRT sigue actualizando score y level en juegos sin canvas registrado.
- [ ] `paused` y `skin` siguen funcionando: el canvas recibe los props actualizados.
- [ ] `tsc --noEmit` limpio.
- [ ] Sin regresiones de gameplay en ningún juego activo.

---

## Decisiones tomadas y descartadas

| Decisión                             | Elegido                                           | Descartado                                  | Motivo                                                                                                                             |
| ------------------------------------ | ------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Estrategia HUD                       | Refs + `textContent` directo                      | `useState` con throttle                     | El throttle sigue generando renders periódicos; refs + DOM son cero renders                                                        |
| `finalScore` como estado             | `setFinalScore(s)` al game-over                   | Leer `scoreRef.current` en el JSX del modal | El modal puede renderizarse después de que `scoreRef` sea reseteado por `restart()`; capturar el valor en estado lo hace inmutable |
| Mock CRT en `setInterval` único      | Lógica de level-up fusionada dentro del intervalo | Mantener el `useEffect([..., score])`       | Con `score` ya no siendo estado, el effect no se dispararía; fusionar la lógica elimina la dependencia reactiva                    |
| `paused`, `over`, `skin` como estado | Sin cambios                                       | Moverlos a refs                             | Son triggers de cambios estructurales en la UI (modal, prop del canvas); React necesita saber de ellos                             |
| Scope de `React.memo`                | Solo los tres canvas registrados                  | Incluir todos los `forwardRef` del proyecto | Snake no tiene canvas component registrado; se aplica cuando se integre                                                            |

---

## Riesgos

| Riesgo                                                                                                | Mitigación                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callbacks` captura `game.id` en closure con deps `[]`: si `game` cambiara, el closure quedaría stale | `game` es una prop de entrada que no cambia durante la vida del componente (cambiar de juego implica navegar a otra URL) — safe                      |
| `React.memo` con `forwardRef` — la comparación de props es shallow por defecto                        | `callbacks` es estable (useMemo `[]`); `paused` y `skin` son primitivos; el `ref` no es una prop visible al memo — sin riesgo de comparación fallida |
| El engine llama `onLives(0)` y el mock CRT escribe en los mismos refs en el mismo tick                | Son rutas mutuamente excluyentes (el mock CRT solo corre cuando `!Canvas`) — sin conflicto                                                           |
