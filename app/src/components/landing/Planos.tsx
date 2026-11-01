"use client";

import Link from "next/link";
import { useState } from "react";
import { planos } from "@/config/planos";

/** Os nomes dos planos são o título; o preço pertence ao nome selecionado e a área do preço não se mexe. */
export function Planos() {
  const [selecionado, setSelecionado] = useState("essencial");
  const plano = planos.find((p) => p.codigo === selecionado) ?? planos[1];

  return (
    <section id="planos" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-24 md:px-8 md:py-32" aria-label="Planos">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div role="group" aria-label="Escolha o plano" className="rise flex flex-col md:col-span-6">
          {planos.map((p) => {
            const ativo = p.codigo === plano.codigo;
            return (
              <button
                key={p.codigo}
                type="button"
                aria-pressed={ativo}
                onClick={() => setSelecionado(p.codigo)}
                className={`ctl lp-display flex items-center gap-4 py-1 text-left leading-[1.15] text-[clamp(2.25rem,5.2vw,4.5rem)] ${ativo ? "text-tinta" : "text-tinta/35 hover:text-tinta/60"}`}
              >
                <span aria-hidden className={`size-[0.3em] shrink-0 rounded-full bg-floresta transition-opacity ${ativo ? "opacity-100" : "opacity-0"}`} />
                {p.nome}
              </button>
            );
          })}
        </div>

        <div className="rise md:col-span-5 md:col-start-8" aria-live="polite">
          <div className="min-h-[250px]">
            <p className="flex items-baseline gap-3">
              <span className="text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-none tracking-tight tabular-nums text-tinta">{plano.preco}</span>
              <span className="text-lg text-suave">{plano.periodo}</span>
            </p>
            {plano.emBreve && <p className="mt-4 w-fit rounded-full bg-folha px-4 py-1.5 text-[15px] font-medium text-tinta">Em breve</p>}
            <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-suave">
              {plano.resumo} {plano.itens.join(". ")}.
            </p>
          </div>
          <Link href={plano.cta.href} className="botao mt-4 !px-7 !py-3.5 !text-base">
            {plano.emBreve ? plano.cta.texto : `Começar com ${plano.nome}`}
          </Link>
          <p className="mt-4 text-[15px] text-suave">Sem cartão. Você confirma o e-mail e conecta o WhatsApp em seguida.</p>
        </div>
      </div>
    </section>
  );
}
