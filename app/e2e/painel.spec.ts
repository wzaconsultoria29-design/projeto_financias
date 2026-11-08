import { test, expect, type Page } from "@playwright/test";
import { simular, entrar, CONTA } from "./apoio";

// Quarta-feira, 28/10/2026, 10h em São Paulo.
const AGORA = new Date("2026-10-28T13:00:00Z");

/** Os mesmos números do teste SQL da migração 015 (supabase/tests/015_painel_metricas.test.sql). */
const PAINEL = {
  periodo: { de: "2026-10-01", ate: "2026-10-31", dias: 31, dias_decorridos: 28 },
  resumo: { receitas: 3500, despesas: 1900, saldo: 1600, taxa_poupanca: 45.7, media_diaria: 67.86, quantidade: 9 },
  anterior: { de: "2026-08-31", ate: "2026-09-30", receitas: 3000, despesas: 1500, despesas_mesmo_ponto: 1400 },
  variacao_despesas_pct: 35.7,
  categorias: [
    { categoria: "Moradia", total: 1000, qtd: 1, pct: 52.6, anterior: 1000 },
    { categoria: "Alimentação", total: 500, qtd: 2, pct: 26.3, anterior: 300 },
    { categoria: "Lazer", total: 150, qtd: 1, pct: 7.9, anterior: 150 },
    { categoria: "Outras", total: 250, qtd: 4, pct: 13.2, anterior: 0 },
  ],
  pareto: { top3_pct: 86.8 },
  tipos: { essencial: 1300, superfluo: 400, investimento: 100, sem_tipo: 100 },
  fixos: { fixos_total: 1050, variaveis_total: 850, maiores: [{ descricao: "Aluguel", categoria: "Moradia", valor: 1000 }] },
  acumulado: Array.from({ length: 31 }, (_, i) => ({
    dia: i + 1,
    atual: i < 28 ? Math.round(((i + 1) / 28) * 1900) : null,
    anterior: Math.round(((i + 1) / 30) * 1500),
  })),
  dia_semana: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({ dow, total: dow === 5 ? 700 : 100, ocorrencias: 4 })),
  tendencia: [
    { mes: "2026-05-01", receitas: 0, despesas: 0 },
    { mes: "2026-06-01", receitas: 0, despesas: 0 },
    { mes: "2026-07-01", receitas: 0, despesas: 0 },
    { mes: "2026-08-01", receitas: 3000, despesas: 1000 },
    { mes: "2026-09-01", receitas: 3000, despesas: 1500 },
    { mes: "2026-10-01", receitas: 3500, despesas: 1900 },
  ],
  maiores: [{ id: "l1", data: "2026-10-02", categoria: "Moradia", descricao: "<img src=x onerror=alert(1)>", valor: 1000 }],
  projecao: { previsto: 2100, dias_decorridos: 28, dias_no_mes: 31 },
  sem_receita: false,
  historico_total: 14,
};

/** Entra no painel com o RPC simulado; devolve os parâmetros recebidos por chamada. */
async function abrirPainel(page: Page, resposta: (p: Record<string, unknown>) => unknown = () => PAINEL) {
  await page.clock.setFixedTime(AGORA);
  const chamadas: Record<string, unknown>[] = [];
  await simular(page, { login: ["ok"] }, {
    app_painel: (p) => {
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

  test("abre no mês atual, responde se está no azul e mostra saldo, categorias e previsão", async ({ page }) => {
    const chamadas = await abrirPainel(page);
    await expect(page.getByRole("heading", { name: "Visão geral", level: 1 })).toBeVisible();
    await expect(page.getByText("Você está no azul neste período.")).toBeVisible();
    await expect(page.getByText("R$ 1.600,00").first()).toBeAttached();
    await expect(page.getByText("+R$ 3.500,00")).toBeVisible();
    await expect(page.getByRole("list", { name: "Categorias de despesa" }).getByText("Alimentação")).toBeVisible();
    await expect(page.getByText("Previsão de fechamento")).toBeVisible();
    expect(chamadas[0]).toEqual({ p_de: "2026-10-01", p_ate: "2026-10-31" });
  });

  test("conta a história em ordem, com manchete e 'Como ler' em cada capítulo", async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByText("Sobraram R$ 1.600,00: você poupou 45,7% da renda.")).toBeVisible();
    const titulos = await page.locator("main h2").allTextContents();
    expect(titulos).toEqual([
      "Como você está",
      "O que mudou",
      "Para onde foi o dinheiro",
      "Essencial, supérfluo e investimento",
      "Fixos e variáveis",
      "O ritmo do período",
      "Nos últimos meses",
      "Maiores gastos",
      "O que fazer agora",
    ]);
    await expect(page.getByText("Moradia levou mais da metade do que você gastou.")).toBeVisible();
    await expect(page.getByText(/No ritmo atual, o mês fecha com R\$ 2\.100,00/)).toBeVisible();
    await expect(page.getByText("Como ler", { exact: true })).toHaveCount(6);
  });

  test("o passo da categoria que subiu leva aos lançamentos já filtrados", async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByRole("link", { name: "Ver lançamentos" })).toHaveAttribute("href", "/painel/lancamentos?categoria=Alimenta%C3%A7%C3%A3o&de=2026-10-01&ate=2026-10-31");
  });

  test("descrição com HTML é exibida como texto", async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
    await expect(page.locator("main img")).toHaveCount(0);
  });

  test("seta do mês anterior consulta setembro, e o mês atual não avança", async ({ page }) => {
    const chamadas = await abrirPainel(page);
    await expect(page.getByRole("button", { name: "Próximo mês" })).toBeDisabled();
    await page.getByRole("button", { name: "Mês anterior" }).click();
    await expect.poll(() => chamadas.at(-1)).toEqual({ p_de: "2026-09-01", p_ate: "2026-09-30" });
    await expect(page.locator('header [aria-live="polite"]')).toHaveText("setembro de 2026");
    await expect(page.getByRole("button", { name: "Próximo mês" })).toBeEnabled();
  });

  test("30 dias consulta a janela até hoje e esconde a previsão do mês", async ({ page }) => {
    const chamadas = await abrirPainel(page, (p) => ({ ...PAINEL, periodo: { ...PAINEL.periodo, de: p.p_de, ate: p.p_ate }, projecao: p.p_de === "2026-10-01" ? PAINEL.projecao : null }));
    await page.getByRole("button", { name: "30 dias" }).click();
    await expect.poll(() => chamadas.at(-1)?.p_ate).toBe("2026-10-28");
    await expect(page.getByText("Previsão de fechamento")).toHaveCount(0);
  });

  test("intervalo personalizado consulta as datas escolhidas", async ({ page }) => {
    const chamadas = await abrirPainel(page);
    await page.getByRole("button", { name: "Personalizado" }).click();
    await page.getByLabel("De", { exact: true }).fill("2026-10-05");
    await page.getByLabel("Até", { exact: true }).fill("2026-10-10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect.poll(() => chamadas.at(-1)).toEqual({ p_de: "2026-10-05", p_ate: "2026-10-10" });
  });

  test("conta nova mostra os primeiros passos e quadros vazios sem NaN", async ({ page }) => {
    await abrirPainel(page, () => ({
      ...PAINEL,
      resumo: { receitas: 0, despesas: 0, saldo: 0, taxa_poupanca: null, media_diaria: 0, quantidade: 0 },
      variacao_despesas_pct: null,
      categorias: [],
      pareto: { top3_pct: null },
      tipos: { essencial: 0, superfluo: 0, investimento: 0, sem_tipo: 0 },
      fixos: { fixos_total: 0, variaveis_total: 0, maiores: [] },
      acumulado: null,
      tendencia: [],
      maiores: [],
      projecao: null,
      historico_total: 0,
    }));
    await expect(page.getByRole("heading", { name: "Primeiros passos" })).toBeVisible();
    await expect(page.getByText("Nenhuma despesa neste período.").first()).toBeVisible();
    await expect(page.getByText("Nada foi lançado neste período ainda.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("NaN");
  });

  test("sem renda registrada convida a registrar e não mostra taxa de poupança", async ({ page }) => {
    await abrirPainel(page, () => ({
      ...PAINEL,
      sem_receita: true,
      resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 },
    }));
    await expect(page.getByText("Registre a sua renda deste período").first()).toBeVisible();
    await expect(page.getByRole("meter")).toHaveCount(0);
  });

  test("sem receita lançada, a renda mensal do perfil entra e o pedido para registrar some", async ({ page }) => {
    await page.clock.setFixedTime(AGORA);
    await simular(page, { login: ["ok"] }, {
      app_painel: () => ({
        ...PAINEL,
        sem_receita: true,
        resumo: { receitas: 0, despesas: 2500, saldo: -2500, taxa_poupanca: null, media_diaria: 80, quantidade: 4 },
      }),
      app_minha_conta: () => ({ ...CONTA, renda_mensal: 10000, custo_vida_mensal: 20000 }),
    });
    await entrar(page);
    await expect(page.getByText("Renda mensal informada no seu perfil")).toBeVisible();
    await expect(page.getByText("Registre a sua renda deste período")).toHaveCount(0);
    await expect(page.getByRole("meter", { name: "Taxa de poupança" })).toHaveAttribute("aria-valuenow", "75");
  });

  test("erro do servidor mostra mensagem amigável e Tentar de novo recarrega", async ({ page }) => {
    let falhar = true;
    const chamadas = await abrirPainel(page, () => (falhar ? new Error("erro_interno: detalhe técnico") : PAINEL));
    await expect(page.getByRole("alert").filter({ hasText: "Algo deu errado" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("detalhe técnico");
    falhar = false;
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(page.getByText("+R$ 3.500,00")).toBeVisible();
    expect(chamadas.length).toBeGreaterThanOrEqual(2);
  });

  test("Lançar abre o formulário na própria Visão geral", async ({ page }) => {
    await abrirPainel(page);
    await page.getByRole("button", { name: "Lançar" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("mês em andamento mostra quanto ainda pode gastar por dia", async ({ page }) => {
    await abrirPainel(page);
    // renda 3.500 menos gasto 1.900 = 1.600, divididos pelos 3 dias que faltam (28 de 31 já passaram)
    await expect(page.getByText("Pode gastar por dia até o fim do mês")).toBeVisible();
    await expect(page.getByText("R$ 533,33")).toBeVisible();
    await expect(page.getByText(/Sobram R\$ 1\.600,00 da renda registrada, em 3 dias/)).toBeVisible();
  });

  test("olho esconde os valores com desfoque, lembra a escolha e mostra de novo", async ({ page }) => {
    await abrirPainel(page);
    const valor = page.getByText("R$ 533,33");
    const filtro = () => valor.evaluate((el) => getComputedStyle(el).filter);
    expect(await filtro()).toBe("none");
    const botao = page.getByRole("button", { name: "Esconder valores" });
    await expect(botao).toHaveAttribute("aria-pressed", "false");
    await botao.click();
    await expect(botao).toHaveAttribute("aria-pressed", "true");
    await expect.poll(filtro).toContain("blur");
    await page.screenshot({ path: `../docs/screens/painel-visao-escondido-${test.info().project.name}.png`, fullPage: true });
    expect(await page.evaluate(() => localStorage.getItem("painel-valores-escondidos"))).toBe("1");
    // o que não é valor continua legível
    await expect(page.getByRole("heading", { name: "Para onde foi o dinheiro" })).toBeVisible();
    await botao.click();
    await expect.poll(filtro).toBe("none");
    expect(await page.evaluate(() => localStorage.getItem("painel-valores-escondidos"))).toBe("0");
  });

  test("enquanto carrega, mostra o esqueleto com o desenho da tela pronta", async ({ page }) => {
    await page.clock.setFixedTime(AGORA);
    await simular(page, { login: ["ok"] }, { app_painel: () => PAINEL });
    // a resposta do banco demora; esta rota vem depois da simulação e, por isso, passa na frente dela
    await page.route("**/rest/v1/rpc/app_painel", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.fallback();
    });
    await entrar(page);
    const esqueleto = page.getByLabel("Carregando");
    await expect(esqueleto).toBeVisible();
    await expect(esqueleto.locator("[data-esqueleto-cartao]")).toHaveCount(9);
    await page.screenshot({ path: `../docs/screens/painel-carregando-${test.info().project.name}.png`, fullPage: true });
    await expect(page.getByText("+R$ 3.500,00")).toBeVisible({ timeout: 10000 });
    await expect(esqueleto).toHaveCount(0);
  });

  test("perguntas sugeridas abrem o WhatsApp do assistente já escritas", async ({ page }) => {
    await abrirPainel(page);
    const link = page.getByRole("link", { name: "Onde posso economizar?" });
    await expect(link).toHaveAttribute("href", "https://wa.me/5582991130317?text=Onde%20posso%20economizar%3F");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("atalho para conversar no WhatsApp e sem rolagem horizontal", async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByRole("link", { name: /Conversar no WhatsApp/ }).first()).toHaveAttribute("href", "https://wa.me/5582991130317");
    await expect(page.getByText("+R$ 3.500,00")).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `../docs/screens/painel-visao-${test.info().project.name}.png`, fullPage: true });
  });
});
