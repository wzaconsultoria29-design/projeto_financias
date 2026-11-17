import { Casca } from "@/components/nova/Casca";

// Login no visual fintech escura, sem o cabeçalho e o rodapé do site (a tela tem a própria moldura).
export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return <Casca moldura={false}>{children}</Casca>;
}
