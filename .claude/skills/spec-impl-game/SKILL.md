---
name: spec-impl-game
description: Implementa un spec de integración de juego aprobado siguiendo el flujo completo de /spec-impl (validación, rama git, implementación paso a paso) y, al terminar, lanza secuencialmente skin-designer y luego mobile-porter para dejar el juego con skins y controles mobile listos sin pasos manuales.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*), Agent
---

# /spec-impl-game — Implementer de specs de juego + skins + mobile

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

---

## Fases 1-4 — Implementación del spec (flujo /spec-impl)

**Ejecuta el flujo completo de `/spec-impl` para `$ARGUMENTS`, exactamente como
está definido en `.claude/skills/spec-impl/SKILL.md`:**

- **Fase 1** — Identificar el spec en `specs/` (acepta número, slug o nombre
  completo).
- **Fase 2** — Validar que el estado signifique "Aprobado" (en cualquier idioma).
  Si no lo es, mostrar el mensaje de error estándar y detenerse.
- **Fase 3** — Crear (o reusar) la rama `spec-NN-slug`, confirmar que estás en
  ella, y mostrar el resumen del spec (objetivo, alcance, plan, criterios de
  aceptación).
- **Fase 4** — Implementar paso a paso con pausas: un paso → mostrar resumen de
  archivos tocados → pedir confirmación antes del siguiente.

**Reglas no negociables (recordatorio — la fuente de verdad es `spec-impl`):**

1. Solo avanzas si el estado del spec significa "Aprobado".
2. La rama lleva el formato `spec-NN-slug`.
3. Implementas lo que dice el spec; si algo te parece subóptimo, lo mencionas
   pero implementas lo acordado.
4. Pausas tras cada paso esperando confirmación del usuario.
5. Al completar el último paso, recuerdas al usuario que verifique los criterios
   de aceptación y que cambie el estado del spec a "Implementado" antes del
   commit final — **pero antes de ese recordatorio, continúas con la Fase 5.**

---

## Fase 5 — Post-implementación: skins + mobile (secuencial, automático)

Esta fase se dispara **automáticamente** justo después de completar el último
paso del plan de implementación (sin pausa adicional de confirmación).

### Paso 5.0 — Derivar el `game-id`

Extrae el `game-id` del spec recién implementado. Fuentes en orden de
preferencia:

1. La sentencia `INSERT INTO games (id, ...)` del spec → toma el valor del campo
   `id`.
2. El slug del archivo: `specs/NN-<id>-integration.md` → extrae `<id>` (todo lo
   que quede entre el número y `-integration`, o entre el número y `.md` si no
   hay sufijo `-integration`).

Muestra un mensaje breve de confirmación antes de invocar los agentes:

```
🎮 Implementación completada. Lanzando pipeline de skins + mobile para: `<game-id>`

  1/2 → skin-designer  (en curso…)
```

### Paso 5.1 — Lanzar `skin-designer` (ESPERAR a que termine)

Invoca el agente `skin-designer` con este prompt (adapta `<game-id>`):

> Diseña e implementa los 3 skins —neon, retro y classic— para el juego
> `<game-id>` que acaba de ser integrado a Arcade Vault. Sigue tu flujo
> habitual: verifica `references/game-with-themes.md`, diseña las paletas,
> escribe el spec y aplica todos los cambios de código necesarios
> (`lib/games/skins.ts`, motor, tipos, Canvas). Actualiza el ledger al final.

**Espera el resultado completo de `skin-designer` antes de continuar.**
No lances `mobile-porter` hasta tener la respuesta de este primer agente.

**Razón de la secuencialidad:** `skin-designer` modifica `Canvas.tsx` y
`skins.ts`; `mobile-porter` debe auditar esos archivos ya modificados para
evitar conflictos de edición concurrente y para que el audit de mobile incluya
el código de skins final.

### Paso 5.2 — Solo cuando `skin-designer` haya terminado: lanzar `mobile-porter`

Una vez recibido el resultado de `skin-designer`, muestra:

```
  2/2 → mobile-porter  (en curso…)
```

Invoca el agente `mobile-porter` con este prompt (adapta `<game-id>`):

> Audita y corrige el layout y los controles táctiles de Arcade Vault,
> prestando atención especial al juego `<game-id>` que acaba de ser integrado
> (y que `skin-designer` acaba de actualizar). Sigue tu flujo habitual:
> lee `specs/10-mobile-touch-controls.md`, verifica cada juego registrado y
> aplica las correcciones necesarias sin romper los demás.

**Espera el resultado completo de `mobile-porter` antes de mostrar el cierre.**

### Paso 5.3 — Cierre

Tras recibir el resultado de `mobile-porter`, muestra el resumen final:

```
✅ Pipeline completo para `<game-id>`.

  ✔ Implementación del spec (Fases 1-4)
  ✔ Skins aplicados por skin-designer  →  [resumen de 1 línea del resultado]
  ✔ Mobile auditado por mobile-porter  →  [resumen de 1 línea del resultado]

Próximos pasos:
  1. Verifica los criterios de aceptación del spec uno a uno.
  2. Cambia el estado del spec a "Implementado" (o el equivalente en tu repo).
  3. Haz el commit final y abre el PR para esta rama.
```

---

## Summary of expected behavior

```
/spec-impl-game 08-caida-tetris-integration

  Fase 1  →  Encuentra specs/08-caida-tetris-integration.md
  Fase 2  →  Lee el estado → "Aprobado" → ✅ continúa
  Fase 3  →  git checkout -b spec-08-caida-tetris-integration
              Muestra objetivo, alcance, plan y criterios
  Fase 4  →  Implementa paso a paso con pausas (igual que /spec-impl)
  Fase 5  →  Al terminar el último paso:
              5.0 Detecta game-id: "caida"
              5.1 Lanza skin-designer("caida") — ESPERA resultado
              5.2 Lanza mobile-porter("caida") — ESPERA resultado
              5.3 Muestra resumen final + recordatorio de criterios y commit

/spec-impl-game 08-caida-tetris-integration  (estado: Borrador)

  Fase 1  →  Encuentra specs/08-caida-tetris-integration.md
  Fase 2  →  Lee el estado → "Borrador" → ❌ se detiene
              Muestra el mensaje de error estándar de /spec-impl
              No crea rama, no toca código, no lanza agentes
```
