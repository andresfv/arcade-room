# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Proyecto

Arcade Vault: plataforma para jugar online y competir por la mayor cantidad de puntos. Hoy es un scaffold de `create-next-app` (solo `app/layout.tsx` y `app/page.tsx` de ejemplo); el producto aún no está implementado.

El desarrollo sigue **Spec Driven Design** con los comandos `/spec` y `/spec-impl` de las skills de https://github.com/Klerith/fernando-skills (instalar con `npx skills@latest add Klerith/fernando-skills`). Las features nuevas parten de una spec antes de implementarse.

## Comandos

- `npm run dev` — servidor de desarrollo (Turbopack) en http://localhost:3000
- `npm run build` — build de producción
- `npm run start` — servir el build
- `npm run lint` — ESLint 9 (flat config, `eslint-config-next` core-web-vitals + typescript)

No hay framework de tests configurado todavía.

## Stack y particularidades

- **Next.js 16.4 + React 19.3**, App Router (`app/`). Las APIs difieren de versiones anteriores: consultar `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, …) antes de escribir código (ver AGENTS.md).
- `next.config.ts` activa `cacheComponents: true` (Cache Components / PPR: datos dinámicos requieren `<Suspense>` o `"use cache"`), `partialPrefetching: true` y `experimental.agentFeedback`.
- Tipos globales generados por Next: los layouts/pages usan `LayoutProps<"/">` / `PageProps<...>` sin importarlos.
- **Tailwind CSS v4** cargado vía loader de Turbopack (`@tailwindcss/turbopack`, regla `*.css` en `next.config.ts`), no PostCSS. No hay `tailwind.config`: tema definido con `@theme inline` en `app/globals.css` (tokens `--background`/`--foreground`, fuentes Geist).
- Alias de import `@/*` apunta a la raíz del repo.
