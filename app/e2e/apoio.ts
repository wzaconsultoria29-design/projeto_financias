import { expect, type Page, type Request } from "@playwright/test";

export const SUPABASE = "https://supabase.exemplo.test";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const JSON_CORS = { ...CORS, "content-type": "application/json" };

function jwtFalso(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", role: "authenticated", exp })}.assinatura`;
}

const USUARIO = { id: "u1", aud: "authenticated", role: "authenticated", email: "maria@exemplo.com", app_metadata: {}, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" };
export const CONTA = {
  nome: "Maria Silva", email: "maria@exemplo.com", telefone_mascarado: "+55 11 *****-8888",
  plano: null, assinatura: null, uso: { mensagens: 0, limite: null, restantes: null },
  consentimento: { em: null, versao: null },
};

export type Estados = { login?: string[]; usuarioStatus?: number };
export type Rpcs = Record<string, (corpo: Record<string, unknown>, req: Request) => unknown>;

/** Simula as Edge Functions de login e o Auth do Supabase. `estados.login` é a sequência devolvida pelo login-status. */
export async function simular(page: Page, estados: Estados = {}, rpcs: Rpcs = {}) {
  const sequencia = [...(estados.login ?? ["pendente", "pendente", "ok"])];
  const chamadasStatus: number[] = [];
  const controle = { usuarioStatus: estados.usuarioStatus ?? 200 };

  await page.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (url.includes("/functions/v1/login-iniciar")) {
      return route.fulfill({
        status: 200, headers: JSON_CORS,
        body: JSON.stringify({ sessao_id: "sessao-1", codigo: "123456", expira_em: new Date(Date.now() + 5 * 60_000).toISOString() }),
      });
    }
    if (url.includes("/functions/v1/login-status")) {
      chamadasStatus.push(Date.now());
      const estado = sequencia.length > 1 ? sequencia.shift()! : sequencia[0];
      const corpo = estado === "ok" ? { estado: "ok", token_hash: "hash-de-teste" } : { estado };
      return route.fulfill({ status: 200, headers: JSON_CORS, body: JSON.stringify(corpo) });
    }
    if (url.includes("/auth/v1/verify")) {
      return route.fulfill({
        status: 200, headers: JSON_CORS,
        body: JSON.stringify({ access_token: jwtFalso(), token_type: "bearer", expires_in: 3600, refresh_token: "refresh-teste", user: USUARIO }),
      });
    }
    if (url.includes("/auth/v1/user")) {
      if (controle.usuarioStatus !== 200) {
        return route.fulfill({ status: controle.usuarioStatus, headers: JSON_CORS, body: JSON.stringify({ code: controle.usuarioStatus, error_code: "session_not_found", msg: "Session not found" }) });
      }
      return route.fulfill({ status: 200, headers: JSON_CORS, body: JSON.stringify(USUARIO) });
    }
    if (url.includes("/auth/v1/logout")) return route.fulfill({ status: 204, headers: CORS });
    if (url.includes("/rest/v1/rpc/app_minha_conta") && !rpcs.app_minha_conta) {
      return route.fulfill({ status: 200, headers: JSON_CORS, body: JSON.stringify(CONTA) });
    }
    const rpc = /\/rest\/v1\/rpc\/([a-z_]+)/.exec(url)?.[1];
    if (rpc && rpcs[rpc]) {
      const corpo = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
      const resposta = rpcs[rpc](corpo, req);
      if (resposta instanceof Error) {
        return route.fulfill({ status: 400, headers: JSON_CORS, body: JSON.stringify({ code: "P0001", message: resposta.message, details: null, hint: null }) });
      }
      return route.fulfill({ status: 200, headers: JSON_CORS, body: JSON.stringify(resposta) });
    }
    return route.fulfill({ status: 404, headers: JSON_CORS, body: "{}" });
  });
  return { chamadasStatus, controle };
}

export async function entrar(page: Page) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Gerar código" }).click();
  await expect(page).toHaveURL(/\/painel$/, { timeout: 15_000 });
}

