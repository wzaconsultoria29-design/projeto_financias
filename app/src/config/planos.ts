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
    nome: "Trial",
    preco: "Grátis",
    periodo: "por 7 dias",
    resumo: "Teste tudo, sem cartão.",
    itens: ["Texto, áudio e foto no WhatsApp", "Painel completo", "50 mensagens para testar"],
    cta: { texto: "Começar grátis", href: "/cadastro?plano=trial" },
  },
  {
    codigo: "essencial",
    nome: "Essencial",
    preco: "R$ 19",
    periodo: "por mês",
    resumo: "Para quem quer controle o mês inteiro.",
    destaque: true,
    itens: ["Tudo do Trial", "300 mensagens por mês", "Comparação com o período anterior", "Exportação em CSV"],
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
