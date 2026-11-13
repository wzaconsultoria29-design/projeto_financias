"use client";

import { useRef, useState } from "react";
import { Check, PaperPlaneRight } from "@phosphor-icons/react";
import { interpretar, type Gasto } from "@/lib/demo";
import { MES, MES_ANTERIOR, PERGUNTAS, responder } from "@/lib/demo-dados";
import { brl } from "@/lib/format";
import { Celular } from "./Celular";
import { Balao, CabecalhoConversa, Digitando, type Mensagem } from "./ConversaPartes";
import { Objeto3d } from "./Objeto3d";
import { PainelFragmento } from "./PainelFragmento";

const EXEMPLOS = ["gastei 32 no almoço", "uber 18,50", "mercado 120"];
const MAXIMO_ITENS = 30;


/** Cartão de lançamento que flutua ao lado dos celulares: mostra o que o assistente fez com a mensagem. */
function ChipLancamento({ titulo, detalhe, valor, className = "", atraso = 0 }: { titulo: string; detalhe: string; valor: string; className?: string; atraso?: number }) {
  return (
    <div aria-hidden className={`chip-entra absolute z-30 hidden lg:block ${className}`} style={{ animationDelay: `${1400 + atraso}ms` }}>
      <div className="flutua flex items-center gap-4 rounded-2xl bg-white px-4 py-2.5 shadow-[0_18px_40px_-18px_rgba(2,20,14,0.7)]" style={{ animationDelay: `${atraso}ms` }}>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold text-[#10201a]">{titulo}</span>
          <span className="text-[13px] text-[#4a5c54]">{detalhe}</span>
        </span>
        <span className="text-[16px] font-semibold tabular-nums text-[#10201a]">{valor}</span>
      </div>
    </div>
  );
}

const lancamento = (descricao: string) => MES.find((i) => i.descricao === descricao);

/** Três celulares: o painel, a conversa (interativa) e a análise do assistente. Escrever na conversa muda o painel. */
export function HeroCelulares() {
  const [itens, setItens] = useState<Gasto[]>(MES);
  const [texto, setTexto] = useState("");
  const [conversa, setConversa] = useState<Mensagem[]>([
    { de: "voce", texto: "farmácia 87" },
    { de: "bot", texto: "Anotado: R$ 87,00, Farmácia, Saúde." },
    { de: "voce", texto: "gastei 142 no restaurante" },
    { de: "bot", texto: "Anotado: R$ 142,00, Restaurante, Alimentação." },
  ]);
  const campo = useRef<HTMLInputElement>(null);

  function enviar(entrada: string) {
    const frase = entrada.trim();
    if (!frase) return;
    const gasto = interpretar(frase);
    const resposta: Mensagem = gasto
      ? { de: "bot", texto: `Anotado: ${brl(gasto.valor)}, ${gasto.descricao}, ${gasto.categoria}.` }
      : { de: "bot", texto: "Não achei o valor. Tente assim: gastei 32 no almoço." };
    if (gasto) setItens((atual) => [gasto, ...atual].slice(0, MAXIMO_ITENS));
    setConversa((atual) => [...atual, { de: "voce" as const, texto: frase.slice(0, 80) }, resposta].slice(-5));
    setTexto("");
    campo.current?.focus();
  }

  return (
    <div className="relative mx-auto mt-14 max-w-6xl px-4 md:mt-16">
      <Objeto3d nome="moeda" className="absolute -left-2 top-10 z-30 hidden size-40 md:block lg:left-6 lg:size-52" />
      <Objeto3d nome="folha" lento atraso={1.2} className="absolute -right-2 top-4 z-30 hidden size-40 md:block lg:right-6 lg:size-56" />
      <Objeto3d nome="recibo" atraso={0.6} className="absolute bottom-24 right-[14%] z-30 hidden size-28 lg:block" />

      <p
        aria-live="polite"
        className="arrive absolute -top-9 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-4 py-1.5 text-[15px] text-white ring-1 ring-white/25 md:flex"
      >
        <span key={itens.length} className="pulso font-semibold tabular-nums">{itens.length}</span>{" "}
        lançamentos organizados
      </p>
      {lancamento("Uber") && (
        <ChipLancamento className="left-[2%] top-[46%]" titulo="Uber" detalhe="Transporte" valor={`-${brl(lancamento("Uber")!.valor)}`} />
      )}
      {lancamento("Netflix") && (
        <ChipLancamento className="right-[3%] top-[56%]" atraso={600} titulo="Netflix" detalhe="Assinaturas" valor={`-${brl(lancamento("Netflix")!.valor)}`} />
      )}
      <div aria-hidden className="chip-entra absolute right-[20%] top-[8%] z-30 hidden items-center gap-2 rounded-full bg-[var(--lima)] px-3.5 py-1.5 text-[14px] font-semibold text-[var(--noite)] lg:flex" style={{ animationDelay: "2000ms" }}>
        <Check size={16} weight="bold" aria-hidden />
        Categorizado sozinho
      </div>

      <div className="relative flex items-end justify-center">
        <div className="relative z-0 -mr-14 hidden translate-y-24 -rotate-[7deg] md:block">
          <Celular className="scale-[0.94]">
            <PainelFragmento titulo="Este mês" itens={itens} anterior={MES_ANTERIOR} anteriorRotulo="mês passado" comparar recentes={2} maxCategorias={4} className="!h-full !rounded-none !p-4 !pt-12" />
          </Celular>
        </div>

        <div className="relative z-20">
          <Celular>
            <div className="flex h-full flex-col bg-papel">
              <CabecalhoConversa sub="assistente financeiro" />
              <ol className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-3 py-3" aria-live="polite" aria-label="Mensagens">
                {conversa.map((m, i) => (
                  <Balao key={`${i}-${m.texto}`} m={m} />
                ))}
              </ol>
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {EXEMPLOS.map((e) => (
                  <button key={e} type="button" onClick={() => enviar(e)} className="ctl rounded-full bg-folha px-3 py-1.5 text-[13px] font-medium text-tinta hover:bg-superficie">
                    {e}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2 border-t border-linha bg-superficie p-3"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  enviar(texto);
                }}
              >
                <label htmlFor="demo-gasto" className="sr-only">
                  Escreva um gasto
                </label>
                <input
                  ref={campo}
                  id="demo-gasto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  maxLength={80}
                  placeholder="Escreva um gasto"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-full bg-papel px-4 py-2.5 text-[16px] text-tinta placeholder:text-suave"
                />
                <button type="submit" aria-label="Enviar" className="ctl grid size-11 shrink-0 place-items-center rounded-full bg-[var(--botao)] text-[var(--botao-fg)]">
                  <PaperPlaneRight size={20} weight="fill" aria-hidden />
                </button>
              </form>
            </div>
          </Celular>
        </div>

        <div className="relative z-0 -ml-14 hidden translate-y-24 rotate-[7deg] md:block">
          <Celular className="scale-[0.94]">
            <div className="flex h-full flex-col bg-papel">
              <CabecalhoConversa sub="analisando seus gastos" />
              <ol className="flex flex-1 flex-col justify-end gap-2 px-3 py-3" aria-label="Exemplo de análise">
                <Balao m={{ de: "voce", texto: PERGUNTAS[0] }} />
                <Balao m={{ de: "bot", texto: responder(PERGUNTAS[0]) }} />
                <Digitando />
              </ol>
            </div>
          </Celular>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[320px] md:hidden">
        <PainelFragmento titulo="Este mês" itens={itens} anterior={MES_ANTERIOR} anteriorRotulo="mês passado" comparar recentes={2} maxCategorias={4} className="shadow-[0_30px_60px_-30px_rgba(2,20,14,0.6)]" />
      </div>
    </div>
  );
}
