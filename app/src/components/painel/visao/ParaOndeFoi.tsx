import { ChartDonut } from "@phosphor-icons/react/dist/ssr";
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
  return <p className="rounded-[14px] border border-dashed border-linha px-4 py-3 text-sm text-suave">{children}</p>;
}

const R = 58;
const C = 2 * Math.PI * R;

/** A rosca: cada fatia é uma categoria, com a mesma cor de sempre; o centro mostra o total. A lista ao lado diz os números. */
function Rosca({ itens, total }: { itens: Painel["categorias"]; total: number }) {
  const inicios = itens.reduce<number[]>((acc, c, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (total > 0 ? (itens[i - 1].total / total) * C : 0)], []);
  const resumo = itens
    .slice(0, 3)
    .map((c) => `${c.categoria} ${pctTexto(c.pct)}`)
    .join(", ");
  return (
    <svg role="img" aria-label={`Rosca dos gastos por categoria: ${resumo}`} viewBox="0 0 150 150" className="h-[10.5rem] w-[10.5rem] flex-none">
      <circle cx="75" cy="75" r={R} fill="none" stroke="var(--d-trilho)" strokeWidth="16" />
      {itens.map((c, i) => {
        const comprimento = total > 0 ? (c.total / total) * C : 0;
        const inicio = inicios[i];
        return (
          <circle
            key={c.categoria}
            cx="75"
            cy="75"
            r={R}
            fill="none"
            stroke={corDaCategoria(c.categoria)}
            strokeWidth="16"
            strokeDasharray={`${Math.max(comprimento - (itens.length > 1 ? 3 : 0), 0.5)} ${C}`}
            strokeDashoffset={-inicio}
            transform="rotate(-90 75 75)"
          />
        );
      })}
      <text x="75" y="70" textAnchor="middle" fontSize="11" fill="var(--suave)">
        Total
      </text>
      <text x="75" y="91" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--tinta)" className="dado" style={{ fontFamily: "var(--font-urbanist), system-ui, sans-serif" }}>
        {brl(total)}
      </text>
    </svg>
  );
}

/** Rosca e lista: a cor é sempre a mesma para a mesma categoria, o número ao lado é a participação no gasto. */
export function ParaOndeFoi({ p }: { p: Painel }) {
  const itens = p.categorias;
  const total = itens.reduce((s, c) => s + c.total, 0);
  const { onde } = manchetes(p);
  const somaTres = p.pareto.top3_pct !== null && itens.length >= 3 ? ` As 3 maiores somam ${pctTexto(p.pareto.top3_pct)} do gasto.` : "";

  return (
    <Capitulo
      id="onde"
      titulo="Para onde foi o dinheiro"
      icone={ChartDonut}
      manchete={onde}
      comoLer={`Cada fatia da rosca é uma categoria, e a cor é sempre a mesma para ela. O centro mostra o total gasto; o número ao lado é a parte desse total.${somaTres}`}
    >
      {itens.length === 0 ? (
        <QuadroVazio>Nenhuma despesa neste período.</QuadroVazio>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="dado">
            <Rosca itens={itens} total={total} />
          </div>
          <ul aria-label="Categorias de despesa" className="flex w-full min-w-0 flex-1 flex-col gap-3.5">
            {itens.map((c) => {
              const cor = corDaCategoria(c.categoria);
              return (
                <li key={c.categoria}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span data-testid="cor-categoria" data-cor={cor} aria-hidden="true" className="h-3 w-3 flex-none rounded-full" style={{ background: cor }} />
                      <span className="min-w-0 truncate font-medium text-tinta">{c.categoria}</span>
                    </span>
                    <span className="flex flex-none items-baseline gap-3 tabular-nums">
                      <span className="dado text-tinta">{brl(c.total)}</span>
                      <span className="w-14 text-right text-sm text-suave">{pctTexto(c.pct)}</span>
                    </span>
                  </div>
                  <p className="dado mt-0.5 pl-[22px] text-[0.8125rem] text-suave tabular-nums">{mudanca(c.total, c.anterior)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Capitulo>
  );
}
