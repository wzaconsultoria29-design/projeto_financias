import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { deltaBrl, participacao, pctTexto } from "@/lib/painel";

/**
 * A história do período, escrita com os números que já vieram do banco. Cada frase só existe quando os dados a sustentam
 * (senão é null) e nunca acusa, aconselha investimento nem inventa causa.
 */

const AUMENTO_MINIMO_REAIS = 10; // abaixo disso a variação de uma categoria é ruído
const AUMENTO_RELEVANTE_REAIS = 50; // para virar "próximo passo"
const AUMENTO_RELEVANTE_PCT = 15;
const REFERENCIA_POUPANCA = 20;

const arredonda1 = (n: number) => Math.round(n * 10) / 10;

export type Mudanca = {
  chave: "despesas" | "receitas" | "subiu" | "caiu";
  rotulo: string;
  atual: number;
  anterior: number;
  delta: number;
  pct: number | null;
  /** Cor diz bom ou ruim, não subiu ou desceu: gastar menos é bom, receber mais é bom. */
  bom: boolean;
};

/** O que mudou em relação ao período anterior, com o antes e o depois. */
export function oQueMudou(p: Painel): Mudanca[] {
  const out: Mudanca[] = [];
  const { resumo, anterior } = p;

  // O mês em andamento é comparado com o mesmo ponto do mês passado (comparação justa).
  if (anterior.despesas_mesmo_ponto > 0) {
    const delta = resumo.despesas - anterior.despesas_mesmo_ponto;
    out.push({ chave: "despesas", rotulo: "Despesas", atual: resumo.despesas, anterior: anterior.despesas_mesmo_ponto, delta, pct: arredonda1((delta / anterior.despesas_mesmo_ponto) * 100), bom: delta <= 0 });
  }
  // Receitas só quando o período está fechado: o mês anterior inteiro não se compara com um mês pela metade.
  if (!p.projecao && anterior.receitas > 0) {
    const delta = resumo.receitas - anterior.receitas;
    out.push({ chave: "receitas", rotulo: "Receitas", atual: resumo.receitas, anterior: anterior.receitas, delta, pct: arredonda1((delta / anterior.receitas) * 100), bom: delta >= 0 });
  }

  // "Outras" junta várias categorias, então não diz nada sobre uma delas.
  const comparaveis = p.categorias.filter((c) => c.categoria !== "Outras" && c.anterior > 0).map((c) => ({ c, delta: c.total - c.anterior }));
  const subiu = comparaveis.filter((x) => x.delta >= AUMENTO_MINIMO_REAIS).sort((a, b) => b.delta - a.delta)[0];
  const caiu = comparaveis.filter((x) => x.delta <= -AUMENTO_MINIMO_REAIS).sort((a, b) => a.delta - b.delta)[0];
  if (subiu) out.push({ chave: "subiu", rotulo: subiu.c.categoria, atual: subiu.c.total, anterior: subiu.c.anterior, delta: subiu.delta, pct: arredonda1((subiu.delta / subiu.c.anterior) * 100), bom: false });
  if (caiu) out.push({ chave: "caiu", rotulo: caiu.c.categoria, atual: caiu.c.total, anterior: caiu.c.anterior, delta: caiu.delta, pct: arredonda1((caiu.delta / caiu.c.anterior) * 100), bom: true });
  return out;
}

export type Manchetes = {
  abertura: string;
  mudou: string | null;
  onde: string | null;
  divisao: string | null;
  ritmo: string | null;
  tendencia: string | null;
};

function abertura(p: Painel): string {
  const { resumo } = p;
  if (resumo.despesas <= 0 && resumo.receitas <= 0) return "Ainda não há lançamentos neste período.";
  if (p.sem_receita) return `Você gastou ${brl(resumo.despesas)}. Falta registrar a renda para saber quanto sobra.`;
  if (resumo.saldo > 0) {
    return resumo.taxa_poupanca === null ? `Sobraram ${brl(resumo.saldo)}.` : `Sobraram ${brl(resumo.saldo)}: você poupou ${pctTexto(resumo.taxa_poupanca)} da renda.`;
  }
  if (resumo.saldo < 0) return `Você gastou ${brl(Math.abs(resumo.saldo))} a mais do que recebeu.`;
  return "Você fechou no zero a zero.";
}

function mudou(p: Painel): string | null {
  const v = p.variacao_despesas_pct;
  if (v === null) return null;
  let frase = v === 0 ? "Você gastou o mesmo que no período anterior, até o mesmo ponto." : `Você gastou ${pctTexto(Math.abs(v))} a ${v > 0 ? "mais" : "menos"} que no período anterior, até o mesmo ponto.`;
  const subiu = oQueMudou(p).find((m) => m.chave === "subiu");
  if (subiu) frase += ` O maior aumento foi em ${subiu.rotulo} (${deltaBrl(subiu.delta)}).`;
  return frase;
}

function onde(p: Painel): string | null {
  const topo = p.categorias[0];
  if (!topo || p.resumo.despesas <= 0 || topo.categoria === "Outras") return null;
  if (topo.pct >= 99.95) return `Todo o seu gasto foi em ${topo.categoria}.`;
  if (topo.pct > 50) return `${topo.categoria} levou mais da metade do que você gastou.`;
  return `${topo.categoria} levou ${pctTexto(topo.pct)} do que você gastou.`;
}

function divisao(p: Painel): string | null {
  const { tipos, resumo } = p;
  if (resumo.despesas <= 0 || tipos.essencial + tipos.superfluo + tipos.investimento <= 0) return null;
  const parte = (v: number) => pctTexto(participacao(v, resumo.despesas));
  let frase = `Do que você gastou, ${parte(tipos.essencial)} foi essencial, ${parte(tipos.superfluo)} supérfluo e ${parte(tipos.investimento)} investimento.`;
  if (tipos.sem_tipo > 0) frase += " O restante não foi classificado.";
  return frase;
}

function ritmo(p: Painel): string | null {
  const { resumo, projecao } = p;
  if (projecao) {
    const base = `No ritmo atual, o mês fecha com ${brl(projecao.previsto)} em despesas`;
    if (p.sem_receita || resumo.receitas <= 0) return `${base}.`;
    return projecao.previsto <= resumo.receitas ? `${base}, dentro da renda registrada.` : `${base}, ${brl(projecao.previsto - resumo.receitas)} acima da renda registrada.`;
  }
  return resumo.media_diaria > 0 ? `Você gastou em média ${brl(resumo.media_diaria)} por dia.` : null;
}

function tendencia(p: Painel): string | null {
  // O mês em andamento está pela metade: fica de fora da comparação.
  const meses = p.projecao ? p.tendencia.slice(0, -1) : p.tendencia;
  const ultimos = meses.slice(-3).map((m) => m.despesas);
  if (ultimos.length === 3 && ultimos.every((v) => v > 0)) {
    if (ultimos[0] < ultimos[1] && ultimos[1] < ultimos[2]) return "Suas despesas subiram nos últimos 3 meses.";
    if (ultimos[0] > ultimos[1] && ultimos[1] > ultimos[2]) return "Suas despesas caíram nos últimos 3 meses.";
  }
  const [anteriorMes, ultimoMes] = meses.slice(-2).map((m) => m.despesas);
  if (anteriorMes !== undefined && ultimoMes !== undefined && anteriorMes > 0 && ultimoMes > 0 && anteriorMes !== ultimoMes) {
    return `Suas despesas ${ultimoMes > anteriorMes ? "subiram" : "caíram"} de ${brl(anteriorMes)} para ${brl(ultimoMes)} no último mês.`;
  }
  return null;
}

/** A frase de cada capítulo da história: a conclusão que o gráfico ou o número abaixo dela comprova. */
export function manchetes(p: Painel): Manchetes {
  return { abertura: abertura(p), mudou: mudou(p), onde: onde(p), divisao: divisao(p), ritmo: ritmo(p), tendencia: tendencia(p) };
}

export type AcaoPasso =
  | { tipo: "lancar"; rotulo: string }
  | { tipo: "link"; rotulo: string; href: string }
  | { tipo: "pergunta"; rotulo: string; pergunta: string };

export type Passo = { id: string; texto: string; acao: AcaoPasso };

const PERGUNTAR_ECONOMIA: AcaoPasso = { tipo: "pergunta", rotulo: "Perguntar no WhatsApp", pergunta: "Onde posso economizar?" };

/** Até três próximos passos que dependem dos dados do período. Sempre devolve pelo menos um. */
export function proximosPassos(p: Painel): Passo[] {
  const { resumo } = p;
  if (resumo.despesas <= 0 && resumo.receitas <= 0) {
    return [{ id: "vazio", texto: "Registre o primeiro gasto ou a sua renda para o painel começar a contar a história.", acao: { tipo: "lancar", rotulo: "Lançar agora" } }];
  }

  const passos: Passo[] = [];
  if (p.sem_receita) {
    passos.push({ id: "sem-renda", texto: "Registre a sua renda deste período para ver quanto sobra de verdade.", acao: { tipo: "lancar", rotulo: "Registrar renda" } });
  } else if (resumo.saldo < 0) {
    passos.push({ id: "passou-da-renda", texto: "Você passou da renda. Veja onde dá para ajustar.", acao: PERGUNTAR_ECONOMIA });
  }

  const subiu = oQueMudou(p).find((m) => m.chave === "subiu");
  if (subiu && subiu.delta >= AUMENTO_RELEVANTE_REAIS && (subiu.pct ?? 0) >= AUMENTO_RELEVANTE_PCT) {
    const href = `/painel/lancamentos?categoria=${encodeURIComponent(subiu.rotulo)}&de=${p.periodo.de}&ate=${p.periodo.ate}`;
    passos.push({ id: "subiu", texto: `${subiu.rotulo} subiu ${brl(subiu.delta)}. Veja os lançamentos dessa categoria.`, acao: { tipo: "link", rotulo: "Ver lançamentos", href } });
  }

  if (!p.sem_receita && resumo.saldo > 0 && resumo.taxa_poupanca !== null && resumo.taxa_poupanca < REFERENCIA_POUPANCA) {
    passos.push({ id: "poupanca-baixa", texto: `Sobrou menos que a referência de ${REFERENCIA_POUPANCA}%. Vale olhar os gastos supérfluos.`, acao: PERGUNTAR_ECONOMIA });
  }

  if (passos.length === 0) {
    return [
      {
        id: "tudo-certo",
        texto: "Tudo em ordem por aqui. Continue registrando: quanto mais lançamentos, mais precisa fica a leitura.",
        acao: { tipo: "pergunta", rotulo: "Perguntar no WhatsApp", pergunta: "Quanto gastei esta semana?" },
      },
    ];
  }
  if (!passos.some((x) => x.acao.tipo === "pergunta")) {
    passos.push({ id: "perguntar", texto: "Pergunte ao assistente onde dá para economizar.", acao: PERGUNTAR_ECONOMIA });
  }
  return passos.slice(0, 3);
}

/** Oito cores de categoria (--c1 a --c8, paleta validada para daltonismo) e o cinza de "Outras". Cor segue a categoria, nunca a posição. */
const FIXAS: Record<string, string> = {
  alimentacao: "var(--c2)",
  moradia: "var(--c1)",
  habitacao: "var(--c1)",
  transporte: "var(--c3)",
  lazer: "var(--c5)",
  saude: "var(--c8)",
  educacao: "var(--c4)",
  compras: "var(--c7)",
  roupas: "var(--c7)",
  vestuario: "var(--c7)",
  assinaturas: "var(--c7)",
  contas: "var(--c6)",
  "despesas fixas": "var(--c6)",
  seguros: "var(--c6)",
  outras: "var(--d-cinza)",
  outros: "var(--d-cinza)",
};

export function corDaCategoria(nome: string): string {
  const chave = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  const fixa = FIXAS[chave];
  if (fixa) return fixa;
  let soma = 0;
  for (const ch of chave) soma += ch.charCodeAt(0);
  return `var(--c${(soma % 8) + 1})`;
}
