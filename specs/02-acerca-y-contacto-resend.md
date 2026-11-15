# SPEC 02 — Página Acerca de y formulario de contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-11-15
> **Objective:** Portar la pantalla About de `references/templates/home-about/` a la ruta `/acerca` y hacer que su formulario de contacto envíe un correo real mediante Resend.

---

## Por qué existe esta spec

La Home ya está portada desde `references/templates/home-about/`, pero la navbar aún no tiene "Acerca de" y no existe la pantalla. Además, el formulario de la plantilla solo simula el envío. Esta spec añade la pantalla con fidelidad visual a la plantilla y conecta el formulario a un envío real, que es la primera pieza de servidor del proyecto.

---

## Scope

**In:**

- Ruta `/acerca` con las secciones de `about.jsx`: hero (kicker, título, misión, 3 highlights con iconos pixel), divisor de píxeles animado y sección de contacto (intro, tips con LEDs, formulario).
- Animación `.reveal` al entrar en el viewport, reutilizando `app/components/home-reveal.tsx`.
- Enlace "Acerca de" en la navbar de escritorio y en el panel móvil, con estado activo en `/acerca`, en la misma posición que en `nav.jsx`.
- Marca **ARCADE ROOM** en todos los textos de la pantalla (ver Decisions).
- Server Action que valida los datos y envía un correo con Resend a `andresfallasv@gmail.com`.
- Campo honeypot anti-spam.
- Estados de UI: inactivo, enviando, error y éxito (terminal de la plantilla).
- Botón "ENVIAR OTRO MENSAJE" que vuelve al formulario vacío.
- Estilos de la sección `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` portados a `app/globals.css`.
- Dependencia `resend` y variable `RESEND_API_KEY` en `.env.local`.

**Out of scope (para futuras specs):**

- Correo de acuse de recibo al remitente (requiere dominio verificado).
- Dominio propio verificado en Resend y remitente personalizado.
- Plantillas con React Email.
- Rate limiting por IP o CAPTCHA.
- Guardar los mensajes en base de datos o panel de administración.
- Asociar el mensaje al usuario con sesión (`av_user`).
- Tests automatizados.

---

## Data model

No hay persistencia nueva. Solo aparecen el estado de la Server Action y las constantes de envío.

```ts
// app/acerca/actions.ts
export type ContactFields = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }            // name ya recortado
  | { status: "error"; message: string; fields: ContactFields };

export async function sendContactMessage(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState>;
```

Campos del `FormData`: `name`, `email`, `msg` y `website` (honeypot).

Constantes en `app/acerca/actions.ts`:

```ts
const CONTACT_TO = "andresfallasv@gmail.com";
const CONTACT_FROM = "Arcade Room <onboarding@resend.dev>";
```

Variable de entorno (en `.env.local`, no versionado; `.gitignore` ya excluye `.env*`):

```
RESEND_API_KEY=re_xxxxxxxx
```

Reglas de validación en servidor:

- `name`, `email`, `msg` no vacíos tras `trim()`.
- `email` con formato `algo@dominio.tld` (regex simple).
- `name` ≤ 80 caracteres; `msg` ≤ 2000 caracteres.
- `website` con contenido → devolver `{ status: "success", name }` sin llamar a Resend.

Correo enviado:

- Asunto: `[Arcade Room] Mensaje de {name}`.
- `replyTo`: el `email` del usuario.
- Cuerpo en texto plano y HTML simple con nombre, email y mensaje. El HTML escapa `& < > " '`.

Mensajes de error (texto de la línea de error):

- Validación: `[ERROR] REVISA LOS CAMPOS: CORREO NO VÁLIDO.` (o el campo que falle).
- Fallo de Resend o falta de `RESEND_API_KEY`: `[ERROR] NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO.` El detalle va a `console.error` en el servidor, nunca al cliente.

---

## Estructura de archivos

```
app/
  acerca/
    page.tsx                  # Server Component: hero, divisor, intro de contacto, metadata
    actions.ts                # "use server" — sendContactMessage
  components/
    contact-form.tsx          # "use client" — formulario, useActionState, shake, terminal
    highlight-icon.tsx        # iconos pixel HEART / BROWSER / PLANT
    nav.tsx                   # (modificado) sección "acerca"
  globals.css                 # (modificado) estilos ABOUT PAGE
package.json                  # (modificado) dependencia resend
CLAUDE.md                     # (modificado) documentar RESEND_API_KEY
```

---

## Implementation plan

Usar la skill `/frontend-design` en cada paso que construya UI (requisito de `CLAUDE.md`). Antes de escribir código, consultar `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` y la referencia de Server Actions / `useActionState` (requisito de `AGENTS.md`).

1. **Estilos.** Portar a `app/globals.css` el bloque `/* ===== ABOUT PAGE ===== */` de la plantilla, más `.btn.press:active`, `.terminal-success` y `.term-*`. Añadir los keyframes `pxblink` y `shake` solo si no existen. Añadir una clase `.contact-error` (mono, rojo/magenta, estilo línea de terminal). Respetar el bloque `prefers-reduced-motion` existente. Verificar: `npm run build` compila.
2. **Página estática.** Crear `app/acerca/page.tsx` y `app/components/highlight-icon.tsx`. Textos de la plantilla con ARCADE ROOM. Montar `<HomeReveal />`. `metadata.title = "Acerca de · Arcade Room"`. El formulario queda como marcador sin lógica. Verificar: `/acerca` se ve igual que la plantilla salvo el formulario.
3. **Navbar.** Añadir la sección `"acerca"` a `sectionFor` y el enlace "Acerca de" tras "Salón de la Fama" en escritorio y en el panel móvil. Verificar: el enlace queda activo en `/acerca`.
4. **Formulario cliente.** Crear `app/components/contact-form.tsx` con el marcado de la plantilla (campos, placeholders, botón `▶  ENVIAR MENSAJE`, terminal de éxito). Validación de vacíos en cliente con shake de 400 ms, como la plantilla. Campo honeypot `website` oculto fuera de pantalla, `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`. Sin envío real todavía. Verificar: enviar vacío hace shake.
5. **Resend.** `npm install resend`. Crear `.env.local` con `RESEND_API_KEY`. Documentar la variable en `CLAUDE.md`.
6. **Server Action.** Crear `app/acerca/actions.ts` con `sendContactMessage`: honeypot, validación, envío con `new Resend(process.env.RESEND_API_KEY).emails.send(...)`, manejo del `{ error }` devuelto y de excepciones. Sin `RESEND_API_KEY` devuelve el error genérico sin lanzar.
7. **Conexión.** En `contact-form.tsx`, usar `useActionState(sendContactMessage, { status: "idle" })`. Enviando: botón deshabilitado con `▶  TRANSMITIENDO…`. Error: shake + línea `.contact-error` bajo el botón, conservando lo escrito. Éxito: terminal con `GRACIAS, {NAME}.`. "ENVIAR OTRO MENSAJE" vuelve al formulario vacío (p. ej. remontando el form con una `key`).

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `/acerca` no muestra errores ni advertencias de hidratación en la consola.
- [ ] El título dice "ACERCA DE ARCADE ROOM" y la misión empieza por "ARCADE ROOM nació del amor…".
- [ ] Se ven los 3 highlights (corazón magenta, navegador cian, planta verde) en 3 columnas; a ≤ 820 px pasan a 1 columna.
- [ ] El divisor muestra 24 píxeles parpadeando.
- [ ] La sección de contacto aparece con animación al hacer scroll.
- [ ] A ≤ 900 px la intro y el formulario se apilan en 1 columna.
- [ ] La navbar muestra "Acerca de" en escritorio y en el panel móvil, activo solo en `/acerca`.
- [ ] La pestaña del navegador muestra "Acerca de · Arcade Room".
- [ ] Enviar con algún campo vacío hace shake y no lanza ninguna petición al servidor.
- [ ] Durante el envío el botón está deshabilitado y dice "▶  TRANSMITIENDO…".
- [ ] Un envío válido entrega un correo en `andresfallasv@gmail.com` con asunto `[Arcade Room] Mensaje de {nombre}`.
- [ ] Responder a ese correo dirige la respuesta al email escrito en el formulario.
- [ ] Un mensaje con `<b>hola</b>` aparece como texto literal en el correo HTML, no en negrita.
- [ ] Tras el éxito se ve la terminal "ROOM-OS // TERMINAL" con `room@arcade:~$` y "GRACIAS, {NOMBRE EN MAYÚSCULAS}."
- [ ] "ENVIAR OTRO MENSAJE" muestra el formulario con los tres campos vacíos.
- [ ] Sin `RESEND_API_KEY`, un envío válido muestra shake y "[ERROR] NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO." y conserva lo escrito.
- [ ] Rellenar `website` (vía DevTools) muestra la terminal de éxito y no llega ningún correo.
- [ ] Un mensaje de más de 2000 caracteres devuelve error de validación sin enviar correo.
- [ ] `RESEND_API_KEY` no aparece en ningún archivo versionado ni en el bundle del cliente.
- [ ] La pantalla coincide visualmente con la vista About de `references/templates/home-about/arcade-vault-standalone.html` en escritorio y móvil (salvo la marca).

---

## Decisions

- **Sí:** ruta `/acerca`. Consistente con `/biblioteca` y `/salon`.
- **No:** `/about` ni `/acerca-de`.
- **Sí:** ARCADE ROOM en todo: título, misión, `ROOM-OS // TERMINAL`, `room@arcade:~$` y placeholder `jugador@room.gg`. Coherente con la decisión de marca de SPEC 01.
- **Sí:** destinatario `andresfallasv@gmail.com` fijo en código. Decisión del usuario.
- **No:** destinatario en variable de entorno.
- **Sí:** remitente `onboarding@resend.dev`. No hay dominio verificado. Solo entrega al correo dueño de la cuenta Resend, que debe ser `andresfallasv@gmail.com`.
- **Sí:** Server Action con `useActionState`. Idiomático en Next 16 y sin endpoint público adicional.
- **No:** Route Handler `/api/contacto`. No hay otros consumidores.
- **Sí:** validación en servidor más honeypot, sin dependencias nuevas (sin zod).
- **No:** rate limit en memoria. Poco fiable en serverless; va en otra spec si hace falta.
- **Sí:** el honeypot finge éxito. El bot no recibe señal de que fue filtrado.
- **Sí:** error como línea estilo terminal bajo el botón, más shake, conservando lo escrito.
- **No:** terminal de error con REINTENTAR. Más marcado sin beneficio claro.
- **Sí:** correo en texto plano + HTML escapado, con `replyTo` del usuario.
- **No:** React Email ni acuse al remitente.
- **Sí:** reutilizar `HomeReveal` tal cual. Ya activa cualquier `.reveal` de la página.
- **Sí:** el detalle de errores de Resend solo en `console.error` del servidor.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| `onboarding@resend.dev` rechaza destinatarios distintos al dueño de la cuenta | Confirmar que la cuenta Resend está registrada con `andresfallasv@gmail.com` antes del paso 6. |
| Falta `RESEND_API_KEY` en local o en despliegue | La acción devuelve el error genérico sin lanzar; `CLAUDE.md` documenta la variable. |
| Inyección HTML en el correo | Escapar `& < > " '` en el cuerpo HTML. |
| `cacheComponents` / `partialPrefetching` con un Client Component que usa `useActionState` | La página no lee datos dinámicos; consultar la doc local si aparece `instant-shell-url-data`. |
| `type="email"` dispara la validación nativa del navegador antes del shake | Aceptable: mismo comportamiento que la plantilla. El servidor revalida igualmente. |
| Abuso del formulario para spam | Honeypot y límites de longitud. Rate limit fuera de alcance. |

---

## What is **not** in this spec

- Acuse de recibo al remitente.
- Dominio propio en Resend.
- React Email.
- Rate limiting o CAPTCHA.
- Persistencia de mensajes o panel de administración.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
