/** Cores e textos compartilhados da landing nova. Os textos de privacidade e das perguntas são os mesmos da landing atual. */

const CORES: Record<string, string> = {
  "Alimentação": "var(--nv-laranja)",
  "Transporte": "var(--nv-ciano)",
  "Moradia": "var(--nv-violeta)",
  "Despesas Fixas": "var(--nv-verde)",
  "Saúde": "var(--nv-vermelho)",
  "Lazer": "var(--nv-rosa)",
  "Assinaturas": "var(--nv-amarelo)",
  "Educação": "var(--nv-lima)",
};

/** A cor segue a categoria, nunca a posição na lista. */
export function corDe(categoria: string): string {
  return CORES[categoria] ?? "#8fa399";
}

export const AFIRMACOES = [
  { frase: "Não acessamos sua conta bancária.", detalhe: "Você registra só o que quiser, do jeito que quiser." },
  { frase: "Cada pessoa vê só os próprios dados.", detalhe: "O isolamento é feito no banco de dados, não só na tela." },
  { frase: "Baixe tudo quando quiser.", detalhe: "Envie MEUS DADOS no WhatsApp e receba um resumo e um arquivo com todos os lançamentos." },
  { frase: "Apague tudo com uma mensagem.", detalhe: "EXCLUIR MEUS DADOS remove lançamentos e conversas e anonimiza o cadastro." },
  { frase: "Sem anúncios nem oferta de crédito.", detalhe: "Quem sustenta o produto é a assinatura, não os seus dados." },
];

export const DUVIDAS = [
  { q: "Preciso instalar algum aplicativo?", a: "Não. Você usa o WhatsApp que já tem. O painel abre no navegador, no celular ou no computador." },
  { q: "O teste grátis pede cartão?", a: "Não. São 7 dias sem cartão, com 50 mensagens. Quem registra 5 gastos ganha mais 3 dias." },
  { q: "Como entro no painel?", a: "Com e-mail e senha. No primeiro acesso você confirma pelo WhatsApp que o número é seu e cria a senha. Se esquecer, recupera pelo WhatsApp também." },
  { q: "Como eu pago?", a: "Pelo Mercado Pago, com Pix, cartão ou boleto. O plano vale por um mês e não renova sozinho: você renova quando quiser." },
  { q: "O assistente dá dicas?", a: "Só se você perguntar. Ele analisa os seus gastos e sugere algo leve, como um teto para uma categoria. Não dá conselho de investimento nem indica bancos, aplicativos ou produtos." },
];

/** Alturas fixas da onda de áudio (nada aleatório: o servidor e o navegador desenham igual). */
export const ONDA = [8, 14, 20, 11, 17, 24, 13, 9, 19, 22, 12, 16, 10, 21, 15, 8, 18, 13, 23, 11, 16, 9, 14, 19];
