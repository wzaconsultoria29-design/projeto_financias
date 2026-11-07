import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { deltaBrl, pctTexto } from "@/lib/painel";

/** Frase curta e honesta sobre o que mudou na categoria em relação ao período anterior. */
function mudanca(total: number, anterior: number): string {
  if (anterior <= 0) return total > 0 ? "novo neste período" : "";
  const d = deltaBrl(total - anterior);
  return d || "igual";
}

export function QuadroVazio({ children }: { children: string }) {
  return <p className="rounded-[10px] border border-dashed border-linha px-4 py-3 text-sm text-suave">{children}</p>;
}

/** Barras ordenadas, uma cor só: o comprimento é o valor, o número ao lado é a participação no gasto. */
export function ParaOndeFoi({ p }: { p: Painel }) {
  const itens = p.categorias;
  const maior = Math.max(...itens.map((c) => c.total), 0);

  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-onde">
      <h2 id="t-onde" className="font-display text-lg font-semibold text-tinta">
        Para onde foi o dinheiro
      </h2>

      {itens.length === 0 ? (
        <div className="mt-4">
          <QuadroVazio>Nenhuma despesa neste período.</QuadroVazio>
        </div>
      ) : (
        <>
          <ul aria-label="Categorias de despesa" className="mt-4 flex flex-col gap-4">
            {itens.map((c) => (
              <li key={c.categoria}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium text-tinta">{c.categoria}</span>
                  <span className="flex flex-none items-baseline gap-3 tabular-nums">
                    <span className="dado text-tinta">{brl(c.total)}</span>
                    <span className="w-14 text-right text-sm text-suave">{pctTexto(c.pct)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-d-trilho" aria-hidden="true">
                  <div className="h-full rounded-full bg-floresta" style={{ width: `${maior > 0 ? (c.total / maior) * 100 : 0}%` }} />
                </div>
                <p className="dado mt-1 text-xs text-suave tabular-nums">{mudanca(c.total, c.anterior)}</p>
              </li>
            ))}
          </ul>
          {p.pareto.top3_pct !== null && itens.length >= 3 && (
            <p className="mt-5 border-t border-linha pt-4 text-sm text-suave">{`As 3 maiores somam ${pctTexto(p.pareto.top3_pct)} do gasto.`}</p>
          )}
        </>
      )}
    </section>
  );
}
