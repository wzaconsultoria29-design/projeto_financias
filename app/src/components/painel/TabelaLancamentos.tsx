import { PencilSimple, Trash } from "@phosphor-icons/react";
import { canonico, METODOS } from "@/config/categorias";
import { brl, dataCurta } from "@/lib/format";
import type { LancamentoItem } from "@/lib/api";
import { IconeCategoria } from "./IconeCategoria";

type Props = { itens: LancamentoItem[]; onEditar: (i: LancamentoItem) => void; onExcluir: (i: LancamentoItem) => void };

// Uma única estrutura. No desktop é uma linha de grade com uma coluna por campo.
// No celular é uma faixa curta: ícone | descrição e "categoria · pagamento · data" | valor e ações.
const GRADE_DESKTOP = "md:grid-cols-[84px_minmax(0,1fr)_150px_120px_150px_150px] md:items-center md:gap-4";
const ACAO = "botao-contorno !p-2 !text-[0.8125rem] md:!px-3.5 md:!py-1.5";

export function TabelaLancamentos({ itens, onEditar, onExcluir }: Props) {
  return (
    <div>
      <div aria-hidden className={`hidden border-b border-linha px-4 pb-3 text-sm text-suave md:grid ${GRADE_DESKTOP}`}>
        <span>Data</span><span>Descrição</span><span>Categoria</span><span>Pagamento</span><span className="text-right">Valor</span><span />
      </div>
      <ul className="divide-y divide-linha">
        {itens.map((i) => {
          const texto = i.descricao?.trim() || "Sem descrição";
          const sinal = i.tipo === "receita" ? "+ " : "";
          const categoria = i.categoria ?? "Sem categoria";
          const metodo = i.metodo_pagamento ? canonico(i.metodo_pagamento, METODOS) : null;
          return (
            <li key={i.id} className={`grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 md:py-4 ${GRADE_DESKTOP}`}>
              <span className="hidden text-sm text-suave md:block">{dataCurta(i.data)}</span>

              {/* No celular o ícone e o texto viram células da grade; no desktop ficam juntos numa célula. */}
              <span className="contents md:flex md:min-w-0 md:items-center md:gap-3">
                <span className="col-start-1 row-span-2 row-start-1 md:row-span-1">
                  <span className="md:hidden"><IconeCategoria categoria={i.categoria} receita={i.tipo === "receita"} tamanho={36} /></span>
                  <span className="hidden md:block"><IconeCategoria categoria={i.categoria} receita={i.tipo === "receita"} tamanho={40} /></span>
                </span>
                <span className="col-start-2 row-start-1 min-w-0 truncate font-semibold text-tinta" title={texto}>{texto}</span>
              </span>

              <span className="col-start-2 row-start-2 min-w-0 truncate text-[13px] text-suave md:hidden">
                {[categoria, metodo, dataCurta(i.data)].filter(Boolean).join(" · ")}
              </span>
              <span className="hidden truncate text-sm text-suave md:block">{categoria}</span>
              <span className="hidden truncate text-sm text-suave md:block">{metodo ?? "-"}</span>

              <span className={`col-start-3 row-start-1 text-right font-bold tabular-nums md:col-start-auto md:row-start-auto ${i.tipo === "receita" ? "text-bom-ink" : "text-tinta"}`}>
                {sinal}{brl(i.valor)}
              </span>
              <span className="col-start-3 row-start-2 flex justify-end gap-1.5 md:col-start-auto md:row-start-auto md:gap-2">
                <button type="button" className={ACAO} onClick={() => onEditar(i)} aria-label={`Editar ${texto}`}>
                  <PencilSimple size={16} aria-hidden className="md:hidden" />
                  <span className="hidden md:inline">Editar</span>
                </button>
                <button type="button" className={ACAO} onClick={() => onExcluir(i)} aria-label={`Excluir ${texto}`}>
                  <Trash size={16} aria-hidden className="md:hidden" />
                  <span className="hidden md:inline">Excluir</span>
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
