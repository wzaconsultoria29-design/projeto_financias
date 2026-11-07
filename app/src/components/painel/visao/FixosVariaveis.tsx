import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { participacao, pctTexto } from "@/lib/painel";
import { Capitulo } from "./Capitulo";

/** Quanto do gasto já está comprometido (moradia, contas, assinaturas, recorrentes) e quanto ainda dá para mexer. */
export function FixosVariaveis({ p }: { p: Painel }) {
  const { fixos_total: fixos, variaveis_total: variaveis, maiores } = p.fixos;
  const total = fixos + variaveis;
  if (total <= 0) return null;

  return (
    <Capitulo
      id="fixos"
      titulo="Fixos e variáveis"
      manchete={`${pctTexto(participacao(fixos, total))} do gasto já está comprometido com contas fixas.`}
      comoLer="Fixos são contas que se repetem, como moradia, assinaturas e lançamentos recorrentes. Variáveis mudam de mês a mês e são onde dá para ajustar."
    >
      <div
        role="img"
        aria-label={`Fixos ${pctTexto(participacao(fixos, total))}, variáveis ${pctTexto(participacao(variaveis, total))} do gasto`}
        className="flex h-3.5 gap-0.5 overflow-hidden rounded-full"
      >
        <div className="h-full rounded-[3px] bg-floresta" style={{ width: `${participacao(fixos, total)}%` }} />
        <div className="h-full rounded-[3px] bg-d-trilho" style={{ width: `${participacao(variaveis, total)}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="flex items-center gap-2 text-sm text-suave">
            <span className="h-3 w-3 rounded-full bg-floresta" aria-hidden="true" />
            Fixos
          </dt>
          <dd className="dado mt-1 text-lg font-semibold tabular-nums text-tinta">
            {brl(fixos)} <span className="text-sm font-normal text-suave">{pctTexto(participacao(fixos, total))}</span>
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-sm text-suave">
            <span className="h-3 w-3 rounded-full bg-d-cinza" aria-hidden="true" />
            Variáveis
          </dt>
          <dd className="dado mt-1 text-lg font-semibold tabular-nums text-tinta">
            {brl(variaveis)} <span className="text-sm font-normal text-suave">{pctTexto(participacao(variaveis, total))}</span>
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
    </Capitulo>
  );
}
