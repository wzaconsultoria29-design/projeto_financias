import type { LancamentoItem } from "@/lib/api";
import { dataLonga } from "@/lib/format";

const CABECALHO = ["data", "tipo", "valor", "categoria", "subcategoria", "descricao", "metodo_pagamento", "origem", "codigo"];

/** Protege separadores/aspas e neutraliza fórmulas que o Excel executaria (=, +, -, @). */
function celula(valor: string | null | undefined): string {
  let s = valor ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV para Excel pt-BR: BOM, ponto e vírgula, vírgula decimal e datas dd/mm/aaaa. */
export function lancamentosParaCsv(itens: LancamentoItem[]): string {
  const linhas = itens.map((i) =>
    [
      dataLonga(i.data),
      i.tipo,
      i.valor.toFixed(2).replace(".", ","),
      celula(i.categoria),
      celula(i.subcategoria),
      celula(i.descricao),
      celula(i.metodo_pagamento),
      celula(i.origem),
      celula(i.codigo),
    ].join(";"),
  );
  return `﻿${[CABECALHO.join(";"), ...linhas].join("\n")}`;
}
