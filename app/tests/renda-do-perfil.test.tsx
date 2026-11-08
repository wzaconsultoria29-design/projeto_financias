import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { aplicarRendaDoPerfil } from "@/lib/painel";
import { Resumo } from "@/components/painel/visao/Resumo";
import { base } from "./painel-fixture";

const SEM_RENDA = (periodo: { dias: number; dias_decorridos?: number } = { dias: 30 }) =>
  base({
    sem_receita: true,
    periodo: { de: "2026-11-01", ate: "2026-11-30", dias: periodo.dias, dias_decorridos: periodo.dias_decorridos ?? periodo.dias },
    resumo: { receitas: 0, despesas: 2500, saldo: -2500, taxa_poupanca: null, media_diaria: 83, quantidade: 4 },
  });

describe("renda do perfil no painel", () => {
  it("sem receita lançada, usa a renda mensal do perfil: saldo, taxa e o aviso de 'registre a renda' somem", () => {
    const p = aplicarRendaDoPerfil(SEM_RENDA(), 10000);
    expect(p.sem_receita).toBe(false);
    expect(p.resumo.receitas).toBe(10000);
    expect(p.resumo.saldo).toBe(7500);
    expect(p.resumo.taxa_poupanca).toBe(75);
    expect(p.renda_do_perfil).toBe(true);
  });

  it("receita lançada de verdade vale mais que a renda do perfil", () => {
    const original = base();
    expect(aplicarRendaDoPerfil(original, 10000)).toBe(original);
  });

  it("sem renda no perfil (nula ou zero), nada muda", () => {
    const original = SEM_RENDA();
    expect(aplicarRendaDoPerfil(original, null)).toBe(original);
    expect(aplicarRendaDoPerfil(original, 0)).toBe(original);
  });

  it("mês de 28 ou 31 dias e '30 dias' contam um mês inteiro; o ano conta doze", () => {
    expect(aplicarRendaDoPerfil(SEM_RENDA({ dias: 28 }), 3000).resumo.receitas).toBe(3000);
    expect(aplicarRendaDoPerfil(SEM_RENDA({ dias: 31 }), 3000).resumo.receitas).toBe(3000);
    expect(aplicarRendaDoPerfil(SEM_RENDA({ dias: 365 }), 3000).resumo.receitas).toBe(36000);
  });

  it("período curto vale a parte proporcional da renda", () => {
    const p = aplicarRendaDoPerfil(SEM_RENDA({ dias: 7 }), 3000);
    expect(p.resumo.receitas).toBeGreaterThan(600);
    expect(p.resumo.receitas).toBeLessThan(800);
  });

  it("gasto maior que a renda do perfil dá saldo e taxa negativos, sem NaN", () => {
    const p = aplicarRendaDoPerfil(SEM_RENDA(), 1000);
    expect(p.resumo.saldo).toBe(-1500);
    expect(p.resumo.taxa_poupanca).toBe(-150);
  });

  it("período sem gasto nenhum continua sem inventar renda", () => {
    const vazio = base({ sem_receita: false, resumo: { receitas: 0, despesas: 0, saldo: 0, taxa_poupanca: null, media_diaria: 0, quantidade: 0 } });
    expect(aplicarRendaDoPerfil(vazio, 10000)).toBe(vazio);
  });

  it("o Resumo diz que a renda vem do perfil e não mostra mais o pedido para registrar", () => {
    render(<Resumo p={aplicarRendaDoPerfil(SEM_RENDA(), 10000)} />);
    expect(screen.queryByText(/registre a sua renda/i)).not.toBeInTheDocument();
    expect(screen.getByText(/renda mensal informada no seu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: /taxa de poupança/i })).toHaveAttribute("aria-valuenow", "75");
  });
});
