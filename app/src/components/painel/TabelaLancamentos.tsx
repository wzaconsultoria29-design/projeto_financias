import { canonico, METODOS } from "@/config/categorias";
import { brl, dataCurta } from "@/lib/format";
import type { LancamentoItem } from "@/lib/api";

type Props = { itens: LancamentoItem[]; onEditar: (i: LancamentoItem) => void; onExcluir: (i: LancamentoItem) => void };

// Uma única estrutura: no celular cada linha vira um cartão, no desktop vira uma linha de grade.
const GRADE = "md:grid md:grid-cols-[84px_minmax(0,1fr)_150px_120px_110px_150px] md:items-center md:gap-4";

export function TabelaLancamentos({ itens, onEditar, onExcluir }: Props) {
  return (
    <div>
      <div aria-hidden className={`hidden border-b border-linha px-4 pb-3 text-sm text-suave ${GRADE}`}>
        <span>Data</span><span>Descrição</span><span>Categoria</span><span>Pagamento</span><span className="text-right">Valor</span><span />
      </div>
      <ul className="divide-y divide-linha">
        {itens.map((i) => {
          const texto = i.descricao?.trim() || "Sem descrição";
          const sinal = i.tipo === "receita" ? "+ " : "";
          return (
            <li key={i.id} className={`flex flex-col gap-2 px-4 py-4 ${GRADE}`}>
              <span className="text-sm text-suave">{dataCurta(i.data)}</span>
              <span className="min-w-0 truncate font-medium text-tinta" title={texto}>{texto}</span>
              <span className="truncate text-sm text-suave">{i.categoria ?? "Sem categoria"}</span>
              <span className="truncate text-sm text-suave">{i.metodo_pagamento ? canonico(i.metodo_pagamento, METODOS) : "-"}</span>
              <span className={`font-medium tabular-nums md:text-right ${i.tipo === "receita" ? "text-floresta" : "text-tinta"}`}>
                {sinal}{brl(i.valor)}
              </span>
              <span className="flex gap-2 md:justify-end">
                <button type="button" className="botao-contorno !px-3 !py-1.5 text-sm" onClick={() => onEditar(i)} aria-label={`Editar ${texto}`}>Editar</button>
                <button type="button" className="botao-contorno !px-3 !py-1.5 text-sm" onClick={() => onExcluir(i)} aria-label={`Excluir ${texto}`}>Excluir</button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
