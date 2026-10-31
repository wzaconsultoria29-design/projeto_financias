import Link from "next/link";
import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-linha bg-papel/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-tinta">
          {brand.name}
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm text-suave md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-tinta">Como funciona</a>
          <a href="#recursos" className="transition-colors hover:text-tinta">Recursos</a>
          <a href="#planos" className="transition-colors hover:text-tinta">Planos</a>
          <a href="#perguntas" className="transition-colors hover:text-tinta">Perguntas</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/entrar" className="hidden px-3 text-sm font-medium text-suave transition-colors hover:text-tinta sm:inline-flex">
            Entrar
          </Link>
          <Link href="/cadastro" className="botao">Começar grátis</Link>
        </div>
      </div>
    </header>
  );
}
