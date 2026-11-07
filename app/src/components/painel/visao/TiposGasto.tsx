import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { manchetes } from "@/lib/narrativa";
import { participacao, pctTexto } from "@/lib/painel";
import { Capitulo } from "./Capitulo";
import { QuadroVazio } from "./ParaOndeFoi";

const PARTES = [
  { chave: "essencial", rotulo: "Essencial", cor: "var(--t1)", ref: 50 },
  { chave: "superfluo", rotulo: "Supérfluo", cor: "var(--t2)", ref: 30 },
  { chave: "investimento", rotulo: "Investimento", cor: "var(--t3)", ref: 20 },
] as const;

/** Quanto do dinheiro foi para o essencial, para o supérfluo e para o futuro, contra a referência 50/30/20 da renda. */
export function TiposGasto({ p }: { p: Painel }) {
  const { tipos, resumo } = p;
  const gasto = resumo.despesas;
  const comRenda = resumo.receitas > 0;
  const base = comRenda ? resumo.receitas : gasto;
  // Quando se gasta mais do que se recebe, a barra inteira representa o gasto, para os segmentos caberem.
  const escala = Math.max(base, gasto);
  const larg = (v: number) => `${participacao(v, escala)}%`;
  const { divisao } = manchetes(p);

  const resumoTexto = PARTES.map((x) => `${x.rotulo.toLowerCase()} ${pctTexto(participacao(tipos[x.chave], base))}`).join(", ");

  return (
    <Capitulo
      id="tipos"
      titulo="Essencial, supérfluo e investimento"
      manchete={gasto > 0 ? divisao : null}
      comoLer={
        comRenda
          ? "Percentuais sobre a renda do período. Referência 50/30/20: essencial é o que não dá para evitar, supérfluo é o que você escolhe e investimento é o que vira reserva. São um guia, não uma regra."
          : "Sem renda registrada, os percentuais são calculados sobre o total do que você gastou."
      }
    >
      {gasto <= 0 ? (
        <QuadroVazio>Nenhuma despesa neste período.</QuadroVazio>
      ) : (
        <>
          <div role="img" aria-label={`${resumoTexto} ${comRenda ? "da renda" : "do gasto"}`} className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-d-trilho">
            {PARTES.map((x) => (
              <div key={x.chave} className="h-full rounded-[3px]" style={{ width: larg(tipos[x.chave]), background: x.cor }} />
            ))}
            {tipos.sem_tipo > 0 && <div className="h-full rounded-[3px] bg-d-cinza" style={{ width: larg(tipos.sem_tipo) }} />}
          </div>

          <ul className="mt-5 flex flex-col gap-3">
            {PARTES.map((x) => (
              <li key={x.chave} className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 flex-none rounded-full" style={{ background: x.cor }} aria-hidden="true" />
                  <span className="text-tinta">{x.rotulo}</span>
                </span>
                <span className="flex flex-none items-baseline gap-3 whitespace-nowrap tabular-nums">
                  <span className="dado text-tinta">{brl(tipos[x.chave])}</span>
                  <span className="w-12 text-right text-sm font-semibold text-tinta">{pctTexto(participacao(tipos[x.chave], base))}</span>
                  {comRenda && <span className="hidden w-[5.5rem] text-right text-xs text-suave sm:block">{`referência ${x.ref}%`}</span>}
                </span>
              </li>
            ))}
            {tipos.sem_tipo > 0 && (
              <li className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 flex-none rounded-full bg-d-cinza" aria-hidden="true" />
                  <span className="text-suave">Sem classificação</span>
                </span>
                <span className="flex flex-none items-baseline gap-3 whitespace-nowrap tabular-nums">
                  <span className="dado text-suave">{brl(tipos.sem_tipo)}</span>
                  <span className="w-12 text-right text-sm text-suave">{pctTexto(participacao(tipos.sem_tipo, base))}</span>
                  {comRenda && <span className="hidden w-[5.5rem] sm:block" />}
                </span>
              </li>
            )}
          </ul>
        </>
      )}
    </Capitulo>
  );
}
