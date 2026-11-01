import { describe, it, expect } from "vitest";
import { agregar, interpretar } from "@/lib/demo";

describe("interpretar", () => {
  it("entende valor, descrição e categoria de uma frase natural", () => {
    expect(interpretar("gastei 32 no almoço")).toEqual({ descricao: "Almoço", valor: 32, categoria: "Alimentação" });
  });

  it("aceita vírgula decimal e frases curtas", () => {
    expect(interpretar("uber 18,50")).toEqual({ descricao: "Uber", valor: 18.5, categoria: "Transporte" });
  });

  it("aceita milhar com ponto", () => {
    expect(interpretar("paguei 1.200,00 de aluguel")).toMatchObject({ valor: 1200, categoria: "Moradia" });
  });

  it("não depende de acento nem de maiúsculas", () => {
    expect(interpretar("GASTEI 45 NA FARMACIA")?.categoria).toBe("Saúde");
  });

  it("usa Outros quando não reconhece o assunto", () => {
    expect(interpretar("gastei 10 com coisa nenhuma conhecida")?.categoria).toBe("Outros");
  });

  it("recusa mensagem sem valor ou com valor zero", () => {
    expect(interpretar("bom dia")).toBeNull();
    expect(interpretar("pix 0")).toBeNull();
    expect(interpretar("   ")).toBeNull();
  });

  it("ignora tags HTML e limita o tamanho da descrição", () => {
    const r = interpretar(`gastei 5 em <img src=x onerror=alert(1)> ${"a".repeat(200)}`);
    expect(r?.descricao.length).toBeLessThanOrEqual(40);
    expect(r?.descricao).not.toMatch(/[<>]/);
  });
});

describe("agregar", () => {
  const itens = [
    { descricao: "Almoço", valor: 30, categoria: "Alimentação" },
    { descricao: "Mercado", valor: 70, categoria: "Alimentação" },
    { descricao: "Uber", valor: 50, categoria: "Transporte" },
  ];

  it("soma o total e agrupa por categoria em ordem decrescente", () => {
    const r = agregar(itens);
    expect(r.total).toBe(150);
    expect(r.categorias.map((c) => c.categoria)).toEqual(["Alimentação", "Transporte"]);
    expect(r.categorias[0]).toMatchObject({ total: 100, qtd: 2 });
  });

  it("percentuais são números finitos e somam 100", () => {
    const r = agregar(itens);
    const soma = r.categorias.reduce((s, c) => s + c.pct, 0);
    expect(r.categorias.every((c) => Number.isFinite(c.pct))).toBe(true);
    expect(Math.round(soma)).toBe(100);
  });

  it("lista vazia não gera NaN nem divisão por zero", () => {
    const r = agregar([]);
    expect(r).toEqual({ total: 0, categorias: [], maior: null });
  });

  it("destaca o maior gasto individual", () => {
    expect(agregar(itens).maior?.descricao).toBe("Mercado");
  });
});
