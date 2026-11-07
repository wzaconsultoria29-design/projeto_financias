import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { participacao, pctTexto } from "@/lib/painel";

/** Quanto do gasto já está comprometido (moradia, contas, assinaturas, recorrentes) e quanto ainda dá para mexer. */
export function FixosVariaveis({ p }: { p: Painel }) {
  const { fixos_total: fixos, variaveis_total: variaveis, maiores } = p.fixos;
  const total = fixos + variaveis;
  if (total <= 0) return null;

  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-fixos">
      <h2 id="t-fixos" className="font-display text-lg font-semibold text-tinta">
        Fixos e variáveis
      </h2>
      <div
        role="img"
        aria-label={`Fixos ${pctTexto(participacao(fixos, total))}, variáveis ${pctTexto(participacao(variaveis, total))} do gasto`}
        className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
      >
        <div className="h-full rounded-[3px] bg-floresta" style={{ width: `${participacao(fixos, total)}%` }} />
        <div className="h-full rounded-[3px] bg-d-trilho" style={{ width: `${participacao(variaveis, total)}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="flex items-center gap-2 text-sm text-suave">
            <span className="h-2 w-2 rounded-full bg-floresta" aria-hidden="true" />
            Fixos
          </dt>
          <dd className="dado mt-1 tabular-nums text-tinta">
            {brl(fixos)} <span className="text-sm text-suave">{pctTexto(participacao(fixos, total))}</span>
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-sm text-suave">
            <span className="h-2 w-2 rounded-full bg-d-cinza" aria-hidden="true" />
            Variáveis
          </dt>
          <dd className="dado mt-1 tabular-nums text-tinta">
            {brl(variaveis)} <span className="text-sm text-suave">{pctTexto(participacao(variaveis, total))}</span>
          </dd>
        </div>
      </dl>
      {maiores.length > 0 && (
        <ul aria-label="Maiores gastos fixos" className="mt-4 flex flex-col gap-2 border-t border-linha pt-4 text-sm">
          {maiores.slice(0, 3).map((m, i) => (
            <li key={`${m.descricao}-${i}`} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-suave">{m.descricao}</span>
              <span className="dado flex-none tabular-nums text-tinta">{brl(m.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
