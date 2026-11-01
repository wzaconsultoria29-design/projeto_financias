import type { Gasto } from "@/lib/demo";

/** Dados de exemplo da landing. Os totais e percentuais são calculados por `agregar`, nunca digitados. */

export const MES: Gasto[] = [
  { descricao: "Restaurante", valor: 142, categoria: "Alimentação" },
  { descricao: "Farmácia", valor: 87, categoria: "Saúde" },
  { descricao: "Netflix", valor: 55.9, categoria: "Assinaturas" },
  { descricao: "Uber", valor: 64.8, categoria: "Transporte" },
  { descricao: "Conta de luz", valor: 128.4, categoria: "Despesas Fixas" },
  { descricao: "Aluguel", valor: 1150, categoria: "Moradia" },
  { descricao: "Mercado", valor: 412.3, categoria: "Alimentação" },
];
export const MES_ANTERIOR = 1912.7;

export const SEMANA: Gasto[] = [
  { descricao: "Mercado", valor: 150.3, categoria: "Alimentação" },
  { descricao: "Restaurante", valor: 142, categoria: "Alimentação" },
  { descricao: "Uber", valor: 64.8, categoria: "Transporte" },
  { descricao: "Cinema", valor: 62, categoria: "Lazer" },
];
export const SEMANA_ANTERIOR = 388.4;

export const ANO: Gasto[] = [
  { descricao: "Mercado e restaurantes", valor: 5320, categoria: "Alimentação" },
  { descricao: "Aluguel", valor: 11500, categoria: "Moradia" },
  { descricao: "Luz, água e internet", valor: 2460, categoria: "Despesas Fixas" },
  { descricao: "Uber e combustível", valor: 790, categoria: "Transporte" },
  { descricao: "Assinaturas", valor: 640, categoria: "Assinaturas" },
  { descricao: "Consultas e farmácia", valor: 1040, categoria: "Saúde" },
];
export const ANO_ANTERIOR = 20100;

export type Periodo = "semana" | "mes" | "ano";

export const PERIODOS: Record<Periodo, { rotulo: string; titulo: string; itens: Gasto[]; anterior: number; anteriorRotulo: string }> = {
  semana: { rotulo: "Semana", titulo: "Esta semana", itens: SEMANA, anterior: SEMANA_ANTERIOR, anteriorRotulo: "semana passada" },
  mes: { rotulo: "Mês", titulo: "Este mês", itens: MES, anterior: MES_ANTERIOR, anteriorRotulo: "mês passado" },
  ano: { rotulo: "Ano", titulo: "Este ano", itens: ANO, anterior: ANO_ANTERIOR, anteriorRotulo: "ano passado" },
};

/** Alimentação no mês passado, usada nas respostas de exemplo do assistente. */
export const ALIMENTACAO_ANTERIOR = 480;
