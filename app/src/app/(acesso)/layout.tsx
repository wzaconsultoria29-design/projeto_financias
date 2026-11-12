import { inter, urbanist } from "@/app/fontes";

// Telas de acesso no visual Verde-lima, sem o cabeçalho e o rodapé do site.
export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`app-vl ${inter.variable} ${urbanist.variable}`}>{children}</div>;
}
