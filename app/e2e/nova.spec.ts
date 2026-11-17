import { test, expect } from "@playwright/test";

test.describe("landing nova (/nova)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/nova");
    await page.waitForFunction(() => {
      const el = document.querySelector("#nv-gasto");
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps"));
    });
  });

  test("topo: título em até 2 linhas, o que é e botão de começar à vista", async ({ page }) => {
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("Controle financeiro");
    const linhas = await h1.evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
    expect(linhas).toBeLessThanOrEqual(2);
    const botao = page.getByRole("main").getByRole("link", { name: "Começar grátis" }).first();
    await expect(botao).toBeInViewport();
    await expect(botao).toHaveAttribute("href", "/cadastro");
    await expect(page.getByRole("main")).toContainText("7 dias grátis");
  });

  test("conversa do topo: o roteiro já soma no painel e um gasto escrito entra na conta", async ({ page }) => {
    const total = page.locator("[data-total-topo]");
    await expect(total).toHaveText("R$ 2.177,30");
    await page.getByLabel("Escreva um gasto").fill("gastei 50 no cinema");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Anotado: R$ 50,00, Cinema, Lazer.")).toBeVisible();
    await expect(total).toHaveText("R$ 2.227,30");
  });

  test("conversa do topo: frase sem valor recebe ajuda", async ({ page }) => {
    await page.getByLabel("Escreva um gasto").fill("bom dia");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Não achei o valor. Tente assim: gastei 32 no almoço.")).toBeVisible();
  });

  test("como entende: texto, áudio e foto viram o mesmo lançamento", async ({ page }) => {
    const secao = page.locator("#como-funciona");
    await secao.scrollIntoViewIfNeeded();
    await secao.getByRole("tab", { name: /Áudio/ }).click();
    await expect(secao.locator("[data-campo='categoria']")).toHaveText("Transporte");
    await secao.getByRole("tab", { name: /Foto/ }).click();
    await expect(secao.locator("[data-campo='valor']")).toHaveText("R$ 86,40");
  });

  test("painel: trocar o período recalcula", async ({ page }) => {
    const secao = page.locator("#painel");
    await secao.scrollIntoViewIfNeeded();
    await expect(secao).toContainText("Este mês");
    await secao.getByRole("button", { name: "Semana" }).click();
    await expect(secao).toContainText("Esta semana");
    await expect(secao).toContainText("R$ 419,10");
  });

  test("planos: três cartões e a calculadora indica o plano", async ({ page }) => {
    const secao = page.locator("#planos");
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator("[data-plano]")).toHaveCount(3);
    await expect(secao.locator('[data-plano="essencial"]')).toContainText("R$ 19");
    await expect(secao.locator('[data-plano="essencial"]')).toHaveAttribute("data-indicado", "true");
    await expect(secao.locator('[data-plano="family"]')).toContainText("R$ 39");
    await secao.getByRole("button", { name: "3 pessoas" }).click();
    await expect(secao.locator('[data-plano="family"]')).toHaveAttribute("data-indicado", "true");
    await expect(secao.locator('[data-plano="essencial"]')).toHaveAttribute("data-indicado", "false");
    await expect(secao).toContainText("Sem renovação automática");
    await expect(secao.locator('[data-plano="family"]').getByRole("link")).toHaveAttribute("href", /plano=family/);
  });

  test("todo botão de começar leva ao cadastro", async ({ page }) => {
    const hrefs = await page.getByRole("link", { name: "Começar grátis" }).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const h of hrefs) expect(h).toContain("/cadastro");
  });

  test("privacidade e aviso de independência", async ({ page }) => {
    await expect(page.locator("#privacidade")).toContainText("Não acessamos sua conta bancária.");
    await expect(page.getByText("sem vínculo com a Meta nem com o WhatsApp")).toBeVisible();
  });

  test("perguntas: abre uma por vez", async ({ page }) => {
    const perguntas = page.locator("#perguntas details");
    await perguntas.nth(0).locator("summary").click();
    await expect(perguntas.nth(0)).toHaveAttribute("open", "");
    await perguntas.nth(1).locator("summary").click();
    await expect(perguntas.nth(0)).not.toHaveAttribute("open", "");
  });

  test("chamada final leva o e-mail para o cadastro", async ({ page }) => {
    await page.getByLabel("Seu e-mail").fill("maria@exemplo.com");
    await page.getByRole("button", { name: "Criar conta grátis" }).click();
    await expect(page).toHaveURL(/\/cadastro\?email=maria%40exemplo\.com/);
  });

  test("sem rolagem horizontal, sem travessão e sem conteúdo escondido", async ({ page }) => {
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    expect(await page.locator("body").innerText()).not.toMatch(/[—–]/);
    const escondidos = await page.locator("[data-revela]").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
    expect(escondidos).toBe(0);
  });

  test("prints", async ({ page }) => {
    const nome = test.info().project.name;
    await page.screenshot({ path: `../docs/screens/nova-${nome}-topo.png` });
    await page.screenshot({ path: `../docs/screens/nova-${nome}.png`, fullPage: true });
  });
});

test.describe("telas públicas no visual escuro", () => {
  for (const [nome, rota] of [["cadastro", "/cadastro"], ["termos", "/termos"], ["privacidade", "/privacidade"], ["convite", "/convite/ABCDEFGHJK"], ["login", "/entrar"]] as const) {
    test(`${nome} usa a casca escura e não sobra rolagem lateral`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(rota);
      const fundo = await page.locator(".nv").first().evaluate((e) => getComputedStyle(e).backgroundColor);
      expect(fundo).toBe("rgb(3, 10, 7)");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
  }
});
