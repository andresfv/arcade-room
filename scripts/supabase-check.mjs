// Verifica la conexión con Supabase y la validez de la publishable key.
// Uso: pnpm supabase:check (carga .env.local con node --env-file).
// Sale con código 0 si la API REST responde y acepta la clave; 1 en otro caso.
import { createClient } from "@supabase/supabase-js";
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];
for (const name of REQUIRED) {
  if (!process.env[name]) {
    console.error(`[SUPABASE] FALTA ${name}`);
    process.exit(1);
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// PGRST205: la tabla no existe. La API respondió y aceptó la clave.
const TABLE_NOT_FOUND = "PGRST205";
try {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error, status } = await supabase
    .from("__healthcheck__")
    .select("*")
    .limit(1);
  if (!error || error.code === TABLE_NOT_FOUND) {
    console.log(`[SUPABASE] OK ${url}`);
    process.exit(0);
  }
  console.error(`[SUPABASE] ERROR ${error.code || status}: ${error.message}`);
  process.exit(1);
} catch (err) {
  const code = err?.code ?? err?.cause?.code ?? "UNKNOWN";
  console.error(`[SUPABASE] ERROR ${code}: ${err?.message ?? err}`);
  process.exit(1);
}
