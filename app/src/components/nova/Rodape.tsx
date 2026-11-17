import Link from "next/link";
import { brand } from "@/config/brand";
import { Marca } from "./Cabecalho";

export function Rodape() {
  return (
    <footer className="relative bg-[var(--nv-fundo)] pb-28 pt-14 md:pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <Marca />
          <p className="nv-suave mt-4 max-w-[46ch] text-[15px] leading-relaxed">
            {brand.tagline} Serviço independente, sem vínculo com a Meta nem com o WhatsApp.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
          <Link href="/entrar" className="nv-suave hover:text-[var(--nv-texto)]">Entrar</Link>
          <Link href="/cadastro" className="nv-suave hover:text-[var(--nv-texto)]">Criar conta</Link>
          <Link href="/termos" className="nv-suave hover:text-[var(--nv-texto)]">Termos de uso</Link>
          <Link href="/privacidade" className="nv-suave hover:text-[var(--nv-texto)]">Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}
