import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { CENARIOS, cenario } from "@/lib/demo-conversa";
import { PERGUNTAS, responder } from "@/lib/demo-dados";
import { porDia } from "@/config/planos";
import { Conversa } from "@/components/landing/Conversa";
import { BarraCta } from "@/components/landing/BarraCta";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { PorQuePago } from "@/components/landing/PorQuePago";

describe("cenários da conversa de demonstração", () => {
  it("tem quatro jeitos de mandar: texto, áudio, foto e pergunta", () => {
    expect(CENARIOS.map((c) => c.tipo)).toEqual(["texto", "audio", "foto", "pergunta"]);
  });

  it("texto: anota o gasto e mostra o total da categoria já com ele", () => {
    const c = cenario("texto");
    expect(c.voce).toMatchObject({ tipo: "texto", texto: "mercado 184" });
    expect(c.bot[0]).toContain("Anotado: R$ 184,00");
    expect(c.bot[0]).toContain("Alimentação");
    // Alimentação no mês de exemplo: 142 + 412,30 = 554,30; com os 184 novos, 738,30
    expect(c.bot.join(" ")).toContain("R$ 738,30");
  });

  it("áudio: mostra a transcrição e anota o valor falado", () => {
    const c = cenario("audio");
    expect(c.voce).toMatchObject({ tipo: "audio", transcricao: "gastei 32 no almoço" });
    expect(c.bot.join(" ")).toContain("gastei 32 no almoço");
    expect(c.bot.join(" ")).toContain("R$ 32,00");
  });

  it("foto: lê o cupom e anota o valor", () => {
    const c = cenario("foto");
    expect(c.voce.tipo).toBe("foto");
    expect(c.bot.join(" ")).toContain("R$ 87,50");
  });

  it("pergunta: responde com os números do mês de exemplo", () => {
    const c = cenario("pergunta");
    expect(c.rotulo).toBe(PERGUNTAS[0]);
    expect(c.bot).toEqual([responder(PERGUNTAS[0])]);
  });

  it("nenhum texto tem travessão, NaN ou undefined", () => {
    const tudo = JSON.stringify(CENARIOS);
    expect(tudo).not.toMatch(/—|–|NaN|undefined/);
  });
});

describe("porDia", () => {
  it("divide o preço mensal por 30 dias", () => {
    expect(porDia("R$ 19")).toBe("R$ 0,63");
    expect(porDia("R$ 39")).toBe("R$ 1,30");
  });
  it("preço que não é número não gera custo por dia", () => {
    expect(porDia("Grátis")).toBeNull();
  });
});

describe("Conversa", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("começa com uma saudação e os quatro jeitos de mandar", () => {
    render(<Conversa />);
    expect(screen.getByRole("heading", { name: /fale com o seu dinheiro/i })).toBeInTheDocument();
    for (const c of CENARIOS) expect(screen.getByRole("button", { name: c.rotulo })).toBeInTheDocument();
  });

  it("clicar mostra a sua mensagem na hora e a resposta depois, com indicador de digitando", () => {
    render(<Conversa />);
    fireEvent.click(screen.getByRole("button", { name: "mercado 184" }));
    const lista = screen.getByRole("list", { name: /mensagens/i });
    expect(within(lista).getByText("mercado 184")).toBeInTheDocument();
    expect(within(lista).queryByText(/Anotado: R\$ 184,00/)).not.toBeInTheDocument();
    expect(screen.getByTestId("digitando")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(3000));
    expect(within(lista).getByText(/Anotado: R\$ 184,00/)).toBeInTheDocument();
    expect(screen.queryByTestId("digitando")).not.toBeInTheDocument();
  });

  it("enquanto o assistente responde, os botões ficam desativados", () => {
    render(<Conversa />);
    fireEvent.click(screen.getByRole("button", { name: "Foto da notinha" }));
    expect(screen.getByRole("button", { name: "Mandar um áudio" })).toBeDisabled();
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByRole("button", { name: "Mandar um áudio" })).toBeEnabled();
  });

  it("áudio aparece como mensagem de voz com a duração", () => {
    render(<Conversa />);
    fireEvent.click(screen.getByRole("button", { name: "Mandar um áudio" }));
    expect(screen.getByText("0:04")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByText(/R\$ 32,00/)).toBeInTheDocument();
  });

  it("a conversa guarda só as últimas mensagens", () => {
    render(<Conversa />);
    for (const c of CENARIOS) {
      fireEvent.click(screen.getByRole("button", { name: c.rotulo }));
      act(() => void vi.advanceTimersByTime(4000));
    }
    expect(within(screen.getByRole("list", { name: /mensagens/i })).getAllByRole("listitem").length).toBeLessThanOrEqual(8);
  });
});

describe("BarraCta", () => {
  let dispara: (alvos: { isIntersecting: boolean }[]) => void = () => {};
  beforeEach(() => {
    class IO {
      constructor(cb: (e: { isIntersecting: boolean; target: Element }[]) => void) {
        dispara = (alvos) => cb(alvos.map((a, i) => ({ ...a, target: document.querySelectorAll("[data-barra-oculta]")[i] ?? document.body })));
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", IO);
    document.body.innerHTML = '<section data-barra-oculta="a"></section><section data-barra-oculta="b"></section>';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("fica escondida enquanto o topo está na tela e leva ao cadastro", () => {
    render(<BarraCta />);
    dispara([{ isIntersecting: true }, { isIntersecting: false }]);
    const link = screen.getByRole("link", { name: "Começar grátis", hidden: true });
    expect(link).toHaveAttribute("href", "/cadastro");
    expect(link.closest("[data-barra-cta]")).toHaveAttribute("data-visivel", "false");
  });

  it("aparece depois que nenhuma seção de chamada está na tela", () => {
    render(<BarraCta />);
    act(() => dispara([{ isIntersecting: false }, { isIntersecting: false }]));
    expect(screen.getByRole("link", { name: "Começar grátis" }).closest("[data-barra-cta]")).toHaveAttribute("data-visivel", "true");
    expect(screen.getByText(/7 dias grátis, sem cartão/)).toBeInTheDocument();
  });
});

describe("ComoFunciona: trilha de passos", () => {
  it("são três passos numerados em uma lista", () => {
    render(<ComoFunciona />);
    const lista = screen.getByRole("list", { name: /três passos/i });
    const itens = within(lista).getAllByRole("listitem");
    expect(itens).toHaveLength(3);
    expect(within(itens[0]).getByText("1")).toBeInTheDocument();
    expect(within(itens[2]).getByText("3")).toBeInTheDocument();
  });
});

describe("PorQuePago", () => {
  it("explica por que cobra, sem prometer o que a política não diz", () => {
    render(<PorQuePago />);
    expect(screen.getByRole("heading", { name: /por que .* é pago/i })).toBeInTheDocument();
    expect(screen.getByText(/sem anúncios/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/não vendemos|nunca vendemos/i);
    expect(document.body).not.toHaveTextContent(/—|–/);
  });
});
