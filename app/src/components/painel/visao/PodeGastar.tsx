import { ChartLineUp, Percent, Star, Warning } from "@phosphor-icons/react/dist/ssr";
import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { pctTexto, podeGastarPorDia } from "@/lib/painel";

/** A estrela de quatro pontas do cartão lima: só decoração. */
function Estrela({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className}>
      <path d="M50 4c4 26 20 42 46 46-26 4-42 20-46 46-4-26-20-42-46-46C30 46 46 30 50 4z" fill="currentColor" />
    </svg>
  );
}

/**
 * Quanto ainda dá para gastar por dia até o fim do mês (o que sobra da renda registrada dividido pelos dias que faltam).
 * Só existe no mês em andamento e com renda registrada; se já passou da renda, vira um aviso direto.
 */
export function PodeGastar({ p }: { p: Painel }) {
  const folga = podeGastarPorDia(p);
  if (!folga || !p.projecao) return null;

  if (folga.tipo === "estourou") {
    return (
      <section className="cartao flex flex-col justify-center gap-3 p-6 md:p-8" aria-label="Aviso do mês">
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-ruim-bg px-3.5 py-1.5 text-xs font-bold text-ruim-ink">
          <Warning size={15} weight="fill" aria-hidden="true" />
          Atenção
        </span>
        <p className="dado font-display text-[1.375rem] font-bold leading-tight tracking-tight text-tinta">
          {folga.excesso > 0 ? `Você já passou ${brl(folga.excesso)} da renda registrada neste mês.` : "Você já usou toda a renda registrada neste mês."}
        </p>
        <p className="text-sm text-suave">Quanto antes você lançar o que falta, mais fiel fica o número.</p>
      </section>
    );
  }

  const usada = p.resumo.receitas > 0 ? (p.resumo.despesas / p.resumo.receitas) * 100 : null;

  return (
    <section className="relative flex flex-col overflow-hidden rounded-[28px] bg-lima p-6 text-[#0b3a22] md:p-8" aria-label="Quanto pode gastar por dia">
      <Estrela className="pointer-events-none absolute -right-8 -top-4 h-48 w-48 text-[#d8f89b]" />
      <span className="relative inline-flex items-center gap-2 self-start rounded-full bg-[#0b3a22] py-1.5 pl-1.5 pr-4 text-xs font-bold text-white">
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0b3a22]">
          <Star size={13} weight="fill" />
        </span>
        Seu limite diário
      </span>
      <p className="relative mt-5 text-sm font-medium text-[#2f4a1f]">Pode gastar por dia até o fim do mês</p>
      <p className="dado numero-grande relative mt-1 text-[3rem] tabular-nums md:text-[3.75rem]">{brl(folga.porDia)}</p>
      <p className="dado relative mt-2 text-[0.8125rem] text-[#2f4a1f]">{`Sobram ${brl(folga.restante)} da renda registrada, em ${folga.dias} ${folga.dias === 1 ? "dia" : "dias"}.`}</p>

      <dl className="relative mt-auto grid grid-cols-2 gap-3 pt-5">
        <div className="rounded-[20px] bg-white/50 px-4 py-3">
          <dt className="flex items-center justify-between text-[0.8125rem] font-medium text-[#2f4a1f]">
            Previsto no mês
            <ChartLineUp size={16} aria-hidden="true" />
          </dt>
          <dd className="dado mt-1 font-display text-xl font-bold tabular-nums">{brl(p.projecao.previsto)}</dd>
        </div>
        {usada !== null && (
          <div className="rounded-[20px] bg-white/50 px-4 py-3">
            <dt className="flex items-center justify-between text-[0.8125rem] font-medium text-[#2f4a1f]">
              Renda usada
              <Percent size={16} aria-hidden="true" />
            </dt>
            <dd className="dado mt-1 font-display text-xl font-bold tabular-nums">{pctTexto(usada)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
