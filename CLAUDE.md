# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Proyecto

Arcade Vault: plataforma para jugar online y competir por la mayor cantidad de puntos. La app ya tiene las pantallas del MVP, pero sesión y puntuaciones se simulan en `localStorage` y el catálogo vive en `app/data.ts`. Supabase está conectado solo como base (clientes y verificación, sin tablas ni Auth); las features que lo usen llegarán en specs propias.

El desarrollo sigue **Spec Driven Design** con los comandos `/spec` y `/spec-impl` de las skills de https://github.com/Klerith/fernando-skills (instalar con `npx skills@latest add Klerith/fernando-skills`). Las features nuevas parten de una spec antes de implementarse.

No hay framework de tests configurado todavía.

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Stack y particularidades

- **Next.js 16.4 + React 19.3**, App Router (`app/`). Las APIs difieren de versiones anteriores: consultar `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, …) antes de escribir código (ver AGENTS.md).
- `next.config.ts` activa `cacheComponents: true` (Cache Components / PPR: datos dinámicos requieren `<Suspense>` o `"use cache"`), `partialPrefetching: true` y `experimental.agentFeedback`.
- Tipos globales generados por Next: los layouts/pages usan `LayoutProps<"/">` / `PageProps<...>` sin importarlos.
- **Tailwind CSS v4** cargado vía loader de Turbopack (`@tailwindcss/turbopack`, regla `*.css` en `next.config.ts`), no PostCSS. No hay `tailwind.config`: tema definido con `@theme inline` en `app/globals.css` (tokens `--background`/`--foreground`, fuentes Geist).
- Alias de import `@/*` apunta a la raíz del repo.
- **Prettier** (devDependency, `.prettierrc.json` con defaults, `pnpm format`) + ESLint. Hook `PostToolUse` de Claude Code (`.claude/settings.json` → `.claude/hooks/format-lint.mjs`) pasa cada archivo creado/editado por Prettier y, si es JS/TS, por `eslint --fix` con `no-multiple-empty-lines` en `max: 0` (elimina todas las líneas en blanco del código) y `--max-warnings 0`; si quedan errores o advertencias devuelve exit 2 para que Claude los corrija.
- ESLint ignora `references/**` (plantillas y juegos de referencia, no es código de la app).
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`), sin tablas ni Auth todavía. Clientes:
  - `@/lib/supabase/server`: `await createClient()` para Server Components, Server Actions y Route Handlers. Usa `cookies()` de `next/headers`; en una página va dentro de `<Suspense>` (Cache Components). Se crea en cada llamada.
  - `@/lib/supabase/client`: `createClient()` para Client Components.
  - `pnpm supabase:check` (`scripts/supabase-check.mjs`, carga `.env.local` con `node --env-file`): verifica URL y clave; imprime `[SUPABASE] OK <url>` y sale 0, o `[SUPABASE] FALTA <VAR>` / `[SUPABASE] ERROR <code>: <message>` y sale 1. Si el proyecto (plan gratuito) está pausado, falla con error de red: reactivarlo desde el Dashboard.

## Variables de entorno

Van en `.env.local` (no versionado: `.gitignore` excluye `.env*`).

- `RESEND_API_KEY`: clave de API de [Resend](https://resend.com/api-keys), solo de servidor (sin prefijo `NEXT_PUBLIC_`). La usa la Server Action del formulario de contacto de `/acerca` (`app/acerca/actions.ts`). Si falta, el formulario muestra un error genérico y no envía. El remitente es `onboarding@resend.dev`, que solo entrega al correo dueño de la cuenta Resend.
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase (Dashboard → Project Settings → API Keys, o `get_project_url` del MCP). Pública por diseño.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key (`sb_publishable_…`, no la anon key legacy JWT), del mismo sitio del Dashboard o `get_publishable_keys` del MCP. Pública por diseño: la protección de datos depende de RLS. Nunca poner la clave secreta con prefijo `NEXT_PUBLIC_`.
