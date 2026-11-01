"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Fecha a página com uma frase em que o e-mail é a lacuna. Leva o e-mail já preenchido para o cadastro. */
export function CtaFinal() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8 md:pb-32" aria-labelledby="titulo-cta">
      <div className="rise rounded-[28px] bg-folha px-6 py-16 md:px-16 md:py-24">
        <h2 id="titulo-cta" className="lp-display max-w-[16ch] text-[clamp(2.25rem,6vw,5rem)] text-tinta">Anote o próximo gasto</h2>
        <form
          className="mt-10 flex max-w-[640px] flex-col gap-3 sm:flex-row"
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
            className="min-w-0 flex-1 rounded-full bg-papel px-6 py-4 text-[18px] text-tinta placeholder:text-suave"
          />
          <button type="submit" className="botao !px-8 !py-4 !text-[18px]">Criar conta grátis</button>
        </form>
        <p className="mt-4 max-w-[52ch] text-[16px] text-suave">7 dias sem cartão. Depois do cadastro você confirma o e-mail e conecta o WhatsApp.</p>
      </div>
    </section>
  );
}
