import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const roteador = { replace: vi.fn(), push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => roteador, usePathname: () => "/painel", useParams: () => ({ codigo: "K7M2Q9XAB3" }) }));

const minhaConta = vi.fn();
const planoEPagamentos = vi.fn();
const solicitarPlano = vi.fn();
const cancelarPedidoPlano = vi.fn();
const grupoAtual = vi.fn();
const criarConvite = vi.fn();
const cancelarConvite = vi.fn();
const removerMembro = vi.fn();
const sairDoGrupo = vi.fn();
const aceitarConvite = vi.fn();
vi.mock("@/lib/api", async () => {
  const real = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...real,
    minhaConta: () => minhaConta(),
    planoEPagamentos: () => planoEPagamentos(),
    solicitarPlano: (c: string) => solicitarPlano(c),
    cancelarPedidoPlano: () => cancelarPedidoPlano(),
    grupoAtual: () => grupoAtual(),
    criarConvite: () => criarConvite(),
    cancelarConvite: (id: string) => cancelarConvite(id),
    removerMembro: (id: string) => removerMembro(id),
    sairDoGrupo: () => sairDoGrupo(),
    aceitarConvite: (c: string) => aceitarConvite(c),
  };
});

import { ApiError } from "@/lib/api";
import PlanoPage from "@/app/painel/configuracoes/plano/page";
import AcessoPage from "@/app/painel/configuracoes/acesso/page";
import ConvitePage from "@/app/(site)/convite/[codigo]/page";
import { ConviteAoEntrar } from "@/components/painel/ConviteAoEntrar";

const CONTA = {
  nome: "Maria Silva", email: "maria@exemplo.com", telefone_mascarado: "+55 11 *****-8888", renda_mensal: null, custo_vida_mensal: null,
  plano: { codigo: "essencial", nome: "Essencial", preco_centavos: 1900, mensagens_limite: 300, membros_max: 1 },
  assinatura: { status: "ativa", periodo_inicio: "2026-11-01T00:00:00Z", periodo_fim: null },
  uso: { mensagens: 120, limite: 300, restantes: 180 },
  consentimento: { em: "2026-11-01T00:00:00Z", versao: "v1-2026-10" },
};
const PLANOS = {
  atual: "essencial", solicitacao: null, pagamentos: [],
  planos: [
    { codigo: "trial", nome: "Trial", preco_centavos: 0, mensagens_limite: 50, membros_max: 1 },
    { codigo: "essencial", nome: "Essencial", preco_centavos: 1900, mensagens_limite: 300, membros_max: 1 },
    { codigo: "family", nome: "Family", preco_centavos: 3900, mensagens_limite: 800, membros_max: 4 },
  ],
};
const GRUPO_VAZIO = { elegivel: false, limite: null, papel: null, titular_nome: null, membros: [], convites: [] };
const GRUPO_TITULAR = {
  elegivel: true, limite: 4, papel: "titular", titular_nome: "Maria Silva",
  membros: [
    { usuario_id: "u1", nome: "Maria Silva", papel: "titular", entrou_em: "2026-11-01T00:00:00Z", eu: true },
    { usuario_id: "u2", nome: "João Silva", papel: "membro", entrou_em: "2026-11-03T00:00:00Z", eu: false },
  ],
  convites: [{ id: "c1", criado_em: "2026-11-05T00:00:00Z", expira_em: "2026-11-12T00:00:00Z" }],
};

beforeEach(() => {
  minhaConta.mockResolvedValue(CONTA);
  planoEPagamentos.mockResolvedValue(PLANOS);
  grupoAtual.mockResolvedValue(GRUPO_TITULAR);
});
afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("Plano e pagamentos", () => {
  it("mostra o plano atual, o uso e os três planos com o atual marcado", async () => {
    render(<PlanoPage />);
    expect(await screen.findByText(/120 de 300 mensagens/)).toBeInTheDocument();
    const familia = screen.getByRole("article", { name: "Family" });
    expect(within(familia).getByText("R$ 39")).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "Essencial" })).getByText("Seu plano")).toBeInTheDocument();
  });

  it("não fala 'em breve' do Family e oferece assinar", async () => {
    render(<PlanoPage />);
    await screen.findByRole("article", { name: "Family" });
    expect(document.body).not.toHaveTextContent(/em breve/i);
    expect(screen.getByRole("button", { name: "Assinar o Family" })).toBeEnabled();
  });

  it("assinar registra o pedido, avisa que o plano não muda e deixa cancelar", async () => {
    // o servidor de mentira acompanha o estado: depois de solicitar, a próxima leitura traz o pedido
    solicitarPlano.mockImplementation(async () => {
      planoEPagamentos.mockResolvedValue({ ...PLANOS, solicitacao: { codigo: "family", nome: "Family", criado_em: "2026-11-07T00:00:00Z" } });
      return { nome: "Family" };
    });
    render(<PlanoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Assinar o Family" }));
    await waitFor(() => expect(solicitarPlano).toHaveBeenCalledWith("family"));
    expect(await screen.findByText(/pedido registrado/i)).toBeInTheDocument();
    expect(screen.getByText(/o seu plano atual não muda até lá/i)).toBeInTheDocument();
    cancelarPedidoPlano.mockImplementation(async () => {
      planoEPagamentos.mockResolvedValue(PLANOS);
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    await waitFor(() => expect(cancelarPedidoPlano).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Assinar o Family" })).toBeInTheDocument();
  });

  it("pedido que já existe aparece desde o carregamento", async () => {
    planoEPagamentos.mockResolvedValue({ ...PLANOS, solicitacao: { codigo: "family", nome: "Family", criado_em: "2026-11-06T00:00:00Z" } });
    render(<PlanoPage />);
    expect(await screen.findByText(/pedido registrado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assinar o Family" })).not.toBeInTheDocument();
  });

  it("histórico vazio explica que o teste não cobra", async () => {
    render(<PlanoPage />);
    expect(await screen.findByText(/nenhuma cobrança ainda/i)).toBeInTheDocument();
  });

  it("histórico lista data, descrição, valor e situação", async () => {
    planoEPagamentos.mockResolvedValue({ ...PLANOS, pagamentos: [{ id: "p1", data: "2026-10-07T12:00:00Z", descricao: "Essencial, mensalidade", valor_centavos: 1900, status: "pago" }] });
    render(<PlanoPage />);
    const tabela = await screen.findByRole("table", { name: /histórico de pagamentos/i });
    expect(within(tabela).getByText("07/10/2026")).toBeInTheDocument();
    expect(within(tabela).getByText("R$ 19,00")).toBeInTheDocument();
    expect(within(tabela).getByText("Pago")).toBeInTheDocument();
  });

  it("erro ao pedir mostra a mensagem sem detalhe técnico", async () => {
    solicitarPlano.mockRejectedValue(new ApiError("ja_no_plano", "Você já está neste plano."));
    render(<PlanoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Assinar o Family" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Você já está neste plano.");
  });
});

describe("Acesso compartilhado", () => {
  it("sem o Family, explica e leva ao plano", async () => {
    grupoAtual.mockResolvedValue(GRUPO_VAZIO);
    render(<AcessoPage />);
    expect(await screen.findByText(/disponível no plano family/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver o plano Family" })).toHaveAttribute("href", "/painel/configuracoes/plano");
    expect(screen.queryByRole("button", { name: /convidar/i })).not.toBeInTheDocument();
  });

  it("titular vê as pessoas do grupo e o convite pendente", async () => {
    render(<AcessoPage />);
    expect(await screen.findByText("Pessoas do grupo · 2 de 4")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("(você)")).toBeInTheDocument();
    expect(screen.getByText(/convite pendente/i)).toBeInTheDocument();
    expect(screen.getByText(/vale até 12\/11\/2026/i)).toBeInTheDocument();
  });

  it("convidar mostra o link uma vez, com o código", async () => {
    criarConvite.mockResolvedValue({ codigo: "K7M2Q9XAB3", expira_em: "2026-11-14T00:00:00Z" });
    render(<AcessoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Convidar alguém" }));
    const campo = (await screen.findByLabelText("Link do convite")) as HTMLInputElement;
    expect(campo.value).toMatch(/\/convite\/K7M2Q9XAB3$/);
    expect(screen.getByText(/este link aparece só agora/i)).toBeInTheDocument();
  });

  it("copiar o link usa a área de transferência", async () => {
    const escrever = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: escrever } });
    criarConvite.mockResolvedValue({ codigo: "K7M2Q9XAB3", expira_em: "2026-11-14T00:00:00Z" });
    render(<AcessoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Convidar alguém" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(escrever).toHaveBeenCalledWith(expect.stringMatching(/\/convite\/K7M2Q9XAB3$/)));
    expect(await screen.findByText("Link copiado.")).toBeInTheDocument();
  });

  it("grupo completo desativa o convite e explica", async () => {
    grupoAtual.mockResolvedValue({ ...GRUPO_TITULAR, limite: 3, membros: [...GRUPO_TITULAR.membros, { usuario_id: "u3", nome: "Ana", papel: "membro", entrou_em: "2026-11-04T00:00:00Z", eu: false }], convites: [] });
    render(<AcessoPage />);
    expect(await screen.findByRole("button", { name: "Convidar alguém" })).toBeDisabled();
    expect(screen.getByText(/o grupo está completo/i)).toBeInTheDocument();
  });

  it("remover pede confirmação e usa o nome da pessoa", async () => {
    removerMembro.mockResolvedValue(undefined);
    render(<AcessoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Remover João Silva" }));
    expect(screen.getByText(/remover joão silva do grupo\?/i)).toBeInTheDocument();
    expect(removerMembro).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    await waitFor(() => expect(removerMembro).toHaveBeenCalledWith("u2"));
  });

  it("cancelar convite pendente", async () => {
    cancelarConvite.mockResolvedValue(undefined);
    render(<AcessoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar convite" }));
    await waitFor(() => expect(cancelarConvite).toHaveBeenCalledWith("c1"));
  });

  it("membro vê o grupo só para leitura e pode sair", async () => {
    grupoAtual.mockResolvedValue({ ...GRUPO_TITULAR, elegivel: false, papel: "membro", convites: [], membros: GRUPO_TITULAR.membros.map((m) => ({ ...m, eu: m.usuario_id === "u2" })) });
    sairDoGrupo.mockResolvedValue(undefined);
    render(<AcessoPage />);
    expect(await screen.findByText(/você está no grupo de maria silva/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /convidar|remover/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sair do grupo" }));
    await waitFor(() => expect(sairDoGrupo).toHaveBeenCalled());
  });

  it("avisa que a visão compartilhada dos valores ainda não existe", async () => {
    render(<AcessoPage />);
    expect(await screen.findByText(/cada pessoa vê só os próprios lançamentos/i)).toBeInTheDocument();
  });

  it("erro do servidor aparece com a mensagem amigável", async () => {
    criarConvite.mockRejectedValue(new ApiError("limite_atingido", "O grupo já está completo."));
    render(<AcessoPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Convidar alguém" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("O grupo já está completo.");
  });
});

describe("Página do convite", () => {
  it("guarda o código e leva a entrar ou criar a conta", () => {
    render(<ConvitePage />);
    expect(window.localStorage.getItem("convite-pendente")).toBe("K7M2Q9XAB3");
    expect(screen.getByRole("link", { name: "Já tenho conta: entrar" })).toHaveAttribute("href", "/entrar");
    expect(screen.getByRole("link", { name: "Criar a minha conta" })).toHaveAttribute("href", "/cadastro");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/convite/i);
  });
});

describe("Aceite do convite ao entrar", () => {
  it("sem convite guardado não faz nada e não mostra nada", () => {
    const { container } = render(<ConviteAoEntrar />);
    expect(aceitarConvite).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it("aceita o convite guardado, apaga o código e avisa em qual grupo entrou", async () => {
    window.localStorage.setItem("convite-pendente", "K7M2Q9XAB3");
    aceitarConvite.mockResolvedValue({ titular_nome: "Maria Silva" });
    render(<ConviteAoEntrar />);
    await waitFor(() => expect(aceitarConvite).toHaveBeenCalledWith("K7M2Q9XAB3"));
    expect(await screen.findByRole("status")).toHaveTextContent("Você entrou no grupo de Maria Silva.");
    expect(window.localStorage.getItem("convite-pendente")).toBeNull();
  });

  it("convite que não vale mostra o motivo e também apaga o código", async () => {
    window.localStorage.setItem("convite-pendente", "K7M2Q9XAB3");
    aceitarConvite.mockRejectedValue(new ApiError("convite_invalido", "Convite inválido, vencido ou já usado. Peça um novo link."));
    render(<ConviteAoEntrar />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Convite inválido");
    expect(window.localStorage.getItem("convite-pendente")).toBeNull();
  });
});
