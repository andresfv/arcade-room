# SPEC 01 — MVP visual de Arcade Vault

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-11-14
> **Objective:** Portar a Next.js App Router las cinco pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Acceso y Salón de la Fama) con datos ficticios y sin ningún juego real.

---

## Por qué existe esta spec

Hoy el repo es un scaffold de `create-next-app`. Los estilos globales y las fuentes ya están portados (`app/globals.css`, `app/layout.tsx`). Falta el producto visible. Esta spec convierte la plantilla HTML+Babel (SPA con estado en el hash) en rutas reales de Next, para que las siguientes specs (juegos, backend, puntuaciones reales) tengan una base navegable.

---

## Scope

**In:**

- Las cinco pantallas de la plantilla, cada una en su propia ruta del App Router:
  - `/` — Biblioteca (hero, buscador, chips de categoría, grilla de tarjetas con efecto tilt, estado "NO HAY RESULTADOS").
  - `/juegos/[id]` — Detalle (portada, tags, descripción, stat-strip, acciones, leaderboard de 10 filas).
  - `/juegos/[id]/jugar` — Reproductor (HUD, arena CRT decorativa, pausa, fin, modal de fin de juego con guardar puntuación).
  - `/login` — Acceso (pestañas iniciar sesión / crear cuenta, invitado, botones sociales decorativos).
  - `/salon` — Salón de la Fama (pestañas por juego, podio, tabla de 12 filas, fila "TU MEJOR MARCA" si hay sesión).
- Navbar compartida (logo, enlaces con estado activo, contador de créditos, botón de sesión, menú hamburguesa móvil) y footer.
- Datos ficticios centralizados en `app/data.ts`, tipados, como sustituto de una futura base de datos.
- Sesión y puntuaciones simuladas en `localStorage` (`av_user`, `av_scores`), igual que la plantilla.
- Simulación de partida en el Reproductor idéntica a la plantilla (puntuación que sube sola, subida de nivel, pausa, FIN).
- Redirección a `/` cuando el `id` de juego no existe.
- Reemplazo del contenido de ejemplo de `app/page.tsx`.

**Out of scope (para futuras specs):**

- Cualquier juego jugable real (canvas, lógica, controles de teclado).
- Autenticación real, validación de formularios, OAuth de Google/GitHub.
- Backend o base de datos. `app/data.ts` es el único origen de datos.
- Leer `av_scores` para mostrar puntuaciones reales en Detalle o Salón de la Fama.
- Menú desplegable de usuario (el botón con el nombre cierra sesión directamente, como en la plantilla).
- Sistema de créditos funcional (el contador "CRÉDITOS · 03" es fijo).
- Framework de tests o tests e2e.

---

## Data model

Todo vive en `app/data.ts`. Se porta `references/templates/data.jsx` a TypeScript sin cambiar valores.

```ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | Category;

export interface Game {
  id: string;        // slug usado en la URL: "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;     // clase CSS existente en globals.css: "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;     // "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;      // "dd/mm/2026"
}

export const GAMES: Game[];             // 8 juegos de la plantilla
export const CATS: CategoryFilter[];    // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[];         // 18 nombres de la plantilla
export function seededScores(seed: number, count?: number): ScoreRow[];
export function getGame(id: string): Game | undefined;
```

Sesión y puntuaciones en `localStorage` (mismas claves que la plantilla):

```ts
// "av_user"   → SessionUser | ausente
interface SessionUser { name: string }   // mayúsculas, máx. 10 caracteres

// "av_scores" → SavedScore[]
interface SavedScore { game: string; score: number; name: string; at: number }
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Las semillas de `seededScores` son las de la plantilla: Detalle `id.length * 17 + 3` (10 filas); Salón `id.length * 23 + 7` (12 filas).
- La fila "TU MEJOR MARCA" del Salón usa la fórmula de la plantilla: rango `8 + (id.length % 4)`, puntuación `rows[5].score - 2400`, fecha fija `11/05/2026`.

---

## Estructura de archivos

```
app/
  data.ts                        # datos ficticios + seededScores + getGame
  layout.tsx                     # (modificado) SessionProvider + Nav + <main> + Footer
  page.tsx                       # (reemplazado) Biblioteca
  juegos/[id]/page.tsx           # Detalle
  juegos/[id]/jugar/page.tsx     # Reproductor
  login/page.tsx                 # Acceso
  salon/page.tsx                 # Salón de la Fama
  components/
    session-provider.tsx         # "use client" — contexto useSession (user, login, logout, saveScore)
    nav.tsx                      # "use client" — usePathname para el estado activo, menú móvil
    footer.tsx
    library-browser.tsx          # "use client" — buscador + chips + grilla
    game-card.tsx                # "use client" — efecto tilt
    game-player.tsx              # "use client" — simulación, HUD, modal
    auth-form.tsx                # "use client" — pestañas y envío
    hall-of-fame.tsx             # "use client" — pestañas por juego, podio, tabla
```

Las `page.tsx` son Server Components que leen `app/data.ts` y delegan la interactividad a los componentes cliente.

---

## Implementation plan

Usar la skill `/frontend-design` en cada paso que construya UI (requisito de `CLAUDE.md`). Antes de escribir código, consultar `node_modules/next/dist/docs/` para rutas dinámicas, `generateStaticParams`, `redirect` y Cache Components (requisito de `AGENTS.md`).

1. **Datos.** Crear `app/data.ts` con los tipos y valores del Data model. Verificar: `npm run build` compila.
2. **Sesión.** Crear `app/components/session-provider.tsx`. Lee `av_user` tras montar (sin desajuste de hidratación). Expone `login(user | null)`, `logout()` y `saveScore(entry)`. Envolver `children` en `app/layout.tsx`.
3. **Marco.** Crear `nav.tsx` y `footer.tsx`. Montarlos en `app/layout.tsx` alrededor de `<main className="av-main">`. "Biblioteca" queda activa en `/` y en `/juegos/*`. "Iniciar Sesión" enlaza a `/login`. Con sesión, el botón muestra `{name} ▾` y cierra sesión. Verificar: el menú hamburguesa abre y cierra el panel móvil.
4. **Biblioteca.** Reemplazar `app/page.tsx`. Crear `library-browser.tsx` y `game-card.tsx`. Tarjeta y botón JUGAR navegan a `/juegos/[id]`. Verificar: filtrar por texto y por categoría; buscar "zzz" muestra "NO HAY RESULTADOS".
5. **Detalle.** Crear `app/juegos/[id]/page.tsx` con `generateStaticParams` desde `GAMES`. Si `getGame(id)` es `undefined`, `redirect("/")`. "JUGAR AHORA" va a `/juegos/[id]/jugar`; "VOLVER A LA BIBLIOTECA" va a `/`. Verificar: `/juegos/no-existe` termina en `/`.
6. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx` y `game-player.tsx`. Misma redirección para `id` inválido. Simulación: +10–99 puntos cada 220 ms, sube nivel según la regla de la plantilla, PAUSA/REANUDAR, FIN abre el modal. GUARDAR PUNTUACIÓN llama a `saveScore` y muestra "▸ PUNTUACIÓN GUARDADA_". JUGAR DE NUEVO reinicia. SALIR va a `/juegos/[id]`. El intervalo se limpia al desmontar.
7. **Acceso.** Crear `app/login/page.tsx` y `auth-form.tsx`. Enviar el formulario guarda `{ name: (usuario || "PLAYER1").toUpperCase().slice(0, 10) }` y navega a `/`. JUGAR COMO INVITADO llama a `login(null)` y navega a `/`. Google y GitHub no hacen nada.
8. **Salón de la Fama.** Crear `app/salon/page.tsx` y `hall-of-fame.tsx`. Pestaña inicial: primer juego de `GAMES`. Fila "TU MEJOR MARCA" solo con sesión. "VOLVER A LA BIBLIOTECA" va a `/`.
9. **Metadatos.** Añadir `metadata` (o `generateMetadata` en las rutas dinámicas) con título por pantalla, p. ej. `"BRICK BUSTER · Arcade Room"`.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] Ninguna pantalla muestra errores ni advertencias de hidratación en la consola del navegador.
- [ ] `/` muestra los 8 juegos de la plantilla.
- [ ] Escribir "free" en el buscador deja solo FREEFALL.
- [ ] El chip SHOOTER deja solo INVADERS y ROCKS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta navega a `/juegos/<id>` de ese juego.
- [ ] `/juegos/caida` muestra portada, descripción larga, mejor global `184.220` y 10 filas de leaderboard.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` redirigen a `/`.
- [ ] En `/juegos/<id>/jugar` la puntuación sube sola y se detiene con PAUSA.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] GUARDAR PUNTUACIÓN añade una entrada `{ game, score, name, at }` a `localStorage["av_scores"]`.
- [ ] Iniciar sesión como "neonfox" guarda `{"name":"NEONFOX"}` en `av_user` y la navbar muestra "NEONFOX ▾".
- [ ] Recargar la página mantiene la sesión.
- [ ] Pulsar "NEONFOX ▾" cierra sesión y borra `av_user`.
- [ ] `/salon` muestra podio y 12 filas; cambiar de pestaña cambia el ranking.
- [ ] Con sesión, `/salon` muestra la fila "TU MEJOR MARCA"; sin sesión no aparece.
- [ ] El enlace activo de la navbar corresponde a la ruta actual (Biblioteca en `/` y `/juegos/*`; Salón en `/salon`).
- [ ] A ancho móvil (≤ 768 px) se ve el botón ≡ y abre el panel lateral.
- [ ] Cada pantalla coincide visualmente con su equivalente en `references/templates/Arcade Vault.html` en escritorio y móvil.
- [ ] `app/page.tsx` ya no contiene el contenido de ejemplo de `create-next-app`.

---

## Decisions

- **Sí:** rutas reales del App Router. URLs compartibles y base para futuras specs.
- **No:** SPA con estado en el hash como la plantilla. No es idiomático en Next y rompe el historial.
- **Sí:** reutilizar las clases ya portadas en `app/globals.css` (`.card`, `.av-grid`, `.podium`…). Máxima fidelidad con la plantilla.
- **No:** reescribir con Tailwind o CSS Modules. Más trabajo y riesgo de diferencias visuales. Tailwind queda solo para ajustes puntuales.
- **Sí:** la marca visible es **ARCADE ROOM** en todas las pantallas (navbar, footer, hero, cabecera de Acceso y títulos de página), en lugar del "ARCADE VAULT" de la plantilla. Decisión del usuario durante la implementación.
- **Sí:** títulos de los juegos en inglés (BRICK BUSTER, FREEFALL, SERPENTINE, GLUTTON, INVADERS, ROCKS, FROGWAY, PIXEL DUEL). Los `id` (slugs de URL) y las descripciones no cambian. Decisión del usuario durante la implementación.
- **Sí:** el botón de vuelta del Detalle y del modal del Reproductor dice "VOLVER A LA BIBLIOTECA" en lugar de "VOLVER AL VAULT".
- **Sí:** datos ficticios en `app/data.ts`. Decisión del usuario: será reemplazado por una base de datos.
- **Sí:** componentes compartidos en `app/components/`. Mantiene todo el código dentro de `app/`, junto a `app/data.ts`.
- **Sí:** `localStorage` con las claves `av_user` y `av_scores` de la plantilla. Simula sesión sin backend.
- **No:** estado solo en memoria. Se perdería la sesión al recargar.
- **Sí:** simulación de partida idéntica a la plantilla. Valida todo el flujo visual del Reproductor sin juego real.
- **Sí:** `redirect("/")` para `id` inválido. Decisión del usuario.
- **No:** `notFound()` con página 404 propia.
- **Sí:** Salón de la Fama igual que la plantilla (ranking con `seededScores` y fila de usuario inventada).
- **No:** leer `av_scores` en el Salón. Va en la spec de puntuaciones reales.
- **Sí:** verificación con build, lint y revisión manual.
- **No:** Playwright u otro framework de tests. Se añade en otra spec.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Desajuste de hidratación al leer `localStorage` en el render | Leer `av_user` solo tras montar (`useEffect` o `useSyncExternalStore` con snapshot de servidor `null`). |
| `cacheComponents: true` exige `<Suspense>` o `"use cache"` para datos dinámicos y puede fallar el build en rutas `[id]` | Usar `generateStaticParams` sobre `GAMES` y consultar la guía de Cache Components en `node_modules/next/dist/docs/` antes del paso 5. |
| APIs de Next 16.4 distintas a las conocidas (`params` como Promise, `redirect`) | Revisar la documentación local antes de escribir cada ruta (AGENTS.md). |
| El intervalo de la simulación sigue vivo tras salir del Reproductor | Limpiar el `setInterval` en el cleanup del efecto. |
| `seededScores` no es determinista entre servidor y cliente | Es una función pura con semilla; se llama con los mismos argumentos en ambos lados. |

---

## What is **not** in this spec

- Juegos jugables reales.
- Autenticación real y OAuth.
- Backend o base de datos.
- Puntuaciones reales en Detalle o Salón de la Fama.
- Créditos funcionales.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
