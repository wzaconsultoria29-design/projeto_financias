import Link from "next/link";
import { ChatDemo } from "./ChatDemo";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 md:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:pt-6">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-tinta sm:text-5xl lg:text-[3.6rem]">
          Gastou? Mande no WhatsApp.
        </h1>
        <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-suave">
          Texto, áudio ou foto do cupom. A gente organiza e o painel mostra para onde o dinheiro foi.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/cadastro" className="botao">Começar grátis</Link>
          <a href="#como-funciona" className="botao-contorno">Ver como funciona</a>
        </div>
      </div>
      <ChatDemo />
    </section>
  );
}
