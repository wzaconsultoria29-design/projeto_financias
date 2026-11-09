"use client";

import { ChartBar } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { eixo, valorCurto } from "@/lib/painel";
import { mesCurto, rotuloDoMes } from "@/lib/periodo";
import { manchetes } from "@/lib/narrativa";
import { Capitulo } from "./Capitulo";
import { QuadroVazio } from "./ParaOndeFoi";
import { useLargura } from "./useLargura";

const ALTURA = 220;
const M = { esq: 46, dir: 8, topo: 12, base: 26 };

type Serie = "despesas" | "receitas";

/** Uma série por vez: as colunas dos meses anteriores ficam suaves e a do mês atual vai em lima, com o valor em um balão. */
function Colunas({ p, serie }: { p: Painel; serie: Serie }) {
  const [ref, w] = useLargura();
  const meses = p.tendencia;
  const { topo, passos } = eixo(Math.max(1, ...meses.map((m) => m[serie])));
  const area = w - M.esq - M.dir;
  const faixa = area / Math.max(1, meses.length);
  const barra = Math.max(14, Math.min(44, faixa * 0.6));
  const y = (v: number) => M.topo + (1 - v / topo) * (ALTURA - M.topo - M.base);
  const h = (v: number) => Math.max(v > 0 ? 2 : 0, y(0) - y(v));
  const ultimo = meses.length - 1;
  const rotulo = serie === "despesas" ? "despesas" : "receitas";

  return (
    <div ref={ref} className="dado mt-4 overflow-hidden">
      <svg role="img" aria-label={`${serie === "despesas" ? "Despesas" : "Receitas"} por mês, nos últimos seis meses`} width={w} height={ALTURA} viewBox={`0 0 ${w} ${ALTURA}`} className="block">
        {passos.map((v) => (
          <g key={v}>
            <line x1={M.esq} x2={w - M.dir} y1={y(v)} y2={y(v)} stroke="var(--linha)" strokeWidth={1} />
            <text x={M.esq - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--suave)">
              {valorCurto(v)}
            </text>
          </g>
        ))}
        {meses.map((m, i) => {
          const centro = M.esq + faixa * i + faixa / 2;
          const ym = m.mes.slice(0, 7);
          const atual = i === ultimo;
          const topoBarra = y(m[serie]);
          const largBalao = 78;
          const xBalao = Math.min(Math.max(centro - largBalao / 2, M.esq), w - M.dir - largBalao);
          return (
            <g key={m.mes}>
              <rect x={centro - barra / 2} y={topoBarra} width={barra} height={h(m[serie])} rx={Math.min(10, barra / 2)} fill={atual ? "var(--lima)" : "var(--folha)"}>
                <title>{`${rotuloDoMes(ym)}: ${rotulo} ${brl(m[serie])}`}</title>
              </rect>
              {atual && m[serie] > 0 && (
                <g aria-hidden="true">
                  <rect x={xBalao} y={Math.max(0, topoBarra - 32)} width={largBalao} height={24} rx={8} fill="#0f1a14" />
                  <text x={xBalao + largBalao / 2} y={Math.max(0, topoBarra - 32) + 16} textAnchor="middle" fontSize={12} fontWeight={700} fill="#ffffff">
                    {brl(m[serie])}
                  </text>
                </g>
              )}
              <text x={centro} y={ALTURA - 6} textAnchor="middle" fontSize={12} fill="var(--suave)">
                {mesCurto(ym)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Tendencia({ p }: { p: Painel }) {
  const [serie, setSerie] = useState<Serie>("despesas");
  const temHistorico = p.tendencia.some((m) => m.receitas > 0 || m.despesas > 0);
  const { tendencia } = manchetes(p);

  return (
    <Capitulo
      id="tend"
      titulo="Nos últimos meses"
      icone={ChartBar}
      manchete={temHistorico ? tendencia : null}
      comoLer="Cada coluna é um mês e a coluna lima é o mês atual, com o valor no balão. Use os botões para trocar entre o que saiu e o que entrou."
    >
      {temHistorico ? (
        <>
          <div role="group" aria-label="Qual valor mostrar" className="inline-flex gap-0.5 rounded-full bg-d-trilho p-1">
            {(["despesas", "receitas"] as const).map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={serie === x}
                onClick={() => setSerie(x)}
                className={`min-h-8 rounded-full px-4 text-[0.8125rem] font-medium transition-colors ${serie === x ? "bg-superficie font-semibold text-tinta shadow-[0_1px_3px_rgba(15,26,20,0.1)]" : "text-suave hover:text-tinta"}`}
              >
                {x === "despesas" ? "Despesas" : "Receitas"}
              </button>
            ))}
          </div>
          <Colunas p={p} serie={serie} />
          <table aria-label="Receitas e despesas dos últimos seis meses" className="sr-only">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Receitas</th>
                <th>Despesas</th>
              </tr>
            </thead>
            <tbody>
              {p.tendencia.map((m) => (
                <tr key={m.mes}>
                  <td>{rotuloDoMes(m.mes.slice(0, 7))}</td>
                  <td>{brl(m.receitas)}</td>
                  <td>{brl(m.despesas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <QuadroVazio>Ainda não há meses para comparar. Com o uso, esta comparação aparece aqui.</QuadroVazio>
      )}
    </Capitulo>
  );
}
