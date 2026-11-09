import { Scales } from "@phosphor-icons/react/dist/ssr";
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
  const { divisao } = manchetes(p);

  const resumoTexto = PARTES.map((x) => `${x.rotulo.toLowerCase()} ${pctTexto(participacao(tipos[x.chave], base))}`).join(", ");

  return (
    <Capitulo
      id="tipos"
      titulo="Essencial, supérfluo e investimento"
      icone={Scales}
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
          <span role="img" aria-label={`${resumoTexto} ${comRenda ? "da renda" : "do gasto"}`} className="sr-only" />
          <ul className="flex flex-col gap-5">
            {PARTES.map((x) => {
              const parte = participacao(tipos[x.chave], base);
              return (
                <li key={x.chave}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-tinta">{x.rotulo}</span>
                    <span className="flex flex-none items-baseline gap-2.5 whitespace-nowrap tabular-nums">
                      <span className="dado text-suave">{brl(tipos[x.chave])}</span>
                      <span className="w-14 text-right font-bold text-tinta">{pctTexto(parte)}</span>
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 rounded-full bg-d-trilho" aria-hidden="true">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, parte)}%`, background: x.cor }} />
                    {comRenda && <span className="absolute -top-[3px] h-4 w-0.5 rounded-full bg-tinta opacity-50" style={{ left: `${x.ref}%` }} />}
                  </div>
                  {comRenda && <p className="mt-1 text-xs text-suave" style={{ marginLeft: `max(0px, calc(${x.ref}% - 2.5rem))` }}>{`referência ${x.ref}%`}</p>}
                </li>
              );
            })}
            {tipos.sem_tipo > 0 && (
              <li className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 flex-none rounded-full bg-d-cinza" aria-hidden="true" />
                  <span className="text-suave">Sem classificação</span>
                </span>
                <span className="flex flex-none items-baseline gap-2.5 whitespace-nowrap tabular-nums">
                  <span className="dado text-suave">{brl(tipos.sem_tipo)}</span>
                  <span className="w-14 text-right text-suave">{pctTexto(participacao(tipos.sem_tipo, base))}</span>
                </span>
              </li>
            )}
          </ul>
        </>
      )}
    </Capitulo>
  );
}
