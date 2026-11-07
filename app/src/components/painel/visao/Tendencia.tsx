"use client";

import type { Painel } from "@/lib/api";
import { brl } from "@/lib/format";
import { eixo, valorCurto } from "@/lib/painel";
import { mesCurto, rotuloDoMes } from "@/lib/periodo";
import { QuadroVazio } from "./ParaOndeFoi";
import { useLargura } from "./useLargura";

const ALTURA = 200;
const M = { esq: 46, dir: 8, topo: 12, base: 26 };

function Colunas({ p }: { p: Painel }) {
  const [ref, w] = useLargura();
  const meses = p.tendencia;
  const { topo, passos } = eixo(Math.max(1, ...meses.flatMap((m) => [m.receitas, m.despesas])));
  const area = w - M.esq - M.dir;
  const faixa = area / Math.max(1, meses.length);
  const barra = Math.max(8, Math.min(26, faixa / 3));
  const y = (v: number) => M.topo + (1 - v / topo) * (ALTURA - M.topo - M.base);
  const h = (v: number) => Math.max(v > 0 ? 2 : 0, y(0) - y(v));

  return (
    <div ref={ref} className="dado mt-4">
      <svg role="img" aria-label="Receitas e despesas por mês, nos últimos seis meses" width={w} height={ALTURA} viewBox={`0 0 ${w} ${ALTURA}`} className="block">
        {passos.map((v) => (
          <g key={v}>
            <line x1={M.esq} x2={w - M.dir} y1={y(v)} y2={y(v)} stroke="var(--linha)" strokeWidth={v === 0 ? 1.5 : 1} />
            <text x={M.esq - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--suave)">
              {valorCurto(v)}
            </text>
          </g>
        ))}
        {meses.map((m, i) => {
          const centro = M.esq + faixa * i + faixa / 2;
          const ym = m.mes.slice(0, 7);
          return (
            <g key={m.mes}>
              <rect x={centro - barra - 1} y={y(m.receitas)} width={barra} height={h(m.receitas)} rx={3} fill="var(--floresta)">
                <title>{`${rotuloDoMes(ym)}: receitas ${brl(m.receitas)}`}</title>
              </rect>
              <rect x={centro + 1} y={y(m.despesas)} width={barra} height={h(m.despesas)} rx={3} fill="var(--d-laranja)">
                <title>{`${rotuloDoMes(ym)}: despesas ${brl(m.despesas)}`}</title>
              </rect>
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
  const temHistorico = p.tendencia.some((m) => m.receitas > 0 || m.despesas > 0);

  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-tend">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <h2 id="t-tend" className="font-display text-lg font-semibold text-tinta">
          Últimos seis meses
        </h2>
        {temHistorico && (
          <ul className="flex items-center gap-4 text-xs text-suave">
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-floresta" aria-hidden="true" />
              Receitas
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-d-laranja" aria-hidden="true" />
              Despesas
            </li>
          </ul>
        )}
      </div>

      {temHistorico ? (
        <>
          <Colunas p={p} />
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
        <div className="mt-4">
          <QuadroVazio>Ainda não há meses para comparar. Com o uso, esta comparação aparece aqui.</QuadroVazio>
        </div>
      )}
    </section>
  );
}
