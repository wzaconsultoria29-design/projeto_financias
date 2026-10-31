"use client";

import { useEffect, useRef } from "react";
import { brl, dataCurta } from "@/lib/format";
import type { LancamentoItem } from "@/lib/api";

type Props = { item: LancamentoItem; ocupado: boolean; erro: string; onConfirmar: () => void; onCancelar: () => void };

export function ConfirmarExclusao({ item, ocupado, erro, onConfirmar, onCancelar }: Props) {
  const cancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="excluir-titulo" className="cartao w-full max-w-md p-6 shadow-xl">
        <h2 id="excluir-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Excluir este lançamento?</h2>
        <p className="mt-3 leading-relaxed text-suave">
          {item.descricao?.trim() || "Sem descrição"}, {brl(item.valor)} em {dataCurta(item.data)}. Ele deixa de aparecer no painel e nos totais.
        </p>
        {erro && <p role="alert" className="mt-4 rounded-[12px] bg-folha px-4 py-3 text-sm text-tinta">{erro}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelar} type="button" className="botao-contorno" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button type="button" className="botao" onClick={onConfirmar} disabled={ocupado}>
            {ocupado ? "Excluindo…" : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
