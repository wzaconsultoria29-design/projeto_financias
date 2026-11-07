import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { podeGastarPorDia } from "@/lib/painel";
import { gravarEscondido, lerEscondido } from "@/lib/privacidade";
import { Resumo } from "@/components/painel/visao/Resumo";
import { CabecalhoPainel } from "@/components/painel/visao/CabecalhoPainel";
import { EsqueletoPainel } from "@/components/painel/visao/EsqueletoPainel";
import { PerguntasRapidas } from "@/components/painel/visao/PerguntasRapidas";
import { base } from "./painel-fixture";

const NO_MEIO_DO_MES = { previsto: 2100, dias_decorridos: 15, dias_no_mes: 31 };

describe("podeGastarPorDia", () => {
  it("divide o que sobra da renda pelos dias que faltam", () => {
    // renda 3.500, gasto 1.900: sobram 1.600 para 16 dias
    expect(podeGastarPorDia(base({ projecao: NO_MEIO_DO_MES }))).toEqual({ tipo: "ok", porDia: 100, restante: 1600, dias: 16 });
  });

  it("no último dia do mês conta o dia de hoje, nunca divide por zero", () => {
    const r = podeGastarPorDia(base({ projecao: { previsto: 1900, dias_decorridos: 31, dias_no_mes: 31 } }));
    expect(r).toEqual({ tipo: "ok", porDia: 1600, restante: 1600, dias: 1 });
  });

  it("arredonda para centavos", () => {
    const p = base({ projecao: NO_MEIO_DO_MES, resumo: { receitas: 1000, despesas: 100, saldo: 900, taxa_poupanca: 90, media_diaria: 6.67, quantidade: 2 } });
    expect(podeGastarPorDia(p)).toMatchObject({ tipo: "ok", porDia: 56.25 });
  });

  it("gasto maior que a renda registrada diz quanto passou", () => {
    const p = base({ projecao: NO_MEIO_DO_MES, resumo: { receitas: 1000, despesas: 1300, saldo: -300, taxa_poupanca: -30, media_diaria: 80, quantidade: 5 } });
    expect(podeGastarPorDia(p)).toEqual({ tipo: "estourou", excesso: 300 });
  });

  it("renda toda usada não vira número negativo nem positivo", () => {
    const p = base({ projecao: NO_MEIO_DO_MES, resumo: { receitas: 1000, despesas: 1000, saldo: 0, taxa_poupanca: 0, media_diaria: 66, quantidade: 5 } });
    expect(podeGastarPorDia(p)).toEqual({ tipo: "estourou", excesso: 0 });
  });

  it("não existe para mês encerrado, nem sem renda registrada", () => {
    expect(podeGastarPorDia(base({ projecao: null }))).toBeNull();
    expect(podeGastarPorDia(base({ projecao: NO_MEIO_DO_MES, sem_receita: true, resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 } }))).toBeNull();
  });
});

describe("Resumo: quanto pode gastar por dia", () => {
  it("mostra o valor por dia e de onde ele vem", () => {
    render(<Resumo p={base({ projecao: NO_MEIO_DO_MES })} />);
    expect(screen.getByText("Pode gastar por dia até o fim do mês")).toBeInTheDocument();
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    expect(screen.getByText(/sobram R\$ 1\.600,00 da renda registrada, em 16 dias/i)).toBeInTheDocument();
  });

  it("estourou: troca o número por uma frase direta", () => {
    render(<Resumo p={base({ projecao: NO_MEIO_DO_MES, resumo: { receitas: 1000, despesas: 1300, saldo: -300, taxa_poupanca: -30, media_diaria: 80, quantidade: 5 } })} />);
    expect(screen.getByText(/você já passou R\$ 300,00 da renda registrada/i)).toBeInTheDocument();
    expect(screen.queryByText(/pode gastar por dia/i)).not.toBeInTheDocument();
  });

  it("mês encerrado não mostra o bloco", () => {
    render(<Resumo p={base()} />);
    expect(screen.queryByText(/pode gastar por dia/i)).not.toBeInTheDocument();
  });
});

describe("privacidade dos valores", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("guarda e lê a escolha no navegador", () => {
    expect(lerEscondido()).toBe(false);
    gravarEscondido(true);
    expect(lerEscondido()).toBe(true);
    gravarEscondido(false);
    expect(lerEscondido()).toBe(false);
  });

  it("sem acesso ao armazenamento, segue funcionando com os valores à mostra", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("bloqueado");
      },
      setItem() {
        throw new Error("bloqueado");
      },
    });
    expect(lerEscondido()).toBe(false);
    expect(() => gravarEscondido(true)).not.toThrow();
  });
});

describe("CabecalhoPainel: botão de esconder valores", () => {
  const props = {
    titulo: "Visão geral",
    subtitulo: "Você está no azul neste período.",
    modo: "mes" as const,
    mes: "2026-10",
    mesAtual: "2026-10",
    custom: undefined,
    maximo: "2026-10-28",
    onModo() {},
    onMes() {},
    onCustom() {},
    onLancar() {},
  };

  it("é um botão de alternar, com nome fixo e estado em aria-pressed", () => {
    const aoClicar = vi.fn();
    const { rerender } = render(<CabecalhoPainel {...props} privado={false} onPrivado={aoClicar} />);
    const botao = screen.getByRole("button", { name: "Esconder valores" });
    expect(botao).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(botao);
    expect(aoClicar).toHaveBeenCalledTimes(1);
    rerender(<CabecalhoPainel {...props} privado onPrivado={aoClicar} />);
    expect(screen.getByRole("button", { name: "Esconder valores" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("EsqueletoPainel", () => {
  it("tem o desenho da tela pronta: nove cartões em duas colunas, sem animação", () => {
    const { container } = render(<EsqueletoPainel />);
    const raiz = screen.getByLabelText("Carregando");
    expect(raiz).toHaveAttribute("aria-busy", "true");
    expect(raiz.querySelectorAll("[data-esqueleto-cartao]")).toHaveLength(9);
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });
});

describe("PerguntasRapidas", () => {
  it("cada pergunta abre o WhatsApp do assistente já escrita", () => {
    render(<PerguntasRapidas />);
    expect(screen.getByRole("heading", { name: /pergunte pelo whatsapp/i })).toBeInTheDocument();
    const lista = screen.getByRole("list", { name: /perguntas/i });
    const links = within(lista).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
    const onde = within(lista).getByRole("link", { name: /onde posso economizar/i });
    expect(onde).toHaveAttribute("href", "https://wa.me/5582991130317?text=Onde%20posso%20economizar%3F");
    expect(onde).toHaveAttribute("target", "_blank");
    expect(onde).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
