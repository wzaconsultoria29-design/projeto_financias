// Teste de integração do login (rodar à mão contra o projeto Supabase).
//   Fase A:  node tests/e2e-login.mjs                 -> cria sessão e imprime sessao_id/código
//   (confirme o código por SQL com login_confirmar)
//   Fase B:  node tests/e2e-login.mjs <sessao_id>     -> troca a sessão confirmada por tokens e testa isolamento
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? "https://bfgmjovveboyidvhggpq.supabase.co";
const ANON = process.env.SUPABASE_ANON_KEY ?? "sb_publishable_b-N9DVq6Vg83vaVWZ_VKTQ_1kwUh4xK";

let falhas = 0;
const check = (cond, msg) => {
  if (cond) console.log("PASS", msg);
  else { console.error("FAIL", msg); falhas++; }
};
const fn = async (nome, corpo) => {
  const r = await fetch(`${URL}/functions/v1/${nome}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo ?? {}),
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};

const sessaoArg = process.argv[2];

if (!sessaoArg) {
  const ini = await fn("login-iniciar");
  check(ini.status === 200 && /^\d{6}$/.test(ini.json?.codigo ?? ""), "login-iniciar devolve código de 6 dígitos");
  const st = await fn("login-status", { sessao_id: ini.json?.sessao_id });
  check(st.json?.estado === "pendente", "login-status é pendente antes da confirmação");
  const ruim = await fn("login-status", { sessao_id: "nao-e-uuid" });
  check(ruim.status === 400, "login-status recusa sessao_id inválido");
  console.log(JSON.stringify({ sessao_id: ini.json?.sessao_id, codigo: ini.json?.codigo }));
} else {
  const st = await fn("login-status", { sessao_id: sessaoArg });
  check(st.json?.estado === "ok" && !!st.json?.token_hash && !!st.json?.email, "login-status devolve ok com token_hash");
  const sb = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.verifyOtp({ token_hash: st.json?.token_hash, type: "magiclink" });
  if (error) console.error("verifyOtp erro:", error.status, error.code, error.message);
  check(!error && !!data?.session, "verifyOtp abre a sessão");
  const { data: itens, error: e2 } = await sb.from("lancamentos").select("descricao");
  check(!e2 && itens?.length === 1 && itens[0].descricao === "teste-A", "RLS: a sessão só enxerga o lançamento do próprio usuário");
  const de_novo = await fn("login-status", { sessao_id: sessaoArg });
  check(de_novo.json?.estado === "expirado", "segunda chamada com a mesma sessão expira");
}
console.log(falhas === 0 ? "FALHAS: 0" : `FALHAS: ${falhas}`);
process.exit(falhas === 0 ? 0 : 1);
