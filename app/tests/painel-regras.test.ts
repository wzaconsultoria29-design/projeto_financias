import { describe, it, expect } from "vitest";
import { eixo, gerarInsights, veredito, mediaPorDiaSemana, participacao, partesBrl, somarDias, valorCurto } from "@/lib/painel";
import { deslocarMes, intervaloDoMes, rotuloDoMes } from "@/lib/periodo";
import type { Painel } from "@/lib/api";

function base(extra: Partial<Painel> = {}): Painel {
  return {
    periodo: { de: "2026-10-01", ate: "2026-10-31", dias: 31, dias_decorridos: 31 },
    resumo: { receitas: 3500, despesas: 1900, saldo: 1600, taxa_poupanca: 45.7, media_diaria: 61.29, quantidade: 9 },
    anterior: { de: "2026-08-31", ate: "2026-09-30", receitas: 3000, despesas: 1500, despesas_mesmo_ponto: 1500 },
    variacao_despesas_pct: 26.7,
    categorias: [
      { categoria: "Moradia", total: 1000, qtd: 1, pct: 52.6, anterior: 1000 },
      { categoria: "Alimentação", total: 500, qtd: 2, pct: 26.3, anterior: 300 },
      { categoria: "Lazer", total: 150, qtd: 1, pct: 7.9, anterior: 150 },
    ],
    pareto: { top3_pct: 86.8 },
    tipos: { essencial: 1300, superfluo: 400, investimento: 100, sem_tipo: 100 },
    fixos: { fixos_total: 1050, variaveis_total: 850, maiores: [] },
    acumulado: null,
    dia_semana: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({ dow, total: dow === 5 ? 700 : 100, ocorrencias: dow === 5 ? 5 : 4 })),
    tendencia: [],
    maiores: [],
    projecao: null,
    sem_receita: false,
    historico_total: 14,
    ...extra,
  };
}

describe("gerarInsights", () => {
  it("diz quanto foi poupado e compara com a referência de 20%", () => {
    const f = gerarInsights(base());
    expect(f[0]).toContain("45,7%");
    expect(f[0]).toContain("20%");
  });

  it("poupança baixa usa tom neutro, sem bronca", () => {
    const f = gerarInsights(base({ resumo: { receitas: 2000, despesas: 1900, saldo: 100, taxa_poupanca: 5, media_diaria: 60, quantidade: 5 } }));
    expect(f[0]).toContain("5%");
    expect(f[0]).not.toMatch(/gastou demais|culpa|erro/i);
  });

  it("gasto maior que a renda mostra o valor que passou", () => {
    const f = gerarInsights(base({ resumo: { receitas: 1000, despesas: 1300, saldo: -300, taxa_poupanca: -30, media_diaria: 40, quantidade: 5 } }));
    expect(f[0]).toContain("R$ 300,00");
    expect(f[0]).toContain("a mais");
  });

  it("sem renda registrada pede a renda e não inventa taxa", () => {
    const f = gerarInsights(base({ sem_receita: true, resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 } }));
    expect(f[0]).toMatch(/renda/i);
    expect(f.join(" ")).not.toMatch(/poupou/i);
  });

  it("aponta a categoria que mais subiu, com os dois valores", () => {
    const f = gerarInsights(base());
    expect(f.join(" ")).toContain("Alimentação foi de R$ 300,00 para R$ 500,00");
  });

  it("não aponta aumento pequeno", () => {
    const f = gerarInsights(base({ categorias: [{ categoria: "Lazer", total: 110, qtd: 1, pct: 10, anterior: 100 }] }));
    expect(f.join(" ")).not.toContain("Lazer foi de");
  });

  it("mostra a previsão de fechamento quando existe", () => {
    const f = gerarInsights(base({ projecao: { previsto: 2100, dias_decorridos: 15, dias_no_mes: 31 } }));
    expect(f.join(" ")).toContain("R$ 2.100,00");
  });

  it("devolve no máximo quatro frases e nunca NaN", () => {
    const f = gerarInsights(base({ projecao: { previsto: 2100, dias_decorridos: 15, dias_no_mes: 31 } }));
    expect(f.length).toBeLessThanOrEqual(4);
    expect(f.join(" ")).not.toMatch(/NaN|undefined|Infinity/);
  });

  it("painel vazio não gera frase nenhuma", () => {
    const vazio = base({
      resumo: { receitas: 0, despesas: 0, saldo: 0, taxa_poupanca: null, media_diaria: 0, quantidade: 0 },
      variacao_despesas_pct: null, categorias: [], pareto: { top3_pct: null },
      tipos: { essencial: 0, superfluo: 0, investimento: 0, sem_tipo: 0 }, fixos: { fixos_total: 0, variaveis_total: 0, maiores: [] }, historico_total: 0,
    });
    expect(gerarInsights(vazio)).toEqual([]);
  });
});

describe("mediaPorDiaSemana", () => {
  it("divide o total pelas vezes que o dia ocorreu e ignora dia sem ocorrência", () => {
    const m = mediaPorDiaSemana([
      { dow: 0, total: 100, ocorrencias: 4 },
      { dow: 1, total: 50, ocorrencias: 0 },
      { dow: 5, total: 700, ocorrencias: 5 },
    ]);
    expect(m.find((x) => x.dow === 0)?.media).toBe(25);
    expect(m.find((x) => x.dow === 1)?.media).toBe(0);
    expect(m.find((x) => x.dow === 5)?.media).toBe(140);
  });
});

describe("participacao", () => {
  it("é segura com total zero", () => {
    expect(participacao(10, 0)).toBe(0);
    expect(participacao(25, 100)).toBe(25);
  });
});

describe("meses", () => {
  it("intervalo do mês inteiro, inclusive fevereiro e ano bissexto", () => {
    expect(intervaloDoMes("2026-10")).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(intervaloDoMes("2026-02")).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
    expect(intervaloDoMes("2028-02")).toEqual({ de: "2028-02-01", ate: "2028-02-29" });
  });

  it("anda para o mês anterior e o seguinte, virando o ano", () => {
    expect(deslocarMes("2026-01", -1)).toBe("2025-12");
    expect(deslocarMes("2026-12", 1)).toBe("2027-01");
    expect(deslocarMes("2026-10", 0)).toBe("2026-10");
  });

  it("rótulo em português", () => {
    expect(rotuloDoMes("2026-10")).toBe("outubro de 2026");
    expect(rotuloDoMes("2027-03")).toBe("março de 2027");
  });
});

describe("eixo", () => {
  it("escolhe um topo redondo acima do maior valor, com degraus iguais", () => {
    expect(eixo(1900)).toEqual({ topo: 2000, passos: [0, 500, 1000, 1500, 2000] });
    expect(eixo(3500)).toEqual({ topo: 4000, passos: [0, 1000, 2000, 3000, 4000] });
    expect(eixo(87)).toEqual({ topo: 100, passos: [0, 25, 50, 75, 100] });
  });

  it("valor zero ou nulo não quebra e nunca deixa o topo em zero", () => {
    expect(eixo(0).topo).toBeGreaterThan(0);
    expect(eixo(-5).topo).toBeGreaterThan(0);
  });

  it("o maior valor nunca encosta no topo", () => {
    expect(eixo(2000).topo).toBeGreaterThan(2000);
  });
});

describe("valorCurto", () => {
  it("abrevia milhares para o eixo", () => {
    expect(valorCurto(0)).toBe("0");
    expect(valorCurto(500)).toBe("500");
    expect(valorCurto(1000)).toBe("1 mil");
    expect(valorCurto(1500)).toBe("1,5 mil");
    expect(valorCurto(12000)).toBe("12 mil");
  });
});

describe("partesBrl", () => {
  it("separa reais e centavos para o número grande, com sinal quando negativo", () => {
    expect(partesBrl(1600)).toEqual({ sinal: "", inteiro: "R$ 1.600", centavos: ",00" });
    expect(partesBrl(-300.5)).toEqual({ sinal: "-", inteiro: "R$ 300", centavos: ",50" });
  });
});

describe("somarDias", () => {
  it("anda dias no calendário, virando mês e ano", () => {
    expect(somarDias("2026-10-01", 0)).toBe("2026-10-01");
    expect(somarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("veredito", () => {
  it("responde se está no azul", () => {
    expect(veredito(base())).toBe("Você está no azul neste período.");
  });

  it("gasto maior que a renda é dito sem rodeio e sem bronca", () => {
    const v = veredito(base({ resumo: { receitas: 1000, despesas: 1300, saldo: -300, taxa_poupanca: -30, media_diaria: 40, quantidade: 5 } }));
    expect(v).toBe("Você gastou mais do que recebeu neste período.");
  });

  it("saldo zerado não vira elogio nem alarme", () => {
    expect(veredito(base({ resumo: { receitas: 1000, despesas: 1000, saldo: 0, taxa_poupanca: 0, media_diaria: 30, quantidade: 5 } }))).toBe("Você fechou o período no zero a zero.");
  });

  it("sem renda registrada não afirma nada sobre o saldo", () => {
    const v = veredito(base({ sem_receita: true, resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 } }));
    expect(v).toMatch(/renda/);
    expect(v).not.toMatch(/azul|gastou mais/);
  });

  it("período vazio diz que não há lançamentos", () => {
    const vazio = base({ resumo: { receitas: 0, despesas: 0, saldo: 0, taxa_poupanca: null, media_diaria: 0, quantidade: 0 } });
    expect(veredito(vazio)).toBe("Nada foi lançado neste período ainda.");
  });
});
