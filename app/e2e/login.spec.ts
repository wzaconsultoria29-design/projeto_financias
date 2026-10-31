import { test, expect, type Page } from "@playwright/test";

const SUPABASE = "https://supabase.exemplo.test";
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
const CONTA = {
  nome: "Maria Silva", email: "maria@exemplo.com", telefone_mascarado: "+55 11 *****-8888",
  plano: null, assinatura: null, uso: { mensagens: 0, limite: null, restantes: null },
  consentimento: { em: null, versao: null },
};

type Estados = { login?: string[]; usuarioStatus?: number };

/** Simula as Edge Functions de login e o Auth do Supabase. `estados.login` é a sequência devolvida pelo login-status. */
async function simular(page: Page, estados: Estados = {}) {
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
    if (url.includes("/rest/v1/rpc/app_minha_conta")) {
      return route.fulfill({ status: 200, headers: JSON_CORS, body: JSON.stringify(CONTA) });
    }
    return route.fulfill({ status: 404, headers: JSON_CORS, body: "{}" });
  });
  return { chamadasStatus, controle };
}

async function entrar(page: Page) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Gerar código" }).click();
  await expect(page).toHaveURL(/\/painel$/, { timeout: 15_000 });
}

test.describe("entrar pelo WhatsApp", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("mostra o botão, o código, a contagem e o link do WhatsApp", async ({ page }) => {
    await simular(page, { login: ["pendente"] });
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Gerar código" }).click();
    await expect(page.getByText("123456")).toBeVisible();
    await expect(page.getByText(/^(4:5\d|5:00)$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/5582991130317?text=PAINEL%20123456",
    );
    await page.screenshot({ path: `../docs/screens/entrar-${test.info().project.name}.png` });
  });

  test("consulta a cada 2 segundos e entra no painel quando o bot confirma", async ({ page }) => {
    const { chamadasStatus } = await simular(page, { login: ["pendente", "pendente", "ok"] });
    await entrar(page);
    expect(chamadasStatus.length).toBe(3);
    expect(chamadasStatus[1] - chamadasStatus[0]).toBeGreaterThanOrEqual(1500);
    // no celular o cabeçalho não tem espaço para o nome
    if (test.info().project.name === "desktop") await expect(page.getByText("Maria Silva")).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `../docs/screens/painel-cabecalho-${test.info().project.name}.png` });
  });

  test("código vencido oferece gerar outro", async ({ page }) => {
    await simular(page, { login: ["expirado"] });
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Gerar código" }).click();
    await expect(page.getByText("Código vencido")).toBeVisible();
    await expect(page.getByRole("button", { name: "Gerar novo código" })).toBeVisible();
  });

  test("abrir o painel sem sessão leva para /entrar", async ({ page }) => {
    await simular(page);
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("sessão revogada volta para /entrar sem mensagem técnica", async ({ page }) => {
    const { controle } = await simular(page);
    await entrar(page);
    controle.usuarioStatus = 401;
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByText(/session|jwt|401|token/i)).toHaveCount(0);
  });

  test("Sair encerra a sessão e volta para /entrar", async ({ page }) => {
    await simular(page);
    await entrar(page);
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  });
});
