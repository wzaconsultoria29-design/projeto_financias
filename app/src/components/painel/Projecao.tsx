import { brl } from "@/lib/format";
import type { VisaoGeral } from "@/lib/api";

export function Projecao({ projecao }: { projecao: VisaoGeral["projecao_mes"] }) {
  if (!projecao) return null;
  return (
    <section className="cartao p-5" aria-labelledby="projecao-titulo">
      <h2 id="projecao-titulo" className="text-sm text-suave">Previsão para fechar o mês</h2>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-tinta tabular-nums">{brl(projecao.previsto)}</p>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        Calculada pelo ritmo de gastos em {projecao.dias_decorridos} de {projecao.dias_no_mes} dias. É uma estimativa, não uma garantia.
      </p>
    </section>
  );
}
