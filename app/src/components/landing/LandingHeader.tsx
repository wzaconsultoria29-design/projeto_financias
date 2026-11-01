import Link from "next/link";
import { brand } from "@/config/brand";
import { OcultaAoRolar } from "./OcultaAoRolar";

const LINKS = [
  { href: "#como-funciona", rotulo: "Como funciona" },
  { href: "#painel", rotulo: "Painel" },
  { href: "#planos", rotulo: "Planos" },
  { href: "#perguntas", rotulo: "Perguntas" },
];

export function LandingHeader() {
  return (
    <OcultaAoRolar>
    <header>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
          {brand.name}
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-[15px] text-suave md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-tinta">
              {l.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/entrar" className="px-3 py-2 text-[15px] font-medium text-suave transition-colors hover:text-tinta">
            Entrar
          </Link>
          <Link href="/cadastro" className="botao">
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
    </OcultaAoRolar>
  );
}
