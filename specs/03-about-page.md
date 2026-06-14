# 03-about-page

**Estado:** Implementado
**Dependencias:** 02-home-page (requiere Nav.tsx y globals.css existentes)
**Fecha:** 2026-06-13
**Objetivo:** Implementar la página /about con secciones "Acerca de" y formulario de contacto que envía correos vía Resend.

---

## Scope

### Dentro del scope
- Instalar `resend` como dependencia
- Crear `app/api/contact/route.ts` — endpoint POST que recibe `{ name, email, msg }`,
  valida que los tres campos estén presentes, y envía el correo a `max.collazosm@gmail.com`
  usando el dominio sandbox `onboarding@resend.dev`
- Crear `app/about/page.tsx` — página `'use client'` que replica exactamente `about.jsx` del template:
  - Hero: kicker, título, misión, 3 highlight-cards (HEART / BROWSER / PLANT)
  - Divider de píxeles animados
  - Sección de contacto: intro con tips + formulario (nombre, email, mensaje)
  - Estado de éxito: terminal animada estilo VAULT-OS
  - Estado de error: mensaje inline si el servidor falla
  - Estado de carga: botón deshabilitado mientras el request está en vuelo
- Crear `components/HighlightIcon.tsx` — SVG pixel-art para `kind`: HEART | BROWSER | PLANT
- Actualizar `components/Nav.tsx`:
  - Agregar link "Sobre nosotros" → `/about` en desktop y panel móvil
  - Agregar caso `'about'` en `isActive`
- Variable de entorno `RESEND_API_KEY` — el usuario la agrega manualmente a `.env.local`

### Fuera del scope
- Dominio verificado en Resend (se usa sandbox; correos fuera de `@resend.dev` solo llegan en dev)
- Correo de confirmación al visitante
- Tests automatizados
- Cualquier otra sección o página nueva

---

## Modelo de datos

No se introducen estructuras persistentes nuevas.

### Payload del formulario (solo en memoria, client → server)
```ts
interface ContactPayload {
  name: string
  email: string
  msg: string
}
```

### Respuesta del API route
- `200 { ok: true }` — correo enviado
- `400 { error: string }` — campos faltantes
- `500 { error: string }` — fallo de Resend

### Estado local del componente About
```ts
type FormState = 'idle' | 'loading' | 'success' | 'error'

form: { name: string; email: string; msg: string }
status: FormState
senderName: string   // guardado al enviar, usado en el mensaje de éxito
shake: boolean       // dispara animación CSS de validación client-side
```

---

## Plan de implementación

1. **Instalar Resend** — `npm install resend`. El package.json queda actualizado.

2. **Crear `app/api/contact/route.ts`** — Handler `POST` que:
   - Lee `{ name, email, msg }` del body JSON
   - Devuelve `400` si algún campo está vacío
   - Instancia `new Resend(process.env.RESEND_API_KEY)` y llama `resend.emails.send()`
     con `from: 'onboarding@resend.dev'`, `to: 'max.collazosm@gmail.com'`,
     `subject: 'Nuevo mensaje de contacto — Arcade Vault'`,
     y un body de texto plano con nombre, email y mensaje
   - Devuelve `200 { ok: true }` en éxito o `500 { error }` si Resend lanza

3. **Crear `components/HighlightIcon.tsx`** — Componente que recibe `kind: 'HEART' | 'BROWSER' | 'PLANT'`
   y devuelve el SVG pixel-art correspondiente del template (mismos `<rect>` exactos).
   Clase `hl-icon`, `fill="currentColor"`.

4. **Crear `app/about/page.tsx`** — Componente `'use client'` que:
   - Monta el `IntersectionObserver` de `.reveal` en un `useEffect` (idéntico al hook del Home)
   - Gestiona `form`, `status`, `senderName`, `shake` con `useState`
   - `handleSubmit`: valida client-side (shake si falta campo), pone `status = 'loading'`,
     hace `fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) })`,
     en éxito guarda `senderName` y pone `status = 'success'`;
     en error pone `status = 'error'`
   - Renderiza exactamente las secciones del template: hero → divider → contacto
   - El estado `'success'` muestra la terminal VAULT-OS con el nombre del remitente
   - El estado `'error'` muestra un texto de error inline debajo del formulario
   - El botón de envío muestra "ENVIANDO…" y queda deshabilitado mientras `status === 'loading'`

5. **Actualizar `components/Nav.tsx`** — Agregar en `isActive`:
   ```ts
   if (section === 'about') return pathname === '/about'
   ```
   Agregar `<Link href="/about">` con texto "Sobre nosotros" en el bloque `links` de desktop
   y su equivalente `<a onClick>` en el panel móvil, antes del link de auth.

6. **Verificar CSS** — Confirmar que las clases del About (`.about`, `.about-hero`,
   `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.hl-icon`,
   `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-form`, `.terminal-success`,
   `.term-bar`, `.term-body`, `.contact-tips`) ya existen en `app/globals.css`.
   Si falta alguna, agregarla desde `references/templates/home-about/styles.css`.

---

## Criterios de aceptación

- [ ] `/about` existe y muestra la página completa sin errores de consola
- [ ] El Nav de escritorio tiene el link "Sobre nosotros" que marca `active` cuando la ruta es `/about`
- [ ] El panel móvil también incluye "Sobre nosotros" con el mismo comportamiento
- [ ] La sección hero muestra kicker, título, texto de misión y las 3 highlight-cards
      (HEART/magenta, BROWSER/cyan, PLANT/green) con sus iconos pixel SVG
- [ ] El divider de píxeles aparece con animación `pxblink` entre las dos secciones
- [ ] El formulario valida client-side: si falta cualquier campo dispara la animación `shake`
      y no hace fetch
- [ ] Mientras el envío está en vuelo, el botón muestra "ENVIANDO…" y está deshabilitado
- [ ] Al enviar con éxito, el formulario es reemplazado por la terminal VAULT-OS con el nombre
      del remitente en mayúsculas
- [ ] "ENVIAR OTRO MENSAJE" resetea el formulario y vuelve al estado `idle`
- [ ] Si Resend devuelve error, se muestra un texto de error inline (el formulario permanece visible)
- [ ] `POST /api/contact` devuelve `400` cuando algún campo está vacío
- [ ] `POST /api/contact` devuelve `500` si `RESEND_API_KEY` no está definida o Resend falla
- [ ] No hay errores de TypeScript (`tsc --noEmit` pasa limpio)
- [ ] No hay regresiones en `/`, `/games`, `/games/[id]`, `/games/[id]/play`, `/auth`, `/hall-of-fame`

---

## Decisiones tomadas y descartadas

| Decisión | Elegido | Descartado | Motivo |
|---|---|---|---|
| Ruta del About | `/about` | `/acerca-de` | Convención estándar; más corta y consistente con rutas en inglés del proyecto |
| Label en el Nav | "Sobre nosotros" | "Acerca de" (template) | Decisión explícita del usuario |
| Servicio de email | Resend | Nodemailer / SendGrid / EmailJS | Resend es el más sencillo de configurar con Next.js App Router; SDK oficial TypeScript |
| Dominio remitente | `onboarding@resend.dev` (sandbox) | Dominio propio verificado | No hay dominio verificado disponible; suficiente para desarrollo |
| Confirmación al visitante | Ninguna | Email de ACK al remitente | Fuera de scope por decisión del usuario; reduce complejidad |
| Estado de error | Mensaje inline, formulario visible | Modal / toast | Menos invasivo; el usuario puede corregir y reintentar sin perder lo escrito |
| Estado de carga | Botón deshabilitado + texto "ENVIANDO…" | Spinner overlay | Consistente con la estética del template; sin dependencias extra |
| HighlightIcon | Componente separado `components/HighlightIcon.tsx` | Inline en page.tsx | Mismo patrón que `FeatureIcon` del spec 02; legibilidad |
