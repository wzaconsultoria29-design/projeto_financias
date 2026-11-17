import type { Metadata } from "next";
import { Casca } from "@/components/nova/Casca";

export const metadata: Metadata = {
  title: "Controle financeiro em uma mensagem",
  description: "Mande o gasto por texto, áudio ou foto no WhatsApp. O assistente anota e o painel mostra para onde o dinheiro foi. 7 dias grátis, sem cartão.",
};

/** Landing alternativa (rota /nova). A landing de "/" continua separada. */
export default function NovaLayout({ children }: { children: React.ReactNode }) {
  return <Casca>{children}</Casca>;
}
