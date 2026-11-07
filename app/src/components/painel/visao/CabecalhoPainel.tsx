"use client";

import { useState } from "react";
import { CaretLeft, CaretRight, Plus, WhatsappLogo } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { rotuloDoMes, type Intervalo } from "@/lib/periodo";

export type Modo = "mes" | "30d" | "ano" | "custom";

const MODOS: { id: Modo; rotulo: string }[] = [
  { id: "mes", rotulo: "Mês" },
  { id: "30d", rotulo: "30 dias" },
  { id: "ano", rotulo: "Ano" },
  { id: "custom", rotulo: "Personalizado" },
];

type Props = {
  titulo: string;
  subtitulo: string;
  modo: Modo;
  mes: string;
  mesAtual: string;
  custom: Intervalo | undefined;
  maximo: string;
  onModo: (m: Modo) => void;
  onMes: (delta: -1 | 1) => void;
  onCustom: (r: Intervalo) => void;
  onLancar: () => void;
};

const campo = "rounded-[10px] border border-linha bg-superficie px-3 py-2 text-tinta";

/** Título que responde à pergunta da tela, a escolha do período e as duas ações do dia a dia: lançar e conversar. */
export function CabecalhoPainel({ titulo, subtitulo, modo, mes, mesAtual, custom, maximo, onModo, onMes, onCustom, onLancar }: Props) {
  const [de, setDe] = useState(custom?.de ?? "");
  const [ate, setAte] = useState(custom?.ate ?? "");

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-tinta">{titulo}</h1>
          <p className="mt-1 text-base text-suave">{subtitulo}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onLancar} className="botao">
            <Plus size={18} weight="bold" aria-hidden="true" />
            Lançar
          </button>
          <a href={brand.botWaUrl("")} target="_blank" rel="noopener noreferrer" className="botao-contorno">
            <WhatsappLogo size={18} aria-hidden="true" />
            Conversar no WhatsApp
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Período" className="inline-flex rounded-full bg-d-trilho p-1">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={modo === m.id}
              onClick={() => onModo(m.id)}
              className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${modo === m.id ? "bg-superficie text-tinta" : "text-suave hover:text-tinta"}`}
            >
              {m.rotulo}
            </button>
          ))}
        </div>

        {modo === "mes" && (
          <div className="inline-flex items-center gap-1">
            <button type="button" aria-label="Mês anterior" onClick={() => onMes(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-suave transition-colors hover:bg-folha hover:text-tinta">
              <CaretLeft size={18} aria-hidden="true" />
            </button>
            <span className="min-w-[10.5rem] text-center font-medium text-tinta first-letter:uppercase" aria-live="polite">
              {rotuloDoMes(mes)}
            </span>
            <button
              type="button"
              aria-label="Próximo mês"
              disabled={mes >= mesAtual}
              onClick={() => onMes(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-suave transition-colors hover:bg-folha hover:text-tinta disabled:pointer-events-none disabled:opacity-35"
            >
              <CaretRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {modo === "custom" && (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (de && ate) onCustom({ de, ate });
            }}
          >
            <label className="flex flex-col gap-1 text-sm text-suave">
              De
              <input type="date" value={de} max={maximo} onChange={(e) => setDe(e.target.value)} required className={campo} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-suave">
              Até
              <input type="date" value={ate} max={maximo} onChange={(e) => setAte(e.target.value)} required className={campo} />
            </label>
            <button type="submit" className="botao-contorno">
              Aplicar
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
