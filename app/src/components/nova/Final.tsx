"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { DUVIDAS } from "./dados";

export function Perguntas() {
  return (
    <section id="perguntas" className="relative scroll-mt-20 py-24 md:py-32" aria-labelledby="titulo-perguntas">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-12">
        <h2 id="titulo-perguntas" data-revela className="nv-titulo text-[clamp(2rem,4.6vw,3.75rem)] lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          Perguntas frequentes
        </h2>
        <div className="flex flex-col gap-3 lg:col-span-7">
          {DUVIDAS.map((d, i) => (
            <details key={d.q} name="nv-faq" data-revela style={{ "--i": i } as React.CSSProperties} className="nv-pergunta nv-cartao transition-colors">
              <summary className="flex min-h-[72px] items-center justify-between gap-6 px-6 py-4 text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] font-medium">
                {d.q}
                <span aria-hidden className="nv-mais" />
              </summary>
              <p className="nv-suave max-w-[58ch] px-6 pb-6 text-[17px] leading-relaxed">{d.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Fecha a página pedindo só o e-mail, que já chega preenchido no cadastro. */
export function Final() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <section data-barra-oculta="final" className="relative px-4 pb-24 md:px-8 md:pb-32" aria-labelledby="titulo-final">
      <div data-revela="escala" className="nv-feixe nv-grao relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[var(--nv-sup)] px-6 py-16 text-center md:px-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="nv-aurora left-[8%] top-[-40%] h-[420px] w-[520px] bg-[rgba(39,224,139,0.3)]" />
          <div className="nv-aurora bottom-[-50%] right-[5%] h-[420px] w-[520px] bg-[rgba(200,246,93,0.2)]" />
        </div>
        <h2 id="titulo-final" className="nv-titulo relative mx-auto max-w-[16ch] text-[clamp(2.25rem,6vw,4.75rem)]">
          Anote o <span className="nv-degrade-texto">próximo gasto</span>.
        </h2>
        <p className="nv-suave relative mx-auto mt-5 max-w-[46ch] text-[18px] leading-relaxed">
          O cadastro leva um minuto. São 7 dias grátis, sem cartão, e o assistente já começa a anotar.
        </p>
        <form
          className="relative mx-auto mt-9 flex max-w-[580px] flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const valor = email.trim();
            router.push(valor ? `/cadastro?email=${encodeURIComponent(valor)}` : "/cadastro");
          }}
        >
          <label htmlFor="nv-email" className="sr-only">Seu e-mail</label>
          <input
            id="nv-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu e-mail"
            className="min-h-[56px] min-w-0 flex-1 rounded-full bg-white/[0.08] px-6 text-[18px] text-white shadow-[inset_0_0_0_1px_var(--nv-linha-forte)] placeholder:text-white/45"
          />
          <button type="submit" className="nv-botao !min-h-[56px] !px-8 !text-[18px]">
            Criar conta grátis
            <ArrowRight size={20} weight="bold" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}
