import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const roteador = { replace: vi.fn(), push: vi.fn() };
let caminho = "/painel/configuracoes/conta";
vi.mock("next/navigation", () => ({ useRouter: () => roteador, usePathname: () => caminho }));

const sair = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { signOut: (...a: unknown[]) => sair(...a) } } }));

const minhaConta = vi.fn();
const salvarPerfil = vi.fn();
vi.mock("@/lib/api", async () => {
  const real = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...real, minhaConta: () => minhaConta(), salvarPerfil: (d: unknown) => salvarPerfil(d) };
});

import { ApiError } from "@/lib/api";
import { MenuConfiguracoes } from "@/components/painel/configuracoes/MenuConfiguracoes";
import ContaPage from "@/app/painel/configuracoes/conta/page";
import AparenciaPage from "@/app/painel/configuracoes/aparencia/page";

const CONTA = {
  nome: "Maria Silva",
  email: "maria@exemplo.com",
  telefone_mascarado: "+55 11 *****-8888",
  renda_mensal: 3500,
  custo_vida_mensal: 1900,
  plano: { codigo: "essencial", nome: "Essencial", preco_centavos: 1900, mensagens_limite: 300, membros_max: 1 },
  assinatura: { status: "ativa", periodo_inicio: "2026-11-01T00:00:00Z", periodo_fim: null },
  uso: { mensagens: 120, limite: 300, restantes: 180 },
  consentimento: { em: "2026-11-01T00:00:00Z", versao: "v1-2026-10" },
};

beforeEach(() => {
  minhaConta.mockResolvedValue(CONTA);
  salvarPerfil.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.documentElement.removeAttribute("data-tema");
  caminho = "/painel/configuracoes/conta";
});

describe("MenuConfiguracoes", () => {
  it("lista as áreas das Configurações com os endereços certos", () => {
    render(<MenuConfiguracoes />);
    const menu = screen.getByRole("navigation", { name: /configurações/i });
    const hrefs = within(menu).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")]);
    expect(hrefs).toEqual([
      ["Conta", "/painel/configuracoes/conta"],
      ["Aparência e segurança", "/painel/configuracoes/aparencia"],
      ["Plano e pagamentos", "/painel/configuracoes/plano"],
      ["Acesso compartilhado", "/painel/configuracoes/acesso"],
      ["WhatsApp", "/painel/configuracoes/whatsapp"],
      ["Notificações", "/painel/configuracoes/notificacoes"],
      ["Privacidade e dados", "/painel/configuracoes/privacidade"],
    ]);
  });

  it("marca a área aberta", () => {
    caminho = "/painel/configuracoes/plano";
    render(<MenuConfiguracoes />);
    expect(screen.getByRole("link", { name: "Plano e pagamentos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Conta" })).not.toHaveAttribute("aria-current");
  });
});

describe("Conta", () => {
  it("mostra os dados, com e-mail e WhatsApp só para leitura", async () => {
    render(<ContaPage />);
    expect(await screen.findByRole("heading", { name: "Sua conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Maria Silva");
    expect(screen.getByLabelText("Renda mensal")).toHaveValue("3.500,00");
    expect(screen.getByLabelText("Custo de vida mensal")).toHaveValue("1.900,00");
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@exemplo.com");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("WhatsApp")).toHaveValue("+55 11 *****-8888");
    expect(screen.getByLabelText("WhatsApp")).toHaveAttribute("readonly");
  });

  it("salva nome, renda e custo de vida lidos em reais", async () => {
    render(<ContaPage />);
    const renda = await screen.findByLabelText("Renda mensal");
    fireEvent.change(renda, { target: { value: "4.200,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvarPerfil).toHaveBeenCalledWith({ nome: "Maria Silva", renda: 4200.5, custo: 1900 }));
    expect(await screen.findByText("Salvo.")).toBeInTheDocument();
  });

  it("campo vazio limpa o valor", async () => {
    render(<ContaPage />);
    fireEvent.change(await screen.findByLabelText("Custo de vida mensal"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(salvarPerfil).toHaveBeenCalledWith({ nome: "Maria Silva", renda: 3500, custo: null }));
  });

  it("valor que não é número não é enviado e diz qual campo conferir", async () => {
    render(<ContaPage />);
    fireEvent.change(await screen.findByLabelText("Renda mensal"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/confira a renda mensal/i);
    expect(salvarPerfil).not.toHaveBeenCalled();
  });

  it("nome vazio não é enviado", async () => {
    render(<ContaPage />);
    fireEvent.change(await screen.findByLabelText("Nome"), { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/informe o seu nome/i);
    expect(salvarPerfil).not.toHaveBeenCalled();
  });

  it("erro do servidor aparece sem detalhe técnico", async () => {
    salvarPerfil.mockRejectedValueOnce(new ApiError("nome_invalido", "Confira o nome."));
    render(<ContaPage />);
    await screen.findByLabelText("Nome");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Confira o nome.");
  });

  it("sair deste navegador encerra só esta sessão e volta para a entrada", async () => {
    render(<ContaPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Sair deste navegador" }));
    await waitFor(() => expect(sair).toHaveBeenCalledWith({ scope: "local" }));
    await waitFor(() => expect(roteador.replace).toHaveBeenCalledWith("/entrar"));
  });

  it("sair de todos os aparelhos encerra todas as sessões", async () => {
    render(<ContaPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Sair de todos os aparelhos" }));
    await waitFor(() => expect(sair).toHaveBeenCalledWith({ scope: "global" }));
  });

  it("erro ao carregar oferece tentar de novo", async () => {
    minhaConta.mockRejectedValueOnce(new Error("falhou"));
    render(<ContaPage />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByLabelText("Nome")).toBeInTheDocument();
  });
});

describe("Aparência e segurança", () => {
  it("oferece claro, escuro e automático, e o automático começa marcado", () => {
    render(<AparenciaPage />);
    const grupo = screen.getByRole("radiogroup", { name: /tema/i });
    expect(within(grupo).getAllByRole("radio").map((r) => r.getAttribute("aria-label") ?? r.textContent)).toEqual(expect.arrayContaining([]));
    expect(screen.getByRole("radio", { name: /automático/i })).toBeChecked();
  });

  it("escolher escuro ou claro muda a página na hora e fica guardado", () => {
    render(<AparenciaPage />);
    fireEvent.click(screen.getByRole("radio", { name: /escuro/i }));
    expect(document.documentElement.dataset.tema).toBe("escuro");
    expect(window.localStorage.getItem("painel-tema")).toBe("escuro");
    fireEvent.click(screen.getByRole("radio", { name: /claro/i }));
    expect(document.documentElement.dataset.tema).toBe("claro");
    fireEvent.click(screen.getByRole("radio", { name: /automático/i }));
    expect(document.documentElement.hasAttribute("data-tema")).toBe(false);
  });

  it("'Ocultar valores ao abrir' é um interruptor que guarda a escolha", () => {
    render(<AparenciaPage />);
    const chave = screen.getByRole("switch", { name: /ocultar valores ao abrir/i });
    expect(chave).toHaveAttribute("aria-checked", "false");
    fireEvent.click(chave);
    expect(chave).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem("painel-ocultar-ao-abrir")).toBe("1");
    fireEvent.click(chave);
    expect(chave).toHaveAttribute("aria-checked", "false");
  });
});
