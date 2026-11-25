import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// Cliente de Supabase para Server Components, Server Actions y Route Handlers.
// Se crea en cada llamada (nunca como singleton de módulo) porque depende de
// las cookies de la petición en curso. `cookies()` es una API de petición: con
// Cache Components, llamar a este cliente en una página exige un <Suspense>.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `set` lanza si se llama desde un Server Component. Se ignora:
            // el proxy de la spec de Auth refrescará la sesión.
          }
        },
      },
    },
  );
}
