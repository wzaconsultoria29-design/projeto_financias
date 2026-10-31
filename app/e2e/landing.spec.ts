import { test, expect } from "@playwright/test";

test.describe("landing", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("hero: promessa em até 2 linhas e botão visível sem rolar", async ({ page }) => {
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("WhatsApp");
    const linhas = await h1.evaluate((el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
    if (test.info().project.name === "desktop") expect(linhas).toBeLessThanOrEqual(2.01);
    await expect(page.getByRole("main").getByRole("link", { name: "Começar grátis" }).first()).toBeInViewport();
  });

  test("navegação em uma linha e com altura contida (desktop)", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop");
    const header = page.locator("header").first();
    expect((await header.boundingBox())!.height).toBeLessThanOrEqual(80);
    const topos = await header.locator("nav a").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(topos).size).toBe(1);
  });

  test("três planos com preços e Family marcado como em breve", async ({ page }) => {
    const planos = page.locator("[data-plano]");
    await expect(planos).toHaveCount(3);
    await expect(page.locator('[data-plano="trial"]')).toContainText("Grátis");
    await expect(page.locator('[data-plano="essencial"]')).toContainText("R$ 19");
    await expect(page.locator('[data-plano="family"]')).toContainText("R$ 39");
    await expect(page.locator('[data-plano="family"]')).toContainText("Em breve");
    await expect(page.locator('[data-plano="family"]')).toContainText("4 números");
  });

  test("todo botão de começar leva ao cadastro", async ({ page }) => {
    const botoes = page.getByRole("link", { name: "Começar grátis" });
    expect(await botoes.count()).toBeGreaterThanOrEqual(3);
    for (const href of await botoes.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
      expect(href).toContain("/cadastro");
    }
  });

  test("privacidade explícita e aviso de independência", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Seus dados são só seus" })).toBeVisible();
    await expect(page.getByText("Não acessamos sua conta bancária")).toBeVisible();
    await expect(page.getByText("não tem vínculo com a Meta nem com o WhatsApp")).toBeVisible();
  });

  test("sem rolagem horizontal", async ({ page }) => {
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });

  test("sem travessão no texto visível", async ({ page }) => {
    const texto = await page.locator("body").innerText();
    expect(texto).not.toMatch(/[—–]/);
  });

  test("perguntas frequentes abrem e fecham", async ({ page }) => {
    const pergunta = page.locator("details").first();
    await expect(pergunta).not.toHaveAttribute("open", "");
    await pergunta.locator("summary").click();
    await expect(pergunta).toHaveAttribute("open", "");
  });
});
