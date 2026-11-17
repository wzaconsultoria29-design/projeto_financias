import { Sora } from "next/font/google";
import { inter } from "@/app/fontes";
import { Cabecalho } from "./Cabecalho";
import { Rodape } from "./Rodape";
import { Efeitos } from "./Efeitos";
import { Fundo } from "./Fundo";
import "./nova.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

/**
 * Casca do visual fintech escura: fontes, fundo vivo, cabeçalho e rodapé.
 * Usada pela landing /nova, pelo cadastro, pelas páginas legais, pelo convite e (sem moldura) pelo login.
 */
export function Casca({ children, moldura = true }: { children: React.ReactNode; moldura?: boolean }) {
  return (
    <div className={`nv ${inter.variable} ${sora.variable} flex min-h-full flex-1 flex-col`}>
      <Fundo />
      {moldura && <Cabecalho />}
      {children}
      {moldura && <Rodape />}
      <Efeitos />
    </div>
  );
}
