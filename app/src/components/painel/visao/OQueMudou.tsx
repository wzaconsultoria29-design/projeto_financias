import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import type { Painel } from "@/lib/api";
import { brl, pct } from "@/lib/format";
import { manchetes, oQueMudou, type Mudanca } from "@/lib/narrativa";
import { deltaBrl } from "@/lib/painel";
import { Capitulo } from "./Capitulo";
import { QuadroVazio } from "./ParaOndeFoi";

const SUBROTULO: Partial<Record<Mudanca["chave"], string>> = { subiu: "Categoria que mais subiu", caiu: "Categoria que mais caiu" };

/** Em relação ao período anterior, o que mudou: o antes e o depois, a diferença e se ela é boa ou ruim para o bolso. */
export function OQueMudou({ p }: { p: Painel }) {
  const itens = oQueMudou(p);
  const { mudou } = manchetes(p);

  return (
    <Capitulo
      id="mudou"
      titulo="O que mudou"
      icone={ChartLineUp}
      manchete={mudou}
      comoLer="Comparamos com o período anterior do mesmo tamanho; no mês em andamento, até o mesmo dia. Verde é bom para o seu bolso e laranja pede atenção."
    >
      {itens.length === 0 ? (
        <QuadroVazio>Ainda não há um período anterior para comparar.</QuadroVazio>
      ) : (
        <ul aria-label="Mudanças em relação ao período anterior" className="flex flex-col gap-3">
          {itens.map((i) => (
            <li key={`${i.chave}-${i.rotulo}`} data-bom={i.bom} className="grid grid-cols-1 gap-y-2 rounded-[18px] bg-papel px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-4 sm:gap-y-1">
              <div>
                <p className="font-semibold text-tinta">{i.rotulo}</p>
                {SUBROTULO[i.chave] && <p className="text-[13px] text-suave">{SUBROTULO[i.chave]}</p>}
              </div>
              <span className={`dado order-last justify-self-start whitespace-nowrap sm:order-none sm:row-span-2 sm:justify-self-end rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${i.bom ? "bg-bom-bg text-bom-ink" : "bg-ruim-bg text-ruim-ink"}`}>
                {`${deltaBrl(i.delta)}${i.pct === null ? "" : ` · ${pct(i.pct)}`}`}
              </span>
              <p className="dado text-sm text-suave tabular-nums">{`${brl(i.anterior)} → ${brl(i.atual)}`}</p>
            </li>
          ))}
        </ul>
      )}
    </Capitulo>
  );
}
