import Link from "next/link";
import { Gauge } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/config/brand";

const LINKS = [
  { href: "#como-funciona", texto: "Como funciona" },
  { href: "#painel", texto: "Painel" },
  { href: "#planos", texto: "Planos" },
  { href: "#perguntas", texto: "Perguntas" },
];

export function Marca() {
  return (
    <span className="flex items-center gap-2.5 text-[19px] font-semibold tracking-tight">
      <span aria-hidden className="grid size-9 place-items-center rounded-[12px] bg-[var(--nv-lima)] text-[#04130b]">
        <Gauge size={22} weight="fill" />
      </span>
      <span className="nv-titulo !tracking-[-0.02em]">{brand.name}</span>
    </span>
  );
}

export function Cabecalho() {
  return (
    <header className="nv-cabecalho fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/nova" aria-label={`${brand.name}: início`}>
          <Marca />
        </Link>
        <nav aria-label="Seções" className="hidden items-center gap-8 text-[15px] md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nv-suave transition-colors hover:text-[var(--nv-texto)]">
              {l.texto}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/entrar" className="hidden px-2 py-2 text-[15px] font-medium text-[var(--nv-texto)] sm:block">
            Entrar
          </Link>
          <Link href="/cadastro" className="nv-botao !min-h-[42px] !px-5 !py-2 !text-[15px]">
            Começar grátis
          </Link>
        </div>
      </div>
      <span aria-hidden className="nv-progresso absolute inset-x-0 bottom-0 block h-[2px] bg-[linear-gradient(90deg,var(--nv-verde),var(--nv-lima))]" />
    </header>
  );
}
