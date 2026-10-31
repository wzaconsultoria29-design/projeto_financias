import { brand } from "@/config/brand";

/** Versão dos textos legais. Deve ser igual a `Config.termos_versao` no n8n e à versão gravada no aceite. */
export const VERSAO_LEGAL = "v1-2026-10";

export type SecaoLegal = { titulo: string; paragrafos: string[] };

export const termos: SecaoLegal[] = [
  {
    titulo: "O que é o serviço",
    paragrafos: [
      `O ${brand.name} registra gastos e receitas que você envia pelo WhatsApp (texto, áudio ou foto) e mostra o resumo em um painel na web. Não é consultoria financeira, não acessa a sua conta bancária e não movimenta dinheiro.`,
    ],
  },
  {
    titulo: "Quem pode usar",
    paragrafos: ["Pessoas com 18 anos ou mais e com número de celular próprio. Você é responsável pelas informações que envia."],
  },
  {
    titulo: "Conta e acesso",
    paragrafos: [
      "O seu número de WhatsApp identifica a sua conta. Você entra no painel enviando, do seu número, o código mostrado no site. Não compartilhe esse código com ninguém.",
    ],
  },
  {
    titulo: "Planos e pagamento",
    paragrafos: [
      "O teste grátis dura 7 dias e inclui 50 mensagens. Valores, formas de pagamento e regras de cancelamento dos planos pagos serão informados antes da contratação.",
    ],
  },
  {
    titulo: "Uso adequado",
    paragrafos: [
      "Não use o serviço para atividades ilegais, para enviar dados de terceiros sem autorização ou para tentar acessar dados de outras pessoas.",
    ],
  },
  {
    titulo: "Inteligência artificial",
    paragrafos: [
      "Usamos inteligência artificial para interpretar as suas mensagens. Ela pode errar: confira a confirmação que você recebe e corrija ou apague o lançamento quando necessário.",
    ],
  },
  {
    titulo: "Limites do serviço",
    paragrafos: [
      "O serviço é oferecido no estado em que se encontra, sem garantia de funcionamento ininterrupto. Não nos responsabilizamos por decisões financeiras tomadas com base nos registros.",
    ],
  },
  {
    titulo: "Encerramento",
    paragrafos: [
      "Você pode apagar os seus dados a qualquer momento (veja a Política de privacidade). Podemos suspender contas que descumpram estes termos.",
    ],
  },
  {
    titulo: "Alterações e contato",
    paragrafos: [
      "Podemos atualizar estes termos. A versão em vigor aparece no topo desta página.",
      `Dúvidas: ${brand.supportEmail}.`,
    ],
  },
];

export const privacidade: SecaoLegal[] = [
  {
    titulo: "Quem é o responsável",
    paragrafos: [
      `${brand.legalEntity}. Contato para assuntos de privacidade: ${brand.supportEmail}. Encarregado pelo tratamento de dados: a definir.`,
    ],
  },
  {
    titulo: "Dados que tratamos",
    paragrafos: [
      "Telefone, nome e e-mail do cadastro. Mensagens que você envia (texto, áudio e imagens). Lançamentos (valor, data, categoria e descrição). Quantidade de mensagens usadas e o registro do seu aceite.",
    ],
  },
  {
    titulo: "Para que usamos e em que base legal",
    paragrafos: [
      "Prestar o serviço contratado: interpretar suas mensagens, guardar os lançamentos e mostrar o painel (execução de contrato). Segurança e prevenção a fraudes (legítimo interesse). Cumprir obrigações legais, como registros de pagamento. Enviar novidades do produto, somente se você marcou essa opção (consentimento).",
    ],
  },
  {
    titulo: "Com quem compartilhamos",
    paragrafos: [
      "Usamos prestadores que tratam dados em nosso nome: hospedagem e banco de dados (Supabase), inteligência artificial para interpretar mensagens, áudios e imagens (OpenAI), transmissão de mensagens (WhatsApp, da Meta, e o servidor que conecta o número ao serviço) e hospedagem do site (Vercel). Não vendemos seus dados.",
    ],
  },
  {
    titulo: "Transferência internacional",
    paragrafos: [
      "Alguns desses prestadores estão nos Estados Unidos. Adotamos as salvaguardas exigidas pela LGPD para essa transferência.",
    ],
  },
  {
    titulo: "Por quanto tempo guardamos",
    paragrafos: [
      "Enquanto a sua conta estiver ativa. Lançamentos apagados ficam marcados como excluídos. Quando você pede EXCLUIR MEUS DADOS, apagamos lançamentos e conversas e anonimizamos o cadastro, mantendo apenas o que a lei exige (como registros de pagamento e a prova do aceite).",
    ],
  },
  {
    titulo: "Seus direitos",
    paragrafos: [
      "Você pode confirmar a existência do tratamento, acessar, corrigir, receber uma cópia, pedir a eliminação dos dados e revogar consentimentos. Pelo WhatsApp, envie MEUS DADOS para receber uma cópia ou EXCLUIR MEUS DADOS para apagar tudo. Também atendemos por e-mail.",
    ],
  },
  {
    titulo: "Segurança",
    paragrafos: [
      "Conexões protegidas, acesso restrito e isolamento entre clientes: cada pessoa só enxerga os próprios dados. Nenhum sistema é totalmente imune a falhas; em caso de incidente relevante, avisaremos as pessoas afetadas e a autoridade, como a lei determina.",
    ],
  },
  {
    titulo: "Dados sensíveis e menores",
    paragrafos: [
      "Evite incluir dados sensíveis (como saúde ou religião) na descrição dos lançamentos. O serviço não é destinado a menores de 18 anos.",
    ],
  },
  {
    titulo: "Alterações",
    paragrafos: ["Esta política pode mudar. A versão em vigor aparece no topo desta página."],
  },
];
