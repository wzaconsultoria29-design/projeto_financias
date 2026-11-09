import { Receipt } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { brl, dataCurta } from "@/lib/format";
import type { VisaoGeral } from "@/lib/api";
import { EstadoVazio } from "./EstadoVazio";
import { IconeCategoria } from "./IconeCategoria";

export function MaioresGastos({ itens }: { itens: VisaoGeral["maiores"] }) {
  return (
    <section className="cartao flex flex-col p-5 md:p-6" aria-labelledby="maiores-titulo">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-folha text-verde-escuro">
          <Receipt size={21} />
        </span>
        <h2 id="maiores-titulo" className="min-w-0 flex-1 font-display text-[1.1875rem] font-bold tracking-tight text-tinta">
          Maiores gastos
        </h2>
      </div>
      {itens.length === 0 ? (
        <div className="mt-4">
          <EstadoVazio />
        </div>
      ) : (
        <ul className="mt-3 flex-1 divide-y divide-linha">
          {itens.map((m) => {
            const texto = m.descricao?.trim() || "Sem descrição";
            return (
              <li key={m.id} className="flex items-center gap-3.5 py-3">
                <IconeCategoria categoria={m.categoria} tamanho={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-tinta" title={texto}>
                    {texto}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-suave">
                    {dataCurta(m.data)}
                    {m.categoria ? ` · ${m.categoria}` : ""}
                  </p>
                </div>
                <p className="dado shrink-0 font-bold tabular-nums text-ruim-ink">{brl(m.valor)}</p>
              </li>
            );
          })}
        </ul>
      )}
      {itens.length > 0 && (
        <Link href="/painel/lancamentos" className="botao-contorno mt-4 self-start !px-4 !py-2 !text-[0.8125rem]">
          Ver todos os lançamentos
        </Link>
      )}
    </section>
  );
}
