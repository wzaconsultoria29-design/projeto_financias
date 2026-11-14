import { test, expect } from "@playwright/test";

test.describe("landing", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    // Espera o React assumir a página: digitar antes disso faz o texto se misturar com o valor inicial.
    await page.waitForFunction(() =>
      ["#demo-gasto"].every((seletor) => {
        const el = document.querySelector(seletor);
        return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps"));
      }),
    );
  });

  test("topo: promessa em até 2 linhas e botão visível sem rolar", async ({ page }) => {
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("Gastou?");
    await expect(h1).toContainText("Manda no WhatsApp.");
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
    const visivel = (texto: string) => page.getByText(texto).and(page.locator(":visible")).first();
    await expect(visivel("R$ 2.040,40")).toBeVisible();
    await page.getByLabel("Escreva um gasto").fill("gastei 32 no almoço");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Anotado: R$ 32,00, Almoço, Alimentação.")).toBeVisible();
    await expect(visivel("R$ 2.072,40")).toBeVisible();
  });

  test("demonstração do topo: frase sem valor recebe ajuda, não erro", async ({ page }) => {
    await page.getByLabel("Escreva um gasto").fill("bom dia");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Não achei o valor. Tente assim: gastei 32 no almoço.")).toBeVisible();
  });

  test("estrutura enxuta: cada demonstração aparece uma vez só", async ({ page }) => {
    await expect(page.locator("#conversa")).toHaveCount(0);
    await expect(page.locator("textarea#mensagens")).toHaveCount(0);
    await expect(page.locator("#demo-gasto")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /por que .* é pago/i })).toHaveCount(0);
    expect(await page.locator("main > section").count()).toBeLessThanOrEqual(8);
    await expect(page.locator("header nav a", { hasText: "Painel" })).toHaveAttribute("href", "#recursos");
  });

  test("recursos: trocar o período e comparar atualiza o painel fixo", async ({ page }) => {
    const secao = page.locator("#recursos");
    await secao.scrollIntoViewIfNeeded();
    await secao.getByRole("button", { name: "Semana" }).click();
    await expect(secao).toContainText("Esta semana");
    await secao.getByRole("switch").click();
    await expect(secao).toContainText("semana passada");
  });

  test("recursos no celular: painel não fica fixo por cima do texto e vem logo depois dos botões", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile");
    const secao = page.locator("#recursos");
    await secao.scrollIntoViewIfNeeded();
    const painel = secao.locator("[data-painel-recursos]");
    expect(await painel.evaluate((e) => getComputedStyle(e).position), "painel fixo cobre o texto ao rolar").not.toBe("sticky");
    const botao = (await secao.getByRole("button", { name: "Semana" }).boundingBox())!;
    const caixa = (await painel.boundingBox())!;
    expect(botao.y).toBeLessThan(caixa.y);
    // o painel aparece inteiro, sem corte embaixo
    expect(await painel.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  });

  test("topo no celular também tem vida: objetos 3D, contador e cartões flutuantes", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile");
    await expect(page.locator(".objeto3d:visible")).not.toHaveCount(0);
    await expect(page.getByText("lançamentos organizados")).toBeVisible();
    await expect(page.locator(".chip-entra:visible")).not.toHaveCount(0);
  });

  test("planos: três cartões, o do meio em destaque e Family com opção de assinar", async ({ page }) => {
    const secao = page.locator("#planos");
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator("[data-plano]")).toHaveCount(3);
    const trial = secao.locator('[data-plano="trial"]');
    await expect(trial).toContainText("Grátis");
    await expect(trial).toContainText("por 7 dias");
    await expect(trial).toContainText("Ganha mais 3 dias");
    const essencial = secao.locator('[data-plano="essencial"]');
    await expect(essencial).toContainText("R$ 19");
    await expect(essencial).toContainText("Mais popular");
    const family = secao.locator('[data-plano="family"]');
    await expect(family).toContainText("R$ 39");
    await expect(family).not.toContainText("Em breve");
    await expect(family).toContainText("Até 4 pessoas");
    await expect(family.getByRole("link", { name: "Assinar o Family" })).toHaveAttribute("href", /plano=family/);
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
    await expect(page.locator("#privacidade")).toContainText("Sem anúncios nem oferta de crédito.");
    await expect(page.getByText("sem vínculo com a Meta nem com o WhatsApp")).toBeVisible();
  });

  test("contador do topo sobe quando um gasto é escrito", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop");
    const contador = page.locator('p[aria-live="polite"]').filter({ hasText: "lançamentos organizados" });
    await expect(contador).toContainText("7 lançamentos organizados");
    await page.getByLabel("Escreva um gasto").fill("gastei 32 no almoço");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(contador).toContainText("8 lançamentos organizados");
  });

  test("barra fixa: some no topo e nos planos, aparece entre as seções e leva ao cadastro", async ({ page }) => {
    const barra = page.locator("[data-barra-cta]");
    await expect(barra).toHaveAttribute("data-visivel", "false");
    await page.locator("#recursos").scrollIntoViewIfNeeded();
    await expect(barra).toHaveAttribute("data-visivel", "true");
    await expect(barra.getByRole("link", { name: "Começar grátis" })).toHaveAttribute("href", "/cadastro");
    await page.locator("#planos").scrollIntoViewIfNeeded();
    await expect(barra).toHaveAttribute("data-visivel", "false");
  });

  test("planos: custo por dia calculado e garantias à vista", async ({ page }) => {
    const secao = page.locator("#planos");
    await expect(secao.locator('[data-plano="essencial"]')).toContainText("Cerca de R$ 0,63 por dia");
    await expect(secao).toContainText("Pix, cartão ou boleto pelo Mercado Pago");
    await expect(secao).toContainText("Sem renovação automática");
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

  test("perguntas frequentes: login com e-mail e senha, pagamento explicado e nada desatualizado", async ({ page }) => {
    const faq = page.locator("#perguntas");
    await faq.getByText("Como entro no painel?").click();
    await expect(faq).toContainText("e-mail e senha");
    await expect(faq).toContainText("Como eu pago?");
    await expect(faq).not.toContainText("em desenvolvimento");
    await expect(page.locator("main")).not.toContainText("confirma o e-mail");
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
