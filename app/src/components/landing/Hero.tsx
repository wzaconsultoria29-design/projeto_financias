import Link from "next/link";
import { LivePanel } from "./LivePanel";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 md:px-8 md:pt-10">
      <div className="max-w-4xl">
        <h1 className="lp-display lines text-[clamp(2.4rem,5.4vw,4.4rem)] text-tinta">
          <span className="line">
            <span data-line style={{ "--i": 0 } as React.CSSProperties}>Seu mês inteiro,</span>
          </span>
          <span className="line">
            <span data-line style={{ "--i": 1 } as React.CSSProperties}>sem planilha.</span>
          </span>
        </h1>
        <div className="arrive">
          <p className="mt-4 max-w-[44ch] text-[clamp(1.0625rem,1rem+0.4vw,1.1875rem)] leading-relaxed text-suave">
            Mande o gasto pelo WhatsApp, em texto, áudio ou foto. O painel mostra para onde o dinheiro foi.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/cadastro" className="botao !px-7 !py-3.5 !text-base">
              Começar grátis
            </Link>
            <a href="#como-funciona" className="px-2 py-3 text-base font-medium text-tinta underline decoration-2 underline-offset-[6px]">
              Ver como funciona
            </a>
          </div>
        </div>
      </div>

      <div className="rise mt-8 rounded-[28px] bg-folha p-3 md:mt-10 md:p-6">
        <LivePanel />
      </div>
    </section>
  );
}
