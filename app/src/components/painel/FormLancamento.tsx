"use client";

import { useEffect, useRef, useState } from "react";
import { canonico, CATEGORIAS, METODOS } from "@/config/categorias";
import { lerValor } from "@/lib/format";
import { hojeIso } from "@/lib/periodo";
import type { LancamentoInput, LancamentoItem } from "@/lib/api";

type Props = {
  inicial: LancamentoItem | null;
  categorias?: string[];
  ocupado: boolean;
  erro: string;
  onSalvar: (dados: LancamentoInput) => void;
  onCancelar: () => void;
};

const campo = "rounded-[12px] border border-linha bg-superficie px-3 py-2.5 text-tinta";

function valorInicial(v: number | undefined): string {
  return v === undefined ? "" : v.toFixed(2).replace(".", ",");
}

export function FormLancamento({ inicial, categorias: opcoesCategoria = CATEGORIAS, ocupado, erro, onSalvar, onCancelar }: Props) {
  const [tipo, setTipo] = useState<"despesa" | "receita">(inicial?.tipo ?? "despesa");
  const [valor, setValor] = useState(valorInicial(inicial?.valor));
  const [data, setData] = useState(inicial?.data.slice(0, 10) ?? hojeIso(new Date()));
  const [categoria, setCategoria] = useState(canonico(inicial?.categoria ?? "", opcoesCategoria));
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [metodo, setMetodo] = useState(canonico(inicial?.metodo_pagamento ?? "", METODOS));
  const [aviso, setAviso] = useState("");
  const primeiro = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primeiro.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const numero = lerValor(valor);
    if (numero === null) return setAviso("Informe um valor maior que zero.");
    if (!data) return setAviso("Informe a data.");
    setAviso("");
    onSalvar({
      tipo,
      valor: numero,
      data,
      categoria: categoria || null,
      descricao: descricao.trim() || null,
      metodo_pagamento: metodo || null,
    });
  }

  // Categoria que o bot criou e não está na lista continua selecionável.
  const categorias = categoria && !opcoesCategoria.includes(categoria) ? [categoria, ...opcoesCategoria] : opcoesCategoria;
  const metodos = metodo && !METODOS.includes(metodo) ? [metodo, ...METODOS] : METODOS;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-tinta/40 p-4 sm:items-center">
      <form onSubmit={enviar} role="dialog" aria-modal="true" aria-labelledby="form-titulo" className="cartao flex w-full max-w-lg flex-col gap-4 p-6 shadow-xl" noValidate>
        <h2 id="form-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">
          {inicial ? "Editar lançamento" : "Novo lançamento"}
        </h2>

        <fieldset className="flex gap-2">
          <legend className="sr-only">Tipo</legend>
          {(["despesa", "receita"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${tipo === t ? "border-transparent bg-lima font-semibold text-[#0b3a22]" : "border-linha text-suave"}`}
            >
              {t === "despesa" ? "Despesa" : "Receita"}
            </button>
          ))}
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-suave">
            Valor
            <input ref={primeiro} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={campo} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-suave">
            Data
            <input type="date" value={data} max={hojeIso(new Date())} onChange={(e) => setData(e.target.value)} className={campo} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-suave">
          Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-suave">
          Descrição
          <input value={descricao} maxLength={300} onChange={(e) => setDescricao(e.target.value)} className={campo} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-suave">
          Forma de pagamento
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={campo}>
            <option value="">Não informada</option>
            {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        {(aviso || erro) && <p role="alert" className="rounded-[12px] bg-folha px-4 py-3 text-sm text-tinta">{aviso || erro}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="botao-contorno" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button type="submit" className="botao" disabled={ocupado}>{ocupado ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </div>
  );
}
