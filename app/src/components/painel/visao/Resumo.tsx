import type { Painel } from "@/lib/api";
import { brl, pct } from "@/lib/format";
import { partesBrl, pctTexto } from "@/lib/painel";

const REFERENCIA = 20;

/** O número grande: reais em destaque, centavos menores e cinzas. O texto completo fica para leitores de tela. */
export function ValorGrande({ valor }: { valor: number }) {
  const { sinal, inteiro, centavos } = partesBrl(valor);
  return (
    <p className="font-display text-[2.25rem] font-semibold leading-none tracking-tight text-tinta tabular-nums">
      <span className="sr-only">{`${sinal}${inteiro}${centavos}`}</span>
      <span aria-hidden="true">
        {sinal}
        {inteiro}
        <span className="text-xl font-medium text-suave">{centavos}</span>
      </span>
    </p>
  );
}

/** Responde "estou no azul?": saldo do período, o que entrou e saiu, e quanto da renda sobrou contra a referência de 20%. */
export function Resumo({ p }: { p: Painel }) {
  const { resumo } = p;
  const semRenda = p.sem_receita;
  const taxa = resumo.taxa_poupanca;
  const preenchido = taxa === null ? 0 : Math.min(100, Math.max(0, taxa));

  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-resumo">
      <h2 id="t-resumo" className="text-sm font-medium text-suave">
        {semRenda ? "Gasto no período" : "Saldo do período"}
      </h2>
      <div className="mt-3">
        <ValorGrande valor={semRenda ? resumo.despesas : resumo.saldo} />
      </div>

      {semRenda ? (
        <p className="mt-4 rounded-[10px] bg-folha px-4 py-3 text-sm text-tinta">
          Registre a sua renda deste período para ver quanto sobra de verdade.
        </p>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-linha pt-4">
          <div>
            <dt className="text-sm text-suave">Receitas</dt>
            <dd className="mt-1 text-lg font-medium text-floresta tabular-nums">{`+${brl(resumo.receitas)}`}</dd>
          </div>
          <div>
            <dt className="text-sm text-suave">Despesas</dt>
            <dd className="mt-1 text-lg font-medium text-tinta tabular-nums">{brl(resumo.despesas)}</dd>
          </div>
        </dl>
      )}

      {taxa !== null && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-suave">Taxa de poupança</span>
            <span className="font-semibold text-tinta tabular-nums">{pctTexto(taxa)}</span>
          </div>
          <div
            role="meter"
            aria-label="Taxa de poupança"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={preenchido}
            aria-valuetext={`${pctTexto(taxa)} da renda`}
            className="relative mt-2 h-2 rounded-full bg-d-trilho"
          >
            <div className="h-full rounded-full bg-floresta" style={{ width: `${preenchido}%` }} />
            <div className="absolute -top-1 h-4 w-px bg-tinta" style={{ left: `${REFERENCIA}%` }} aria-hidden="true" />
          </div>
          <div className="relative mt-1.5 h-4 text-xs text-suave">
            <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${REFERENCIA}%` }}>
              {`Referência ${REFERENCIA}%`}
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-suave">
        {p.variacao_despesas_pct === null
          ? "Sem período anterior para comparar."
          : `Despesas ${pct(p.variacao_despesas_pct)} contra o período anterior, até o mesmo ponto.`}
      </p>
    </section>
  );
}
