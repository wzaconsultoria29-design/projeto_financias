import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const roteador = { replace: vi.fn(), push: vi.fn() };
let busca = new URLSearchParams();
vi.mock("next/navigation", () => ({ useRouter: () => roteador, usePathname: () => "/entrar", useSearchParams: () => busca }));

const definirSenha = vi.fn();
const minhaConta = vi.fn();
const salvarObjetivo = vi.fn();
const salvarRenda = vi.fn();
const concluirPrimeiroAcesso = vi.fn();
const listarLancamentos = vi.fn();
vi.mock("@/lib/api", async () => {
  const real = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...real,
    definirSenha: (d: unknown) => definirSenha(d),
    minhaConta: () => minhaConta(),
    salvarObjetivo: (o: unknown) => salvarObjetivo(o),
    salvarRenda: (r: unknown) => salvarRenda(r),
    concluirPrimeiroAcesso: () => concluirPrimeiroAcesso(),
    listarLancamentos: (f: unknown) => listarLancamentos(f),
  };
});
const entrarComSenha = vi.fn();
vi.mock("@/lib/login", async () => {
  const real = await vi.importActual<typeof import("@/lib/login")>("@/lib/login");
  return { ...real, entrarComSenha: (e: string, s: string) => entrarComSenha(e, s), iniciarLogin: vi.fn(), statusLogin: vi.fn() };
});

import { ApiError } from "@/lib/api";
import { FormSenha } from "@/components/acesso/FormSenha";
import { TelaEntrar } from "@/components/acesso/TelaEntrar";
import { PrimeiroAcesso } from "@/components/acesso/PrimeiroAcesso";

const CONTA = {
  nome: "Maria Silva", email: "maria@exemplo.com", telefone_mascarado: "+55 82 *****-8817", renda_mensal: null, custo_vida_mensal: null,
  plano: null, assinatura: null, uso: { mensagens: 0, limite: null, restantes: null }, consentimento: { em: "2026-11-01T00:00:00Z", versao: "v1-2026-10" },
  objetivo: null, primeiro_acesso_concluido: false, tem_senha: false,
};

beforeEach(() => {
  busca = new URLSearchParams();
  minhaConta.mockResolvedValue(CONTA);
  salvarObjetivo.mockResolvedValue(undefined);
  salvarRenda.mockResolvedValue(undefined);
  concluirPrimeiroAcesso.mockResolvedValue(undefined);
  definirSenha.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.clearAllMocks();
});

function preencherSenha(senha: string, repetir = senha) {
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: senha } });
  fireEvent.change(screen.getByLabelText("Repita a senha"), { target: { value: repetir } });
}

describe("FormSenha", () => {
  it("vem com o e-mail do cadastro para conferir e mostra a força da senha", () => {
    render(<FormSenha emailInicial="maria@exemplo.com" botao="Criar senha e continuar" onPronto={() => {}} />);
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@exemplo.com");
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "minha casa tem 3 janelas!" } });
    expect(screen.getByText(/forte/i)).toBeInTheDocument();
  });

  it("e-mail interno antigo não vem preenchido", () => {
    render(<FormSenha emailInicial="u-123@painel.invalid" botao="Salvar" onPronto={() => {}} />);
    expect(screen.getByLabelText("E-mail")).toHaveValue("");
  });

  it("recusa e-mail inválido, senha curta e senhas diferentes sem chamar o servidor", () => {
    render(<FormSenha emailInicial="" botao="Salvar" onPronto={() => {}} />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria" } });
    preencherSenha("segredo123");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/confira o e-mail/i);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@exemplo.com" } });
    preencherSenha("curta");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/pelo menos 8/i);
    preencherSenha("segredo123", "segredo124");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/não são iguais/i);
    expect(definirSenha).not.toHaveBeenCalled();
  });

  it("salva pelo servidor e avisa quando terminou", async () => {
    const onPronto = vi.fn();
    render(<FormSenha emailInicial="maria@exemplo.com" botao="Salvar" sairDosOutros onPronto={onPronto} />);
    preencherSenha("segredo123");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(definirSenha).toHaveBeenCalledWith({ email: "maria@exemplo.com", senha: "segredo123", sairDosOutros: true }));
    await waitFor(() => expect(onPronto).toHaveBeenCalled());
  });

  it("erro do servidor aparece sem detalhe técnico e deixa tentar de novo", async () => {
    definirSenha.mockRejectedValue(new ApiError("email_em_uso", "Esse e-mail já está em outra conta. Use outro ou fale com o suporte."));
    render(<FormSenha emailInicial="maria@exemplo.com" botao="Salvar" onPronto={() => {}} />);
    preencherSenha("segredo123");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/já está em outra conta/i);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("mostrar e esconder a senha", () => {
    render(<FormSenha emailInicial="" botao="Salvar" onPronto={() => {}} />);
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
  });

  it("oferece 'Agora não' só quando dá para pular", () => {
    const aoPular = vi.fn();
    render(<FormSenha emailInicial="" botao="Salvar" onPronto={() => {}} aoPular={aoPular} />);
    fireEvent.click(screen.getByRole("button", { name: /agora não/i }));
    expect(aoPular).toHaveBeenCalled();
  });
});

describe("Tela Entrar", () => {
  it("o caminho principal é e-mail e senha, e entra no painel", async () => {
    entrarComSenha.mockResolvedValue(undefined);
    render(<TelaEntrar />);
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@exemplo.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "segredo123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(entrarComSenha).toHaveBeenCalledWith("maria@exemplo.com", "segredo123"));
    await waitFor(() => expect(roteador.replace).toHaveBeenCalledWith("/painel"));
  });

  it("senha errada mostra a mensagem e não sai da tela", async () => {
    entrarComSenha.mockRejectedValue(new Error("E-mail ou senha incorretos."));
    render(<TelaEntrar />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@exemplo.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "errada123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
    expect(roteador.replace).not.toHaveBeenCalled();
  });

  it("campos vazios pedem para preencher sem chamar o servidor", () => {
    render(<TelaEntrar />);
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/e-mail e a senha/i);
    expect(entrarComSenha).not.toHaveBeenCalled();
  });

  it("tem os caminhos alternativos: WhatsApp, esqueci a senha e criar conta", () => {
    render(<TelaEntrar />);
    expect(screen.getByRole("link", { name: /entrar pelo whatsapp/i })).toHaveAttribute("href", "/entrar?modo=whatsapp");
    expect(screen.getByRole("link", { name: /esqueci a senha/i })).toHaveAttribute("href", "/entrar?modo=recuperar");
    expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute("href", "/cadastro");
  });

  it("no modo WhatsApp mostra o código e a volta para e-mail e senha", () => {
    busca = new URLSearchParams("modo=whatsapp");
    render(<TelaEntrar />);
    expect(screen.getByRole("heading", { name: /entrar pelo whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar código" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /entrar com e-mail e senha/i })).toHaveAttribute("href", "/entrar");
  });

  it("recuperar a senha usa o mesmo código do WhatsApp e explica o que vem depois", () => {
    busca = new URLSearchParams("modo=recuperar");
    render(<TelaEntrar />);
    expect(screen.getByRole("heading", { name: /recuperar o acesso/i })).toBeInTheDocument();
    expect(screen.getByText(/em seguida você cria uma senha nova/i)).toBeInTheDocument();
  });
});

describe("Primeiro acesso", () => {
  it("objetivo: a escolha salva e já avança para a renda", async () => {
    render(<PrimeiroAcesso intervaloMs={10} />);
    fireEvent.click(await screen.findByRole("button", { name: /guardar dinheiro/i }));
    await waitFor(() => expect(salvarObjetivo).toHaveBeenCalledWith("guardar"));
    expect(await screen.findByRole("heading", { name: /quanto entra por mês/i })).toBeInTheDocument();
    expect(screen.getByText("Passo 2 de 4")).toBeInTheDocument();
  });

  it("objetivo: as teclas 1 a 4 também escolhem", async () => {
    render(<PrimeiroAcesso intervaloMs={10} />);
    await screen.findByRole("button", { name: /controlar o dia a dia/i });
    fireEvent.keyDown(window, { key: "4" });
    await waitFor(() => expect(salvarObjetivo).toHaveBeenCalledWith("familia"));
  });

  it("renda: salva o valor digitado; pular não salva", async () => {
    render(<PrimeiroAcesso intervaloMs={10} />);
    fireEvent.click(await screen.findByRole("button", { name: /guardar dinheiro/i }));
    await screen.findByRole("heading", { name: /quanto entra por mês/i });
    fireEvent.change(screen.getByLabelText(/renda mensal/i), { target: { value: "4.500" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(salvarRenda).toHaveBeenCalledWith(4500));
    expect(await screen.findByRole("heading", { name: /crie a sua senha/i })).toBeInTheDocument();
  });

  it("renda: as faixas preenchem um valor de referência", async () => {
    render(<PrimeiroAcesso intervaloMs={10} />);
    fireEvent.click(await screen.findByRole("button", { name: /guardar dinheiro/i }));
    await screen.findByRole("heading", { name: /quanto entra por mês/i });
    fireEvent.click(screen.getByRole("button", { name: "R$ 4.000 a 7.000" }));
    expect(screen.getByLabelText(/renda mensal/i)).toHaveValue("5.500");
    fireEvent.click(screen.getByRole("button", { name: /pular por agora/i }));
    expect(await screen.findByRole("heading", { name: /crie a sua senha/i })).toBeInTheDocument();
    expect(salvarRenda).not.toHaveBeenCalled();
  });

  it("quem já tem senha pula direto para o WhatsApp", async () => {
    minhaConta.mockResolvedValue({ ...CONTA, tem_senha: true });
    render(<PrimeiroAcesso intervaloMs={10} />);
    fireEvent.click(await screen.findByRole("button", { name: /guardar dinheiro/i }));
    fireEvent.click(await screen.findByRole("button", { name: /pular por agora/i }));
    expect(await screen.findByRole("heading", { name: /seu assistente já está no whatsapp/i })).toBeInTheDocument();
  });

  it("WhatsApp: mostra o número mascarado, o QR code e espera o primeiro gasto até ele chegar", async () => {
    listarLancamentos
      .mockResolvedValueOnce({ total: 0, itens: [] })
      .mockResolvedValueOnce({ total: 0, itens: [] })
      .mockResolvedValue({ total: 1, itens: [{ id: "l1", data: "2026-11-12", tipo: "despesa", valor: 100, categoria: "Alimentação", descricao: "Mercado", metodo_pagamento: null }] });
    render(<PrimeiroAcesso intervaloMs={10} />);
    fireEvent.click(await screen.findByRole("button", { name: /guardar dinheiro/i }));
    fireEvent.click(await screen.findByRole("button", { name: /pular por agora/i }));
    fireEvent.click(await screen.findByRole("button", { name: /agora não/i }));
    expect(await screen.findByText(/\+55 82 \*\*\*\*\*-8817/)).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /qr code/i })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /mandar meu primeiro gasto/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+\?text=mercado%20100$/);
    await act(async () => fireEvent.click(link));
    expect(await screen.findByRole("heading", { name: /esperando o seu primeiro gasto/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /chegou/i })).toBeInTheDocument();
    expect(screen.getByText("Mercado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ir para o meu painel/i }));
    await waitFor(() => expect(concluirPrimeiroAcesso).toHaveBeenCalled());
    await waitFor(() => expect(roteador.replace).toHaveBeenCalledWith("/painel"));
  });

  it("dá para fazer depois a qualquer momento: marca como visto e vai para o painel", async () => {
    render(<PrimeiroAcesso intervaloMs={10} />);
    fireEvent.click(await screen.findByRole("button", { name: /fazer depois/i }));
    await waitFor(() => expect(concluirPrimeiroAcesso).toHaveBeenCalled());
    await waitFor(() => expect(roteador.replace).toHaveBeenCalledWith("/painel"));
  });
});
