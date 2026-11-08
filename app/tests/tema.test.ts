import { afterEach, describe, expect, it, vi } from "vitest";
import { aplicarTema, gravarOcultarAoAbrir, gravarTema, lerOcultarAoAbrir, lerTema } from "@/lib/tema";
import { lerReais } from "@/lib/format";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-tema");
});

describe("tema", () => {
  it("sem escolha, segue o aparelho (automático)", () => {
    expect(lerTema()).toBe("auto");
  });

  it("guarda e lê claro, escuro e automático", () => {
    gravarTema("escuro");
    expect(lerTema()).toBe("escuro");
    gravarTema("claro");
    expect(lerTema()).toBe("claro");
    gravarTema("auto");
    expect(lerTema()).toBe("auto");
  });

  it("valor guardado inválido volta para automático", () => {
    window.localStorage.setItem("painel-tema", "roxo");
    expect(lerTema()).toBe("auto");
  });

  it("marca o tema na página: claro e escuro fixam, automático solta", () => {
    aplicarTema("escuro");
    expect(document.documentElement.dataset.tema).toBe("escuro");
    aplicarTema("claro");
    expect(document.documentElement.dataset.tema).toBe("claro");
    aplicarTema("auto");
    expect(document.documentElement.hasAttribute("data-tema")).toBe(false);
  });

  it("sem acesso ao armazenamento, segue funcionando", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("bloqueado");
      },
      setItem() {
        throw new Error("bloqueado");
      },
    });
    expect(lerTema()).toBe("auto");
    expect(() => gravarTema("escuro")).not.toThrow();
  });
});

describe("ocultar valores ao abrir", () => {
  it("começa desligado e guarda a escolha", () => {
    expect(lerOcultarAoAbrir()).toBe(false);
    gravarOcultarAoAbrir(true);
    expect(lerOcultarAoAbrir()).toBe(true);
    gravarOcultarAoAbrir(false);
    expect(lerOcultarAoAbrir()).toBe(false);
  });
});

describe("lerReais", () => {
  it("lê valores em reais com vírgula, ponto de milhar e R$", () => {
    expect(lerReais("3.500,50")).toBe(3500.5);
    expect(lerReais("R$ 1.900")).toBe(1900);
    expect(lerReais("1900,5")).toBe(1900.5);
    expect(lerReais("12.5")).toBe(12.5);
  });

  it("campo vazio limpa o valor", () => {
    expect(lerReais("")).toBeNull();
    expect(lerReais("   ")).toBeNull();
  });

  it("zero é um valor válido (diferente de vazio)", () => {
    expect(lerReais("0")).toBe(0);
    expect(lerReais("0,00")).toBe(0);
  });

  it("texto que não é número é inválido", () => {
    expect(lerReais("abc")).toBe("invalido");
    expect(lerReais("-5")).toBe("invalido");
    expect(lerReais("12,34,56")).toBe("invalido");
  });
});
