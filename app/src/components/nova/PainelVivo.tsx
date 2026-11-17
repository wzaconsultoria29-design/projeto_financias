"use client";

import { useState } from "react";
import { ChartPieSlice, GearSix, ListBullets, SquaresFour, TrendDown, TrendUp } from "@phosphor-icons/react";
import { agregar } from "@/lib/demo";
import { PERIODOS, type Periodo } from "@/lib/demo-dados";
import { brl } from "@/lib/format";
import { corDe } from "./dados";
import { Numero } from "./Numero";

const RAIO = 62;
const VOLTA = 2 * Math.PI * RAIO;

/** O painel de verdade em miniatura: os números saem dos mesmos dados de exemplo, somados por `agregar`. */
export function PainelVivo() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [comparar, setComparar] = useState(true);
  const [foco, setFoco] = useState<string | null>(null);

  const dados = PERIODOS[periodo];
  const { total, categorias, maior } = agregar(dados.itens);
  const focoAtivo = foco && categorias.some((c) => c.categoria === foco) ? foco : null;
  const dif = total - dados.anterior;
  const itens = focoAtivo ? dados.itens.filter((i) => i.categoria === focoAtivo) : dados.itens;
  const emFoco = categorias.find((c) => c.categoria === focoAtivo);

  // Cada fatia da rosca começa onde a anterior terminou.
  const fatias = categorias.map((c, i) => {
    const antes = categorias.slice(0, i).reduce((s, x) => s + x.pct, 0);
    return { ...c, comprimento: (c.pct / 100) * VOLTA, inicio: (antes / 100) * VOLTA };
  });

  return (
    <section id="painel" className="relative scroll-mt-20 overflow-hidden py-24 md:py-32" aria-labelledby="titulo-painel">
      <div aria-hidden className="nv-aurora left-1/2 top-[30%] -z-10 h-[520px] w-[820px] -translate-x-1/2 bg-[rgba(39,224,139,0.13)]" />
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 id="titulo-painel" data-revela className="nv-titulo text-[clamp(2rem,4.6vw,3.75rem)]">
            Veja para onde o dinheiro foi.
          </h2>
          <p data-revela style={{ "--i": 1 } as React.CSSProperties} className="nv-suave mx-auto mt-5 max-w-[52ch] text-[18px] leading-relaxed">
            Tudo o que você manda no WhatsApp aparece no painel, por semana, mês, ano e categoria. Mexa nos botões e veja recalcular.
          </p>
        </div>

        <div data-ui className="nv-quadro mt-14 overflow-hidden rounded-[28px] bg-[var(--nv-sup)] shadow-[0_0_0_1px_var(--nv-linha-forte),0_80px_160px_-50px_rgba(0,0,0,0.95),0_0_140px_-40px_rgba(39,224,139,0.45)]">
          <div className="flex items-center gap-3 bg-white/[0.04] px-4 py-3">
            <span aria-hidden className="flex gap-1.5">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </span>
            <span className="nv-suave mx-auto rounded-full bg-black/40 px-4 py-1 text-[13px]">Painel</span>
            <span className="rounded-full bg-[rgba(200,246,93,0.14)] px-3 py-1 text-[12px] font-medium text-[var(--nv-lima)]">Dados de exemplo</span>
          </div>

          <div className="grid md:grid-cols-[72px_1fr]">
            <div aria-hidden className="hidden flex-col items-center gap-3 bg-black/25 py-6 md:flex">
              {[SquaresFour, ListBullets, ChartPieSlice, GearSix].map((Icone, i) => (
                <span key={i} className={`grid size-11 place-items-center rounded-[14px] ${i === 0 ? "bg-[var(--nv-lima)] text-[#04130b]" : "text-[var(--nv-suave)]"}`}>
                  <Icone size={22} weight={i === 0 ? "fill" : "regular"} />
                </span>
              ))}
            </div>

            <div className="p-4 md:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div role="group" aria-label="Período" className="flex w-fit gap-1 rounded-full bg-black/35 p-1">
                  {(Object.keys(PERIODOS) as Periodo[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={periodo === id}
                      onClick={() => setPeriodo(id)}
                      className={`min-h-[44px] rounded-full px-5 text-[15px] font-medium transition-colors ${periodo === id ? "bg-[var(--nv-lima)] text-[#04130b]" : "text-[var(--nv-suave)] hover:text-[var(--nv-texto)]"}`}
                    >
                      {PERIODOS[id].rotulo}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={comparar}
                  onClick={() => setComparar((v) => !v)}
                  className="flex min-h-[44px] w-fit items-center gap-3 rounded-full bg-black/35 py-1.5 pl-2 pr-5 text-[15px] font-medium"
                >
                  <span aria-hidden className={`relative h-7 w-12 flex-none rounded-full transition-colors ${comparar ? "bg-[var(--nv-verde)]" : "bg-white/15"}`}>
                    <span className={`absolute top-1 size-5 rounded-full bg-white transition-transform ${comparar ? "translate-x-6" : "translate-x-1"}`} />
                  </span>
                  Comparar com o período anterior
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                <div className="flex flex-col gap-4">
                  <div className="rounded-[22px] bg-[linear-gradient(140deg,rgba(39,224,139,0.2),rgba(200,246,93,0.06))] p-6 shadow-[inset_0_0_0_1px_var(--nv-linha)]">
                    <p className="nv-suave text-[15px]">{dados.titulo}</p>
                    <Numero valor={total} className="nv-num mt-1 block text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-none" />
                    {comparar && (
                      <p className="nv-entra mt-4 flex w-fit items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-[14px]">
                        {dif > 0 ? <TrendUp size={17} weight="bold" aria-hidden className="text-[var(--nv-laranja)]" /> : <TrendDown size={17} weight="bold" aria-hidden className="text-[var(--nv-verde)]" />}
                        {brl(Math.abs(dif))} {dif > 0 ? "a mais" : "a menos"} que {dados.anteriorRotulo}
                      </p>
                    )}
                  </div>

                  <div className="rounded-[22px] bg-black/25 p-5 shadow-[inset_0_0_0_1px_var(--nv-linha)]">
                    <p className="flex items-center justify-between gap-3 text-[15px]">
                      <span className="font-semibold">{focoAtivo ? `Lançamentos de ${focoAtivo}` : "Lançamentos"}</span>
                      {maior && !focoAtivo && <span className="nv-suave text-[13px]">Maior: {maior.descricao}</span>}
                    </p>
                    <ul className="mt-3 flex flex-col">
                      {itens.slice(0, 4).map((i) => (
                        <li key={`${periodo}-${i.descricao}`} className="nv-entra flex items-center gap-3 py-2 text-[15px]">
                          <span aria-hidden className="size-2.5 flex-none rounded-full" style={{ background: corDe(i.categoria) }} />
                          <span className="min-w-0 flex-1 truncate">{i.descricao}</span>
                          <span className="nv-suave hidden text-[13px] sm:block">{i.categoria}</span>
                          <span className="nv-num flex-none font-medium">{brl(i.valor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-[22px] bg-black/25 p-5 shadow-[inset_0_0_0_1px_var(--nv-linha)]">
                  <p className="text-[15px] font-semibold">Por categoria</p>
                  <div className="mt-2 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
                    <div className="relative flex-none">
                      <svg viewBox="0 0 160 160" className="nv-rosca size-[168px] -rotate-90" role="img" aria-label={`Gastos por categoria em ${dados.titulo.toLowerCase()}`}>
                        <circle cx="80" cy="80" r={RAIO} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="18" />
                        {fatias.map((f) => (
                          <circle
                            key={f.categoria}
                            cx="80"
                            cy="80"
                            r={RAIO}
                            fill="none"
                            stroke={corDe(f.categoria)}
                            strokeWidth={focoAtivo === f.categoria ? 24 : 18}
                            strokeDasharray={`${Math.max(0, f.comprimento - 2)} ${VOLTA}`}
                            strokeDashoffset={-f.inicio}
                            opacity={focoAtivo && focoAtivo !== f.categoria ? 0.25 : 1}
                          />
                        ))}
                      </svg>
                      <span className="absolute inset-0 grid place-items-center text-center">
                        <span>
                          <span className="nv-num block text-[26px] font-semibold leading-none">{emFoco ? `${Math.round(emFoco.pct)}%` : categorias.length}</span>
                          <span className="nv-suave mt-1 block text-[12px]">{emFoco ? "do total" : "categorias"}</span>
                        </span>
                      </span>
                    </div>

                    <ul className="flex w-full flex-col gap-1.5">
                      {categorias.slice(0, 5).map((c) => (
                        <li key={c.categoria}>
                          <button
                            type="button"
                            aria-pressed={focoAtivo === c.categoria}
                            onClick={() => setFoco(focoAtivo === c.categoria ? null : c.categoria)}
                            className={`w-full rounded-[14px] px-3 py-2 text-left transition-colors ${focoAtivo === c.categoria ? "bg-white/10" : "hover:bg-white/[0.06]"}`}
                          >
                            <span className="flex items-center justify-between gap-3 text-[14px]">
                              <span className="flex min-w-0 items-center gap-2">
                                <span aria-hidden className="size-2.5 flex-none rounded-full" style={{ background: corDe(c.categoria) }} />
                                <span className="truncate">{c.categoria}</span>
                              </span>
                              <span className="nv-num flex-none">{brl(c.total)}</span>
                            </span>
                            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
                              <span className="nv-barra block h-full rounded-full" style={{ background: corDe(c.categoria), transform: `scaleX(${c.pct / 100})` }} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
