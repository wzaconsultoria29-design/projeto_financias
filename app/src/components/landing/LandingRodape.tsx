import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/config/brand";

const LINK = "transition-colors hover:text-tinta";

/** Rodapé em blocos preenchidos, com todas as células usadas. */
export function LandingRodape() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-2 pb-2 md:px-3 md:pb-3">
      <div className="grid gap-2 md:grid-cols-12">
        <div className="flex min-h-[220px] flex-col justify-between rounded-[20px] bg-folha p-6 md:col-span-4">
          <p className="max-w-[26ch] text-[22px] font-medium leading-snug text-tinta">{brand.tagline}</p>
          <p className="text-[14px] leading-relaxed text-suave">
            Serviço independente, sem vínculo com a Meta nem com o WhatsApp.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex min-h-[220px] flex-col gap-3 rounded-[20px] bg-folha p-6 text-[17px] text-suave md:col-span-4">
          <Link href="/entrar" className={LINK}>Entrar</Link>
          <Link href="/cadastro" className={LINK}>Criar conta</Link>
          <Link href="/termos" className={LINK}>Termos de uso</Link>
          <Link href="/privacidade" className={LINK}>Política de privacidade</Link>
        </nav>
        <a href={`mailto:${brand.supportEmail}`} className="flex min-h-[220px] items-end rounded-[20px] bg-folha p-6 text-[20px] font-medium text-tinta md:col-span-4">
          {brand.supportEmail}
        </a>
        <p className="flex min-h-[260px] items-center justify-center rounded-[20px] bg-tinta p-6 text-[clamp(3rem,9vw,8rem)] font-bold leading-none tracking-tight text-papel md:col-span-8">
          {brand.name}
        </p>
        <Link href="/cadastro" className="flex min-h-[200px] flex-col justify-between rounded-[20px] bg-[var(--botao)] p-6 text-[var(--botao-fg)] md:col-span-4">
          <span className="text-[28px] font-semibold leading-tight">Começar grátis</span>
          <ArrowUpRight size={44} weight="bold" aria-hidden className="self-end" />
        </Link>
      </div>
    </footer>
  );
}
