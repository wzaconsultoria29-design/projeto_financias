// Consulta a sessão de login. Quando o bot já confirmou o código, devolve um token de uso único
// que o navegador troca por uma sessão do Supabase Auth (verifyOtp, tipo magiclink).
import { createClient } from "npm:@supabase/supabase-js@2";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

  let corpo: { sessao_id?: string } = {};
  try {
    corpo = await req.json();
  } catch {
    // corpo vazio cai na validação abaixo
  }
  const sessaoId = corpo.sessao_id ?? "";
  if (!UUID.test(sessaoId)) return resp({ erro: "sessao_id_invalido" }, 400, h);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.rpc("login_consumir", { p_sessao_id: sessaoId });
  if (error || !data) return resp({ erro: "falha" }, 500, h);
  if (data.estado !== "ok") return resp({ estado: data.estado }, 200, h);

  const usuarioId = data.usuario_id as string;
  const email = `u-${usuarioId}@painel.invalid`;

  let link = await sb.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) {
    const criado = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { usuario_id: usuarioId } });
    if (criado.error) return resp({ erro: "falha_auth" }, 500, h);
    link = await sb.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error) return resp({ erro: "falha_auth" }, 500, h);
  }

  await sb.from("usuarios").update({ auth_user_id: link.data.user.id }).eq("id", usuarioId);
  return resp({ estado: "ok", email, token_hash: link.data.properties.hashed_token }, 200, h);
});
