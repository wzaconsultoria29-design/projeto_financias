import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { inter } from "../fontes";
import { Cabecalho } from "@/components/nova/Cabecalho";
import { Rodape } from "@/components/nova/Rodape";
import { Efeitos } from "@/components/nova/Efeitos";
import { Fundo } from "@/components/nova/Fundo";
import "./nova.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Controle financeiro em uma mensagem",
  description: "Mande o gasto por texto, áudio ou foto no WhatsApp. O assistente anota e o painel mostra para onde o dinheiro foi. 7 dias grátis, sem cartão.",
};

/** Landing alternativa (rota /nova). Tem cabeçalho, fundo e estilos próprios; não mexe na landing de "/". */
export default function NovaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`nv ${inter.variable} ${sora.variable} flex min-h-full flex-1 flex-col`}>
      <Fundo />
      <Cabecalho />
      {children}
      <Rodape />
      <Efeitos />
    </div>
  );
}
