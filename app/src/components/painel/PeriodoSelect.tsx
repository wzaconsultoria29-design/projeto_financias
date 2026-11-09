"use client";

import { useState } from "react";
import type { Intervalo, Preset } from "@/lib/periodo";

const PRESETS: { id: Preset; rotulo: string }[] = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "semana", rotulo: "Semana" },
  { id: "mes", rotulo: "Mês" },
  { id: "30d", rotulo: "30 dias" },
  { id: "ano", rotulo: "Ano" },
  { id: "custom", rotulo: "Personalizado" },
];

type Props = {
  preset: Preset;
  custom: Intervalo | undefined;
  maximo: string;
  onPreset: (p: Preset) => void;
  onCustom: (r: Intervalo) => void;
};

export function PeriodoSelect({ preset, custom, maximo, onPreset, onCustom }: Props) {
  const [de, setDe] = useState(custom?.de ?? "");
  const [ate, setAte] = useState(custom?.ate ?? "");

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Período" className="inline-flex flex-wrap gap-0.5 self-start rounded-full bg-d-trilho p-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={preset === p.id}
            onClick={() => onPreset(p.id)}
            className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${
              preset === p.id ? "bg-superficie font-semibold text-tinta shadow-[0_1px_3px_rgba(15,26,20,0.1)]" : "text-suave hover:text-tinta"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (de && ate) onCustom({ de, ate });
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-suave">
            De
            <input type="date" value={de} max={maximo} onChange={(e) => setDe(e.target.value)} required className="rounded-[14px] border border-linha bg-superficie px-3 py-2 text-tinta" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-suave">
            Até
            <input type="date" value={ate} max={maximo} onChange={(e) => setAte(e.target.value)} required className="rounded-[14px] border border-linha bg-superficie px-3 py-2 text-tinta" />
          </label>
          <button type="submit" className="botao">Aplicar</button>
        </form>
      )}
    </div>
  );
}
