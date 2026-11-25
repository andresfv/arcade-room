# SPEC 03 — Integración base con Supabase

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-11-18
> **Objective:** Conectar la app de Next.js con el proyecto de Supabase mediante clientes de servidor y navegador reutilizables, sin tablas ni autenticación, para que las specs futuras construyan sobre ellos.

---

## Por qué existe esta spec

Hoy la sesión y las puntuaciones se simulan en `localStorage` (`av_user`, `av_scores`) y el catálogo vive en `app/data.ts`. El proyecto de Supabase ya existe (`.mcp.json`, `project_ref=xovaiiurwhzbwfltqalp`) pero el esquema `public` está vacío y la app no tiene ninguna conexión. Esta spec deja solo la fontanería: dependencias, variables de entorno, clientes y un script de comprobación. Auth, puntuaciones y catálogo irán en specs propias que reutilizarán estos clientes.

---

## Scope

**In:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
- Cliente de servidor `lib/supabase/server.ts` (Server Components, Server Actions, Route Handlers) basado en cookies de `next/headers`.
- Cliente de navegador `lib/supabase/client.ts` (Client Components).
- Script `scripts/supabase-check.mjs` y comando `pnpm supabase:check` que verifica conexión y clave, y sale con código 0 o 1.
- Documentación de las variables y del script en `CLAUDE.md`.

**Out of scope (para futuras specs):**

- Supabase Auth (login, registro, OAuth, invitado anónimo, confirmación de email).
- `proxy.ts` de refresco de sesión. Llega con la spec de Auth.
- Tablas, RLS, funciones RPC y cualquier migración.
- Carpeta `supabase/migrations/` y su convención de nombres. La crea la primera spec con tablas.
- Tipos TypeScript generados (`Database`). Los clientes quedan sin tipar hasta que haya tablas.
- Clave secreta (`SUPABASE_SECRET_KEY`) y cliente admin.
- Sustituir `localStorage` o `app/data.ts` por datos de Supabase.
- Página o endpoint de salud dentro de la app.
- Supabase CLI y entorno local con Docker.
- Tests automatizados.

---

## Data model

Esta feature no introduce estructuras de datos ni tablas. Solo añade variables de entorno y funciones fábrica.

Variables en `.env.local` (no versionado; `.gitignore` ya excluye `.env*`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xovaiiurwhzbwfltqalp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

Ambas son públicas por diseño (prefijo `NEXT_PUBLIC_`). La protección de datos dependerá de RLS en specs futuras.

Firmas de los clientes:

```ts
// lib/supabase/server.ts — solo servidor
export async function createClient(): Promise<SupabaseClient>;
// createServerClient de @supabase/ssr con cookies() de next/headers.
// cookies.getAll lee el store; cookies.setAll escribe dentro de try/catch
// (en Server Components set lanza y se ignora: lo resolverá el proxy de la spec de Auth).

// lib/supabase/client.ts — "use client" no requerido; se importa desde Client Components
export function createClient(): SupabaseClient;
// createBrowserClient de @supabase/ssr.
```

Ambas leen las dos variables con `process.env.NEXT_PUBLIC_SUPABASE_URL!` y `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`. El cliente de servidor se crea en cada llamada, nunca como singleton de módulo.

Comportamiento de `scripts/supabase-check.mjs`:

- Lee las variables con `node --env-file=.env.local`.
- Si falta alguna variable: imprime `[SUPABASE] FALTA <NOMBRE_VARIABLE>` y sale con código 1.
- Crea un cliente con `createClient` de `@supabase/supabase-js` y ejecuta `from("__healthcheck__").select("*").limit(1)`.
- Error con `code === "PGRST205"` (tabla no encontrada): la API respondió y aceptó la clave. Imprime `[SUPABASE] OK <URL>` y sale con código 0.
- Sin error (la tabla existiera): mismo resultado OK.
- Cualquier otro error (401, clave inválida, red, DNS): imprime `[SUPABASE] ERROR <code>: <message>` y sale con código 1.

Script en `package.json`:

```json
"supabase:check": "node --env-file=.env.local scripts/supabase-check.mjs"
```

---

## Estructura de archivos

```
lib/
  supabase/
    server.ts            # createClient() de servidor con cookies
    client.ts            # createClient() de navegador
scripts/
  supabase-check.mjs     # verificación de conexión, sale 0/1
package.json             # (modificado) dependencias y script supabase:check
pnpm-lock.yaml           # (modificado)
CLAUDE.md                # (modificado) variables y script
.env.local               # (local, no versionado)
```

---

## Implementation plan

Antes de escribir código, consultar en `node_modules/next/dist/docs/` la referencia de `cookies()` y la sección de Cache Components sobre APIs dinámicas (requisito de `AGENTS.md`).

1. **Dependencias.** `pnpm add @supabase/supabase-js @supabase/ssr`. Verificar: `pnpm build` compila.
2. **Variables.** Obtener URL y publishable key con el MCP de Supabase (`get_project_url`, `get_publishable_keys`). Escribirlas en `.env.local` junto a `RESEND_API_KEY`, sin tocar esa línea.
3. **Script de comprobación.** Crear `scripts/supabase-check.mjs` y añadir `supabase:check` a `package.json`. Verificar: `pnpm supabase:check` imprime `[SUPABASE] OK …` y sale con 0.
4. **Cliente de servidor.** Crear `lib/supabase/server.ts` según la firma del Data model. Verificar: `pnpm build` y `pnpm lint` pasan.
5. **Cliente de navegador.** Crear `lib/supabase/client.ts`. Verificar: `pnpm build` y `pnpm lint` pasan.
6. **Documentación.** En `CLAUDE.md`, sección "Variables de entorno": añadir las dos variables con su origen (Dashboard → Project Settings → API Keys). Añadir el comando `pnpm supabase:check` y las rutas `@/lib/supabase/server` y `@/lib/supabase/client`. Actualizar la frase "el producto aún no está implementado" solo si sigue siendo falsa respecto a Supabase.

---

## Acceptance criteria

- [ ] `package.json` lista `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [ ] `pnpm build` termina sin errores.
- [ ] `pnpm lint` termina sin errores ni advertencias.
- [ ] Con `.env.local` correcto, `pnpm supabase:check` imprime `[SUPABASE] OK https://xovaiiurwhzbwfltqalp.supabase.co` y sale con código 0.
- [ ] Con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` alterada, `pnpm supabase:check` imprime `[SUPABASE] ERROR …` y sale con código 1.
- [ ] Sin `NEXT_PUBLIC_SUPABASE_URL`, `pnpm supabase:check` imprime `[SUPABASE] FALTA NEXT_PUBLIC_SUPABASE_URL` y sale con código 1.
- [ ] `lib/supabase/server.ts` importa `cookies` de `next/headers` y exporta `createClient` asíncrona.
- [ ] `lib/supabase/client.ts` exporta `createClient` y no importa nada de `next/headers`.
- [ ] Ningún archivo versionado contiene la publishable key ni la URL completa del proyecto fuera de esta spec.
- [ ] El esquema `public` de Supabase sigue sin tablas (`list_tables` devuelve `[]`).
- [ ] Ninguna pantalla existente cambia de comportamiento: `localStorage` sigue siendo la fuente de sesión y puntuaciones.
- [ ] `CLAUDE.md` documenta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `pnpm supabase:check`.

---

## Decisions

- **Sí:** solo integración base. Decisión del usuario: Auth, puntuaciones y catálogo van en specs futuras.
- **No:** Auth en esta spec, en ninguna modalidad.
- **Sí:** `@supabase/ssr`. Es el paquete oficial para Next.js App Router y maneja cookies para la futura spec de Auth.
- **No:** solo `@supabase/supabase-js` en servidor. Obligaría a rehacer los clientes al llegar Auth.
- **Sí:** publishable key (`sb_publishable_…`) con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Formato actual de Supabase y rotable.
- **No:** anon key legacy (JWT). Supabase la está retirando.
- **No:** clave secreta ni cliente admin. Nada los necesita todavía.
- **Sí:** clientes en `lib/supabase/` en la raíz. Convención de la doc de Supabase; import `@/lib/supabase/...`.
- **No:** `app/lib/supabase/`.
- **No:** `proxy.ts` de refresco de sesión. Sin login no hay cookies que refrescar; llega con Auth.
- **Sí:** verificación con un script Node fuera de la app. No añade rutas ni superficie pública.
- **No:** página `/dev/supabase` ni Route Handler `/api/health`.
- **Sí:** comprobar con una consulta a una tabla inexistente y aceptar `PGRST205`. Ejercita la API REST y la clave sin crear nada en la base.
- **No:** health de Auth (`/auth/v1/health`). No usa el cliente que usará la app.
- **Sí:** script standalone `.mjs` con `node --env-file`. No requiere `tsx` ni dotenv; Node 26 soporta `--env-file`.
- **No:** tipos `Database` generados. Sin tablas no aportan; se generan en la primera spec con esquema.
- **Sí (diferido):** las migraciones serán archivos SQL versionados en el repo. La carpeta y su convención las crea la primera spec con tablas.
- **Sí:** `pnpm` como gestor. `CLAUDE.md` documenta `pnpm format`.

---

## Risks

| Risk                                                                                                        | Mitigation                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| El repo tiene `package-lock.json` y `pnpm-lock.yaml` a la vez; `pnpm add` deja desincronizado el de npm     | Usar solo `pnpm`. Unificar el gestor queda fuera de esta spec.                                                                         |
| `cookies()` es API dinámica y, con `cacheComponents: true`, usarla fuera de `<Suspense>` rompe el prerender | Esta spec no usa el cliente de servidor en ninguna página. Las specs futuras lo envuelven en `<Suspense>` o lo usan en Server Actions. |
| `setAll` lanza al llamarse desde un Server Component                                                        | `try/catch` en `setAll`, según la guía de `@supabase/ssr`. El proxy de la spec de Auth refrescará la sesión.                           |
| El proyecto de Supabase en plan gratuito se pausa tras inactividad                                          | `pnpm supabase:check` falla con error de red; reactivarlo desde el Dashboard.                                                          |
| Supabase cambia el código `PGRST205` en una versión futura de PostgREST                                     | El script imprime el `code` recibido; ajustar la condición si cambia.                                                                  |
| Las variables `NEXT_PUBLIC_` se incrustan en el bundle del cliente                                          | Esperado: la publishable key es pública. Nunca poner la clave secreta con ese prefijo.                                                 |

---

## What is **not** in this spec

- Supabase Auth y `proxy.ts`.
- Tablas, RLS, RPC y migraciones.
- Tipos TypeScript generados.
- Clave secreta y cliente admin.
- Migrar `localStorage` o `app/data.ts` a Supabase.
- Página o endpoint de salud.
- Supabase CLI local.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
