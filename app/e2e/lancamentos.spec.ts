import { test, expect, type Page } from "@playwright/test";
import { simular, entrar, CONTA } from "./apoio";

const AGORA = new Date("2026-10-28T13:00:00Z");

const ITENS = [
  { id: "l1", data: "2026-10-27", tipo: "despesa", valor: 32.9, categoria: "Alimentação", subcategoria: null, descricao: "Almoço no restaurante", metodo_pagamento: "Pix", origem: "whatsapp", codigo: "DEL#1" },
  { id: "l2", data: "2026-10-26", tipo: "receita", valor: 1500, categoria: "Outros", subcategoria: null, descricao: "Pagamento de cliente", metodo_pagamento: null, origem: "painel", codigo: "DEL#2" },
  { id: "l3", data: "2026-10-25", tipo: "despesa", valor: 89.9, categoria: null, subcategoria: null, descricao: "x".repeat(300), metodo_pagamento: "Crédito", origem: "whatsapp", codigo: "DEL#3" },
];

async function abrir(page: Page, rota: string) {
  await page.clock.setFixedTime(AGORA);
  const salvos: Record<string, unknown>[] = [];
  await simular(page, { login: ["ok"] }, {
    app_lancamentos: () => ({ total: ITENS.length, itens: ITENS }),
    app_salvar_lancamento: (p) => {
      salvos.push(p);
      return { ok: true, id: "novo" };
    },
    app_minha_conta: () => ({
      ...CONTA,
      plano: { codigo: "trial", nome: "Teste grátis", preco_centavos: 0, mensagens_limite: 50, membros_max: 1 },
      assinatura: { status: "trial", periodo_inicio: "2026-10-24", periodo_fim: "2026-10-31" },
      uso: { mensagens: 12, limite: 50, restantes: 38 },
      consentimento: { em: "2026-10-24T12:00:00Z", versao: "v1-2026-10" },
    }),
  });
  await entrar(page);
  await page.getByRole("navigation", { name: "Painel" }).getByRole("link", { name: rota }).click();
  return salvos;
}

test.describe("painel: lançamentos e conta", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("lista os lançamentos sem rolagem horizontal e com descrição longa truncada", async ({ page }) => {
    await abrir(page, "Lançamentos");
    await expect(page.getByText("Almoço no restaurante")).toBeVisible();
    await expect(page.getByText("+ R$ 1.500,00")).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `../docs/screens/painel-lancamentos-${test.info().project.name}.png`, fullPage: true });
  });

  test("celular: cada lançamento é uma linha compacta", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile");
    await abrir(page, "Lançamentos");
    const linha = page.locator("li", { hasText: "Almoço no restaurante" });
    await expect(linha).toBeVisible();
    // antes cada item virava um cartão de ~250px; agora cabe em uma faixa curta
    expect((await linha.boundingBox())!.height).toBeLessThanOrEqual(96);
    await expect(linha).toContainText("Alimentação");
    await expect(linha).toContainText("R$ 32,90");
    await expect(linha.getByRole("button", { name: /Editar/ })).toBeVisible();
    await expect(linha.getByRole("button", { name: /Excluir/ })).toBeVisible();
  });

  test("celular: a janela de novo lançamento cabe na tela e não dá zoom no iPhone", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile");
    await abrir(page, "Lançamentos");
    await page.getByRole("button", { name: "Novo lançamento" }).click();
    const janela = page.getByRole("dialog");
    await expect(janela).toBeVisible();
    const caixa = (await janela.boundingBox())!;
    const largura = page.viewportSize()!.width;
    expect(caixa.x).toBeGreaterThanOrEqual(0);
    expect(caixa.x + caixa.width).toBeLessThanOrEqual(largura);
    // o iPhone aumenta a página ao focar campo com letra menor que 16px, e a janela "sai" da tela
    const tamanhos = await janela.locator("input, select").evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    for (const t of tamanhos) expect(t).toBeGreaterThanOrEqual(16);
    // nenhum campo passa da borda da janela (o campo de data do iPhone tem largura mínima própria)
    const direitas = await janela.locator("input, select").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right));
    for (const d of direitas) expect(d).toBeLessThanOrEqual(caixa.x + caixa.width);
  });

  test("novo lançamento envia o formulário com id nulo", async ({ page }) => {
    const salvos = await abrir(page, "Lançamentos");
    await page.getByRole("button", { name: "Novo lançamento" }).click();
    await page.getByLabel("Valor").fill("15,90");
    await page.getByLabel("Descrição").fill("Café");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect.poll(() => salvos.length).toBe(1);
    expect(salvos[0]).toMatchObject({ p_id: null, p_dados: { valor: 15.9, descricao: "Café", tipo: "despesa" } });
  });
});
