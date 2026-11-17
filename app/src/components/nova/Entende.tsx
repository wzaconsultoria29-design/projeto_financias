"use client";

import { useState } from "react";
import { Camera, ChatText, CheckCircle, Microphone } from "@phosphor-icons/react";
import { brl } from "@/lib/format";
import { corDe, ONDA } from "./dados";

const MODOS = [
  {
    id: "texto",
    nome: "Texto",
    Icone: ChatText,
    resumo: "Escreva do seu jeito, sem formulário e sem comando para decorar.",
    campos: { valor: 32, descricao: "Almoço", categoria: "Alimentação" },
  },
  {
    id: "audio",
    nome: "Áudio",
    Icone: Microphone,
    resumo: "Fale com a mão ocupada. Ele transcreve, entende e anota.",
    campos: { valor: 18.5, descricao: "Uber", categoria: "Transporte" },
  },
  {
    id: "foto",
    nome: "Foto",
    Icone: Camera,
    resumo: "Fotografe o cupom. Ele lê o total e o nome do lugar.",
    campos: { valor: 86.4, descricao: "Mercado", categoria: "Alimentação" },
  },
] as const;

const DURACAO = "6.5s";

function Entrada({ modo }: { modo: (typeof MODOS)[number]["id"] }) {
  if (modo === "texto") {
    return (
      <p className="nv-entra max-w-[280px] rounded-[18px] rounded-tr-[5px] bg-[#005c4b] px-4 py-3 text-[19px] leading-snug text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]">
        gastei{" "}
        <mark className="rounded-md bg-[var(--nv-lima)] px-1.5 py-0.5 font-semibold text-[#04130b]">32</mark> no{" "}
        <mark className="rounded-md bg-[var(--nv-laranja)] px-1.5 py-0.5 font-semibold text-[#04130b]">almoço</mark>
      </p>
    );
  }
  if (modo === "audio") {
    return (
      <div className="nv-entra w-full max-w-[300px]">
        <div className="nv-onda flex h-20 items-center justify-center gap-[4px] rounded-[18px] bg-[#005c4b] px-4" role="img" aria-label="Áudio de 4 segundos">
          {ONDA.map((h, i) => (
            <span key={i} className="block w-[4px] rounded-full bg-white/85" style={{ height: h * 2.2, "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <p className="nv-suave mt-3 text-[15px] leading-snug">
          Transcrição: paguei{" "}
          <mark className="rounded-md bg-[var(--nv-lima)] px-1.5 py-0.5 font-semibold text-[#04130b]">dezoito e cinquenta</mark> de{" "}
          <mark className="rounded-md bg-[var(--nv-ciano)] px-1.5 py-0.5 font-semibold text-[#04130b]">uber</mark>
        </p>
      </div>
    );
  }
  return (
    <div className="nv-entra relative w-[190px] overflow-hidden rounded-[10px] bg-[#f4f1e8] px-4 py-4 text-[11px] leading-[1.6] text-[#2b2b2b] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]" role="img" aria-label="Cupom do mercado com total de R$ 86,40">
      <p className="text-center text-[12px] font-bold">
        <mark className="rounded bg-[var(--nv-laranja)] px-1 text-[#04130b]">MERCADO</mark> BOM PREÇO
      </p>
      <p className="text-center">CUPOM FISCAL</p>
      <div className="my-2 h-px bg-[#2b2b2b]/30" />
      <p className="flex justify-between"><span>Arroz 5kg</span><span>27,90</span></p>
      <p className="flex justify-between"><span>Feijão 1kg</span><span>8,50</span></p>
      <p className="flex justify-between"><span>Frango 2kg</span><span>31,80</span></p>
      <p className="flex justify-between"><span>Café 500g</span><span>18,20</span></p>
      <div className="my-2 h-px bg-[#2b2b2b]/30" />
      <p className="flex justify-between text-[13px] font-bold">
        <span>TOTAL</span>
        <mark className="rounded bg-[var(--nv-lima)] px-1 text-[#04130b]">86,40</mark>
      </p>
      <span aria-hidden className="nv-varre absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(39,224,139,0.55))] shadow-[0_2px_0_0_var(--nv-verde)]" style={{ "--curso": "150px" } as React.CSSProperties} />
    </div>
  );
}

/** Três jeitos de mandar e o mesmo lançamento no fim. As abas avançam sozinhas até a pessoa escolher uma. */
export function Entende() {
  const [aba, setAba] = useState(0);
  const [sozinho, setSozinho] = useState(true);
  const modo = MODOS[aba];
  const cor = corDe(modo.campos.categoria);

  return (
    <section id="como-funciona" className="relative scroll-mt-20 py-24 md:py-32" aria-labelledby="titulo-entende">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 id="titulo-entende" data-revela className="nv-titulo max-w-[18ch] text-[clamp(2rem,4.6vw,3.75rem)]">
          Texto, áudio ou foto. Ele entende.
        </h2>
        <p data-revela style={{ "--i": 1 } as React.CSSProperties} className="nv-suave mt-5 max-w-[56ch] text-[18px] leading-relaxed">
          A inteligência artificial só interpreta a mensagem. A soma é feita no banco de dados, nunca pela IA.
        </p>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <div role="tablist" aria-label="Jeitos de registrar" data-revela className="flex flex-col gap-3 lg:col-span-4">
            {MODOS.map((m, i) => {
              const ativo = i === aba;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  id={`aba-${m.id}`}
                  aria-selected={ativo}
                  aria-controls="painel-entende"
                  onClick={() => {
                    setAba(i);
                    setSozinho(false);
                  }}
                  className={`nv-cartao nv-foco relative overflow-hidden p-5 text-left transition-colors ${ativo ? "!bg-[var(--nv-sup2)]" : "opacity-70 hover:opacity-100"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`grid size-11 flex-none place-items-center rounded-[14px] ${ativo ? "bg-[var(--nv-lima)] text-[#04130b]" : "bg-white/[0.07] text-[var(--nv-texto)]"}`}>
                      <m.Icone size={22} weight={ativo ? "fill" : "regular"} aria-hidden />
                    </span>
                    <span className="nv-titulo text-[22px]">{m.nome}</span>
                  </span>
                  <span className="nv-suave mt-3 block text-[16px] leading-relaxed">{m.resumo}</span>
                  {ativo && (
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
                      <span
                        key={`${aba}-${sozinho}`}
                        className={`block h-full origin-left bg-[var(--nv-lima)] ${sozinho ? "nv-tempo" : ""}`}
                        style={{ "--dur": DURACAO } as React.CSSProperties}
                        onAnimationEnd={() => sozinho && setAba((a) => (a + 1) % MODOS.length)}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            id="painel-entende"
            role="tabpanel"
            aria-labelledby={`aba-${modo.id}`}
            data-revela="escala"
            data-ui
            className="nv-cartao nv-grao relative flex items-center overflow-hidden p-6 md:p-10 lg:col-span-8"
          >
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[380px] rounded-full opacity-25 blur-[90px] transition-colors duration-700" style={{ background: cor }} />
            <div className="relative grid w-full items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-6">
              <div className="flex min-h-[230px] flex-col items-center justify-center md:items-end" key={modo.id}>
                <Entrada modo={modo.id} />
              </div>

              <svg aria-hidden viewBox="0 0 120 24" className="mx-auto h-6 w-[120px] rotate-90 md:rotate-0">
                <path d="M2 12 H104" stroke="var(--nv-linha-forte)" strokeWidth="2" strokeLinecap="round" />
                <path className="nv-corre" d="M2 12 H104" stroke="var(--nv-lima)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 18" />
                <path d="M100 5 L112 12 L100 19" fill="none" stroke="var(--nv-lima)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div key={`saida-${modo.id}`} className="rounded-[22px] bg-[var(--nv-fundo)] p-5 shadow-[inset_0_0_0_1px_var(--nv-linha-forte)]">
                <p className="nv-suave text-[14px]">Lançamento criado</p>
                <dl className="mt-3 flex flex-col gap-3 text-[16px]">
                  <div className="nv-entra flex items-baseline justify-between gap-4" style={{ animationDelay: "250ms" }}>
                    <dt className="nv-suave">Valor</dt>
                    <dd data-campo="valor" className="nv-num text-[26px] font-semibold text-[var(--nv-lima)]">{brl(modo.campos.valor)}</dd>
                  </div>
                  <div className="nv-entra flex items-baseline justify-between gap-4" style={{ animationDelay: "450ms" }}>
                    <dt className="nv-suave">Descrição</dt>
                    <dd data-campo="descricao" className="font-semibold">{modo.campos.descricao}</dd>
                  </div>
                  <div className="nv-entra flex items-center justify-between gap-4" style={{ animationDelay: "650ms" }}>
                    <dt className="nv-suave">Categoria</dt>
                    <dd className="flex items-center gap-2 rounded-full px-3 py-1 font-semibold" style={{ color: cor, background: `color-mix(in srgb, ${cor} 14%, transparent)` }}>
                      <span aria-hidden className="size-2 rounded-full" style={{ background: cor }} />
                      <span data-campo="categoria">{modo.campos.categoria}</span>
                    </dd>
                  </div>
                  <div className="nv-entra flex items-baseline justify-between gap-4" style={{ animationDelay: "850ms" }}>
                    <dt className="nv-suave">Data</dt>
                    <dd className="font-semibold">Hoje</dd>
                  </div>
                </dl>
                <p className="nv-entra mt-5 flex items-center gap-2 rounded-[14px] bg-[rgba(39,224,139,0.12)] px-3 py-2.5 text-[15px] font-medium text-[var(--nv-verde)]" style={{ animationDelay: "1100ms" }}>
                  <CheckCircle size={20} weight="fill" aria-hidden />
                  Salvo no painel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
