// Cria uma sessão de login pelo WhatsApp e devolve o código de 6 dígitos.
// Pública (verify_jwt desligado): não expõe dado nenhum, só um código descartável de 5 minutos.
import { createClient } from "npm:@supabase/supabase-js@2";

const permitidas = (Deno.env.get("SITE_ORIGIN") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function cors(req: Request): Record<string, string> {
  const origem = req.headers.get("origin") ?? "";
  const liberada = permitidas.length === 0 || permitidas.includes(origem) || origem === "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": liberada ? (permitidas.length === 0 ? "*" : origem) : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function resp(corpo: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(corpo), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return resp({ erro: "metodo_nao_permitido" }, 405, h);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.rpc("login_iniciar");
  if (error || !data) return resp({ erro: "falha" }, 500, h);
  return resp(data, 200, h);
});
