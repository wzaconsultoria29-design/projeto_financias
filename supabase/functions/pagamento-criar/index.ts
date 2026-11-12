// Abre um pagamento no Mercado Pago (Checkout Pro) para um plano pago e devolve o endereço do checkout.
// Exige o login da pessoa (JWT do Supabase Auth). O valor vem sempre do banco, nunca do navegador.
// O token do Mercado Pago fica em public.segredos_app (chave mp_access_token), só acessível pelo servidor.
import { createClient } from "npm:@supabase/supabase-js@2";

const permitidas = (Deno.env.get("SITE_ORIGIN") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const SITE = (Deno.env.get("SITE_URL") ?? "https://projeto-financias-pi.vercel.app").replace(/\/$/, "");

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

  // 1) Quem é a pessoa: o JWT do login confere com o Auth e leva a um cadastro.
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: sessao } = await sb.auth.getUser(jwt);
  if (!sessao?.user) return resp({ erro: "nao_autenticado" }, 401, h);
  const { data: usuario } = await sb.from("usuarios").select("id").eq("auth_user_id", sessao.user.id).maybeSingle();
  if (!usuario) return resp({ erro: "sem_cadastro" }, 403, h);

  // 2) O que ela quer comprar. Só o código do plano vem de fora.
  const corpo = (await req.json().catch(() => ({}))) as { plano?: unknown };
  const plano = typeof corpo.plano === "string" ? corpo.plano : "";

  // 3) Token do Mercado Pago (se ainda não foi configurado, o pagamento fica indisponível).
  const { data: segredo } = await sb.from("segredos_app").select("valor").eq("chave", "mp_access_token").maybeSingle();
  if (!segredo?.valor) return resp({ erro: "pagamento_indisponivel" }, 503, h);
  const token = String(segredo.valor);

  // 4) Cobrança no banco (valida o plano, o limite diário e devolve o preço real).
  const { data: cobranca, error: errCobranca } = await sb.rpc("cobranca_criar", { p_usuario_id: usuario.id, p_plano: plano });
  if (errCobranca || !cobranca) return resp({ erro: "falha" }, 500, h);
  if (!cobranca.ok) return resp({ erro: cobranca.motivo }, cobranca.motivo === "muitas_cobrancas" ? 429 : 400, h);

  // 5) Preferência de pagamento no Mercado Pago.
  const retorno = (estado: string) => `${SITE}/painel/configuracoes/plano?pagamento=${estado}`;
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{
        id: cobranca.plano_codigo,
        title: `Gastômetro ${cobranca.plano_nome} (1 mês)`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: cobranca.valor_centavos / 100,
      }],
      external_reference: cobranca.cobranca_id,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/pagamento-webhook`,
      back_urls: { success: retorno("ok"), pending: retorno("pendente"), failure: retorno("falhou") },
      auto_return: "approved",
      statement_descriptor: "GASTOMETRO",
    }),
  });
  const pref = await r.json().catch(() => ({}));
  if (!r.ok || !pref?.id) return resp({ erro: "falha_mercado_pago" }, 502, h);

  await sb.rpc("cobranca_vincular_preferencia", { p_cobranca_id: cobranca.cobranca_id, p_preferencia: String(pref.id) });

  // Com credenciais de teste o checkout certo é o de sandbox.
  const teste = token.startsWith("TEST-");
  const url = teste ? (pref.sandbox_init_point ?? pref.init_point) : pref.init_point;
  if (!url) return resp({ erro: "falha_mercado_pago" }, 502, h);
  return resp({ url }, 200, h);
});
