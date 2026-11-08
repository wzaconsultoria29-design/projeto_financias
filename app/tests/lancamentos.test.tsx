import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Conta, LancamentoItem } from "@/lib/api";

vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  listarLancamentos: vi.fn(),
  salvarLancamento: vi.fn(),
  excluirLancamento: vi.fn(),
  minhaConta: vi.fn(),
  listarCategorias: vi.fn(),
  planoEPagamentos: vi.fn(),
}));

import { listarLancamentos, salvarLancamento, excluirLancamento, minhaConta, listarCategorias, planoEPagamentos } from "@/lib/api";
import LancamentosPage from "@/app/painel/lancamentos/page";
import PlanoPage from "@/app/painel/configuracoes/plano/page";
import PrivacidadePage from "@/app/painel/configuracoes/privacidade/page";
import { coletarTodos } from "@/lib/exportar";

const listar = vi.mocked(listarLancamentos);
const salvar = vi.mocked(salvarLancamento);
const excluir = vi.mocked(excluirLancamento);
const conta = vi.mocked(minhaConta);
const categorias = vi.mocked(listarCategorias);

function item(n: number, extra: Partial<LancamentoItem> = {}): LancamentoItem {
  return {
    id: `id-${n}`, data: "2026-10-20", tipo: "despesa", valor: 10 * n, categoria: "Alimentação", subcategoria: null,
    descricao: `Compra ${n}`, metodo_pagamento: "Pix", origem: "whatsapp", codigo: `DEL#${n}`, ...extra,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  listar.mockResolvedValue({ total: 2, itens: [item(1), item(2)] });
  salvar.mockResolvedValue("novo-id");
  excluir.mockResolvedValue(true);
  categorias.mockResolvedValue([]);
});

describe("lançamentos: lista e filtros", () => {
  it("carrega a primeira página com 20 itens e mostra as linhas", async () => {
    render(<LancamentosPage />);
    expect(await screen.findByText("Compra 1")).toBeInTheDocument();
    expect(listar).toHaveBeenCalledWith(expect.objectContaining({ limite: 20, offset: 0 }));
  });

  it("busca envia o texto e volta para a primeira página", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.type(screen.getByRole("searchbox"), "mercado{Enter}");
    await waitFor(() => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ busca: "mercado", offset: 0 })));
  });

  it("categoria dispara nova consulta", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), "Transporte");
    await waitFor(() => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ categoria: "Transporte", offset: 0 })));
  });

  it("paginação usa deslocamento múltiplo de 20", async () => {
    listar.mockResolvedValue({ total: 45, itens: [item(1)] });
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    await waitFor(() => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 20 })));
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    await waitFor(() => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 40 })));
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("lista vazia mostra o estado vazio", async () => {
    listar.mockResolvedValue({ total: 0, itens: [] });
    render(<LancamentosPage />);
    expect(await screen.findByText("Nenhum lançamento neste período")).toBeInTheDocument();
  });
});

describe("lançamentos: excluir", () => {
  it("só exclui depois de confirmar", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getAllByRole("button", { name: /Excluir/ })[0]);
    expect(excluir).not.toHaveBeenCalled();
    const dialogo = screen.getByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Confirmar exclusão" }));
    await waitFor(() => expect(excluir).toHaveBeenCalledWith("id-1"));
  });

  it("cancelar não exclui nada", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getAllByRole("button", { name: /Excluir/ })[0]);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(excluir).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("lançamentos: adicionar e editar", () => {
  it("editar envia o id do item", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getAllByRole("button", { name: /Editar/ })[0]);
    const valor = screen.getByLabelText("Valor");
    expect(valor).toHaveValue("10,00");
    await userEvent.clear(valor);
    await userEvent.type(valor, "25,50");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvar).toHaveBeenCalledWith("id-1", expect.objectContaining({ valor: 25.5, tipo: "despesa" })));
  });

  it("adicionar envia id nulo", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getByRole("button", { name: "Novo lançamento" }));
    await userEvent.type(screen.getByLabelText("Valor"), "12,90");
    await userEvent.type(screen.getByLabelText("Descrição"), "Pão");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvar).toHaveBeenCalledWith(null, expect.objectContaining({ valor: 12.9, descricao: "Pão" })));
  });

  it("valor inválido mostra aviso e não envia", async () => {
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getByRole("button", { name: "Novo lançamento" }));
    await userEvent.type(screen.getByLabelText("Valor"), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Informe um valor maior que zero.")).toBeInTheDocument();
    expect(salvar).not.toHaveBeenCalled();
  });
});

describe("categorias e formas de pagamento vindas do bot", () => {
  it("o filtro inclui as categorias que o cliente já usa, sem repetir as padrão", async () => {
    categorias.mockResolvedValue(["Alimentação", "Cuidados Pessoais", "Renda"]);
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await waitFor(() => expect(within(screen.getByLabelText("Categoria")).getByRole("option", { name: "Renda" })).toBeInTheDocument());
    const opcoes = within(screen.getByLabelText("Categoria")).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toContain("Cuidados Pessoais");
    expect(opcoes.filter((o) => o === "Alimentação")).toHaveLength(1);
  });

  it("forma de pagamento em minúsculas do bot abre selecionada sem duplicar a opção", async () => {
    listar.mockResolvedValue({ total: 1, itens: [item(1, { metodo_pagamento: "pix" })] });
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
    const select = screen.getByLabelText("Forma de pagamento");
    expect(select).toHaveValue("Pix");
    expect(within(select).getAllByRole("option").filter((o) => /^pix$/i.test(o.textContent ?? ""))).toHaveLength(1);
  });
});

describe("exportar CSV", () => {
  it("coletarTodos busca em páginas de 200 até completar o total", async () => {
    const todos = Array.from({ length: 450 }, (_, i) => item(i + 1));
    const fonte = vi.fn(async (f: { offset?: number; limite?: number }) => ({ total: 450, itens: todos.slice(f.offset ?? 0, (f.offset ?? 0) + (f.limite ?? 20)) }));
    const itens = await coletarTodos({ busca: "x" }, fonte);
    expect(itens).toHaveLength(450);
    expect(fonte.mock.calls.map(([f]) => [f.offset, f.limite])).toEqual([[0, 200], [200, 200], [400, 200]]);
    expect(fonte.mock.calls[0][0]).toMatchObject({ busca: "x" });
  });

  it("o botão baixa um arquivo com os itens filtrados", async () => {
    const criar = vi.fn(() => "blob:teste");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: criar, revokeObjectURL: vi.fn() }));
    render(<LancamentosPage />);
    await screen.findByText("Compra 1");
    await userEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await waitFor(() => expect(criar).toHaveBeenCalled());
    const blob = (criar.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.size).toBeGreaterThan(50);
  });
});

const CONTA_BASE: Conta = {
  nome: "Maria", email: "maria@exemplo.com", telefone_mascarado: "+55 11 *****-8888", renda_mensal: null, custo_vida_mensal: null,
  plano: { codigo: "trial", nome: "Teste grátis", preco_centavos: 0, mensagens_limite: 50, membros_max: 1 },
  assinatura: { status: "trial", periodo_inicio: "2026-10-24", periodo_fim: "2026-10-31" },
  uso: { mensagens: 12, limite: 50, restantes: 38 },
  consentimento: { em: "2026-10-24T12:00:00Z", versao: "v1-2026-10" },
};

describe("plano e privacidade (antiga página Conta)", () => {
  beforeEach(() => {
    vi.mocked(planoEPagamentos).mockResolvedValue({ atual: null, solicitacao: null, pagamentos: [], planos: [] });
  });

  it("mostra o uso com barra de progresso", async () => {
    conta.mockResolvedValue(CONTA_BASE);
    render(<PlanoPage />);
    expect(await screen.findByText(/12 de 50 mensagens/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "24");
  });

  it("limite nulo não divide por zero nem mostra NaN", async () => {
    conta.mockResolvedValue({ ...CONTA_BASE, plano: null, assinatura: null, uso: { mensagens: 7, limite: null, restantes: null } });
    const { container } = render(<PlanoPage />);
    expect(await screen.findByText(/7 mensagens usadas/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("privacidade: botões abrem o WhatsApp com os comandos prontos", async () => {
    conta.mockResolvedValue(CONTA_BASE);
    render(<PrivacidadePage />);
    await screen.findByText(/v1-2026-10/);
    expect(screen.getByRole("link", { name: "Baixar meus dados" })).toHaveAttribute("href", "https://wa.me/5582991130317?text=MEUS%20DADOS");
    expect(screen.getByRole("link", { name: "Apagar meus dados" })).toHaveAttribute("href", "https://wa.me/5582991130317?text=EXCLUIR%20MEUS%20DADOS");
    expect(screen.getByText(/v1-2026-10/)).toBeInTheDocument();
  });
});
