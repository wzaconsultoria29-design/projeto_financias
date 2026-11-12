import { supabase } from "@/lib/supabase";
import { limparEmail } from "@/lib/senha";

export type SessaoLogin = { sessaoId: string; codigo: string; expiraEm: string };
export type EstadoLogin = "pendente" | "expirado" | "ok";

const base = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

async function chamar(funcao: string, corpo: unknown): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const r = await fetch(`${base()}/${funcao}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return { ok: r.ok, status: r.status, json: ((await r.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
}

export async function iniciarLogin(): Promise<SessaoLogin> {
  const r = await chamar("login-iniciar", {});
  if (r.status === 429) throw new Error("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.");
  if (!r.ok) throw new Error("Não foi possível gerar o código. Tente de novo.");
  return { sessaoId: String(r.json.sessao_id), codigo: String(r.json.codigo), expiraEm: String(r.json.expira_em) };
}

/** Consulta a sessão; quando o bot já confirmou, troca o token por uma sessão do Supabase Auth. */
export async function statusLogin(sessaoId: string): Promise<EstadoLogin> {
  const r = await chamar("login-status", { sessao_id: sessaoId });
  if (!r.ok) throw new Error("Não foi possível verificar o código. Tente de novo.");
  const estado = r.json.estado;
  if (estado === "pendente" || estado === "expirado") return estado;
  if (estado !== "ok") throw new Error("Resposta inesperada ao entrar. Gere um novo código.");
  // A API exige só token_hash e type (sem email).
  const { error } = await supabase.auth.verifyOtp({ token_hash: String(r.json.token_hash), type: "magiclink" });
  if (error) throw new Error("Não foi possível entrar. Gere um novo código.");
  return "ok";
}

/** Entra com e-mail e senha (Supabase Auth). A sessão fica guardada neste navegador e se renova sozinha. */
export async function entrarComSenha(email: string, senha: string): Promise<void> {
  let resultado: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
  try {
    resultado = await supabase.auth.signInWithPassword({ email: limparEmail(email), password: senha });
  } catch {
    throw new Error("Sem conexão com o servidor. Confira a internet e tente de novo.");
  }
  const { error } = resultado;
  if (!error) return;
  if (error.status === 429) throw new Error("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.");
  // Mesma mensagem para e-mail ou senha errados: não contamos qual dos dois existe.
  if (error.status === 400 || error.code === "invalid_credentials") throw new Error("E-mail ou senha incorretos.");
  throw new Error("Não foi possível entrar agora. Tente de novo em instantes.");
}
