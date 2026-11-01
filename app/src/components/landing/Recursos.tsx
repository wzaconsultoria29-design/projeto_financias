"use client";

import { useState } from "react";
import { agregar } from "@/lib/demo";
import { PERGUNTAS, PERIODOS, responder, type Pergunta, type Periodo } from "@/lib/demo-dados";
import { PainelFragmento } from "./PainelFragmento";

function Segmentado<T extends string>({ opcoes, valor, onChange, rotulo }: { opcoes: { id: T; rotulo: string }[]; valor: T | null; onChange: (v: T) => void; rotulo: string }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={valor === o.id}
          onClick={() => onChange(o.id)}
          className={`ctl rounded-full px-5 py-3 text-[16px] font-medium ${valor === o.id ? "bg-[var(--botao)] text-[var(--botao-fg)]" : "bg-folha text-tinta hover:bg-superficie"}`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Saída fixa de um lado, controles reais do outro: a pessoa monta o próprio painel enquanto lê. */
export function Recursos() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [comparar, setComparar] = useState(false);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);

  const dados = PERIODOS[periodo];
  const categoriasDoPeriodo = agregar(dados.itens).categorias.slice(0, 4).map((c) => c.categoria);
  const categoriaAtiva = categoria && categoriasDoPeriodo.includes(categoria) ? categoria : null;

  return (
    <section id="recursos" className="scroll-mt-16 bg-papel" aria-labelledby="titulo-recursos">
      <div className="mx-auto max-w-7xl md:grid md:grid-cols-12 md:gap-x-8 md:px-8">
        <div className="sticky top-16 z-10 bg-folha px-4 py-4 md:col-span-6 md:flex md:h-[calc(100svh-4rem)] md:items-center md:rounded-[28px] md:px-8 md:py-8 md:mt-8">
          <div className="max-h-[42svh] w-full overflow-hidden md:max-h-none">
            <PainelFragmento
              titulo={dados.titulo}
              itens={dados.itens}
              anterior={dados.anterior}
              anteriorRotulo={dados.anteriorRotulo}
              comparar={comparar}
              destaque={categoriaAtiva}
              recentes={categoriaAtiva ? 3 : 2}
            />
            {pergunta && (
              <div data-ui className="mt-3 hidden flex-col gap-2 md:flex" aria-live="polite">
                <p className="ml-auto max-w-[85%] rounded-2xl bg-[var(--botao)] px-4 py-2.5 text-[16px] text-[var(--botao-fg)]">{pergunta}</p>
                <p className="max-w-[92%] rounded-2xl bg-superficie px-4 py-2.5 text-[16px] leading-snug text-tinta">{responder(pergunta)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:col-span-5 md:col-start-8 md:px-0">
          <h2 id="titulo-recursos" className="lp-display rise pt-20 text-[clamp(2rem,3.6vw,3rem)] text-tinta md:pt-[14vh]">Monte o seu painel</h2>

          <div className="flex min-h-[36vh] flex-col justify-center gap-4 py-12">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Escolha o período.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">Semana, mês ou ano. O painel recalcula tudo na hora, direto do banco.</p>
            <Segmentado
              rotulo="Período"
              valor={periodo}
              onChange={setPeriodo}
              opcoes={(Object.keys(PERIODOS) as Periodo[]).map((id) => ({ id, rotulo: PERIODOS[id].rotulo }))}
            />
          </div>

          <div className="flex min-h-[36vh] flex-col justify-center gap-4 py-12">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Compare com antes.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">Veja na hora quanto gastou a mais ou a menos do que no período anterior.</p>
            <button
              type="button"
              role="switch"
              aria-checked={comparar}
              onClick={() => setComparar((v) => !v)}
              className="ctl flex w-fit items-center gap-4 rounded-full bg-folha py-2.5 pl-2.5 pr-6 text-[16px] font-medium text-tinta"
            >
              <span aria-hidden className={`relative h-8 w-14 rounded-full transition-colors ${comparar ? "bg-[var(--botao)]" : "bg-superficie"}`}>
                <span className={`absolute top-1 size-6 rounded-full bg-papel transition-all ${comparar ? "left-7" : "left-1"}`} />
              </span>
              Comparar com o período anterior
            </button>
          </div>

          <div className="flex min-h-[36vh] flex-col justify-center gap-4 py-12">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Olhe uma categoria.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">Toque em uma categoria e o painel destaca só os lançamentos dela.</p>
            <div role="group" aria-label="Categoria" className="flex flex-wrap gap-2">
              {[null, ...categoriasDoPeriodo].map((c) => (
                <button
                  key={c ?? "todas"}
                  type="button"
                  aria-pressed={categoriaAtiva === c}
                  onClick={() => setCategoria(c)}
                  className={`ctl rounded-full px-5 py-3 text-[16px] font-medium ${categoriaAtiva === c ? "bg-[var(--botao)] text-[var(--botao-fg)]" : "bg-folha text-tinta hover:bg-superficie"}`}
                >
                  {c ?? "Todas"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[36vh] flex-col justify-center gap-4 py-12 md:pb-[16vh]">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Pergunte sobre os seus gastos.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">
              Se você perguntar, o assistente analisa só os seus lançamentos e sugere algo leve. Ele nunca puxa assunto e nunca indica investimento ou produto.
            </p>
            <Segmentado rotulo="Pergunta" valor={pergunta} onChange={setPergunta} opcoes={PERGUNTAS.map((p) => ({ id: p, rotulo: p }))} />
            {pergunta && (
              <div data-ui className="flex flex-col gap-2 md:hidden" aria-live="polite">
                <p className="rounded-2xl bg-superficie px-4 py-3 text-[16px] leading-snug text-tinta">{responder(pergunta)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
