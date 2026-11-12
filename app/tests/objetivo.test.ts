import { describe, expect, it } from "vitest";
import { passoDoObjetivo } from "@/lib/narrativa";
import { base } from "./painel-fixture";

describe("passo do objetivo escolhido no primeiro acesso", () => {
  it("sem objetivo, não acrescenta nada", () => {
    expect(passoDoObjetivo(null, base())).toBeNull();
    expect(passoDoObjetivo(undefined, base())).toBeNull();
  });

  it("guardar: lembra quanto foi poupado e sugere separar uma parte", () => {
    const passo = passoDoObjetivo("guardar", base());
    expect(passo?.texto).toMatch(/guardar/i);
    expect(passo?.texto).toContain("45,7%");
    expect(passo?.acao.tipo).toBe("pergunta");
  });

  it("guardar sem renda registrada pede a renda primeiro", () => {
    const passo = passoDoObjetivo("guardar", base({ sem_receita: true, resumo: { receitas: 0, despesas: 900, saldo: -900, taxa_poupanca: null, media_diaria: 30, quantidade: 3 } }));
    expect(passo?.texto).toMatch(/renda/i);
  });

  it("sair do aperto: aponta a categoria que mais pesa, com link para os lançamentos dela", () => {
    const passo = passoDoObjetivo("aperto", base());
    expect(passo?.texto).toContain("Moradia");
    expect(passo?.acao).toMatchObject({ tipo: "link" });
    expect(passo?.acao.tipo === "link" && passo.acao.href).toContain("categoria=Moradia");
  });

  it("organizar a família: leva ao convite do grupo", () => {
    const passo = passoDoObjetivo("familia", base());
    expect(passo?.acao).toEqual({ tipo: "link", rotulo: "Convidar alguém", href: "/painel/configuracoes/acesso" });
  });

  it("controlar o dia a dia: sugere lançar os gastos pequenos", () => {
    const passo = passoDoObjetivo("dia_a_dia", base());
    expect(passo?.acao.tipo).toBe("lancar");
  });
});
