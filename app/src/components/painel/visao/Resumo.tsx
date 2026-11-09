import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, TrendUp } from "@phosphor-icons/react/dist/ssr";
import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { manchetes } from "@/lib/narrativa";
import { partesBrl, pctTexto } from "@/lib/painel";

const REFERENCIA = 20;

/** O número grande: reais em destaque, centavos menores. O texto completo fica para leitores de tela. */
export function ValorGrande({ valor, className = "" }: { valor: number; className?: string }) {
  const { sinal, inteiro, centavos } = partesBrl(valor);
  return (
    <p className={`dado numero-grande text-[2.75rem] tabular-nums md:text-[4rem] ${className}`}>
      <span className="sr-only">{`${sinal}${inteiro}${centavos}`}</span>
      <span aria-hidden="true">
        {sinal}
        {inteiro}
        <span className="text-[1.5rem] font-medium opacity-55 md:text-[1.75rem]">{centavos}</span>
      </span>
    </p>
  );
}

/**
 * Abertura da história: responde "como estou?" com uma frase, o saldo, o que entrou e saiu, e quanto da renda sobrou contra a
 * referência de 20%. No celular é o cartão em degradê verde; no computador, um cartão branco com o número grande.
 */
export function Resumo({ p }: { p: Painel }) {
  const { resumo } = p;
  const semRenda = p.sem_receita;
  const taxa = resumo.taxa_poupanca;
  const preenchido = taxa === null ? 0 : Math.min(100, Math.max(0, taxa));
  const { abertura } = manchetes(p);
  const valorPrincipal = semRenda ? resumo.despesas : resumo.saldo;

  return (
    <section
      className="hero-degrade flex flex-col rounded-[28px] p-6 shadow-[var(--sombra)] [border:var(--borda-cartao)] md:bg-none! md:bg-superficie! md:p-8 md:text-tinta!"
      aria-labelledby="t-resumo"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="t-resumo" className="text-[0.9375rem] font-medium text-white/80 md:text-suave">
          {semRenda ? "Gasto no período" : "Como você está"}
        </h2>
        {!semRenda && taxa !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[0.8125rem] font-semibold text-white md:bg-bom-bg md:text-bom-ink">
            <TrendUp size={15} weight="bold" aria-hidden="true" />
            {`${pctTexto(taxa)} da renda`}
          </span>
        )}
      </div>

      <p className="mt-3 max-w-[34rem] font-display text-[1.375rem] font-bold leading-tight tracking-tight">{abertura}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <ValorGrande valor={valorPrincipal} className={valorPrincipal < 0 ? "text-[#ff9a7a] md:text-ruim-ink" : ""} />
        <Link
          href="/painel/lancamentos"
          aria-label="Ver os lançamentos"
          title="Ver os lançamentos"
          className="hidden h-16 w-16 flex-none items-center justify-center rounded-full bg-lima text-[#0b3a22] transition-transform hover:scale-105 md:flex"
        >
          <ArrowUpRight size={26} aria-hidden="true" />
        </Link>
      </div>

      {!semRenda && (
        <dl className="mt-5 flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 rounded-full bg-white/15 py-1.5 pl-1.5 pr-4 text-sm md:bg-papel">
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-lima text-[#0b3a22] md:bg-bom-bg md:text-bom-ink">
              <ArrowDownLeft size={15} weight="bold" />
            </span>
            <dt className="text-white/80 md:text-suave">Receitas</dt>
            <dd className="dado font-semibold tabular-nums">{`+${brl(resumo.receitas)}`}</dd>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 py-1.5 pl-1.5 pr-4 text-sm md:bg-papel">
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffb59c] text-[#7a2410] md:bg-ruim-bg md:text-ruim-ink">
              <ArrowUpRight size={15} weight="bold" />
            </span>
            <dt className="text-white/80 md:text-suave">Despesas</dt>
            <dd className="dado font-semibold tabular-nums">{brl(resumo.despesas)}</dd>
          </div>
        </dl>
      )}

      {semRenda && (
        <p className="mt-5 rounded-[14px] bg-white/15 px-4 py-3 text-sm md:bg-papel md:text-tinta">Registre a sua renda deste período para ver quanto sobra de verdade.</p>
      )}

      {taxa !== null && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between text-[0.9375rem] text-white/80 md:text-suave">
            <span>Taxa de poupança</span>
            <span className="font-semibold tabular-nums text-white md:text-tinta">{pctTexto(taxa)}</span>
          </div>
          <div
            role="meter"
            aria-label="Taxa de poupança"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={preenchido}
            aria-valuetext={`${pctTexto(taxa)} da renda`}
            className="relative mt-2.5 h-2.5 rounded-full bg-white/20 md:bg-d-trilho"
          >
            <div className="h-full rounded-full bg-lima" style={{ width: `${preenchido}%` }} />
            <div className="absolute -top-[4px] h-[18px] w-0.5 rounded-full bg-white md:bg-tinta md:opacity-60" style={{ left: `${REFERENCIA}%` }} aria-hidden="true" />
          </div>
          <div className="relative mt-1.5 h-5 text-[0.8125rem] text-white/75 md:text-suave">
            <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${REFERENCIA}%` }}>
              {`Referência ${REFERENCIA}%`}
            </span>
          </div>
        </div>
      )}

      {p.renda_do_perfil && (
        <p className="mt-3 rounded-[12px] bg-white/15 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed md:bg-papel md:text-tinta">
          Renda mensal informada no seu perfil. Se lançar uma receita neste período, ela passa a valer no lugar.
        </p>
      )}

      <p className="mt-4 text-[0.8125rem] leading-relaxed text-white/75 md:text-suave">
        A taxa de poupança é a parte da renda que sobrou. {REFERENCIA}% é uma referência comum, não uma obrigação.
      </p>
    </section>
  );
}
