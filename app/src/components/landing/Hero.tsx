import Link from "next/link";
import { HeroCelulares } from "./HeroCelulares";

export function Hero() {
  return (
    <section data-barra-oculta="topo" className="hero-fundo grao -mt-16 overflow-hidden pb-0 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
        <p className="arrive mx-auto w-fit rounded-full bg-white/10 px-4 py-1.5 text-[15px] font-medium text-white ring-1 ring-white/25">
          7 dias grátis, sem cartão
        </p>
        <h1 className="lp-display lines mt-6 text-[clamp(2.2rem,6.2vw,5.25rem)] text-white">
          <span className="line">
            <span data-line style={{ "--i": 0 } as React.CSSProperties}>Seu mês inteiro,</span>
          </span>
          <span className="line">
            <span data-line style={{ "--i": 1 } as React.CSSProperties}>
              <span className="sublinhado">sem planilha.</span>
            </span>
          </span>
        </h1>
        <div className="arrive">
          <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] leading-relaxed text-white/85">
            Mande o gasto pelo WhatsApp, em texto, áudio ou foto. O painel mostra para onde o dinheiro foi.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/cadastro" className="botao-lima">
              Começar grátis
            </Link>
            <a href="#como-funciona" className="botao-vidro">
              Ver como funciona
            </a>
          </div>
        </div>
      </div>
      <HeroCelulares />
      <div aria-hidden className="pointer-events-none relative z-10 -mt-48 h-48 bg-gradient-to-t from-papel to-transparent" />
    </section>
  );
}
