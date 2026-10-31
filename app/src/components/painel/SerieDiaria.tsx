"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, dataCurta } from "@/lib/format";
import type { VisaoGeral } from "@/lib/api";
import { EstadoVazio } from "./EstadoVazio";

export function SerieDiaria({ serie }: { serie: VisaoGeral["serie_diaria"] }) {
  const temDados = serie.some((d) => d.despesas > 0 || d.receitas > 0);
  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="serie-titulo">
      <h2 id="serie-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Dia a dia</h2>
      {!temDados ? (
        <EstadoVazio />
      ) : (
        <>
          <div className="mt-4 h-64 w-full" role="img" aria-label="Gráfico de barras com despesas e receitas por dia">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--linha)" />
                <XAxis dataKey="data" tickFormatter={dataCurta} tick={{ fill: "var(--suave)", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis tickFormatter={(v: number) => brl(v).replace(",00", "")} tick={{ fill: "var(--suave)", fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  cursor={{ fill: "var(--folha)" }}
                  labelFormatter={(l) => dataCurta(String(l))}
                  formatter={(v, nome) => [brl(Number(v)), nome === "despesas" ? "Despesas" : "Receitas"]}
                  contentStyle={{ background: "var(--superficie)", border: "1px solid var(--linha)", borderRadius: 12, color: "var(--tinta)" }}
                />
                <Bar dataKey="despesas" fill="var(--floresta)" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                <Bar dataKey="receitas" fill="var(--suave)" fillOpacity={0.45} radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 flex gap-5 text-sm text-suave">
            <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-floresta" aria-hidden />Despesas</span>
            <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-suave/45" aria-hidden />Receitas</span>
          </p>
        </>
      )}
    </section>
  );
}
