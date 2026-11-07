import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { participacao, pctTexto } from "@/lib/painel";
import { QuadroVazio } from "./ParaOndeFoi";

const PARTES = [
  { chave: "essencial", rotulo: "Essencial", cor: "var(--d-azul)", ref: 50 },
  { chave: "superfluo", rotulo: "Supérfluo", cor: "var(--d-laranja)", ref: 30 },
  { chave: "investimento", rotulo: "Investimento", cor: "var(--d-agua)", ref: 20 },
] as const;

/** Quanto do dinheiro foi para o necessário, para o desejo e para o futuro, contra a referência 50/30/20. */
export function TiposGasto({ p }: { p: Painel }) {
  const { tipos, resumo } = p;
  const gasto = resumo.despesas;
  const comRenda = resumo.receitas > 0;
  const base = comRenda ? resumo.receitas : gasto;
  // Quando se gasta mais do que se recebe, a barra inteira representa o gasto, para os segmentos caberem.
  const escala = Math.max(base, gasto);
  const larg = (v: number) => `${participacao(v, escala)}%`;

  const resumoTexto = PARTES.map((x) => `${x.rotulo.toLowerCase()} ${pctTexto(participacao(tipos[x.chave], base))}`).join(", ");

  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-tipos">
      <h2 id="t-tipos" className="font-display text-lg font-semibold text-tinta">
        Essencial, supérfluo e investimento
      </h2>

      {gasto <= 0 ? (
        <div className="mt-4">
          <QuadroVazio>Nenhuma despesa neste período.</QuadroVazio>
        </div>
      ) : (
        <>
          <div
            role="img"
            aria-label={`${resumoTexto} ${comRenda ? "da renda" : "do gasto"}`}
            className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-d-trilho"
          >
            {PARTES.map((x) => (
              <div key={x.chave} className="h-full rounded-[3px]" style={{ width: larg(tipos[x.chave]), background: x.cor }} />
            ))}
            {tipos.sem_tipo > 0 && <div className="h-full rounded-[3px] bg-d-cinza" style={{ width: larg(tipos.sem_tipo) }} />}
          </div>

          <ul className="mt-5 flex flex-col gap-3">
            {PARTES.map((x) => (
              <li key={x.chave} className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: x.cor }} aria-hidden="true" />
                  <span className="text-tinta">{x.rotulo}</span>
                </span>
                <span className="flex flex-none items-baseline gap-3 whitespace-nowrap tabular-nums">
                  <span className="dado text-tinta">{brl(tipos[x.chave])}</span>
                  <span className="w-12 text-right text-sm font-medium text-tinta">{pctTexto(participacao(tipos[x.chave], base))}</span>
                  {comRenda && <span className="hidden w-14 text-right text-xs text-suave sm:block">{`ref. ${x.ref}%`}</span>}
                </span>
              </li>
            ))}
            {tipos.sem_tipo > 0 && (
              <li className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 flex-none rounded-full bg-d-cinza" aria-hidden="true" />
                  <span className="text-suave">Sem classificação</span>
                </span>
                <span className="flex flex-none items-baseline gap-3 whitespace-nowrap tabular-nums">
                  <span className="dado text-suave">{brl(tipos.sem_tipo)}</span>
                  <span className="w-12 text-right text-sm text-suave">{pctTexto(participacao(tipos.sem_tipo, base))}</span>
                  {comRenda && <span className="hidden w-14 sm:block" />}
                </span>
              </li>
            )}
          </ul>

          <p className="mt-5 border-t border-linha pt-4 text-sm text-suave">
            {comRenda
              ? "Percentuais sobre a renda do período. Referência 50/30/20: o que é necessário, o que é desejo e o que vira futuro."
              : "Sem renda registrada, os percentuais são calculados sobre o total do que você gastou."}
          </p>
        </>
      )}
    </section>
  );
}
