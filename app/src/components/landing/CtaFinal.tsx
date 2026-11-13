"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Objeto3d } from "./Objeto3d";

/** Fecha a página com uma frase em que o e-mail é a lacuna. Leva o e-mail já preenchido para o cadastro. */
export function CtaFinal() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <section data-barra-oculta="final" className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8 md:pb-32" aria-labelledby="titulo-cta">
      <div className="hero-fundo grao rise relative overflow-hidden rounded-[32px] px-6 py-16 md:px-16 md:py-24" style={{ background: "radial-gradient(60% 80% at 85% 10%, rgba(191,242,95,0.3), transparent 70%), radial-gradient(50% 60% at 10% 100%, rgba(31,138,76,0.5), transparent 70%), linear-gradient(160deg, #12613a, #072a18)" }}>
        <Objeto3d nome="moeda" className="absolute -right-4 -top-4 size-40 md:right-10 md:top-8 md:size-60" />
        <h2 id="titulo-cta" className="lp-display relative max-w-[14ch] !leading-[1.08] text-[clamp(2.25rem,6vw,5rem)] text-white">Anote o próximo gasto</h2>
        <form
          className="relative mt-10 flex max-w-[640px] flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const valor = email.trim();
            router.push(valor ? `/cadastro?email=${encodeURIComponent(valor)}` : "/cadastro");
          }}
        >
          <label htmlFor="cta-email" className="sr-only">Seu e-mail</label>
          <input
            id="cta-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu e-mail"
            className="min-w-0 flex-1 rounded-full bg-white px-6 py-4 text-[18px] text-[#10201a] placeholder:text-[#4a5c54]"
          />
          <button type="submit" className="botao-lima !px-8 !py-4 !text-[18px]">Criar conta grátis</button>
        </form>
        <p className="relative mt-4 max-w-[52ch] text-[16px] text-white/80">7 dias sem cartão. O cadastro leva um minuto e o assistente já começa a anotar.</p>
      </div>
    </section>
  );
}
