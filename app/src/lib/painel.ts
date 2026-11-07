import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";

/** Percentual de uma parte no total; zero quando não há total (nunca NaN). */
export function participacao(parte: number, total: number): number {
  return total > 0 ? (parte / total) * 100 : 0;
}

/** "45,7%" ou "5%": uma casa decimal só quando precisa. */
export function pctTexto(n: number): string {
  const inteiro = Math.abs(n - Math.round(n)) < 0.05;
  return `${(inteiro ? Math.round(n) : Number(n.toFixed(1))).toString().replace(".", ",")}%`;
}

/** Gasto médio por ocorrência de cada dia da semana (domingo = 0). Dia que ainda não ocorreu fica em zero. */
export function mediaPorDiaSemana(dias: Painel["dia_semana"]): { dow: number; total: number; media: number }[] {
  return dias.map((d) => ({ dow: d.dow, total: d.total, media: d.ocorrencias > 0 ? Math.round((d.total / d.ocorrencias) * 100) / 100 : 0 }));
}

const REFERENCIA_POUPANCA = 20;
const AUMENTO_MINIMO_REAIS = 50;
const AUMENTO_MINIMO_PCT = 15;

/**
 * Frases de análise do painel, montadas só com números que já vieram do banco. Cada frase só existe quando os
 * dados a sustentam. No máximo quatro, nesta ordem de importância: renda e poupança, o que mais subiu,
 * previsão do mês, concentração e fixos.
 */
export function gerarInsights(p: Painel): string[] {
  const frases: string[] = [];
  const { resumo } = p;
  if (resumo.despesas <= 0 && resumo.receitas <= 0) return frases;

  if (p.sem_receita) {
    frases.push("Registre a sua renda deste período para ver quanto sobra de verdade.");
  } else if (resumo.taxa_poupanca !== null) {
    if (resumo.saldo < 0) {
      frases.push(`Você gastou ${brl(Math.abs(resumo.saldo))} a mais do que recebeu neste período.`);
    } else if (resumo.taxa_poupanca >= REFERENCIA_POUPANCA) {
      frases.push(`Você poupou ${pctTexto(resumo.taxa_poupanca)} da renda, acima da referência de ${REFERENCIA_POUPANCA}%.`);
    } else {
      frases.push(`Você poupou ${pctTexto(resumo.taxa_poupanca)} da renda. A referência é ${REFERENCIA_POUPANCA}%.`);
    }
  }

  const subiu = p.categorias
    .filter((c) => c.anterior > 0 && c.total - c.anterior >= AUMENTO_MINIMO_REAIS && participacao(c.total - c.anterior, c.anterior) >= AUMENTO_MINIMO_PCT)
    .sort((a, b) => b.total - b.anterior - (a.total - a.anterior))[0];
  if (subiu) {
    frases.push(`${subiu.categoria} foi de ${brl(subiu.anterior)} para ${brl(subiu.total)}, ${brl(subiu.total - subiu.anterior)} a mais que no período anterior.`);
  }

  if (p.projecao) {
    frases.push(`No ritmo atual, o mês fecha com ${brl(p.projecao.previsto)} em despesas.`);
  }

  if (p.pareto.top3_pct !== null && p.categorias.length >= 3) {
    frases.push(`As 3 maiores categorias somam ${pctTexto(p.pareto.top3_pct)} do que você gastou.`);
  }

  if (p.fixos.fixos_total > 0 && resumo.despesas > 0) {
    frases.push(`${pctTexto(participacao(p.fixos.fixos_total, resumo.despesas))} do gasto é fixo (${brl(p.fixos.fixos_total)}): moradia, contas e assinaturas.`);
  }

  return frases.slice(0, 4);
}

/** Eixo vertical com quatro degraus iguais e o topo sempre acima do maior valor (a linha nunca encosta na borda). */
export function eixo(max: number): { topo: number; passos: number[] } {
  const alvo = max > 0 ? max : 100;
  for (let e = -2; e <= 9; e++) {
    for (const m of [1, 2, 2.5, 5]) {
      const degrau = m * 10 ** e;
      if (degrau * 4 > alvo) return { topo: degrau * 4, passos: [0, 1, 2, 3, 4].map((i) => Math.round(degrau * i * 100) / 100) };
    }
  }
  return { topo: alvo, passos: [0, alvo] };
}

/** Valor abreviado para o eixo: "500", "1,5 mil". */
export function valorCurto(v: number): string {
  if (v >= 1000) return `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return String(Math.round(v));
}

/** Reais e centavos separados, para o número grande com os centavos menores. */
export function partesBrl(v: number): { sinal: string; inteiro: string; centavos: string } {
  const texto = brl(Math.abs(v));
  const corte = texto.lastIndexOf(",");
  return { sinal: v < 0 ? "-" : "", inteiro: texto.slice(0, corte), centavos: texto.slice(corte) };
}

/** Anda `n` dias no calendário a partir de "AAAA-MM-DD". */
export function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const NOME_DIA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const NOME_DIA_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** "+R$ 200,00" / "-R$ 50,00": a variação com sinal, vazia quando não mudou. */
export function deltaBrl(v: number): string {
  if (Math.abs(v) < 0.005) return "";
  return `${v > 0 ? "+" : "-"}${brl(Math.abs(v))}`;
}

/** A resposta de uma frase à pergunta da tela: estou no azul? Sem renda registrada, não afirma nada sobre o saldo. */
export function veredito(p: Painel): string {
  const { resumo } = p;
  if (resumo.despesas <= 0 && resumo.receitas <= 0) return "Nada foi lançado neste período ainda.";
  if (p.sem_receita) return "Falta registrar a renda para saber se sobra.";
  if (resumo.saldo > 0) return "Você está no azul neste período.";
  if (resumo.saldo < 0) return "Você gastou mais do que recebeu neste período.";
  return "Você fechou o período no zero a zero.";
}

export type Folga = { tipo: "ok"; porDia: number; restante: number; dias: number } | { tipo: "estourou"; excesso: number };

/**
 * Quanto ainda dá para gastar por dia até o fim do mês: o que sobra da renda registrada dividido pelos dias que faltam.
 * Só existe no mês em andamento e com renda registrada; no último dia, divide por um (nunca por zero).
 */
export function podeGastarPorDia(p: Painel): Folga | null {
  if (!p.projecao || p.sem_receita || p.resumo.receitas <= 0) return null;
  const restante = Math.round((p.resumo.receitas - p.resumo.despesas) * 100) / 100;
  if (restante <= 0) return { tipo: "estourou", excesso: 0 - restante };
  const dias = Math.max(1, p.projecao.dias_no_mes - p.projecao.dias_decorridos);
  return { tipo: "ok", porDia: Math.round((restante / dias) * 100) / 100, restante, dias };
}
