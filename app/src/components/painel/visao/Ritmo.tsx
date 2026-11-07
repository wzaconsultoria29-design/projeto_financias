"use client";

import { useState, type PointerEvent } from "react";
import type { Painel } from "@/lib/api";
import { brl, dataCurta } from "@/lib/format";
import { eixo, mediaPorDiaSemana, NOME_DIA, NOME_DIA_CURTO, somarDias, valorCurto } from "@/lib/painel";
import { useLargura } from "./useLargura";

const ALTURA = 210;
const M = { esq: 46, dir: 14, topo: 12, base: 26 };

function Legenda({ previsao }: { previsao: boolean }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-suave">
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded bg-floresta" aria-hidden="true" />
        Este período
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded bg-d-cinza" aria-hidden="true" />
        Período anterior
      </li>
      {previsao && (
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-floresta" aria-hidden="true" />
          Previsão
        </li>
      )}
    </ul>
  );
}

/** Gasto acumulado dia a dia: a linha deste período contra a do anterior, e a previsão tracejada até o fim do mês. */
function GraficoAcumulado({ p }: { p: Painel }) {
  const [ref, w] = useLargura();
  const [sel, setSel] = useState<number | null>(null);
  const serie = p.acumulado ?? [];
  const n = serie.length;
  const ultimo = serie.reduce((u, d, i) => (d.atual !== null ? i : u), -1);
  const previsto = p.projecao?.previsto ?? null;
  const maximo = Math.max(1, previsto ?? 0, ...serie.map((d) => Math.max(d.atual ?? 0, d.anterior)));
  const { topo, passos } = eixo(maximo);

  const x = (i: number) => M.esq + (n <= 1 ? 0 : (i / (n - 1)) * (w - M.esq - M.dir));
  const y = (v: number) => M.topo + (1 - v / topo) * (ALTURA - M.topo - M.base);
  const linha = (pontos: [number, number][]) => pontos.map(([i, v], k) => `${k === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const atual = serie.flatMap((d, i) => (d.atual !== null ? [[i, d.atual] as [number, number]] : []));
  const anterior = serie.map((d, i) => [i, d.anterior] as [number, number]);
  const ultimoAtual = ultimo >= 0 ? (serie[ultimo]?.atual ?? 0) : 0;
  const passoX = Math.max(1, Math.ceil(n / 5));
  const rotulosX = serie.map((_, i) => i).filter((i) => i % passoX === 0);

  function mover(e: PointerEvent<SVGSVGElement>) {
    const caixa = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - caixa.left - M.esq) / Math.max(1, w - M.esq - M.dir)) * (n - 1));
    setSel(Math.min(n - 1, Math.max(0, i)));
  }

  const alvo = sel !== null ? serie[sel] : undefined;
  const resumo = `Gasto acumulado dia a dia: este período ${brl(ultimoAtual)}, período anterior ${brl(serie[ultimo >= 0 ? ultimo : n - 1]?.anterior ?? 0)} no mesmo ponto`;

  return (
    <div ref={ref} className="relative mt-4">
      <svg
        role="img"
        aria-label={resumo}
        width={w}
        height={ALTURA}
        viewBox={`0 0 ${w} ${ALTURA}`}
        className="block touch-pan-y"
        onPointerMove={mover}
        onPointerLeave={() => setSel(null)}
      >
        {passos.map((v) => (
          <g key={v}>
            <line x1={M.esq} x2={w - M.dir} y1={y(v)} y2={y(v)} stroke="var(--linha)" strokeWidth={v === 0 ? 1.5 : 1} />
            <text x={M.esq - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--suave)">
              {valorCurto(v)}
            </text>
          </g>
        ))}
        {rotulosX.map((i) => (
          <text key={i} x={x(i)} y={ALTURA - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={12} fill="var(--suave)">
            {dataCurta(somarDias(p.periodo.de, i))}
          </text>
        ))}
        <path d={linha(anterior)} fill="none" stroke="var(--d-cinza)" strokeWidth={2} strokeLinejoin="round" />
        {previsto !== null && ultimo >= 0 && ultimo < n - 1 && (
          <path d={linha([[ultimo, ultimoAtual], [n - 1, previsto]])} fill="none" stroke="var(--floresta)" strokeWidth={2} strokeDasharray="5 5" />
        )}
        <path d={linha(atual)} fill="none" stroke="var(--floresta)" strokeWidth={2.5} strokeLinejoin="round" />
        {ultimo >= 0 && <circle cx={x(ultimo)} cy={y(ultimoAtual)} r={4} fill="var(--floresta)" stroke="var(--superficie)" strokeWidth={2} />}
        {sel !== null && alvo && (
          <g>
            <line x1={x(sel)} x2={x(sel)} y1={M.topo} y2={ALTURA - M.base} stroke="var(--suave)" strokeWidth={1} strokeDasharray="3 3" />
            {alvo.atual !== null && <circle cx={x(sel)} cy={y(alvo.atual)} r={4} fill="var(--floresta)" stroke="var(--superficie)" strokeWidth={2} />}
            <circle cx={x(sel)} cy={y(alvo.anterior)} r={4} fill="var(--d-cinza)" stroke="var(--superficie)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {sel !== null && alvo && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-[8px] border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-sm"
          style={{ left: Math.min(Math.max(x(sel) + 10, 0), Math.max(0, w - 170)) }}
        >
          <p className="font-medium">{dataCurta(somarDias(p.periodo.de, sel))}</p>
          <p className="tabular-nums">{`Este período: ${alvo.atual === null ? "—" : brl(alvo.atual)}`}</p>
          <p className="tabular-nums text-suave">{`Anterior: ${brl(alvo.anterior)}`}</p>
        </div>
      )}

      <table aria-label="Gasto acumulado por dia" className="sr-only">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Este período</th>
            <th>Período anterior</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((d, i) => (
            <tr key={d.dia}>
              <td>{dataCurta(somarDias(p.periodo.de, i))}</td>
              <td>{d.atual === null ? "—" : brl(d.atual)}</td>
              <td>{brl(d.anterior)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Gasto médio por ocorrência de cada dia da semana; a barra mais alta recebe a cor da marca. */
function DiaSemana({ p }: { p: Painel }) {
  const medias = mediaPorDiaSemana(p.dia_semana);
  const maior = medias.reduce((m, d) => (d.media > m.media ? d : m), { dow: 0, total: 0, media: 0 });
  if (maior.media <= 0) return null;
  const artigo = maior.dow === 0 || maior.dow === 6 ? "aos" : "às";

  return (
    <div className="mt-6 border-t border-linha pt-5">
      <p className="text-sm text-tinta">{`Você mais gasta ${artigo} ${NOME_DIA[maior.dow]}s, em média ${brl(maior.media)} por dia.`}</p>
      <ol aria-label="Gasto médio por dia da semana" className="mt-3 grid grid-cols-7 gap-2">
        {medias.map((d) => (
          <li key={d.dow} className="flex flex-col items-center gap-1.5">
            <div className="flex h-14 w-full items-end justify-center">
              <div
                className={`w-full max-w-7 rounded-t-[4px] ${d.dow === maior.dow ? "bg-floresta" : "bg-floresta/25"}`}
                style={{ height: `${Math.max(2, (d.media / maior.media) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-suave">{NOME_DIA_CURTO[d.dow]}</span>
            <span className="sr-only">{brl(d.media)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Ritmo({ p }: { p: Painel }) {
  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-ritmo">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <h2 id="t-ritmo" className="font-display text-lg font-semibold text-tinta">
          Ritmo do período
        </h2>
        {p.acumulado && <Legenda previsao={p.projecao !== null} />}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="text-sm text-suave">Média por dia</dt>
          <dd className="mt-0.5 text-xl font-semibold text-tinta tabular-nums">{brl(p.resumo.media_diaria)}</dd>
        </div>
        {p.projecao && (
          <div>
            <dt className="text-sm text-suave">Previsão de fechamento</dt>
            <dd className="mt-0.5 text-xl font-semibold text-tinta tabular-nums">{brl(p.projecao.previsto)}</dd>
            <dd className="text-xs text-suave">{`no ritmo de ${p.projecao.dias_decorridos} de ${p.projecao.dias_no_mes} dias`}</dd>
          </div>
        )}
      </dl>

      {p.acumulado && p.acumulado.length > 0 && <GraficoAcumulado p={p} />}
      <DiaSemana p={p} />
    </section>
  );
}
