import { test, expect, type Page } from "@playwright/test";
import { simular, entrar, CONTA, PLANOS, GRUPO_SEM_FAMILY } from "./apoio";

type Rpcs = NonNullable<Parameters<typeof simular>[2]>;

async function abrir(page: Page, rpcs: Rpcs = {}) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await simular(page, { login: ["ok"] }, rpcs);
  await entrar(page);
}

async function irParaConfiguracoes(page: Page) {
  await page.getByRole("link", { name: "Configurações" }).first().click();
  await expect(page).toHaveURL(/\/painel\/configuracoes\/conta$/);
}

test.describe("painel: configurações", () => {
  test("o item Configurações leva à Conta e as áreas do menu abrem", async ({ page }) => {
    await abrir(page);
    await irParaConfiguracoes(page);
    await expect(page.getByRole("heading", { name: "Sua conta", level: 2 })).toBeVisible();
    const menu = page.getByRole("navigation", { name: "Configurações" });
    for (const area of ["Aparência e segurança", "Plano e pagamentos", "Acesso compartilhado", "WhatsApp", "Notificações", "Privacidade e dados"]) {
      await menu.getByRole("link", { name: area }).click();
      await expect(page.getByRole("heading", { name: area, level: 2 })).toBeVisible();
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sobra, `rolagem horizontal em ${area}`).toBeLessThanOrEqual(0);
    }
  });

  test("o endereço antigo /painel/conta leva para as Configurações", async ({ page }) => {
    await abrir(page);
    await page.goto("/painel/conta");
    await expect(page).toHaveURL(/\/painel\/configuracoes\/conta$/);
    await expect(page.getByRole("heading", { name: "Sua conta", level: 2 })).toBeVisible();
  });

  test("Conta: salva renda e custo de vida lidos em reais", async ({ page }) => {
    const salvos: Record<string, unknown>[] = [];
    await abrir(page, {
      app_salvar_perfil: (c) => {
        salvos.push(c);
        return { ok: true };
      },
    });
    await irParaConfiguracoes(page);
    await expect(page.getByLabel("Nome")).toHaveValue(CONTA.nome);
    await page.getByLabel("Renda mensal").fill("4.200,50");
    await page.getByLabel("Custo de vida mensal").fill("1900");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Salvo.")).toBeVisible();
    expect(salvos).toEqual([{ p_nome: CONTA.nome, p_renda: 4200.5, p_custo: 1900 }]);
    await page.screenshot({ path: `../docs/screens/painel-configuracoes-conta-${test.info().project.name}.png`, fullPage: true });
  });

  test("Conta: valor inválido não é enviado", async ({ page }) => {
    const salvos: unknown[] = [];
    await abrir(page, { app_salvar_perfil: (c) => (salvos.push(c), { ok: true }) });
    await irParaConfiguracoes(page);
    await page.getByLabel("Renda mensal").fill("abc");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText(/Confira a renda mensal/)).toBeVisible();
    expect(salvos).toHaveLength(0);
  });

  test("Aparência: tema escuro e claro mudam a página na hora", async ({ page }) => {
    await abrir(page);
    await page.goto("/painel/configuracoes/aparencia");
    const fundo = () => page.evaluate(() => getComputedStyle(document.querySelector(".app-vl")!).backgroundColor);
    await page.getByText("Escuro", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
    expect(await fundo()).toBe("rgb(10, 18, 14)");
    await page.screenshot({ path: `../docs/screens/painel-configuracoes-aparencia-${test.info().project.name}.png`, fullPage: true });
    await page.getByText("Claro", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
    expect(await fundo()).toBe("rgb(238, 241, 237)");
    await page.getByText("Automático", { exact: true }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-tema", /.+/);
  });

  test("Aparência: 'Ocultar valores ao abrir' começa o painel com os valores escondidos", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("painel-ocultar-ao-abrir", "1"));
    await abrir(page);
    await expect(page.locator('[data-privado="true"]')).toBeVisible();
  });

  test("Plano: mostra o plano e o uso das mensagens", async ({ page }) => {
    await abrir(page, {
      app_minha_conta: () => ({
        ...CONTA,
        plano: { codigo: "trial", nome: "Teste grátis", preco_centavos: 0, mensagens_limite: 50, membros_max: 1 },
        assinatura: { status: "trial", periodo_inicio: "2026-10-24", periodo_fim: "2026-10-31" },
        uso: { mensagens: 12, limite: 50, restantes: 38 },
      }),
    });
    await page.goto("/painel/configuracoes/plano");
    await expect(page.getByText("12 de 50 mensagens")).toBeVisible();
    await expect(page.getByText("Teste grátis").first()).toBeVisible();
  });

  test("Plano: Family tem botão para assinar, o pedido é registrado e o plano não muda", async ({ page }) => {
    let estado: typeof PLANOS = { ...PLANOS, atual: "essencial" };
    const pedidos: unknown[] = [];
    await abrir(page, {
      app_plano_e_pagamentos: () => estado,
      app_solicitar_plano: (c) => {
        pedidos.push(c);
        estado = { ...estado, solicitacao: { codigo: "family", nome: "Family", criado_em: "2026-11-07T12:00:00Z" } };
        return { ok: true, nome: "Family" };
      },
      app_cancelar_pedido_plano: () => {
        estado = { ...estado, solicitacao: null };
        return { ok: true };
      },
    });
    await page.goto("/painel/configuracoes/plano");
    await expect(page.locator("body")).not.toContainText(/em breve/i);
    await page.getByRole("button", { name: "Assinar o Family" }).click();
    await expect(page.getByText(/Pedido registrado: Family/)).toBeVisible();
    await expect(page.getByText(/plano atual não muda até lá/)).toBeVisible();
    expect(pedidos).toEqual([{ p_codigo: "family" }]);
    await page.screenshot({ path: `../docs/screens/painel-configuracoes-plano-${test.info().project.name}.png`, fullPage: true });
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(page.getByRole("button", { name: "Assinar o Family" })).toBeVisible();
  });

  test("Plano: histórico de pagamentos lista as cobranças", async ({ page }) => {
    await abrir(page, {
      app_plano_e_pagamentos: () => ({ ...PLANOS, atual: "essencial", pagamentos: [{ id: "p1", data: "2026-10-07T12:00:00Z", descricao: "Essencial, mensalidade", valor_centavos: 1900, status: "pago" }] }),
    });
    await page.goto("/painel/configuracoes/plano");
    const tabela = page.getByRole("table", { name: /histórico de pagamentos/i });
    await expect(tabela).toContainText("R$ 19,00");
    await expect(tabela).toContainText("Pago");
  });

  test("Acesso: sem Family, convida a conhecer o plano", async ({ page }) => {
    await abrir(page, { app_grupo: () => GRUPO_SEM_FAMILY });
    await page.goto("/painel/configuracoes/acesso");
    await expect(page.getByText(/disponível no plano Family/i)).toBeVisible();
    await page.getByRole("link", { name: "Ver o plano Family" }).click();
    await expect(page).toHaveURL(/\/painel\/configuracoes\/plano$/);
  });

  test("Acesso: titular convida, vê o link uma vez e cancela o convite", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
    let convites = [{ id: "c1", criado_em: "2026-11-05T00:00:00Z", expira_em: "2026-11-12T00:00:00Z" }];
    const cancelados: unknown[] = [];
    await abrir(page, {
      app_grupo: () => ({
        elegivel: true, limite: 4, papel: "titular", titular_nome: "Maria Silva",
        membros: [{ usuario_id: "u1", nome: "Maria Silva", papel: "titular", entrou_em: "2026-11-01T00:00:00Z", eu: true }],
        convites,
      }),
      app_criar_convite: () => {
        convites = [...convites, { id: "c2", criado_em: "2026-11-07T00:00:00Z", expira_em: "2026-11-14T00:00:00Z" }];
        return { ok: true, codigo: "K7M2Q9XAB3", expira_em: "2026-11-14T00:00:00Z" };
      },
      app_cancelar_convite: (c) => {
        cancelados.push(c);
        convites = convites.filter((x) => x.id !== c.p_id);
        return { ok: true };
      },
    });
    await page.goto("/painel/configuracoes/acesso");
    await expect(page.getByRole("heading", { name: /Pessoas do grupo · 1 de 4/ })).toBeVisible();
    await page.getByRole("button", { name: "Convidar alguém" }).click();
    await expect(page.getByLabel("Link do convite")).toHaveValue(/\/convite\/K7M2Q9XAB3$/);
    await expect(page.getByText(/Este link aparece só agora/)).toBeVisible();
    await page.screenshot({ path: `../docs/screens/painel-configuracoes-acesso-${test.info().project.name}.png`, fullPage: true });
    await page.getByRole("button", { name: "Cancelar convite" }).first().click();
    await expect.poll(() => cancelados).toEqual([{ p_id: "c1" }]);
  });

  test("Convite: o link guarda o código e, ao entrar, o convite é aceito", async ({ page }) => {
    const aceitos: unknown[] = [];
    await page.goto("/convite/K7M2Q9XAB3");
    await expect(page.getByRole("heading", { name: /Você recebeu um convite/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Já tenho conta: entrar" })).toHaveAttribute("href", "/entrar");
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem("convite-pendente"))).toBe("K7M2Q9XAB3");
    await simular(page, { login: ["ok"] }, {
      app_aceitar_convite: (c) => {
        aceitos.push(c);
        return { ok: true, titular_nome: "Maria Silva" };
      },
    });
    await entrar(page);
    await expect(page.getByText("Você entrou no grupo de Maria Silva.")).toBeVisible();
    expect(aceitos).toEqual([{ p_codigo: "K7M2Q9XAB3" }]);
    expect(await page.evaluate(() => window.localStorage.getItem("convite-pendente"))).toBeNull();
  });

  test("Privacidade: atalhos do WhatsApp com os comandos prontos", async ({ page }) => {
    await abrir(page);
    await page.goto("/painel/configuracoes/privacidade");
    await expect(page.getByRole("link", { name: "Baixar meus dados" })).toHaveAttribute("href", "https://wa.me/5582991130317?text=MEUS%20DADOS");
    await expect(page.getByText("Zona de risco")).toBeVisible();
  });
});
