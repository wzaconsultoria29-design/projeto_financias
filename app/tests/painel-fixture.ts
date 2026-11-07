import type { Painel } from "@/lib/api";

/** Outubro/2026 do cliente de teste: receitas 3.500, despesas 1.900, saldo 1.600 (os mesmos números do teste SQL 015). */
export function base(extra: Partial<Painel> = {}): Painel {
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
    fixos: { fixos_total: 1050, variaveis_total: 850, maiores: [{ descricao: "Aluguel", categoria: "Moradia", valor: 1000 }] },
    acumulado: Array.from({ length: 31 }, (_, i) => ({ dia: i + 1, atual: Math.round(((i + 1) / 31) * 1900), anterior: Math.round(((i + 1) / 30) * 1500) })),
    dia_semana: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({ dow, total: dow === 5 ? 700 : 100, ocorrencias: dow === 5 ? 5 : 4 })),
    tendencia: [
      { mes: "2026-05-01", receitas: 0, despesas: 0 },
      { mes: "2026-06-01", receitas: 0, despesas: 0 },
      { mes: "2026-07-01", receitas: 0, despesas: 0 },
      { mes: "2026-08-01", receitas: 3000, despesas: 1000 },
      { mes: "2026-09-01", receitas: 3000, despesas: 1500 },
      { mes: "2026-10-01", receitas: 3500, despesas: 1900 },
    ],
    maiores: [],
    projecao: null,
    sem_receita: false,
    historico_total: 14,
    ...extra,
  };
}

export const SEM_DADOS: Partial<Painel> = {
  resumo: { receitas: 0, despesas: 0, saldo: 0, taxa_poupanca: null, media_diaria: 0, quantidade: 0 },
  variacao_despesas_pct: null,
  categorias: [],
  pareto: { top3_pct: null },
  tipos: { essencial: 0, superfluo: 0, investimento: 0, sem_tipo: 0 },
  fixos: { fixos_total: 0, variaveis_total: 0, maiores: [] },
  acumulado: null,
  tendencia: [],
  historico_total: 0,
};
