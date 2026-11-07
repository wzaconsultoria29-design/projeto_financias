export type PlanoVitrine = {
  codigo: "trial" | "essencial" | "family";
  nome: string;
  preco: string;
  periodo: string;
  resumo: string;
  destaque?: boolean;
  emBreve?: boolean;
  itens: string[];
  cta: { texto: string; href: string };
};

/** Espelha a tabela `planos` do banco (migração 009). Se mudar lá, mude aqui. */
export const planos: PlanoVitrine[] = [
  {
    codigo: "trial",
    nome: "Teste grátis",
    preco: "Grátis",
    periodo: "por 7 dias",
    resumo: "Teste tudo, sem cartão.",
    itens: ["Texto, áudio e foto no WhatsApp", "Painel completo", "50 mensagens para testar", "Registrou 5 gastos? Ganha mais 3 dias"],
    cta: { texto: "Começar grátis", href: "/cadastro?plano=trial" },
  },
  {
    codigo: "essencial",
    nome: "Essencial",
    preco: "R$ 19",
    periodo: "por mês",
    resumo: "Para quem quer controle o mês inteiro.",
    destaque: true,
    itens: ["Tudo do Teste grátis", "300 mensagens por mês", "Comparação com o período anterior", "Exportação em CSV"],
    cta: { texto: "Começar grátis", href: "/cadastro?plano=essencial" },
  },
  {
    codigo: "family",
    nome: "Family",
    preco: "R$ 39",
    periodo: "por mês",
    resumo: "Para casais e famílias organizadas.",
    emBreve: true,
    itens: [
      "Tudo do Essencial",
      "Até 4 números no mesmo grupo",
      "Todos veem os gastos do grupo",
      "800 mensagens por mês, compartilhadas",
    ],
    cta: { texto: "Quero ser avisado", href: "/cadastro?plano=family" },
  },
];

/** Custo por dia de um preço mensal ("R$ 19" vira "R$ 0,63"), ou null quando o preço não é um número. */
export function porDia(preco: string): string | null {
  const n = Number(preco.replace(/[^\d,]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return `R$ ${(Math.round((n / 30) * 100) / 100).toFixed(2).replace(".", ",")}`;
}
