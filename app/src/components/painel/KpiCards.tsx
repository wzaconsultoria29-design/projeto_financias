import { brl, pct } from "@/lib/format";
import type { VisaoGeral } from "@/lib/api";

function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="cartao p-5">
      <p className="text-sm text-suave">{titulo}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-tinta tabular-nums">{valor}</p>
      {detalhe !== undefined && <p className="mt-2 text-sm text-suave">{detalhe}</p>}
    </div>
  );
}

export function KpiCards({ dados }: { dados: VisaoGeral }) {
  const { totais, variacao_despesas_pct } = dados;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="cartao p-5">
        <p className="text-sm text-suave">Despesas</p>
        <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-tinta tabular-nums">{brl(totais.despesas)}</p>
        <p className="mt-2 text-sm text-suave">
          <span className="font-medium text-tinta tabular-nums">{pct(variacao_despesas_pct)}</span> em relação ao período anterior
        </p>
      </div>
      <Cartao titulo="Receitas" valor={brl(totais.receitas)} />
      <Cartao titulo="Saldo" valor={brl(totais.saldo)} detalhe={totais.saldo < 0 ? "Gastou mais do que entrou" : "Entrou mais do que saiu"} />
      <Cartao titulo="Lançamentos" valor={String(totais.quantidade)} />
    </div>
  );
}
