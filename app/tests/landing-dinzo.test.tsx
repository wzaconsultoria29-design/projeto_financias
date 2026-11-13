import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { porDia } from "@/config/planos";
import { BarraCta } from "@/components/landing/BarraCta";
import { ComoFunciona } from "@/components/landing/ComoFunciona";

describe("porDia", () => {
  it("divide o preço mensal por 30 dias", () => {
    expect(porDia("R$ 19")).toBe("R$ 0,63");
    expect(porDia("R$ 39")).toBe("R$ 1,30");
  });
  it("preço que não é número não gera custo por dia", () => {
    expect(porDia("Grátis")).toBeNull();
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
