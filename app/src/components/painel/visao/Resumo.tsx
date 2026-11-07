import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { manchetes } from "@/lib/narrativa";
import { partesBrl, pctTexto, podeGastarPorDia } from "@/lib/painel";

const REFERENCIA = 20;

/** O número grande: reais em destaque, centavos menores. O texto completo fica para leitores de tela. */
export function ValorGrande({ valor, className = "text-white" }: { valor: number; className?: string }) {
  const { sinal, inteiro, centavos } = partesBrl(valor);
  return (
    <p className={`dado font-display text-[2.5rem] font-semibold leading-none tracking-tight tabular-nums ${className}`}>
      <span className="sr-only">{`${sinal}${inteiro}${centavos}`}</span>
      <span aria-hidden="true">
        {sinal}
        {inteiro}
        <span className="text-[1.375rem] font-medium opacity-70">{centavos}</span>
      </span>
    </p>
  );
}

/**
 * Abertura da história: responde "como estou?" com uma frase, o saldo, o que entrou e saiu, e quanto da renda sobrou contra a
 * referência de 20%. Cartão de cor cheia, para ser a primeira coisa que se lê.
 */
export function Resumo({ p }: { p: Painel }) {
  const { resumo } = p;
  const semRenda = p.sem_receita;
  const taxa = resumo.taxa_poupanca;
  const preenchido = taxa === null ? 0 : Math.min(100, Math.max(0, taxa));
  const folga = podeGastarPorDia(p);
  const { abertura } = manchetes(p);
  const valorPrincipal = semRenda ? resumo.despesas : resumo.saldo;

  return (
    <section className="rounded-[24px] bg-hero p-6 text-sobre-bloco md:grid md:grid-cols-[1.15fr_1fr] md:gap-9 md:p-8" aria-labelledby="t-resumo">
      <div>
        <h2 id="t-resumo" className="text-sm font-medium text-[#a9c7b8]">
          {semRenda ? "Gasto no período" : "Como você está"}
        </h2>
        <p className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white">{abertura}</p>
        <div className="mt-5">
          <ValorGrande valor={valorPrincipal} className={valorPrincipal < 0 ? "text-coral" : "text-white"} />
        </div>
        {!semRenda && (
          <dl className="mt-4 flex flex-wrap gap-2.5">
            <div className="flex items-baseline gap-2 rounded-full bg-realce/15 px-3.5 py-1.5">
              <dt className="text-sm text-realce/80">Receitas</dt>
              <dd className="dado font-medium text-realce tabular-nums">{`+${brl(resumo.receitas)}`}</dd>
            </div>
            <div className="flex items-baseline gap-2 rounded-full bg-coral/15 px-3.5 py-1.5">
              <dt className="text-sm text-coral/80">Despesas</dt>
              <dd className="dado font-medium text-coral tabular-nums">{brl(resumo.despesas)}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-6 md:mt-0">
        {semRenda && <p className="rounded-[14px] bg-white/10 px-4 py-3 text-sm text-white">Registre a sua renda deste período para ver quanto sobra de verdade.</p>}

        {taxa !== null && (
          <div>
            <div className="flex items-baseline justify-between text-[0.9375rem] text-[#c8dccf]">
              <span>Taxa de poupança</span>
              <span className="font-semibold text-white tabular-nums">{pctTexto(taxa)}</span>
            </div>
            <div
              role="meter"
              aria-label="Taxa de poupança"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={preenchido}
              aria-valuetext={`${pctTexto(taxa)} da renda`}
              className="relative mt-2.5 h-2.5 rounded-full bg-white/20"
            >
              <div className="h-full rounded-full bg-realce" style={{ width: `${preenchido}%` }} />
              <div className="absolute -top-[5px] h-5 w-0.5 bg-white" style={{ left: `${REFERENCIA}%` }} aria-hidden="true" />
            </div>
            <div className="relative mt-1.5 h-5 text-[13px] text-[#a9c7b8]">
              <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${REFERENCIA}%` }}>
                {`Referência ${REFERENCIA}%`}
              </span>
            </div>
          </div>
        )}

        {folga && (
          <div className="mt-4 rounded-[16px] bg-white/10 px-[18px] py-4">
            {folga.tipo === "ok" ? (
              <>
                <p className="text-sm text-[#a9c7b8]">Pode gastar por dia até o fim do mês</p>
                <p className="dado my-0.5 text-[1.625rem] font-semibold tabular-nums text-white">{brl(folga.porDia)}</p>
                <p className="dado text-[13px] text-[#a9c7b8]">{`Sobram ${brl(folga.restante)} da renda registrada, em ${folga.dias} ${folga.dias === 1 ? "dia" : "dias"}.`}</p>
              </>
            ) : (
              <p className="dado text-sm text-white">
                {folga.excesso > 0 ? `Você já passou ${brl(folga.excesso)} da renda registrada neste mês.` : "Você já usou toda a renda registrada neste mês."}
              </p>
            )}
          </div>
        )}

        <p className="mt-4 text-[13px] leading-relaxed text-[#a9c7b8]">A taxa de poupança é a parte da renda que sobrou. {REFERENCIA}% é uma referência comum, não uma obrigação.</p>
      </div>
    </section>
  );
}
