import { createClient } from "@supabase/supabase-js";

// Só a chave pública (anon/publishable) vai para o navegador. Os valores de reserva evitam falha no build
// quando as variáveis ainda não foram configuradas (as chamadas reais falham com erro claro).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "chave-publica-nao-configurada";

export const supabase = createClient(url, chave, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
