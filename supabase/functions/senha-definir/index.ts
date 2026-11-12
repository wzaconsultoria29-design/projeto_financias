// Cria ou troca a senha de quem está logado e define o e-mail de login (o mesmo do cadastro, que a pessoa pode corrigir).
// Exige o login (JWT do Supabase Auth). A senha vai direto para o Supabase Auth e nunca é gravada nas tabelas do app.
// Sem provedor de e-mail ainda, o e-mail não é confirmado por mensagem: quem prova a identidade é o WhatsApp (o login atual).
import { createClient } from "npm:@supabase/supabase-js@2";

const permitidas = (Deno.env.get("SITE_ORIGIN") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

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

  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: sessao } = await sb.auth.getUser(jwt);
  if (!sessao?.user) return resp({ erro: "nao_autenticado" }, 401, h);
  const { data: usuario } = await sb.from("usuarios").select("id, status").eq("auth_user_id", sessao.user.id).maybeSingle();
  if (!usuario) return resp({ erro: "sem_cadastro" }, 403, h);
  if (["bloqueado", "cancelado", "excluido"].includes(String(usuario.status))) return resp({ erro: "usuario_bloqueado" }, 403, h);

  const corpo = (await req.json().catch(() => ({}))) as { email?: unknown; senha?: unknown };
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const senha = typeof corpo.senha === "string" ? corpo.senha : "";
  if (!EMAIL.test(email) || email.endsWith(".invalid")) return resp({ erro: "email_invalido" }, 400, h);
  if (senha.length < 8 || senha.length > 72) return resp({ erro: "senha_invalida" }, 400, h);

  const { error } = await sb.auth.admin.updateUserById(sessao.user.id, { email, password: senha, email_confirm: true });
  if (error) {
    const texto = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (texto.includes("email_exists") || texto.includes("already") || texto.includes("registered")) return resp({ erro: "email_em_uso" }, 409, h);
    if (texto.includes("weak") || texto.includes("password")) return resp({ erro: "senha_fraca" }, 400, h);
    return resp({ erro: "falha" }, 500, h);
  }

  await sb.rpc("senha_registrada", { p_usuario_id: usuario.id, p_email: email });
  return resp({ ok: true }, 200, h);
});
