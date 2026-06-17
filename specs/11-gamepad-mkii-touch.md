# 11-gamepad-mkii-touch

> **Estado:** Implementado · **Dependencias:** 10-mobile-touch-controls · **Fecha:** 2026-06-17
> **Objetivo:** Rediseñar los controles táctiles de Asteroides y Caída para que adopten la apariencia del Gamepad MK-II de `references/gamepad-assets/` — D-pad en cruz + botón de acción redondo con estética neón.

---

## Scope

**Dentro del scope:**

- Nuevo CSS para el Gamepad MK-II (`.gp`, `.gp-body`, `.gp-col`, `.gp-dpad`, `.dp`, `.dp-hub`, `.dp-hub-gem`, `.gp-actions`, `.ab`) en `app/globals.css`.
- Eliminar las clases obsoletas: `.touch-btn`, `.touch-btn:active`, `.touch-btn-fire`, `.touch-btn-fire:active`, `.touch-row`, `.touch-row-fire`.
- Mantener sin cambios: `.touch-controls` (display + media query) y `.caida-wrap > .touch-controls { flex-basis: 100% }`.
- Reemplazar la JSX de controles táctiles en `AsteroidsCanvas.tsx` y `CaidaCanvas.tsx` por la estructura de D-pad + botón A.
- Animación del hub-gem (`gp-pulse-led`, prefijada para evitar colisión).
- Responsive: breakpoint `max-width: 620px` (igual que el reference).
- Los controles siguen visibles solo en `pointer: coarse`.

**Fuera del scope (para specs futuros):**

- Botón B de acción (sin acción confirmada por juego).
- Snake — los controles táctiles van en su spec de integración.
- Teclado físico / gamepad físico (sin cambios).
- Cambios en el HUD superior (PAUSA / FIN / SALIR).
- Gestión de clase `.on` por teclado (solo pointer events).

---

## Mapeo de botones

Esta feature no introduce nuevas estructuras de datos. Los `TOUCH_BUTTONS` del canvas se eliminan; la JSX pasa a ser estática por juego.

**Asteroides:**

| Control | Tecla        | Acción             |
| ------- | ------------ | ------------------ |
| D-pad ◄ | `ArrowLeft`  | Girar izquierda    |
| D-pad ▲ | `ArrowUp`    | Propulsar          |
| D-pad ► | `ArrowRight` | Girar derecha      |
| D-pad ▼ | `KeyS`       | HIPER (hyperspace) |
| Botón A | `Space`      | FIRE (disparar)    |

**Caída:**

| Control | Tecla        | Acción                   |
| ------- | ------------ | ------------------------ |
| D-pad ◄ | `ArrowLeft`  | Mover izquierda          |
| D-pad ▲ | `ArrowUp`    | Rotar pieza              |
| D-pad ► | `ArrowRight` | Mover derecha            |
| D-pad ▼ | `ArrowDown`  | Bajar rápido             |
| Botón A | `Space`      | DROP (caída instantánea) |

---

## Plan de implementación

### Paso 1 — `app/globals.css`: eliminar clases antiguas

Eliminar los bloques de:

```
.touch-row { … }
.touch-row-fire { … }
.touch-btn { … }
.touch-btn:active { … }
.touch-btn-fire { … }
.touch-btn-fire:active { … }
```

Mantener intacto todo lo anterior a `.touch-row` (`.touch-controls`, `@media (pointer: coarse)`, `.caida-wrap > .touch-controls`).

### Paso 2 — `app/globals.css`: añadir clases Gamepad MK-II

Añadir a continuación de `.caida-wrap > .touch-controls` el bloque completo del gamepad:

```css
/* Gamepad MK-II */
.gp {
  width: 100%;
  max-width: 760px;
  padding: 16px 22px 14px;
  background: linear-gradient(180deg, #1c1c28 0%, #0c0c14 100%);
  border: 1px solid rgba(0, 245, 255, 0.18);
  border-radius: 22px;
  box-shadow:
    0 30px 80px -30px rgba(0, 245, 255, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 0 rgba(0, 0, 0, 0.6);
  position: relative;
}
.gp::before {
  content: "";
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(0, 245, 255, 0.14);
  border-radius: 18px;
  pointer-events: none;
}
.gp::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.03) 1px,
    transparent 1px
  );
  background-size: 8px 8px;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0.6;
}
.gp-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: center;
  padding: 24px 12px;
  position: relative;
  z-index: 1;
}
.gp-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.gp-col-left {
  justify-self: start;
}
.gp-col-right {
  justify-self: end;
}

/* D-pad */
.gp-dpad {
  position: relative;
  width: 156px;
  height: 156px;
}
.dp {
  position: absolute;
  width: 50px;
  height: 50px;
  background: linear-gradient(180deg, #1a1a25, #0a0a12);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  color: var(--ink-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow:
    0 4px 0 #050507,
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 4px rgba(0, 0, 0, 0.6);
  transition:
    transform 80ms,
    box-shadow 140ms,
    color 140ms,
    border-color 140ms,
    background 140ms;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.dp .dp-arrow {
  width: 22px;
  height: 22px;
  transition: filter 140ms;
}
.dp:hover {
  color: var(--cyan);
  border-color: rgba(0, 245, 255, 0.35);
}
.dp.on,
.dp:active {
  transform: translateY(3px);
  color: var(--cyan);
  background: linear-gradient(180deg, #08161e, #030a0e);
  border-color: var(--cyan);
  box-shadow:
    0 1px 0 #050507,
    inset 0 0 16px rgba(0, 245, 255, 0.45),
    0 0 16px rgba(0, 245, 255, 0.5);
}
.dp.on .dp-arrow,
.dp:active .dp-arrow {
  filter: drop-shadow(0 0 6px var(--cyan)) drop-shadow(0 0 12px var(--cyan));
}
.dp-up {
  top: 0;
  left: 53px;
}
.dp-down {
  bottom: 0;
  left: 53px;
}
.dp-left {
  left: 0;
  top: 53px;
}
.dp-right {
  right: 0;
  top: 53px;
}

.dp-hub {
  position: absolute;
  top: 53px;
  left: 53px;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle at 50% 50%, #181822 0%, #08080d 80%);
  border: 1px solid rgba(0, 245, 255, 0.15);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 0 12px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  pointer-events: none;
}
.dp-hub-gem {
  width: 12px;
  height: 12px;
  background: var(--cyan);
  box-shadow:
    0 0 10px var(--cyan),
    inset 0 0 4px rgba(0, 0, 0, 0.5);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  animation: gp-pulse-led 2s ease-in-out infinite;
}
@keyframes gp-pulse-led {
  50% {
    opacity: 0.35;
    transform: scale(0.85);
  }
}

/* Botón de acción */
.gp-actions {
  display: flex;
  flex-direction: column;
  gap: 22px;
  align-items: center;
}
.ab {
  position: relative;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background:
    radial-gradient(
      circle at 32% 26%,
      rgba(255, 255, 255, 0.25),
      transparent 50%
    ),
    radial-gradient(circle at 50% 55%, var(--ab-mid), var(--ab-deep) 75%);
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 0 #050507,
    0 0 22px var(--ab-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -4px 8px rgba(0, 0, 0, 0.4);
  transition:
    transform 80ms,
    box-shadow 140ms;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.ab.a {
  color: var(--magenta);
  --ab-mid: rgba(255, 0, 110, 0.7);
  --ab-deep: rgba(110, 0, 40, 0.95);
  --ab-glow: rgba(255, 0, 110, 0.4);
}
.ab.b {
  color: var(--cyan);
  --ab-mid: rgba(0, 200, 230, 0.7);
  --ab-deep: rgba(0, 50, 70, 0.95);
  --ab-glow: rgba(0, 245, 255, 0.4);
}
.ab .ab-letter {
  font-family: var(--pixel);
  font-size: 22px;
  color: #fff;
  position: relative;
  z-index: 2;
}
.ab.a .ab-letter {
  text-shadow:
    0 0 8px var(--magenta),
    0 0 18px var(--magenta),
    0 1px 0 rgba(0, 0, 0, 0.6);
}
.ab.b .ab-letter {
  text-shadow:
    0 0 8px var(--cyan),
    0 0 18px var(--cyan),
    0 1px 0 rgba(0, 0, 0, 0.6);
}
.ab .ab-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px dashed currentColor;
  opacity: 0;
  transition:
    opacity 140ms,
    transform 200ms;
  pointer-events: none;
}
.ab:hover .ab-ring {
  opacity: 0.45;
}
.ab.on,
.ab:active {
  transform: translateY(4px) scale(0.97);
  box-shadow:
    0 1px 0 #050507,
    0 0 36px var(--ab-glow),
    inset 0 0 18px rgba(0, 0, 0, 0.5);
}
.ab.on .ab-ring,
.ab:active .ab-ring {
  opacity: 1;
  transform: scale(1.08);
}

/* Responsive */
@media (max-width: 620px) {
  .gp {
    padding: 12px 14px 10px;
    border-radius: 16px;
  }
  .gp-body {
    gap: 14px;
    padding: 18px 6px;
  }
  .gp-dpad {
    width: 144px;
    height: 144px;
  }
  .dp {
    width: 46px;
    height: 46px;
    border-radius: 8px;
  }
  .dp-up {
    left: 49px;
  }
  .dp-down {
    left: 49px;
  }
  .dp-left {
    top: 49px;
  }
  .dp-right {
    top: 49px;
  }
  .dp-hub {
    top: 49px;
    left: 49px;
    width: 46px;
    height: 46px;
  }
  .ab {
    width: 64px;
    height: 64px;
  }
  .gp-actions {
    gap: 16px;
  }
}
```

### Paso 3 — `app/games/[id]/play/AsteroidsCanvas.tsx`

Eliminar `TOUCH_BUTTONS`, `row0` y `row1`. Reemplazar `<div className="touch-controls">…</div>` por:

```tsx
<div className="touch-controls">
  <div className="gp">
    <div className="gp-body">
      <div className="gp-col gp-col-left">
        <div className="gp-dpad">
          <button
            className="dp dp-up"
            onPointerDown={() => dispatch("ArrowUp", "keydown")}
            onPointerUp={() => dispatch("ArrowUp", "keyup")}
            onPointerLeave={() => dispatch("ArrowUp", "keyup")}
          >
            <svg className="dp-arrow" viewBox="0 0 24 24">
              <path d="M12 4 L20 16 L4 16 Z" fill="currentColor" />
            </svg>
          </button>
          <button
            className="dp dp-right"
            onPointerDown={() => dispatch("ArrowRight", "keydown")}
            onPointerUp={() => dispatch("ArrowRight", "keyup")}
            onPointerLeave={() => dispatch("ArrowRight", "keyup")}
          >
            <svg className="dp-arrow" viewBox="0 0 24 24">
              <path d="M8 4 L20 12 L8 20 Z" fill="currentColor" />
            </svg>
          </button>
          <button
            className="dp dp-down"
            onPointerDown={() => dispatch("KeyS", "keydown")}
            onPointerUp={() => dispatch("KeyS", "keyup")}
            onPointerLeave={() => dispatch("KeyS", "keyup")}
          >
            <svg className="dp-arrow" viewBox="0 0 24 24">
              <path d="M4 8 L20 8 L12 20 Z" fill="currentColor" />
            </svg>
          </button>
          <button
            className="dp dp-left"
            onPointerDown={() => dispatch("ArrowLeft", "keydown")}
            onPointerUp={() => dispatch("ArrowLeft", "keyup")}
            onPointerLeave={() => dispatch("ArrowLeft", "keyup")}
          >
            <svg className="dp-arrow" viewBox="0 0 24 24">
              <path d="M16 4 L16 20 L4 12 Z" fill="currentColor" />
            </svg>
          </button>
          <div className="dp-hub">
            <span className="dp-hub-gem" />
          </div>
        </div>
      </div>
      <div className="gp-col gp-col-right">
        <div className="gp-actions">
          <button
            className="ab a"
            onPointerDown={() => dispatch("Space", "keydown")}
            onPointerUp={() => dispatch("Space", "keyup")}
            onPointerLeave={() => dispatch("Space", "keyup")}
          >
            <span className="ab-ring" />
            <span className="ab-letter">A</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Paso 4 — `app/games/[id]/play/CaidaCanvas.tsx`

Mismo reemplazo con el mapeo de Caída:

- `dp-up` → `ArrowUp`
- `dp-right` → `ArrowRight`
- `dp-down` → `ArrowDown`
- `dp-left` → `ArrowLeft`
- Botón A → `Space`

Eliminar también `TOUCH_BUTTONS`, `row0`, `row1`.

---

## Criterios de aceptación

- [ ] En dispositivo touch (`pointer: coarse`), Asteroides muestra el Gamepad MK-II: D-pad + botón A magenta.
- [ ] En dispositivo touch (`pointer: coarse`), Caída muestra el Gamepad MK-II: D-pad + botón A magenta.
- [ ] En desktop (mouse), los controles no son visibles y no ocupan espacio.
- [ ] Los controles no solapan el canvas en ningún juego.
- [ ] **Asteroides:** D-pad ◄ ▲ ► giran/propulsan; D-pad ▼ dispara HIPER (KeyS); botón A dispara FIRE (Space).
- [ ] **Caída:** D-pad ◄ ▲ ► ▼ mueven/rotan; botón A dispara DROP (Space).
- [ ] El hub-gem tiene la animación `gp-pulse-led` (pulso cian, 2 s).
- [ ] Al presionar el botón A se aprecia el efecto visual (translateY + glow magenta).
- [ ] Al presionar un botón del D-pad se aprecia el efecto `.on` (translateY + glow cian).
- [ ] Los controles de teclado físico siguen funcionando sin regresiones en ambos juegos.
- [ ] `tsc --noEmit` pasa limpio.
- [ ] El HUD superior (PAUSA / FIN / SALIR) no sufre cambios.

---

## Decisiones

- **Sí:** Adoptar la estructura completa D-pad + botón A. La petición explícita es tomar la apariencia del reference; solo restilar los botones planos no cumpliría el objetivo.
- **No:** Botón B. Sin confirmación del usuario sobre qué acción asignar en cada juego; se deja para extensión futura por juego.
- **Sí:** D-pad ▼ = HIPER en Asteroides. Aprovecha el botón inferior del D-pad en lugar de dejarlo vacío; el hyperspace encaja bien como acción "abajo" (escape/huida).
- **Sí:** D-pad ▲ = ArrowUp (rotar) en Caída. El juego usa esa tecla para rotar; mantenerla en el D-pad es coherente con el mapping del teclado.
- **Sí:** Prefijo `gp-pulse-led` en el `@keyframes`. El reference usa `pulse-led` sin scope; prefijarlo evita colisión con otros keyframes del proyecto.
- **No:** Incluir Snake. No tiene controles táctiles implementados aún; los añadirá su propio spec de integración.
- **Sí:** Breakpoint `max-width: 620px` del reference en lugar del `md` de Tailwind. El reference ya tiene el breakpoint ajustado para este componente; no hay ventaja en cambiarlo.

---

## Riesgos

| Riesgo                                                         | Mitigación                                                                                                                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colisión de clases `.dp` o `.ab` con estilos existentes        | Verificar con `grep -n "\.dp\b\|\.ab\b" app/globals.css` antes de añadir el bloque.                                                                             |
| Offsets del D-pad asumen `width: 50px` → posición `left: 53px` | Si se cambia el tamaño del botón, recalcular: offset = (contenedor − botón) / 2 = (156 − 50) / 2 = 53.                                                          |
| `setPointerCapture` lanza excepción en algunos browsers        | Los handlers de React (`onPointerDown`) no usan `setPointerCapture`; el reference la usaba por compatibilidad con el modelo de eventos vanilla. No aplica aquí. |

---

## Lo que NO está en este spec

- Botón B de acción para ningún juego.
- Controles táctiles para Snake.
- Cambio del tamaño del canvas o del layout desktop.
- Gestos swipe, joystick virtual o soporte de gamepad físico.
