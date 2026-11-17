"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import { planos, porDia } from "@/config/planos";

const GARANTIAS = ["Pix, cartão ou boleto pelo Mercado Pago", "Preço final, sem taxa escondida", "Sem renovação automática: você renova se quiser"];
const LIMITE_ESSENCIAL = 300;
const MAX_POR_DIA = 20;

/** Planos com uma calculadora simples: quantos gastos por dia e quantas pessoas apontam o plano que serve. */
export function PlanosNova() {
  const [porDiaGastos, setPorDiaGastos] = useState(4);
  const [pessoas, setPessoas] = useState(1);

  const mensagens = porDiaGastos * 30;
  const indicado = pessoas > 1 || mensagens > LIMITE_ESSENCIAL ? "family" : "essencial";
  const plano = planos.find((p) => p.codigo === indicado)!;
  const motivo =
    pessoas > 1
      ? `Para ${pessoas} pessoas, cada uma com o próprio login.`
      : mensagens > LIMITE_ESSENCIAL
        ? "Acima de 300 mensagens por mês, o Family dá folga."
        : "Cabe com folga nas 300 mensagens do mês.";

  return (
    <section id="planos" data-barra-oculta="planos" className="relative scroll-mt-20 py-24 md:py-32" aria-labelledby="titulo-planos">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 id="titulo-planos" data-revela className="nv-titulo text-[clamp(2rem,4.6vw,3.75rem)]">
            Custa menos que um café por dia.
          </h2>
          <p data-revela style={{ "--i": 1 } as React.CSSProperties} className="nv-suave mx-auto mt-5 max-w-[50ch] text-[18px] leading-relaxed">
            Teste por 7 dias sem cartão. Depois escolha o plano pelo seu uso.
          </p>
        </div>

        <div data-revela className="nv-cartao mx-auto mt-12 grid max-w-[980px] gap-8 p-6 md:grid-cols-[1.2fr_1fr] md:items-center md:p-9">
          <div className="flex flex-col gap-7">
            <div>
              <label htmlFor="nv-por-dia" className="flex items-baseline justify-between gap-4 text-[16px] font-medium">
                Quantos gastos você registra por dia?
                <span className="nv-num text-[26px] font-semibold text-[var(--nv-lima)]">{porDiaGastos}</span>
              </label>
              <input
                id="nv-por-dia"
                type="range"
                min={1}
                max={MAX_POR_DIA}
                value={porDiaGastos}
                onChange={(e) => setPorDiaGastos(Number(e.target.value))}
                className="nv-faixa mt-3"
                style={{ "--pct": `${((porDiaGastos - 1) / (MAX_POR_DIA - 1)) * 100}%` } as React.CSSProperties}
              />
            </div>
            <div>
              <p id="rotulo-pessoas" className="text-[16px] font-medium">Quantas pessoas vão usar?</p>
              <div role="group" aria-labelledby="rotulo-pessoas" className="mt-3 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={pessoas === n}
                    aria-label={n === 1 ? "1 pessoa" : `${n} pessoas`}
                    onClick={() => setPessoas(n)}
                    className={`nv-num min-h-[48px] rounded-[14px] text-[18px] font-semibold transition-colors ${pessoas === n ? "bg-[var(--nv-lima)] text-[#04130b]" : "bg-white/[0.07] hover:bg-white/[0.12]"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div aria-live="polite" className="rounded-[22px] bg-[var(--nv-fundo)] p-6 shadow-[inset_0_0_0_1px_var(--nv-linha-forte)]">
            <p className="nv-suave text-[15px]">Cerca de {mensagens} mensagens por mês</p>
            <p className="nv-titulo mt-2 text-[28px]">
              Plano indicado: <span className="nv-degrade-texto">{plano.nome}</span>
            </p>
            <p className="mt-2 text-[16px] leading-relaxed">{motivo}</p>
            <p className="nv-suave mt-3 text-[15px]">
              {plano.preco} {plano.periodo}, cerca de {porDia(plano.preco)} por dia.
            </p>
          </div>
        </div>

        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-3">
          {planos.map((p, i) => {
            const eIndicado = p.codigo === indicado;
            return (
              <article
                key={p.codigo}
                data-plano={p.codigo}
                data-indicado={eIndicado}
                data-ligado={eIndicado}
                data-revela
                style={{ "--i": i } as React.CSSProperties}
                className={`nv-feixe nv-cartao flex flex-col p-8 ${eIndicado ? "!bg-[linear-gradient(170deg,rgba(39,224,139,0.2),rgba(10,21,16,0.2)_55%),var(--nv-sup2)] shadow-[0_40px_100px_-40px_rgba(39,224,139,0.6)]" : ""}`}
              >
                <div className="flex min-h-[32px] items-center justify-between gap-3">
                  <h3 className="nv-titulo text-[24px]">{p.nome}</h3>
                  {eIndicado && <span className="rounded-full bg-[var(--nv-lima)] px-3 py-1 text-[13px] font-bold text-[#04130b]">Indicado para você</span>}
                </div>
                <p className="nv-suave mt-2 text-[16px]">{p.resumo}</p>
                <p className="mt-7 flex items-baseline gap-2">
                  <span className="nv-num text-[clamp(2.75rem,5vw,3.75rem)] font-semibold leading-none">{p.preco}</span>
                  <span className="nv-suave text-[16px]">{p.periodo}</span>
                </p>
                <p className="nv-suave mt-2 min-h-[24px] text-[15px]">{porDia(p.preco) ? `Cerca de ${porDia(p.preco)} por dia` : "Sem cartão de crédito"}</p>
                <ul className="mt-7 flex flex-1 flex-col gap-3">
                  {p.itens.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[16px] leading-snug">
                      <Check size={19} weight="bold" aria-hidden className="mt-0.5 flex-none text-[var(--nv-lima)]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href={p.cta.href} className={`mt-9 !w-full ${eIndicado || p.codigo === "trial" ? "nv-botao" : "nv-botao-2"}`}>
                  {p.cta.texto}
                </Link>
              </article>
            );
          })}
        </div>

        <ul data-revela className="mx-auto mt-10 flex max-w-4xl flex-col items-center justify-center gap-x-9 gap-y-3 text-[15px] sm:flex-row sm:flex-wrap">
          {GARANTIAS.map((g) => (
            <li key={g} className="flex items-center gap-2">
              <Check size={17} weight="bold" aria-hidden className="flex-none text-[var(--nv-verde)]" />
              {g}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
