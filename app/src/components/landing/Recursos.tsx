"use client";

import { useState } from "react";
import { agregar } from "@/lib/demo";
import { PERIODOS, type Periodo } from "@/lib/demo-dados";
import { PainelFragmento } from "./PainelFragmento";

function Segmentado<T extends string>({ opcoes, valor, onChange, rotulo, compacto = false }: { opcoes: { id: T; rotulo: string }[]; valor: T | null; onChange: (v: T) => void; rotulo: string; compacto?: boolean }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={valor === o.id}
          onClick={() => onChange(o.id)}
          className={`ctl rounded-full font-medium ${compacto ? "px-4 py-2.5 text-[15px]" : "px-5 py-3 text-[16px]"} ${valor === o.id ? "bg-[var(--botao)] text-[var(--botao-fg)]" : "bg-folha text-tinta hover:bg-superficie"}`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

function Interruptor({ ligado, onToggle, compacto = false }: { ligado: boolean; onToggle: () => void; compacto?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={onToggle}
      className={`ctl flex w-fit items-center gap-4 rounded-full bg-folha py-2.5 pl-2.5 pr-6 font-medium text-tinta ${compacto ? "text-[15px]" : "text-[16px]"}`}
    >
      <span aria-hidden className={`relative h-8 w-14 flex-none rounded-full transition-colors ${ligado ? "bg-[var(--botao)]" : "bg-superficie"}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-papel transition-all ${ligado ? "left-7" : "left-1"}`} />
      </span>
      Comparar com o período anterior
    </button>
  );
}

const ROTULO = "mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-suave";

/**
 * Desktop: painel fixo de um lado e os passos do outro, a pessoa monta o painel enquanto lê.
 * Celular: os botões vêm juntos logo acima do painel, que fica parado e inteiro (fixo, ele cobria o texto).
 */
export function Recursos() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [comparar, setComparar] = useState(false);
  const [categoria, setCategoria] = useState<string | null>(null);

  const dados = PERIODOS[periodo];
  const categoriasDoPeriodo = agregar(dados.itens).categorias.slice(0, 4).map((c) => c.categoria);
  const categoriaAtiva = categoria && categoriasDoPeriodo.includes(categoria) ? categoria : null;

  const opcoesPeriodo = (Object.keys(PERIODOS) as Periodo[]).map((id) => ({ id, rotulo: PERIODOS[id].rotulo }));
  const opcoesCategoria = [null, ...categoriasDoPeriodo].map((c) => ({ id: c ?? "todas", rotulo: c ?? "Todas" }));
  const escolherCategoria = (id: string) => setCategoria(id === "todas" ? null : id);

  return (
    <section id="recursos" className="scroll-mt-16 bg-papel pb-16 md:pb-0" aria-labelledby="titulo-recursos">
      <div className="mx-auto flex max-w-7xl flex-col md:grid md:grid-cols-12 md:gap-x-8 md:px-8">
        <div
          data-painel-recursos
          className="rise order-2 mx-4 rounded-[24px] bg-[var(--lima-suave)] p-3 md:sticky md:top-16 md:z-10 md:order-none md:col-span-6 md:mx-0 md:mt-8 md:flex md:h-[calc(100svh-4rem)] md:items-center md:rounded-[28px] md:p-8"
        >
          <div className="w-full">
            <PainelFragmento
              titulo={dados.titulo}
              itens={dados.itens}
              anterior={dados.anterior}
              anteriorRotulo={dados.anteriorRotulo}
              comparar={comparar}
              destaque={categoriaAtiva}
              recentes={categoriaAtiva ? 3 : 2}
            />
          </div>
        </div>

        <div className="order-1 px-4 md:order-none md:col-span-5 md:col-start-8 md:px-0">
          <h2 id="titulo-recursos" className="lp-display rise pt-20 text-[clamp(2rem,3.6vw,3rem)] text-tinta md:pt-[14vh]">Monte o seu painel</h2>

          {/* Celular: tudo junto, logo acima do painel, para ver a mudança na hora. */}
          <div className="rise flex flex-col gap-5 pb-6 pt-4 md:hidden">
            <p className="text-[17px] leading-relaxed text-suave">Mexa nos botões e veja o painel logo abaixo recalcular, direto do banco.</p>
            <div>
              <p className={ROTULO}>Período</p>
              <Segmentado compacto rotulo="Período" valor={periodo} onChange={setPeriodo} opcoes={opcoesPeriodo} />
            </div>
            <Interruptor compacto ligado={comparar} onToggle={() => setComparar((v) => !v)} />
            <div>
              <p className={ROTULO}>Categoria</p>
              <Segmentado compacto rotulo="Categoria" valor={categoriaAtiva ?? "todas"} onChange={escolherCategoria} opcoes={opcoesCategoria} />
            </div>
          </div>

          {/* Desktop: um passo por vez, ao lado do painel fixo. */}
          <div className="hidden min-h-[36vh] flex-col justify-center gap-4 py-12 md:flex">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Escolha o período.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">Semana, mês ou ano. O painel recalcula tudo na hora, direto do banco.</p>
            <Segmentado rotulo="Período" valor={periodo} onChange={setPeriodo} opcoes={opcoesPeriodo} />
          </div>

          <div className="hidden min-h-[36vh] flex-col justify-center gap-4 py-12 md:flex">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Compare com antes.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">Veja na hora quanto gastou a mais ou a menos do que no período anterior.</p>
            <Interruptor ligado={comparar} onToggle={() => setComparar((v) => !v)} />
          </div>

          <div className="hidden min-h-[36vh] flex-col justify-center gap-4 py-12 md:flex md:pb-[16vh]">
            <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">Olhe uma categoria.</h3>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-suave">Toque em uma categoria e o painel destaca só os lançamentos dela.</p>
            <Segmentado rotulo="Categoria" valor={categoriaAtiva ?? "todas"} onChange={escolherCategoria} opcoes={opcoesCategoria} />
          </div>
        </div>
      </div>
    </section>
  );
}
