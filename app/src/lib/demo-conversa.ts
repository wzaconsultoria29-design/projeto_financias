import { agregar, interpretar, type Gasto } from "@/lib/demo";
import { MES, PERGUNTAS, responder } from "@/lib/demo-dados";
import { brl } from "@/lib/format";

/** Conversa de demonstração da landing: o visitante escolhe um jeito de mandar e vê a resposta. Tudo calculado do mês de exemplo. */

export type TipoMensagem = "texto" | "audio" | "foto" | "pergunta";

export type MensagemVoce =
  | { de: "voce"; tipo: "texto" | "pergunta"; texto: string }
  | { de: "voce"; tipo: "audio"; duracao: string; transcricao: string }
  | { de: "voce"; tipo: "foto"; legenda: string };

export type MensagemBot = { de: "bot"; texto: string };
export type MensagemDemo = MensagemVoce | MensagemBot;

export type Cenario = { id: TipoMensagem; tipo: TipoMensagem; rotulo: string; voce: MensagemVoce; bot: string[] };

const anotado = (g: Gasto) => `Anotado: ${brl(g.valor)}, ${g.descricao}, ${g.categoria}.`;

/** Total da categoria no mês de exemplo, já contando o gasto novo. */
function totalComGasto(g: Gasto): string {
  const total = agregar([g, ...MES]).categorias.find((c) => c.categoria === g.categoria)?.total ?? g.valor;
  return `${g.categoria} no mês: ${brl(total)}.`;
}

function montar(): Cenario[] {
  const texto = interpretar("mercado 184");
  const falado = interpretar("gastei 32 no almoço");
  const cupom: Gasto = { descricao: "Mercado", valor: 87.5, categoria: "Alimentação" };
  if (!texto || !falado) throw new Error("demo-conversa: frases de exemplo não foram entendidas");

  return [
    { id: "texto", tipo: "texto", rotulo: "mercado 184", voce: { de: "voce", tipo: "texto", texto: "mercado 184" }, bot: [anotado(texto), totalComGasto(texto)] },
    {
      id: "audio",
      tipo: "audio",
      rotulo: "Mandar um áudio",
      voce: { de: "voce", tipo: "audio", duracao: "0:04", transcricao: "gastei 32 no almoço" },
      bot: ["Ouvi: gastei 32 no almoço.", anotado(falado)],
    },
    {
      id: "foto",
      tipo: "foto",
      rotulo: "Foto da notinha",
      voce: { de: "voce", tipo: "foto", legenda: "Cupom do mercado" },
      bot: [`Li o cupom: ${brl(cupom.valor)} em ${cupom.descricao}.`, anotado(cupom)],
    },
    { id: "pergunta", tipo: "pergunta", rotulo: PERGUNTAS[0], voce: { de: "voce", tipo: "pergunta", texto: PERGUNTAS[0] }, bot: [responder(PERGUNTAS[0])] },
  ];
}

export const CENARIOS: Cenario[] = montar();

export function cenario(id: TipoMensagem): Cenario {
  const c = CENARIOS.find((x) => x.id === id);
  if (!c) throw new Error(`cenário desconhecido: ${id}`);
  return c;
}
