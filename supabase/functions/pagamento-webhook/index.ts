// Recebe os avisos do Mercado Pago. É pública (verify_jwt desligado), então NÃO confia em nada do aviso:
// só pega o número do pagamento, busca o pagamento de verdade na API do Mercado Pago com o nosso token
// e entrega o resultado ao banco, que é idempotente (o mesmo pagamento nunca ativa duas vezes).
import { createClient } from "npm:@supabase/supabase-js@2";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_PAGAMENTO = /^\d{1,20}$/;

function ok(corpo: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: true, ...corpo }), { status: 200, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") return new Response(null, { status: 405 });

  const url = new URL(req.url);
  const corpo = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string | number } };
  const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? corpo.type ?? corpo.topic ?? "";
  const id = String(url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? corpo.data?.id ?? "");
  // Outros assuntos (pedidos, planos...) e avisos mal formados: respondemos 200 para o Mercado Pago não insistir.
  if (tipo !== "payment" || !ID_PAGAMENTO.test(id)) return ok({ ignorado: true });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: segredo } = await sb.from("segredos_app").select("valor").eq("chave", "mp_access_token").maybeSingle();
  if (!segredo?.valor) return new Response(JSON.stringify({ erro: "pagamento_indisponivel" }), { status: 503, headers: { "Content-Type": "application/json" } });

  // A verdade vem do Mercado Pago, não do aviso.
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${segredo.valor}` } });
  if (r.status === 404) return ok({ ignorado: true }); // aviso de teste do painel do Mercado Pago ou pagamento que não é nosso
  if (!r.ok) return new Response(JSON.stringify({ erro: "falha_mercado_pago" }), { status: 502, headers: { "Content-Type": "application/json" } }); // erro nosso: o Mercado Pago tenta de novo
  const pagamento = await r.json();

  const cobranca = String(pagamento.external_reference ?? "");
  if (!UUID.test(cobranca)) return ok({ ignorado: true });

  const { data, error } = await sb.rpc("cobranca_processar", {
    p_cobranca_id: cobranca,
    p_mp_payment_id: String(pagamento.id),
    p_status: String(pagamento.status ?? ""),
    p_valor_centavos: Math.round(Number(pagamento.transaction_amount) * 100),
    p_moeda: String(pagamento.currency_id ?? ""),
  });
  if (error) return new Response(JSON.stringify({ erro: "falha" }), { status: 500, headers: { "Content-Type": "application/json" } });
  return ok({ resultado: data?.acao ?? data?.motivo ?? null });
});
