import { lerValor } from "@/lib/format";

/** Lógica da demonstração da landing: transforma uma frase em lançamento e agrega por categoria. */

export type Gasto = { descricao: string; valor: number; categoria: string };
export type Agregado = {
  total: number;
  categorias: { categoria: string; total: number; qtd: number; pct: number }[];
  maior: Gasto | null;
};

const SEM_ACENTO = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const CATEGORIAS: [string, string[]][] = [
  ["Alimentação", ["almoco", "jantar", "cafe", "lanche", "mercado", "supermercado", "padaria", "restaurante", "pizza", "ifood", "delivery", "feira", "acougue", "hamburguer"]],
  ["Transporte", ["uber", "onibus", "gasolina", "combustivel", "estacionamento", "metro", "taxi", "pedagio"]],
  ["Moradia", ["aluguel", "condominio", "iptu"]],
  ["Despesas Fixas", ["luz", "agua", "internet", "telefone", "gas"]],
  ["Saúde", ["farmacia", "remedio", "medico", "dentista", "consulta"]],
  ["Lazer", ["cinema", "show", "viagem", "bar", "hotel"]],
  ["Assinaturas", ["netflix", "spotify", "amazon", "assinatura"]],
  ["Educação", ["curso", "escola", "faculdade", "livro"]],
  ["Cuidados Pessoais", ["salao", "barbearia", "cabelo"]],
  ["Compras", ["roupa", "tenis", "camisa", "sapato"]],
];

const PALAVRAS_SOLTAS = new Set([
  "gastei", "paguei", "comprei", "foi", "deu", "no", "na", "nos", "nas", "de", "do", "da", "em", "com", "pro", "pra", "um", "uma", "o", "a", "e",
  "pix", "reais", "real", "r$", "rs",
]);

const LIMITE_DESCRICAO = 40;

function categorizar(descricaoNormalizada: string): string {
  const palavras = new Set(descricaoNormalizada.split(/[^a-z0-9]+/).filter(Boolean));
  for (const [nome, chaves] of CATEGORIAS) if (chaves.some((c) => palavras.has(c))) return nome;
  return "Outros";
}

/** Entende frases como "gastei 32 no almoço" ou "uber 18,50". Devolve null quando não há um valor claro. */
export function interpretar(entrada: string): Gasto | null {
  const limpo = entrada.replace(/<[^>]*>/g, " ").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
  if (!limpo) return null;

  const achado = /\d[\d.,]*/.exec(limpo);
  if (!achado) return null;
  const valor = lerValor(achado[0].replace(/[.,]+$/, ""));
  if (valor === null || valor > 1_000_000) return null;

  const resto = (limpo.slice(0, achado.index) + " " + limpo.slice(achado.index + achado[0].length)).replace(/\s+/g, " ").trim();
  const palavras = resto.split(" ").filter((p) => p && !PALAVRAS_SOLTAS.has(SEM_ACENTO(p)));
  const texto = palavras.join(" ").slice(0, LIMITE_DESCRICAO).trim();
  const descricao = texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Gasto";

  return { descricao, valor, categoria: categorizar(SEM_ACENTO(texto)) };
}

export function agregar(itens: Gasto[]): Agregado {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const mapa = new Map<string, { total: number; qtd: number }>();
  for (const i of itens) {
    const atual = mapa.get(i.categoria) ?? { total: 0, qtd: 0 };
    mapa.set(i.categoria, { total: atual.total + i.valor, qtd: atual.qtd + 1 });
  }
  const categorias = [...mapa.entries()]
    .map(([categoria, v]) => ({ categoria, total: v.total, qtd: v.qtd, pct: total > 0 ? (v.total / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
  const maior = itens.reduce<Gasto | null>((m, i) => (m === null || i.valor > m.valor ? i : m), null);
  return { total, categorias, maior };
}
