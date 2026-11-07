import { test, expect } from "@playwright/test";
import { simular, entrar } from "./apoio";

test.describe("entrar pelo WhatsApp", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("mostra o botão, o código, a contagem e o link do WhatsApp", async ({ page }) => {
    await simular(page, { login: ["pendente"] });
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Gerar código" }).click();
    await expect(page.getByText("123456")).toBeVisible();
    await expect(page.getByText(/Nunca envie este código a pedido de outra pessoa/)).toBeVisible();
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
    // no computador o trilho mostra a inicial da pessoa, com o nome na dica; no celular não há espaço para ela
    if (test.info().project.name === "desktop") await expect(page.getByTitle("Maria Silva")).toBeVisible();
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
