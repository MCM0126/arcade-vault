# 10-mobile-touch-controls

**Estado:** Aprobado
**Dependencias:** 05-asteroides-integration, 08-caida-tetris-integration
**Fecha:** 2026-06-17
**Objetivo:** Mover los controles táctiles de Caída debajo del canvas y añadir
controles táctiles equivalentes a Asteroids, visibles únicamente en dispositivos
touch (`pointer: coarse`), sin solapar la pantalla de juego.

---

## Scope

### Dentro del scope

- **Caída:** sacar `<div className="touch-controls">` del interior de
  `<div className="caida-board-wrap">` y colocarlo como hijo directo de
  `<div className="caida-wrap">` (después de `caida-next-wrap`), de modo que
  ocupe una fila completa debajo del tablero y la previsualización.
- **Asteroids:** añadir el botón HIPER (`KeyS`) a la fila de acción (row 1)
  en `TOUCH_BUTTONS`; el resto de botones (◄ ▲ ► FIRE) ya existen.
- **CSS:** eliminar `position: absolute; bottom: 12px; left: 0; right: 0;` de
  `.touch-controls` para que fluya en el DOM en lugar de superponerse al
  canvas. El `display: none` por defecto y el `@media (pointer: coarse)`
  existentes permanecen sin cambios.
- Ambos juegos: los controles táctiles se muestran únicamente en dispositivos
  touch; en desktop son invisibles y no ocupan espacio.

### Fuera del scope

- Los botones PAUSA / FIN / SALIR permanecen en el HUD superior sin cambios.
- Rediseño del HUD o del layout desktop.
- Controles táctiles para juegos futuros (cada uno los añadirá en su propio
  spec de integración).
- Gestos swipe, joystick virtual o soporte gamepad.
- Cambios en el tamaño del canvas o en las dimensiones de los botones táctiles
  existentes.

---

## Plan de implementación

### Paso 1: `app/globals.css`

En la regla `.touch-controls` (línea ~741), reemplazar:

```css
.touch-controls {
  display: none;
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
```

por:

```css
.touch-controls {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 0 4px;
}
```

Con esto los controles pasan a fluir en el DOM debajo del canvas en lugar de
superponerse a él. El `@media (pointer: coarse)` existente no cambia.

Adicionalmente, para que `.touch-controls` como hijo directo de `.caida-wrap`
(flex row) ocupe su propia fila completa, añadir:

```css
.caida-wrap > .touch-controls {
  flex-basis: 100%;
}
```

### Paso 2: `app/games/[id]/play/CaidaCanvas.tsx`

Mover `<div className="touch-controls">…</div>` fuera de
`<div className="caida-board-wrap">` y colocarlo como último hijo de
`<div className="caida-wrap">`, después del cierre de `<div className="caida-next-wrap">`.

Estructura resultante:

```jsx
<div className="caida-wrap">
  <div className="caida-board-wrap">
    <canvas … />
  </div>
  <div className="caida-next-wrap"> … </div>
  <div className="touch-controls">   {/* movido aquí */}
    <div className="touch-row"> … </div>
    <div className="touch-row"> … </div>
  </div>
</div>
```

### Paso 3: `app/games/[id]/play/AsteroidsCanvas.tsx`

Añadir `{ label: "HIPER", code: "KeyS", row: 1 }` al array `TOUCH_BUTTONS`:

```ts
const TOUCH_BUTTONS = [
  { label: "◄", code: "ArrowLeft", row: 0 },
  { label: "▲", code: "ArrowUp", row: 0 },
  { label: "►", code: "ArrowRight", row: 0 },
  { label: "FIRE", code: "Space", row: 1 },
  { label: "HIPER", code: "KeyS", row: 1 }, // nuevo
];
```

El botón HIPER reutiliza la clase `touch-btn-fire` para destacarlo
visualmente junto a FIRE.

---

## Criterios de aceptación

- [ ] En un dispositivo touch (o Chrome DevTools con `pointer: coarse`), los
      controles táctiles son visibles debajo del canvas en ambos juegos.
- [ ] En desktop (mouse), los controles táctiles no se ven y no ocupan espacio
      vertical (`display: none`).
- [ ] Los controles táctiles **no solapan** el canvas en ningún momento.
- [ ] Asteroids responde a los 5 botones: ◄ ▲ ► FIRE HIPER.
- [ ] Caída responde a sus 5 botones: ◄ ▲ ► ▼ DROP.
- [ ] Los controles de teclado siguen funcionando sin regresiones en ambos
      juegos.
- [ ] `tsc --noEmit` pasa limpio.
- [ ] El HUD superior (PAUSA / FIN / SALIR) no sufre cambios.

---

## Decisiones tomadas y descartadas

| Decisión                 | Elegido                                  | Descartado                                | Motivo                                                                         |
| ------------------------ | ---------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| Visibilidad de controles | `@media (pointer: coarse)` (solo touch)  | Siempre visibles / toggle manual          | Cero ruido en desktop; automático sin intervención del usuario                 |
| Ubicación de controles   | Debajo del canvas en flujo DOM normal    | Overlay (`position: absolute`)            | El overlay era el problema raíz; el flujo normal es más predecible y accesible |
| Botones PAUSA/FIN/SALIR  | Se quedan en el HUD superior sin cambios | Moverlos abajo con los controles táctiles | El usuario confirmó que prefiere el HUD arriba                                 |
| Botón HIPER en Asteroids | Añadido (`KeyS`)                         | Omitirlo para simplificar                 | El usuario confirmó que se incluyen todos los controles                        |
| Clase CSS de HIPER       | `touch-btn-fire` (igual que FIRE)        | Nueva clase propia                        | Reutiliza estilos existentes; visualmente agrupa los botones de acción         |

---

## Riesgos identificados

- **`caida-wrap` es flex row:** al añadir `.touch-controls` como hijo directo,
  sin `flex-basis: 100%` aparecería como columna junto al tablero y la
  previsualización. El paso 1 incluye la regla `.caida-wrap > .touch-controls`
  para forzar fila nueva.
- **`.asteroids-wrap` es `inline-block`:** sin `position: relative` activo,
  el flujo normal debería funcionar. Verificar que el canvas no quede con
  margen inferior inesperado en iOS Safari (el navegador móvil más restrictivo).
