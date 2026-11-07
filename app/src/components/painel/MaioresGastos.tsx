import { brl, dataCurta } from "@/lib/format";
import type { VisaoGeral } from "@/lib/api";
import { EstadoVazio } from "./EstadoVazio";

export function MaioresGastos({ itens }: { itens: VisaoGeral["maiores"] }) {
  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="maiores-titulo">
      <h2 id="maiores-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Maiores gastos</h2>
      {itens.length === 0 ? (
        <EstadoVazio />
      ) : (
        <ul className="mt-4 divide-y divide-linha">
          {itens.map((m) => {
            const texto = m.descricao?.trim() || "Sem descrição";
            return (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-tinta" title={texto}>{texto}</p>
                  <p className="mt-0.5 text-sm text-suave">
                    {dataCurta(m.data)}
                    {m.categoria ? ` · ${m.categoria}` : ""}
                  </p>
                </div>
                <p className="dado shrink-0 font-medium tabular-nums text-tinta">{brl(m.valor)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
