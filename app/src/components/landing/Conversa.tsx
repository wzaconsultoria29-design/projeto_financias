"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Microphone, Play, Question, TextT, type Icon } from "@phosphor-icons/react";
import { CENARIOS, type Cenario, type MensagemDemo, type TipoMensagem } from "@/lib/demo-conversa";
import { Celular } from "./Celular";
import { Balao, BALAO_VOCE, CabecalhoConversa, Digitando } from "./ConversaPartes";

const ICONES: Record<TipoMensagem, Icon> = { texto: TextT, audio: Microphone, foto: Camera, pergunta: Question };
const MAXIMO = 8;
const ONDA = [6, 12, 8, 16, 10, 20, 14, 8, 18, 12, 6, 14, 9, 5];

const SAUDACAO: MensagemDemo = { de: "bot", texto: "Oi! Escolha uma mensagem aí embaixo e veja como eu anoto." };

function Mensagem({ m }: { m: MensagemDemo }) {
  if (m.de === "bot") return <Balao m={{ de: "bot", texto: m.texto }} />;
  if (m.tipo === "audio") {
    return (
      <li className={`entra-msg flex max-w-[88%] items-center gap-2.5 rounded-2xl px-3 py-2.5 ${BALAO_VOCE}`}>
        <Play size={18} weight="fill" aria-hidden />
        <span aria-hidden className="flex h-6 items-center gap-[3px]">
          {ONDA.map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-current opacity-80" style={{ height: h }} />
          ))}
        </span>
        <span className="text-[13px] tabular-nums">{m.duracao}</span>
        <span className="sr-only">Mensagem de voz</span>
      </li>
    );
  }
  if (m.tipo === "foto") {
    return (
      <li className={`entra-msg flex max-w-[88%] items-center gap-3 rounded-2xl px-2.5 py-2.5 ${BALAO_VOCE}`}>
        <span aria-hidden className="flex h-14 w-11 flex-none flex-col gap-1 rounded-md bg-white/90 p-1.5">
          <span className="h-[3px] w-full rounded bg-[#10201a]/60" />
          <span className="h-[3px] w-3/4 rounded bg-[#10201a]/40" />
          <span className="h-[3px] w-full rounded bg-[#10201a]/40" />
          <span className="mt-auto h-[3px] w-1/2 self-end rounded bg-[#10201a]/70" />
        </span>
        <span className="flex items-center gap-1.5 text-[15px]">
          <Camera size={16} aria-hidden />
          {m.legenda}
        </span>
      </li>
    );
  }
  return <Balao m={{ de: "voce", texto: m.texto }} />;
}

/** Conversa de demonstração: a pessoa escolhe um jeito de mandar e vê o assistente responder. */
export function Conversa() {
  const [mensagens, setMensagens] = useState<MensagemDemo[]>([SAUDACAO]);
  const [digitando, setDigitando] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const ativos = timers.current;
    return () => ativos.forEach((t) => window.clearTimeout(t));
  }, []);

  function enviar(c: Cenario) {
    if (digitando) return;
    setDigitando(true);
    setMensagens((a) => [...a, c.voce].slice(-MAXIMO));
    c.bot.forEach((texto, i) => {
      timers.current.push(window.setTimeout(() => setMensagens((a) => [...a, { de: "bot" as const, texto }].slice(-MAXIMO)), 900 + i * 1100));
    });
    timers.current.push(window.setTimeout(() => setDigitando(false), 900 + (c.bot.length - 1) * 1100 + 60));
  }

  return (
    <section id="conversa" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-24 md:px-8 md:py-32" aria-labelledby="titulo-conversa">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="rise">
          <h2 id="titulo-conversa" className="lp-display text-[clamp(2rem,4.4vw,3.75rem)] text-tinta">Fale com o seu dinheiro</h2>
          <p className="mt-4 max-w-[44ch] text-[18px] leading-relaxed text-suave">
            Escolha uma mensagem e veja o que o assistente responde. Texto, áudio, foto ou uma pergunta: do jeito que você falaria com uma pessoa.
          </p>
          <p className="mt-6 text-[15px] text-suave">Exemplo com dados de demonstração.</p>
        </div>

        <div className="rise mx-auto lg:justify-self-center">
          <Celular>
            <div className="flex h-full flex-col bg-papel">
              <CabecalhoConversa sub="assistente financeiro" />
              <ol className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-3 py-3" aria-live="polite" aria-label="Mensagens da conversa de exemplo">
                {mensagens.map((m, i) => (
                  <Mensagem key={`${i}-${m.de}`} m={m} />
                ))}
                {digitando && <Digitando />}
              </ol>
              <div className="flex flex-wrap gap-1.5 border-t border-linha bg-superficie p-3">
                {CENARIOS.map((c) => {
                  const Icone = ICONES[c.tipo];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={digitando}
                      onClick={() => enviar(c)}
                      className="ctl flex items-center gap-1.5 rounded-full bg-folha px-3 py-2 text-[13px] font-medium text-tinta enabled:hover:bg-papel disabled:opacity-50"
                    >
                      <Icone size={15} aria-hidden />
                      {c.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>
          </Celular>
        </div>
      </div>
    </section>
  );
}
