import { agregar, type Gasto } from "@/lib/demo";
import { brl } from "@/lib/format";

type Props = {
  titulo: string;
  itens: Gasto[];
  anterior?: number;
  anteriorRotulo?: string;
  /** Mostra a diferença para o período anterior. */
  comparar?: boolean;
  /** Categoria em destaque (as outras ficam mais discretas). */
  destaque?: string | null;
  /** Quantos lançamentos recentes listar. */
  recentes?: number;
  maxCategorias?: number;
  className?: string;
};

/** Pedaço do painel real, em HTML, com números que somam. A raiz leva `data-ui`. */
export function PainelFragmento({ titulo, itens, anterior, anteriorRotulo = "período anterior", comparar = false, destaque = null, recentes = 3, maxCategorias = 5, className = "" }: Props) {
  const { total, categorias } = agregar(itens);
  const visiveis = destaque ? itens.filter((i) => i.categoria === destaque) : itens;
  const diferenca = anterior !== undefined ? total - anterior : null;

  return (
    <div data-ui className={`rounded-[20px] bg-superficie p-5 text-tinta md:p-6 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-medium">{titulo}</p>
        <p className="text-[13px] text-suave">Dados de exemplo</p>
      </div>

      <p className="mt-5 text-[15px] text-suave">Despesas</p>
      <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight md:text-5xl" aria-live="polite">
        {brl(total)}
      </p>
      {comparar && anterior !== undefined && diferenca !== null && (
        <p className="mt-2 text-[15px] text-suave">
          {brl(anterior)} no {anteriorRotulo}:{" "}
          <span className="font-medium text-tinta">{brl(Math.abs(diferenca))} {diferenca >= 0 ? "a mais" : "a menos"}</span>
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4" aria-label="Despesas por categoria">
        {categorias.slice(0, maxCategorias).map((c) => {
          const apagada = destaque !== null && c.categoria !== destaque;
          return (
            <li key={c.categoria} className={apagada ? "opacity-40 transition-opacity" : "transition-opacity"}>
              <div className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="min-w-0 truncate font-medium">{c.categoria}</span>
                <span className="shrink-0 tabular-nums text-suave">
                  <span className="text-tinta">{brl(c.total)}</span> · {Math.round(c.pct)}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-folha" role="presentation">
                <div className="barra-preenche h-full rounded-full bg-floresta" style={{ width: `${Math.min(100, Math.max(2, c.pct))}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      {recentes > 0 && (
        <ul className="mt-6 flex flex-col gap-3" aria-label="Lançamentos recentes">
          {visiveis.slice(0, recentes).map((i, idx) => (
            <li key={`${i.descricao}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl bg-papel px-4 py-3 text-[15px]">
              <span className="min-w-0 truncate">
                <span className="font-medium">{i.descricao}</span> <span className="text-suave">{i.categoria}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">{brl(i.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
