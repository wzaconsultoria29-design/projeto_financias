import { describe, expect, it } from "vitest";
import { corDaCategoria, manchetes, oQueMudou, proximosPassos } from "@/lib/narrativa";
import { base, SEM_DADOS } from "./painel-fixture";

const NO_MEIO_DO_MES = { previsto: 2100, dias_decorridos: 15, dias_no_mes: 31 };
const resumo = (receitas: number, despesas: number, extra: Record<string, unknown> = {}) => ({
  receitas,
  despesas,
  saldo: receitas - despesas,
  taxa_poupanca: receitas > 0 ? Math.round(((receitas - despesas) / receitas) * 1000) / 10 : null,
  media_diaria: 40,
  quantidade: 5,
  ...extra,
});

describe("manchetes: abertura", () => {
  it("saldo positivo diz quanto sobrou e quanto da renda isso é", () => {
    expect(manchetes(base()).abertura).toBe("Sobraram R$ 1.600,00: você poupou 45,7% da renda.");
  });

  it("gasto maior que a renda diz quanto passou", () => {
    expect(manchetes(base({ resumo: resumo(1000, 1300) })).abertura).toBe("Você gastou R$ 300,00 a mais do que recebeu.");
  });

  it("saldo zerado não vira elogio nem alarme", () => {
    expect(manchetes(base({ resumo: resumo(1000, 1000) })).abertura).toBe("Você fechou no zero a zero.");
  });

  it("sem renda registrada não afirma nada sobre o saldo", () => {
    const m = manchetes(base({ sem_receita: true, resumo: resumo(0, 800) }));
    expect(m.abertura).toBe("Você gastou R$ 800,00. Falta registrar a renda para saber quanto sobra.");
  });

  it("período vazio diz que não há lançamentos", () => {
    expect(manchetes(base(SEM_DADOS)).abertura).toBe("Ainda não há lançamentos neste período.");
  });
});

describe("manchetes: o que mudou", () => {
  it("compara com o período anterior e aponta a categoria que mais subiu", () => {
    expect(manchetes(base()).mudou).toBe("Você gastou 26,7% a mais que no período anterior, até o mesmo ponto. O maior aumento foi em Alimentação (+R$ 200,00).");
  });

  it("gasto menor usa 'a menos' e não inventa causa", () => {
    const m = manchetes(base({ variacao_despesas_pct: -10, categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 1000 }] }));
    expect(m.mudou).toBe("Você gastou 10% a menos que no período anterior, até o mesmo ponto.");
  });

  it("sem período anterior para comparar não escreve nada", () => {
    expect(manchetes(base({ variacao_despesas_pct: null })).mudou).toBeNull();
  });
});

describe("manchetes: para onde foi", () => {
  it("mais da metade num lugar só", () => {
    expect(manchetes(base()).onde).toBe("Moradia levou mais da metade do que você gastou.");
  });

  it("abaixo da metade mostra a porcentagem", () => {
    const m = manchetes(base({ categorias: [{ categoria: "Alimentação", total: 400, qtd: 4, pct: 40, anterior: 0 }, { categoria: "Lazer", total: 600, qtd: 2, pct: 60, anterior: 0 }].reverse() }));
    expect(m.onde).toBe("Lazer levou mais da metade do que você gastou.");
    const m2 = manchetes(base({ categorias: [{ categoria: "Alimentação", total: 400, qtd: 4, pct: 40, anterior: 0 }] }));
    expect(m2.onde).toBe("Alimentação levou 40% do que você gastou.");
  });

  it("gasto inteiro em uma categoria", () => {
    expect(manchetes(base({ categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 0 }] })).onde).toBe("Todo o seu gasto foi em Moradia.");
  });

  it("sem despesas não escreve nada", () => {
    expect(manchetes(base(SEM_DADOS)).onde).toBeNull();
  });
});

describe("manchetes: como está dividido", () => {
  it("essencial, supérfluo e investimento sobre o que foi gasto, e avisa do que não tem classificação", () => {
    expect(manchetes(base()).divisao).toBe("Do que você gastou, 68,4% foi essencial, 21,1% supérfluo e 5,3% investimento. O restante não foi classificado.");
  });

  it("tudo classificado não menciona o restante", () => {
    const m = manchetes(base({ tipos: { essencial: 1000, superfluo: 500, investimento: 400, sem_tipo: 0 } }));
    expect(m.divisao).toBe("Do que você gastou, 52,6% foi essencial, 26,3% supérfluo e 21,1% investimento.");
  });

  it("nada classificado não escreve nada", () => {
    expect(manchetes(base({ tipos: { essencial: 0, superfluo: 0, investimento: 0, sem_tipo: 1900 } })).divisao).toBeNull();
  });
});

describe("manchetes: ritmo", () => {
  it("no mês em andamento diz como ele fecha e compara com a renda", () => {
    expect(manchetes(base({ projecao: NO_MEIO_DO_MES })).ritmo).toBe("No ritmo atual, o mês fecha com R$ 2.100,00 em despesas, dentro da renda registrada.");
  });

  it("previsão acima da renda diz quanto", () => {
    const m = manchetes(base({ projecao: { previsto: 4000, dias_decorridos: 15, dias_no_mes: 31 } }));
    expect(m.ritmo).toBe("No ritmo atual, o mês fecha com R$ 4.000,00 em despesas, R$ 500,00 acima da renda registrada.");
  });

  it("sem renda registrada não compara", () => {
    const m = manchetes(base({ projecao: NO_MEIO_DO_MES, sem_receita: true, resumo: resumo(0, 800) }));
    expect(m.ritmo).toBe("No ritmo atual, o mês fecha com R$ 2.100,00 em despesas.");
  });

  it("período encerrado fala da média por dia", () => {
    expect(manchetes(base()).ritmo).toBe("Você gastou em média R$ 61,29 por dia.");
  });
});

describe("manchetes: nos últimos meses", () => {
  it("três meses seguidos subindo", () => {
    expect(manchetes(base()).tendencia).toBe("Suas despesas subiram nos últimos 3 meses.");
  });

  it("três meses seguidos caindo", () => {
    const t = [
      { mes: "2026-08-01", receitas: 3000, despesas: 2000 },
      { mes: "2026-09-01", receitas: 3000, despesas: 1500 },
      { mes: "2026-10-01", receitas: 3000, despesas: 1000 },
    ];
    expect(manchetes(base({ tendencia: t })).tendencia).toBe("Suas despesas caíram nos últimos 3 meses.");
  });

  it("sem sequência, compara os dois últimos meses", () => {
    const t = [
      { mes: "2026-08-01", receitas: 3000, despesas: 1000 },
      { mes: "2026-09-01", receitas: 3000, despesas: 1800 },
      { mes: "2026-10-01", receitas: 3000, despesas: 1500 },
    ];
    expect(manchetes(base({ tendencia: t })).tendencia).toBe("Suas despesas caíram de R$ 1.800,00 para R$ 1.500,00 no último mês.");
  });

  it("histórico curto não escreve nada", () => {
    expect(manchetes(base(SEM_DADOS)).tendencia).toBeNull();
    const um = [{ mes: "2026-10-01", receitas: 0, despesas: 900 }];
    expect(manchetes(base({ tendencia: um })).tendencia).toBeNull();
  });
});

describe("manchetes: segurança do texto", () => {
  it("nenhuma frase tem NaN, undefined ou travessão", () => {
    for (const p of [base(), base(SEM_DADOS), base({ projecao: NO_MEIO_DO_MES }), base({ sem_receita: true, resumo: resumo(0, 800) })]) {
      expect(JSON.stringify(manchetes(p))).not.toMatch(/NaN|undefined|Infinity|—|–/);
    }
  });
});

describe("oQueMudou", () => {
  it("mostra despesas, receitas e a categoria que mais subiu, com antes e depois", () => {
    const r = oQueMudou(base());
    expect(r.map((x) => x.chave)).toEqual(["despesas", "receitas", "subiu"]);
    expect(r[0]).toMatchObject({ atual: 1900, anterior: 1500, delta: 400, pct: 26.7, bom: false });
    expect(r[1]).toMatchObject({ atual: 3500, anterior: 3000, delta: 500, pct: 16.7, bom: true });
    expect(r[2]).toMatchObject({ rotulo: "Alimentação", atual: 500, anterior: 300, delta: 200, pct: 66.7, bom: false });
  });

  it("cor diz bom ou ruim: gastar menos é bom, categoria que caiu é boa", () => {
    const p = base({
      anterior: { de: "2026-08-31", ate: "2026-09-30", receitas: 3000, despesas: 2500, despesas_mesmo_ponto: 2500 },
      categorias: [
        { categoria: "Moradia", total: 1000, qtd: 1, pct: 52.6, anterior: 1000 },
        { categoria: "Lazer", total: 150, qtd: 1, pct: 7.9, anterior: 400 },
      ],
    });
    const r = oQueMudou(p);
    expect(r.find((x) => x.chave === "despesas")).toMatchObject({ delta: -600, bom: true });
    expect(r.find((x) => x.chave === "caiu")).toMatchObject({ rotulo: "Lazer", delta: -250, bom: true });
  });

  it("mês em andamento não compara receitas (o mês anterior está inteiro, este não)", () => {
    expect(oQueMudou(base({ projecao: NO_MEIO_DO_MES })).map((x) => x.chave)).not.toContain("receitas");
  });

  it("variação pequena e a categoria agrupada 'Outras' não entram", () => {
    const p = base({
      categorias: [
        { categoria: "Lazer", total: 150, qtd: 1, pct: 50, anterior: 145 },
        { categoria: "Outras", total: 900, qtd: 4, pct: 50, anterior: 100 },
      ],
    });
    expect(oQueMudou(p).map((x) => x.chave)).toEqual(["despesas", "receitas"]);
  });

  it("sem base de comparação devolve lista vazia, sem NaN", () => {
    const p = base({ anterior: { de: "2026-08-31", ate: "2026-09-30", receitas: 0, despesas: 0, despesas_mesmo_ponto: 0 }, categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 0 }] });
    expect(oQueMudou(p)).toEqual([]);
  });
});

describe("proximosPassos", () => {
  it("com a renda registrada, aponta a categoria que subiu e oferece perguntar ao assistente", () => {
    const passos = proximosPassos(base());
    expect(passos[0].texto).toBe("Alimentação subiu R$ 200,00. Veja os lançamentos dessa categoria.");
    expect(passos[0].acao).toEqual({ tipo: "link", rotulo: "Ver lançamentos", href: "/painel/lancamentos?categoria=Alimenta%C3%A7%C3%A3o&de=2026-10-01&ate=2026-10-31" });
    expect(passos.some((p) => p.acao.tipo === "pergunta")).toBe(true);
  });

  it("sem renda registrada, o primeiro passo é registrá-la", () => {
    const passos = proximosPassos(base({ sem_receita: true, resumo: resumo(0, 800) }));
    expect(passos[0].texto).toBe("Registre a sua renda deste período para ver quanto sobra de verdade.");
    expect(passos[0].acao).toEqual({ tipo: "lancar", rotulo: "Registrar renda" });
  });

  it("gasto maior que a renda sugere olhar onde ajustar, sem bronca", () => {
    const passos = proximosPassos(base({ resumo: resumo(1000, 1300), categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 1000 }] }));
    expect(passos[0].texto).toBe("Você passou da renda. Veja onde dá para ajustar.");
    expect(passos[0].texto).not.toMatch(/culpa|erro|gastou demais/i);
  });

  it("poupança abaixo da referência de 20% é dita com calma", () => {
    const passos = proximosPassos(base({ resumo: resumo(2000, 1700), categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 1000 }] }));
    expect(passos.map((p) => p.texto)).toContain("Sobrou menos que a referência de 20%. Vale olhar os gastos supérfluos.");
  });

  it("conta sem nada lançado convida a começar", () => {
    const passos = proximosPassos(base(SEM_DADOS));
    expect(passos).toHaveLength(1);
    expect(passos[0].texto).toBe("Registre o primeiro gasto ou a sua renda para o painel começar a contar a história.");
    expect(passos[0].acao.tipo).toBe("lancar");
  });

  it("tudo em ordem ainda devolve um passo útil", () => {
    const calmo = base({ categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 1000 }] });
    const passos = proximosPassos(calmo);
    expect(passos.length).toBeGreaterThanOrEqual(1);
    expect(passos[0].texto).toMatch(/continue registrando/i);
  });

  it("no máximo três passos, com ids únicos", () => {
    for (const p of [base(), base({ sem_receita: true, resumo: resumo(0, 800) }), base({ resumo: resumo(1000, 1300) })]) {
      const passos = proximosPassos(p);
      expect(passos.length).toBeLessThanOrEqual(3);
      expect(new Set(passos.map((x) => x.id)).size).toBe(passos.length);
    }
  });
});

describe("corDaCategoria", () => {
  it("a mesma categoria tem sempre a mesma cor, sem diferenciar acento nem caixa", () => {
    expect(corDaCategoria("Alimentação")).toBe("var(--c2)");
    expect(corDaCategoria("alimentacao")).toBe("var(--c2)");
    expect(corDaCategoria("Moradia")).toBe("var(--c1)");
    expect(corDaCategoria("Habitação")).toBe("var(--c1)");
    expect(corDaCategoria("Transporte")).toBe("var(--c3)");
  });

  it("'Outras' e 'Outros' ficam em cinza", () => {
    expect(corDaCategoria("Outras")).toBe("var(--d-cinza)");
    expect(corDaCategoria("Outros")).toBe("var(--d-cinza)");
  });

  it("categoria que o bot criou recebe uma das oito cores, sempre a mesma", () => {
    const a = corDaCategoria("Pets");
    expect(a).toMatch(/^var\(--c[1-8]\)$/);
    expect(corDaCategoria("Pets")).toBe(a);
  });
});
