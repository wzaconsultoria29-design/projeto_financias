"use client";

import { useState } from "react";
import { Browser, FileCsv, Sparkle, UsersThree, WhatsappLogo } from "@phosphor-icons/react";
import { agregar } from "@/lib/demo";
import { MES, MES_ANTERIOR, PERGUNTAS, responder, type Pergunta } from "@/lib/demo-dados";
import { brl } from "@/lib/format";

const PESSOAS = [
  { letra: "V", cor: "var(--nv-lima)" },
  { letra: "A", cor: "var(--nv-ciano)" },
  { letra: "J", cor: "var(--nv-rosa)" },
  { letra: "M", cor: "var(--nv-laranja)" },
];

const CSV = [
  ["data", "descrição", "categoria", "valor"],
  ["12/11", "Almoço", "Alimentação", "32,00"],
  ["12/11", "Uber", "Transporte", "18,50"],
  ["11/11", "Mercado", "Alimentação", "86,40"],
];

/** Grade de recursos. Cada cartão mostra a coisa funcionando em vez de um ícone com legenda. */
export function Recursos() {
  const [pergunta, setPergunta] = useState<Pergunta>(PERGUNTAS[0]);
  const totalMes = agregar(MES).total;
  const maior = Math.max(totalMes, MES_ANTERIOR);

  return (
    <section id="recursos" className="relative scroll-mt-20 py-24 md:py-32" aria-labelledby="titulo-recursos">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 id="titulo-recursos" data-revela className="nv-titulo max-w-[16ch] text-[clamp(2rem,4.6vw,3.75rem)]">
          Vai além de anotar gasto.
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-6">
          <article data-revela data-ui className="nv-cartao nv-foco overflow-hidden p-7 md:p-9 lg:col-span-4">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span aria-hidden className="grid size-12 place-items-center rounded-[16px] bg-[rgba(164,147,255,0.16)] text-[var(--nv-violeta)]"><Sparkle size={24} weight="fill" /></span>
                <h3 className="nv-titulo mt-5 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">Pergunte. Ele responde com os seus números.</h3>
                <p className="nv-suave mt-3 text-[16px] leading-relaxed">Só quando você pergunta. Sem conselho de investimento e sem indicar banco ou produto.</p>
                <div role="group" aria-label="Perguntas de exemplo" className="mt-6 flex flex-col items-start gap-2">
                  {PERGUNTAS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={pergunta === p}
                      onClick={() => setPergunta(p)}
                      className={`min-h-[44px] rounded-full px-4 py-2 text-left text-[15px] font-medium transition-colors ${pergunta === p ? "bg-[var(--nv-violeta)] text-[#0d0a24]" : "bg-white/[0.07] hover:bg-white/[0.12]"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="nv-conversa flex min-h-[250px] flex-col justify-end gap-2 rounded-[22px] p-4 shadow-[inset_0_0_0_1px_var(--nv-linha)]" aria-live="polite">
                <p key={`p-${pergunta}`} className="nv-balao nv-entra !text-[15px]" data-de="eu">{pergunta}</p>
                <p key={`r-${pergunta}`} className="nv-balao nv-entra !text-[15px]" data-de="bot" style={{ animationDelay: "350ms" }}>{responder(pergunta)}</p>
              </div>
            </div>
          </article>

          <article data-revela style={{ "--i": 1 } as React.CSSProperties} className="relative overflow-hidden rounded-[28px] bg-[var(--nv-lima)] p-7 text-[#04130b] md:p-9 lg:col-span-2">
            <div aria-hidden className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-[18px] bg-[#04130b] text-[var(--nv-lima)]"><WhatsappLogo size={30} weight="fill" /></span>
              <span className="text-[22px] font-semibold">+</span>
              <span className="grid size-14 place-items-center rounded-[18px] bg-[#04130b] text-[var(--nv-lima)]"><Browser size={30} weight="fill" /></span>
            </div>
            <h3 className="nv-titulo mt-6 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">Nada para instalar.</h3>
            <p className="mt-3 text-[16px] leading-relaxed text-[#04130b]/80">Você registra no WhatsApp que já tem e abre o painel no navegador, no celular ou no computador.</p>
          </article>

          <article data-revela data-ui className="nv-cartao nv-foco p-7 lg:col-span-2">
            <h3 className="nv-titulo text-[24px]">Compare com o mês passado.</h3>
            <div className="mt-6 flex flex-col gap-4">
              {[
                { rotulo: "Mês passado", valor: MES_ANTERIOR, cor: "rgba(255,255,255,0.28)" },
                { rotulo: "Este mês", valor: totalMes, cor: "var(--nv-verde)" },
              ].map((b) => (
                <div key={b.rotulo}>
                  <p className="flex justify-between gap-3 text-[14px]">
                    <span className="nv-suave">{b.rotulo}</span>
                    <span className="nv-num">{brl(b.valor)}</span>
                  </p>
                  <span className="mt-1.5 block h-3 overflow-hidden rounded-full bg-white/[0.08]">
                    <span className="nv-barra block h-full rounded-full" style={{ background: b.cor, transform: `scaleX(${b.valor / maior})` }} />
                  </span>
                </div>
              ))}
            </div>
            <p className="nv-suave mt-5 text-[15px] leading-relaxed">O painel diz quanto foi a mais ou a menos, por período e por categoria.</p>
          </article>

          <article data-revela style={{ "--i": 1 } as React.CSSProperties} className="nv-cartao nv-foco p-7 lg:col-span-2">
            <span aria-hidden className="grid size-12 place-items-center rounded-[16px] bg-[rgba(63,213,255,0.14)] text-[var(--nv-ciano)]"><UsersThree size={24} weight="fill" /></span>
            <h3 className="nv-titulo mt-5 text-[24px]">Family: até 4 pessoas.</h3>
            <div aria-hidden className="mt-5 flex">
              {PESSOAS.map((p, i) => (
                <span key={p.letra} className="-ml-2 grid size-12 place-items-center rounded-full text-[17px] font-bold text-[#04130b] shadow-[0_0_0_3px_var(--nv-sup)] first:ml-0" style={{ background: p.cor, zIndex: 4 - i }}>
                  {p.letra}
                </span>
              ))}
            </div>
            <p className="nv-suave mt-5 text-[15px] leading-relaxed">No mesmo grupo, cada pessoa com o próprio login. O convite sai de Configurações.</p>
          </article>

          <article data-revela style={{ "--i": 2 } as React.CSSProperties} data-ui className="nv-cartao nv-foco p-7 lg:col-span-2">
            <span aria-hidden className="grid size-12 place-items-center rounded-[16px] bg-[rgba(255,212,81,0.14)] text-[var(--nv-amarelo)]"><FileCsv size={24} weight="fill" /></span>
            <h3 className="nv-titulo mt-5 text-[24px]">Leve os dados em CSV.</h3>
            <table className="mt-5 w-full text-left text-[12.5px]">
              <tbody>
                {CSV.map((linha, i) => (
                  <tr key={i} className={i === 0 ? "nv-suave" : ""}>
                    {linha.map((c, j) => (
                      <td key={j} className={`py-1 pr-2 ${j === 3 ? "text-right tabular-nums" : ""}`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="nv-suave mt-4 text-[15px] leading-relaxed">Exporte os lançamentos para a sua planilha quando quiser.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
