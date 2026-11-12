import { test, expect, type Page } from "@playwright/test";
import { simular, entrar, CONTA } from "./apoio";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

/** Simula a função senha-definir e devolve o que ela recebeu. */
async function simularSenhaDefinir(page: Page) {
  const pedidos: { corpo: unknown; autorizacao?: string }[] = [];
  await page.route("**/functions/v1/senha-definir", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    pedidos.push({ corpo: JSON.parse(req.postData() ?? "{}"), autorizacao: req.headers().authorization });
    return route.fulfill({ status: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) });
  });
  return pedidos;
}

test.describe("acesso: senha e primeiro acesso", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("entrar com e-mail e senha leva ao painel; senha errada avisa sem sair da tela", async ({ page }) => {
    await simular(page);
    await page.goto("/entrar");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await page.screenshot({ path: `../docs/screens/entrar-${test.info().project.name}.png` });
    await page.getByLabel("E-mail").fill("maria@exemplo.com");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("errada123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("segredo123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/painel$/, { timeout: 15_000 });
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });

  test("a tela Entrar leva ao WhatsApp e à recuperação de senha", async ({ page }) => {
    await simular(page, { login: ["pendente"] });
    await page.goto("/entrar");
    await page.getByRole("link", { name: /Entrar pelo WhatsApp/ }).click();
    await expect(page.getByRole("heading", { name: "Entrar pelo WhatsApp" })).toBeVisible();
    await page.getByRole("link", { name: /Entrar com e-mail e senha/ }).click();
    await page.getByRole("link", { name: "Esqueci a senha" }).click();
    await expect(page.getByRole("heading", { name: "Recuperar o acesso" })).toBeVisible();
    await page.getByRole("button", { name: "Gerar código" }).click();
    await expect(page.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", /PAINEL%20123456$/);
  });

  test("esqueci a senha: confirma pelo WhatsApp, cria a senha nova e tira os outros aparelhos", async ({ page }) => {
    await simular(page, { login: ["ok"] });
    const pedidos = await simularSenhaDefinir(page);
    const saidas: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/auth/v1/logout")) saidas.push(r.url());
    });
    await page.goto("/entrar?modo=recuperar");
    await page.getByRole("button", { name: "Gerar código" }).click();
    await expect(page).toHaveURL(/\/painel\/senha-nova$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Crie uma senha nova" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue("maria@exemplo.com");
    await page.getByLabel("Senha", { exact: true }).fill("nova senha 2026");
    await page.getByLabel("Repita a senha").fill("nova senha 2026");
    await page.getByRole("button", { name: "Salvar e entrar" }).click();
    await expect(page).toHaveURL(/\/painel$/);
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].corpo).toEqual({ email: "maria@exemplo.com", senha: "nova senha 2026" });
    expect(pedidos[0].autorizacao).toMatch(/^Bearer .+/);
    expect(saidas.some((u) => u.includes("scope=others"))).toBe(true);
  });

  test("primeiro acesso: objetivo, renda, senha e o primeiro gasto chegando pelo WhatsApp", async ({ page, context }) => {
    let conta = { ...CONTA, primeiro_acesso_concluido: false, tem_senha: false };
    const chamadas: Record<string, unknown[]> = { objetivo: [], renda: [], concluir: [] };
    let consultas = 0;
    await simular(page, { login: ["ok"] }, {
      app_minha_conta: () => conta,
      app_salvar_objetivo: (c) => (chamadas.objetivo.push(c), { ok: true }),
      app_salvar_renda: (c) => (chamadas.renda.push(c), { ok: true }),
      app_concluir_primeiro_acesso: (c) => {
        chamadas.concluir.push(c);
        conta = { ...conta, primeiro_acesso_concluido: true };
        return { ok: true };
      },
      app_lancamentos: () => {
        consultas += 1;
        return consultas < 3
          ? { total: 0, itens: [] }
          : { total: 1, itens: [{ id: "l1", data: "2026-11-12", tipo: "despesa", valor: 100, categoria: "Alimentação", subcategoria: null, descricao: "Mercado", metodo_pagamento: null, origem: "whatsapp", codigo: "A1" }] };
      },
    });
    const senha = await simularSenhaDefinir(page);
    await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>WhatsApp</p>" }));

    await entrar(page).catch(() => {}); // o painel manda para as boas-vindas logo depois de entrar
    await expect(page).toHaveURL(/\/painel\/boas-vindas$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "O que você quer resolver primeiro?" })).toBeVisible();
    await page.screenshot({ path: `../docs/screens/boas-vindas-objetivo-${test.info().project.name}.png`, fullPage: true });
    await page.getByRole("button", { name: /Guardar dinheiro/ }).click();

    await expect(page.getByRole("heading", { name: /Quanto entra por mês/ })).toBeVisible();
    await page.getByLabel("Renda mensal em reais").fill("4.500");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Crie a sua senha" })).toBeVisible();
    await page.getByLabel("Senha", { exact: true }).fill("minha senha forte");
    await page.getByLabel("Repita a senha").fill("minha senha forte");
    await page.getByRole("button", { name: "Criar senha e continuar" }).click();

    await expect(page.getByRole("heading", { name: "Seu assistente já está no WhatsApp" })).toBeVisible();
    await expect(page.getByText(/Ligado ao seu número/)).toBeVisible();
    await page.screenshot({ path: `../docs/screens/boas-vindas-whatsapp-${test.info().project.name}.png`, fullPage: true });
    const [aba] = await Promise.all([context.waitForEvent("page"), page.getByRole("link", { name: /Mandar meu primeiro gasto/ }).click()]);
    expect(aba.url()).toContain("text=mercado%20100");
    await aba.close();

    await expect(page.getByRole("heading", { name: /Chegou! Já está no seu painel/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Mercado")).toBeVisible();
    await page.screenshot({ path: `../docs/screens/boas-vindas-chegou-${test.info().project.name}.png`, fullPage: true });
    await page.getByRole("button", { name: /Ir para o meu painel/ }).click();
    await expect(page).toHaveURL(/\/painel$/);

    expect(chamadas.objetivo).toEqual([{ p_objetivo: "guardar" }]);
    expect(chamadas.renda).toEqual([{ p_renda: 4500 }]);
    expect(chamadas.concluir).toHaveLength(1);
    expect(senha[0].corpo).toEqual({ email: "maria@exemplo.com", senha: "minha senha forte" });
  });

  test("primeiro acesso: 'Fazer depois' marca como visto e o painel não insiste", async ({ page }) => {
    let conta = { ...CONTA, primeiro_acesso_concluido: false };
    await simular(page, { login: ["ok"] }, {
      app_minha_conta: () => conta,
      app_concluir_primeiro_acesso: () => {
        conta = { ...conta, primeiro_acesso_concluido: true };
        return { ok: true };
      },
    });
    await entrar(page).catch(() => {});
    await expect(page).toHaveURL(/\/painel\/boas-vindas$/, { timeout: 15_000 });
    await page.getByRole("button", { name: "Fazer depois" }).click();
    await expect(page).toHaveURL(/\/painel$/);
    await page.goto("/painel/lancamentos");
    await expect(page).toHaveURL(/\/painel\/lancamentos$/);
  });

  test("Configurações › Conta: quem já tem senha pode trocar", async ({ page }) => {
    await simular(page, { login: ["ok"] });
    const pedidos = await simularSenhaDefinir(page);
    await entrar(page);
    await page.goto("/painel/configuracoes/conta");
    await page.getByRole("button", { name: "Trocar senha" }).click();
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("outra senha 2026");
    await page.getByLabel("Repita a senha").fill("outra senha 2026");
    await page.getByRole("button", { name: "Trocar senha" }).click();
    await expect(page.getByText(/Senha trocada/)).toBeVisible();
    expect(pedidos).toHaveLength(1);
  });
});
