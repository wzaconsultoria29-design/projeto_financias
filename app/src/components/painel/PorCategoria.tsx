import { brl } from "@/lib/format";
import type { VisaoGeral } from "@/lib/api";
import { EstadoVazio } from "./EstadoVazio";

export function PorCategoria({ itens }: { itens: VisaoGeral["por_categoria"] }) {
  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Por categoria</h2>
      {itens.length === 0 ? (
        <EstadoVazio />
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {itens.map((c, i) => {
            const largura = Math.min(100, Math.max(0, Number.isFinite(c.pct) ? c.pct : 0));
            return (
              <li key={`${c.categoria ?? "sem"}-${i}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-tinta">{c.categoria?.trim() || "Sem categoria"}</span>
                  <span className="shrink-0 tabular-nums text-suave">
                    <span className="text-tinta">{brl(c.total)}</span> · {Math.round(largura)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-folha" role="presentation">
                  <div className="h-full rounded-full bg-floresta" style={{ width: `${largura}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
