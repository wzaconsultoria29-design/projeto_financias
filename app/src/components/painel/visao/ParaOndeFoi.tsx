import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { corDaCategoria, manchetes } from "@/lib/narrativa";
import { deltaBrl, pctTexto } from "@/lib/painel";
import { Capitulo } from "./Capitulo";

/** Frase curta e honesta sobre o que mudou na categoria em relação ao período anterior. */
function mudanca(total: number, anterior: number): string {
  if (anterior <= 0) return total > 0 ? "novo neste período" : "";
  const d = deltaBrl(total - anterior);
  return d ? `${d} contra o período anterior` : "igual ao período anterior";
}

export function QuadroVazio({ children }: { children: string }) {
  return <p className="rounded-[10px] border border-dashed border-linha px-4 py-3 text-sm text-suave">{children}</p>;
}

/** Barras ordenadas: o comprimento é o valor, a cor é sempre a mesma para a mesma categoria, o número ao lado é a participação no gasto. */
export function ParaOndeFoi({ p }: { p: Painel }) {
  const itens = p.categorias;
  const maior = Math.max(...itens.map((c) => c.total), 0);
  const { onde } = manchetes(p);
  const somaTres = p.pareto.top3_pct !== null && itens.length >= 3 ? ` As 3 maiores somam ${pctTexto(p.pareto.top3_pct)} do gasto.` : "";

  return (
    <Capitulo
      id="onde"
      titulo="Para onde foi o dinheiro"
      manchete={onde}
      comoLer={`Cada barra é uma categoria, e a cor é sempre a mesma para ela. O comprimento mostra o valor; o número ao lado é a parte do total gasto.${somaTres}`}
    >
      {itens.length === 0 ? (
        <QuadroVazio>Nenhuma despesa neste período.</QuadroVazio>
      ) : (
        <ul aria-label="Categorias de despesa" className="flex flex-col gap-4">
          {itens.map((c) => {
            const cor = corDaCategoria(c.categoria);
            return (
              <li key={c.categoria}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span data-testid="cor-categoria" data-cor={cor} aria-hidden="true" className="h-3 w-3 flex-none rounded-[4px]" style={{ background: cor }} />
                    <span className="min-w-0 truncate font-medium text-tinta">{c.categoria}</span>
                  </span>
                  <span className="flex flex-none items-baseline gap-3 tabular-nums">
                    <span className="dado text-tinta">{brl(c.total)}</span>
                    <span className="w-14 text-right text-sm text-suave">{pctTexto(c.pct)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-d-trilho" aria-hidden="true">
                  <div className="h-full rounded-full" style={{ width: `${maior > 0 ? (c.total / maior) * 100 : 0}%`, background: cor }} />
                </div>
                <p className="dado mt-1 text-[13px] text-suave tabular-nums">{mudanca(c.total, c.anterior)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Capitulo>
  );
}
