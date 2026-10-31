import Link from "next/link";
import { brand } from "@/config/brand";

export function Rodape() {
  return (
    <footer className="border-t border-linha">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row md:justify-between md:px-8">
        <div className="max-w-sm">
          <p className="font-display text-xl font-semibold tracking-tight text-tinta">{brand.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-suave">{brand.tagline}</p>
          <p className="mt-6 text-xs leading-relaxed text-suave">
            O {brand.name} é um serviço independente e não tem vínculo com a Meta nem com o WhatsApp.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-3 text-sm text-suave">
          <Link href="/termos" className="transition-colors hover:text-tinta">Termos de uso</Link>
          <Link href="/privacidade" className="transition-colors hover:text-tinta">Política de privacidade</Link>
          <a href={`mailto:${brand.supportEmail}`} className="transition-colors hover:text-tinta">{brand.supportEmail}</a>
        </nav>
      </div>
    </footer>
  );
}
