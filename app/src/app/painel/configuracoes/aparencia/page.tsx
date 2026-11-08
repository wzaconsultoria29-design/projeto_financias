"use client";

import { useOcultarAoAbrir, useTema, type Tema } from "@/lib/tema";

const TEMAS: { id: Tema; rotulo: string; descricao: string; cores: string[] }[] = [
  { id: "claro", rotulo: "Claro", descricao: "sempre com fundo claro", cores: ["#f3f5f1"] },
  { id: "escuro", rotulo: "Escuro", descricao: "sempre com fundo escuro", cores: ["#0b1411"] },
  { id: "auto", rotulo: "Automático", descricao: "segue o tema do aparelho", cores: ["#f3f5f1", "#0b1411"] },
];

export default function AparenciaPage() {
  const [tema, escolher] = useTema();
  const [ocultar, alternarOcultar] = useOcultarAoAbrir();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">Aparência e segurança</h2>
        <p className="mt-1 text-suave">O tema do painel e como os seus números aparecem.</p>
      </div>

      <div role="radiogroup" aria-label="Tema do painel" className="grid gap-3.5 sm:grid-cols-3">
        {TEMAS.map((t) => (
          <label key={t.id} className={`flex cursor-pointer flex-col rounded-[16px] border-[1.5px] bg-superficie p-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-floresta ${tema === t.id ? "border-floresta" : "border-linha hover:border-suave"}`}>
            <input type="radio" name="tema" checked={tema === t.id} onChange={() => escolher(t.id)} className="sr-only" />
            <span aria-hidden="true" className="mb-3 flex h-[62px] overflow-hidden rounded-[10px] border border-linha">
              {t.cores.map((c) => (
                <span key={c} className="flex-1" style={{ background: c }} />
              ))}
            </span>
            <span className="font-semibold text-tinta">{t.rotulo}</span>
            <span className="text-[0.8125rem] text-suave">{t.descricao}</span>
          </label>
        ))}
      </div>

      <section className="cartao p-5 md:p-6" aria-labelledby="t-seguranca">
        <h3 id="t-seguranca" className="font-display text-lg font-semibold text-tinta">Segurança</h3>
        <div className="mt-4 flex items-center justify-between gap-6">
          <div>
            <p id="t-ocultar" className="font-medium text-tinta">Ocultar valores ao abrir</p>
            <p className="text-sm text-suave">Os valores em reais começam desfocados, em cada nova abertura do painel, até você tocar no olho.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ocultar}
            aria-labelledby="t-ocultar"
            onClick={alternarOcultar}
            className={`relative h-[26px] w-11 flex-none rounded-full transition-colors ${ocultar ? "bg-floresta" : "bg-d-trilho"}`}
          >
            <span aria-hidden="true" className={`absolute top-[3px] h-5 w-5 rounded-full bg-white ring-1 ring-black/10 transition-[left] ${ocultar ? "left-[21px]" : "left-[3px]"}`} />
          </button>
        </div>
      </section>
    </div>
  );
}
