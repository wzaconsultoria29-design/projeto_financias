import { test, expect } from "@playwright/test";

test.describe("landing", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("topo: promessa em até 2 linhas e botão visível sem rolar", async ({ page }) => {
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("sem planilha");
    // O título tem duas linhas escritas à mão; cada uma precisa caber em uma linha só, em qualquer largura.
    const alturas = await h1.locator("[data-line]").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
    expect(alturas).toHaveLength(2);
    for (const a of alturas) expect(a).toBeLessThan(1.3);
    await expect(page.getByRole("main").getByRole("link", { name: "Começar grátis" }).first()).toBeInViewport();
  });

  test("navegação em uma linha e com altura contida (desktop)", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop");
    const header = page.locator("header").first();
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(80);
    const topos = await header.locator("nav a").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(topos).size).toBe(1);
  });

  test("demonstração do topo: escrever um gasto muda o painel", async ({ page }) => {
    const painel = page.locator('[aria-label="Mensagens"]').locator("xpath=ancestor::div[@data-ui]/following-sibling::div[@data-ui]");
    await expect(painel).toContainText("R$ 2.040,40");
    await page.getByLabel("Escreva um gasto").fill("gastei 32 no almoço");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Anotado: R$ 32,00, Almoço, Alimentação.")).toBeVisible();
    await expect(painel).toContainText("R$ 2.072,40");
  });

  test("demonstração do topo: frase sem valor recebe ajuda, não erro", async ({ page }) => {
    await page.getByLabel("Escreva um gasto").fill("bom dia");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Não achei o valor. Tente assim: gastei 32 no almoço.")).toBeVisible();
  });

  test("painel em duas metades: editar as mensagens muda o resultado", async ({ page }) => {
    const mensagens = page.getByLabel(/Mensagens do mês/);
    await mensagens.scrollIntoViewIfNeeded();
    await mensagens.fill("mercado 100\nuber 50");
    const secao = page.locator("#painel");
    await expect(secao).toContainText("R$ 150,00");
    await expect(secao).toContainText("2 de 2 mensagens entendidas");
    await mensagens.fill("bom dia");
    await expect(secao).toContainText("0 de 1 mensagem");
  });

  test("recursos: trocar o período e comparar atualiza o painel fixo", async ({ page }) => {
    const secao = page.locator("#recursos");
    await secao.scrollIntoViewIfNeeded();
    await secao.getByRole("button", { name: "Semana" }).click();
    await expect(secao).toContainText("Esta semana");
    await secao.getByRole("switch").click();
    await expect(secao).toContainText("semana passada");
    await secao.getByRole("button", { name: "Onde posso economizar?" }).click();
    await expect(secao).toContainText("podemos definir um teto");
  });

  test("planos: nomes selecionáveis, preço troca e Family aparece como em breve", async ({ page }) => {
    const secao = page.locator("#planos");
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.getByRole("button", { name: "Essencial" })).toHaveAttribute("aria-pressed", "true");
    await expect(secao).toContainText("R$ 19");
    await secao.getByRole("button", { name: "Teste grátis" }).click();
    await expect(secao).toContainText("por 7 dias");
    await expect(secao).toContainText("Ganha mais 3 dias");
    await secao.getByRole("button", { name: "Family" }).click();
    await expect(secao).toContainText("R$ 39");
    await expect(secao).toContainText("Em breve");
    await expect(secao).toContainText("4 números");
    await expect(secao.getByRole("link", { name: "Quero ser avisado" })).toHaveAttribute("href", /plano=family/);
  });

  test("todo botão de começar leva ao cadastro", async ({ page }) => {
    const botoes = page.getByRole("link", { name: "Começar grátis" });
    expect(await botoes.count()).toBeGreaterThanOrEqual(3);
    for (const href of await botoes.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
      expect(href).toContain("/cadastro");
    }
  });

  test("privacidade explícita e aviso de independência", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Seus dados são seus" })).toBeVisible();
    await expect(page.getByText("Não acessamos sua conta bancária")).toBeVisible();
    await expect(page.getByText("sem vínculo com a Meta nem com o WhatsApp")).toBeVisible();
  });

  test("sem rolagem horizontal", async ({ page }) => {
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });

  test("sem travessão no texto visível", async ({ page }) => {
    const texto = await page.locator("body").innerText();
    expect(texto).not.toMatch(/[—–]/);
  });

  test("perguntas frequentes: abre uma por vez", async ({ page }) => {
    const perguntas = page.locator("details.pergunta");
    await perguntas.nth(0).locator("summary").click();
    await expect(perguntas.nth(0)).toHaveAttribute("open", "");
    await perguntas.nth(1).locator("summary").click();
    await expect(perguntas.nth(1)).toHaveAttribute("open", "");
    await expect(perguntas.nth(0)).not.toHaveAttribute("open", "");
  });

  test("chamada final leva o e-mail para o cadastro", async ({ page }) => {
    await page.getByLabel("Seu e-mail").fill("maria@exemplo.com");
    await page.getByRole("button", { name: "Criar conta grátis" }).click();
    await expect(page).toHaveURL(/\/cadastro\?email=maria%40exemplo\.com/);
    await expect(page.getByLabel("E-mail")).toHaveValue("maria@exemplo.com");
  });

  test("prints da página inteira", async ({ page }) => {
    const nome = test.info().project.name;
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `../docs/screens/landing-${nome}-topo.png` });
    await page.screenshot({ path: `../docs/screens/landing-${nome}.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.screenshot({ path: `../docs/screens/landing-${nome}-escuro.png`, fullPage: true });
  });
});
