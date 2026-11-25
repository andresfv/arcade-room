import { createBrowserClient } from "@supabase/ssr";
// Cliente de Supabase para Client Components. No importa nada de next/headers.
// createBrowserClient reutiliza una única instancia en el navegador.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
