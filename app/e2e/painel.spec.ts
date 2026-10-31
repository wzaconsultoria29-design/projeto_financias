import { test, expect, type Page } from "@playwright/test";
import { simular, entrar } from "./apoio";

// Quarta-feira, 28/10/2026, 10h em São Paulo: a semana vai de 26/10 a 28/10.
const AGORA = new Date("2026-10-28T13:00:00Z");

const VISAO = {
  periodo: { de: "2026-10-01", ate: "2026-10-28", dias: 28 },
  totais: { despesas: 700, receitas: 1000, saldo: 300, quantidade: 4 },
  anterior: { de: "2026-09-03", ate: "2026-09-30", despesas: 500, receitas: 900 },
  variacao_despesas_pct: 40,
  serie_diaria: [
    { data: "2026-10-20", despesas: 200, receitas: 0 },
    { data: "2026-10-21", despesas: 500, receitas: 1000 },
  ],
  por_categoria: [
    { categoria: "Alimentação", total: 450, qtd: 3, pct: 64.3 },
    { categoria: "Transporte", total: 250, qtd: 1, pct: 35.7 },
  ],
  maiores: [{ id: "l1", data: "2026-10-21", categoria: "Alimentação", descricao: "<img src=x onerror=alert(1)>", valor: 300 }],
  projecao_mes: { previsto: 1000, dias_decorridos: 28, dias_no_mes: 31 },
};

/** Entra no painel com o RPC simulado; devolve os parâmetros recebidos por chamada. */
async function abrirPainel(page: Page, resposta: (p: Record<string, unknown>) => unknown = () => VISAO) {
  await page.clock.setFixedTime(AGORA);
  const chamadas: Record<string, unknown>[] = [];
  await simular(page, { login: ["ok"] }, {
    app_visao_geral: (p) => {
      chamadas.push(p);
      return resposta(p);
    },
  });
  await entrar(page);
  return chamadas;
}

test.describe("painel: visão geral", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("abre no mês atual e mostra totais, categorias, maiores gastos e projeção", async ({ page }) => {
    const chamadas = await abrirPainel(page);
    await expect(page.getByText("R$ 700,00").first()).toBeVisible();
    await expect(page.getByText("R$ 1.000,00").first()).toBeVisible();
    await expect(page.getByText("Alimentação").first()).toBeVisible();
    await expect(page.getByText("Previsão para fechar o mês")).toBeVisible();
    expect(chamadas[0]).toEqual({ p_de: "2026-10-01", p_ate: "2026-10-28" });
  });

  test("descrição com HTML é exibida como texto", async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
    await expect(page.locator("main img, section img")).toHaveCount(0);
  });

  test("trocar para Semana consulta de segunda a hoje e esconde a projeção", async ({ page }) => {
    const chamadas = await abrirPainel(page, (p) => ({
      ...VISAO,
      periodo: { de: p.p_de, ate: p.p_ate, dias: 3 },
      projecao_mes: p.p_de === "2026-10-01" ? VISAO.projecao_mes : null,
    }));
    await page.getByRole("button", { name: "Semana" }).click();
    await expect.poll(() => chamadas.at(-1)).toEqual({ p_de: "2026-10-26", p_ate: "2026-10-28" });
    await expect(page.getByText("Previsão para fechar o mês")).toHaveCount(0);
  });

  test("intervalo personalizado consulta as datas escolhidas", async ({ page }) => {
    const chamadas = await abrirPainel(page);
    await page.getByRole("button", { name: "Personalizado" }).click();
    await page.getByLabel("De", { exact: true }).fill("2026-10-05");
    await page.getByLabel("Até", { exact: true }).fill("2026-10-10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect.poll(() => chamadas.at(-1)).toEqual({ p_de: "2026-10-05", p_ate: "2026-10-10" });
  });

  test("sem lançamentos mostra o estado vazio com atalho para o WhatsApp", async ({ page }) => {
    await abrirPainel(page, () => ({
      ...VISAO,
      totais: { despesas: 0, receitas: 0, saldo: 0, quantidade: 0 },
      variacao_despesas_pct: null,
      serie_diaria: [],
      por_categoria: [],
      maiores: [],
      projecao_mes: null,
    }));
    await expect(page.getByText("Nenhum lançamento neste período").first()).toBeVisible();
    await expect(page.getByText("—").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("NaN");
  });

  test("erro do servidor mostra mensagem amigável e Tentar de novo recarrega", async ({ page }) => {
    let falhar = true;
    const chamadas = await abrirPainel(page, () => (falhar ? new Error("erro_interno: detalhe técnico") : VISAO));
    await expect(page.getByRole("alert").filter({ hasText: "Algo deu errado" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("detalhe técnico");
    falhar = false;
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(page.getByText("R$ 700,00").first()).toBeVisible();
    expect(chamadas.length).toBeGreaterThanOrEqual(2);
  });

  test("atalho para registrar pelo WhatsApp e sem rolagem horizontal", async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByRole("link", { name: /Registrar pelo WhatsApp/ })).toHaveAttribute("href", "https://wa.me/5582991130317");
    await expect(page.getByText("R$ 700,00").first()).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `../docs/screens/painel-visao-${test.info().project.name}.png`, fullPage: true });
  });
});
