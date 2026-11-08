import { test, expect, type Page } from "@playwright/test";

const URL_CADASTRO = "https://cadastro.exemplo.test/webhook";
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };

type Resposta = { status: number; corpo: unknown };

/** Simula o webhook do n8n; devolve as requisições recebidas. */
async function simularCadastro(page: Page, resposta: Resposta) {
  const recebidas: Record<string, unknown>[] = [];
  await page.route(`${URL_CADASTRO}**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    recebidas.push(JSON.parse(req.postData() ?? "{}"));
    return route.fulfill({ status: resposta.status, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify(resposta.corpo) });
  });
  return recebidas;
}

async function preencher(page: Page, telefone = "(11) 99999-8888") {
  await page.getByLabel("Nome").fill("Maria Silva");
  await page.getByLabel("E-mail").fill("maria@exemplo.com");
  await page.getByLabel("WhatsApp").fill(telefone);
}

test.describe("cadastro", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("botão fica desabilitado até marcar o aceite", async ({ page }) => {
    await page.goto("/cadastro");
    const botao = page.getByRole("button", { name: "Criar conta" });
    await expect(botao).toBeDisabled();
    const aceite = page.getByLabel(/Li e aceito/);
    await expect(aceite).not.toBeChecked();
    await aceite.check();
    await expect(botao).toBeEnabled();
    await expect(page.getByLabel(/novidades/)).not.toBeChecked();
  });

  test("telefone fixo ou curto mostra o aviso e não envia nada", async ({ page }) => {
    const recebidas = await simularCadastro(page, { status: 200, corpo: { ok: true } });
    await page.goto("/cadastro");
    await preencher(page, "(11) 3333-4444");
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Informe um celular com DDD")).toBeVisible();
    expect(recebidas).toHaveLength(0);
  });

  test("cadastro válido envia aceite e leva ao passo do WhatsApp", async ({ page }) => {
    const recebidas = await simularCadastro(page, {
      status: 200,
      corpo: { ok: true, whatsapp_url: "https://wa.me/5582991130317?text=ATIVAR%20ABC123", codigo_ativacao: "ABC123" },
    });
    await page.goto("/cadastro?plano=essencial");
    await preencher(page);
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { name: "Falta 1 passo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir o WhatsApp" })).toHaveAttribute("href", "https://wa.me/5582991130317?text=ATIVAR%20ABC123");
    await expect(page.getByText("ABC123")).toBeVisible();
    expect(recebidas[0]).toMatchObject({ nome: "Maria Silva", telefone: "5511999998888", plano: "essencial", aceite: true, aceite_marketing: false, website: "" });
  });

  test("mostra a mensagem do servidor quando o cadastro é recusado", async ({ page }) => {
    await simularCadastro(page, { status: 400, corpo: { ok: false, mensagem: "Confira seu nome." } });
    await page.goto("/cadastro");
    await preencher(page);
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    // o Next também injeta um role=alert (route announcer), por isso o filtro por texto
    await expect(page.getByRole("alert").filter({ hasText: "Confira seu nome." })).toBeVisible();
  });

  test("campo isca não é focável nem visível", async ({ page }) => {
    await page.goto("/cadastro");
    const isca = page.locator('input[name="website"]');
    await expect(isca).toHaveAttribute("tabindex", "-1");
    await expect(isca).toHaveAttribute("aria-hidden", "true");
    await expect(isca).not.toBeInViewport();
  });

  test("plano family vem selecionado, com o aviso de que o pagamento online está sendo liberado", async ({ page }) => {
    await page.goto("/cadastro?plano=family");
    await expect(page.getByLabel("Plano")).toHaveValue("family");
    await expect(page.getByText(/pagamento online do Family está sendo liberado/)).toBeVisible();
  });
});

test.describe("páginas legais", () => {
  for (const [rota, titulo, operador] of [
    ["/termos", "Termos de uso", "inteligência artificial"],
    ["/privacidade", "Política de privacidade", "OpenAI"],
  ] as const) {
    test(`${rota} mostra versão, aviso de rascunho e conteúdo`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
      await expect(page.getByText("v1-2026-10")).toBeVisible();
      await expect(page.getByText("Rascunho em revisão jurídica")).toBeVisible();
      await expect(page.getByText(operador).first()).toBeVisible();
    });
  }
});
