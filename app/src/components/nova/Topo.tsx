"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BatteryFull, Check, Checks, Gauge, PaperPlaneRight, Phone, Play, VideoCamera, WifiHigh } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { agregar, interpretar, type Gasto } from "@/lib/demo";
import { MES, MES_ANTERIOR } from "@/lib/demo-dados";
import { brl } from "@/lib/format";
import { corDe, ONDA } from "./dados";
import { Numero } from "./Numero";

type Tipo = "texto" | "audio" | "foto";
type Msg = { id: number; de: "eu" | "bot"; tipo: Tipo; texto?: string };
type Estado = { msgs: Msg[]; extras: Gasto[]; digitando: boolean };
type Acao =
  | { t: "eu"; tipo: Tipo; texto?: string }
  | { t: "digitando" }
  | { t: "bot"; texto: string; gasto?: Gasto }
  | { t: "roteiro-inteiro" };

const ROTEIRO: { tipo: Tipo; texto?: string; gasto: Gasto }[] = [
  { tipo: "texto", texto: "gastei 32 no almoço", gasto: { descricao: "Almoço", valor: 32, categoria: "Alimentação" } },
  { tipo: "audio", gasto: { descricao: "Uber", valor: 18.5, categoria: "Transporte" } },
  { tipo: "foto", gasto: { descricao: "Mercado", valor: 86.4, categoria: "Alimentação" } },
];

const anotado = (g: Gasto) => `Anotado: ${brl(g.valor)}, ${g.descricao}, ${g.categoria}.`;
const SAUDACAO: Msg = { id: 0, de: "bot", tipo: "texto", texto: "Oi! Me conte um gasto por texto, áudio ou foto." };
const INICIAL: Estado = { msgs: [SAUDACAO], extras: [], digitando: false };

function reduzir(e: Estado, a: Acao): Estado {
  const id = e.msgs.length;
  switch (a.t) {
    case "eu":
      return { ...e, msgs: [...e.msgs, { id, de: "eu", tipo: a.tipo, texto: a.texto }] };
    case "digitando":
      return { ...e, digitando: true };
    case "bot":
      return { msgs: [...e.msgs, { id, de: "bot", tipo: "texto", texto: a.texto }], extras: a.gasto ? [...e.extras, a.gasto] : e.extras, digitando: false };
    case "roteiro-inteiro": {
      const msgs: Msg[] = [SAUDACAO];
      for (const r of ROTEIRO) {
        msgs.push({ id: msgs.length, de: "eu", tipo: r.tipo, texto: r.texto });
        msgs.push({ id: msgs.length, de: "bot", tipo: "texto", texto: anotado(r.gasto) });
      }
      return { msgs, extras: ROTEIRO.map((r) => r.gasto), digitando: false };
    }
  }
}

const reduzMovimento = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Cupom() {
  return (
    <div role="img" aria-label="Foto do cupom do mercado, total de R$ 86,40" className="relative w-[150px] overflow-hidden rounded-[8px] bg-[#f4f1e8] px-3 py-3 text-[9px] leading-[1.5] text-[#2b2b2b]">
      <p className="text-center text-[10px] font-bold">MERCADO BOM PREÇO</p>
      <p className="text-center">CUPOM FISCAL</p>
      <div className="my-1.5 h-px bg-[#2b2b2b]/30" />
      <p className="flex justify-between"><span>Arroz 5kg</span><span>27,90</span></p>
      <p className="flex justify-between"><span>Feijão 1kg</span><span>8,50</span></p>
      <p className="flex justify-between"><span>Frango 2kg</span><span>31,80</span></p>
      <p className="flex justify-between"><span>Café 500g</span><span>18,20</span></p>
      <div className="my-1.5 h-px bg-[#2b2b2b]/30" />
      <p className="flex justify-between text-[10px] font-bold"><span>TOTAL</span><span>86,40</span></p>
    </div>
  );
}

function Balao({ m }: { m: Msg }) {
  const hora = (
    <span className="ml-2 inline-flex translate-y-[3px] items-center gap-0.5 text-[10px] text-white/55">
      09:41
      {m.de === "eu" && <Checks size={14} weight="bold" className="text-[#53bdeb]" aria-hidden />}
    </span>
  );
  if (m.tipo === "audio") {
    return (
      <div className="nv-balao nv-entra flex items-center gap-2" data-de={m.de} role="img" aria-label="Áudio de 4 segundos: paguei dezoito e cinquenta de uber">
        <span className="grid size-8 flex-none place-items-center rounded-full bg-white/15"><Play size={14} weight="fill" /></span>
        <span className="nv-onda flex h-7 items-center gap-[2px]">
          {ONDA.map((h, i) => (
            <span key={i} className="block w-[2.5px] rounded-full bg-white/70" style={{ height: h, "--i": i } as React.CSSProperties} />
          ))}
        </span>
        <span className="text-[10px] text-white/55">0:04</span>
      </div>
    );
  }
  if (m.tipo === "foto") {
    return (
      <div className="nv-balao nv-entra !p-1.5" data-de={m.de}>
        <Cupom />
      </div>
    );
  }
  return (
    <p className="nv-balao nv-entra" data-de={m.de}>
      {m.texto}
      {hora}
    </p>
  );
}

export function Topo() {
  const [estado, despachar] = useReducer(reduzir, INICIAL);
  const [rascunho, setRascunho] = useState("");
  const fone = useRef<HTMLDivElement>(null);
  const conversa = useRef<HTMLDivElement>(null);
  const esperas = useRef<number[]>([]);
  const roteiroAtivo = useRef(true);

  // A conversa de exemplo se escreve sozinha; com "reduzir movimento" ela já aparece inteira.
  useEffect(() => {
    const fila: number[] = [];
    const em = (ms: number, f: () => void) => fila.push(window.setTimeout(f, ms));
    roteiroAtivo.current = true;
    if (reduzMovimento()) {
      em(0, () => {
        roteiroAtivo.current = false;
        despachar({ t: "roteiro-inteiro" });
      });
    } else {
      let t = 1600;
      ROTEIRO.forEach((r, i) => {
        em(t, () => despachar({ t: "eu", tipo: r.tipo, texto: r.texto }));
        em(t + 800, () => despachar({ t: "digitando" }));
        em(t + 2100, () => {
          despachar({ t: "bot", texto: anotado(r.gasto), gasto: r.gasto });
          if (i === ROTEIRO.length - 1) roteiroAtivo.current = false;
        });
        t += 3900;
      });
    }
    esperas.current = fila;
    return () => fila.forEach((n) => window.clearTimeout(n));
  }, []);

  // Rola a conversa até a última mensagem.
  useEffect(() => {
    const el = conversa.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduzMovimento() ? "auto" : "smooth" });
  }, [estado.msgs.length, estado.digitando]);

  // O celular inclina de leve na direção do ponteiro.
  useEffect(() => {
    const el = fone.current;
    if (!el || reduzMovimento() || !window.matchMedia("(pointer: fine)").matches) return;
    let alvoX = 0;
    let alvoY = 0;
    let x = 0;
    let y = 0;
    let quadro = 0;
    const passo = () => {
      x += (alvoX - x) * 0.08;
      y += (alvoY - y) * 0.08;
      el.style.setProperty("--ry", `${x.toFixed(2)}deg`);
      el.style.setProperty("--rx", `${y.toFixed(2)}deg`);
      quadro = Math.abs(alvoX - x) + Math.abs(alvoY - y) > 0.02 ? requestAnimationFrame(passo) : 0;
    };
    const aoMover = (ev: PointerEvent) => {
      alvoX = (ev.clientX / window.innerWidth - 0.5) * 16;
      alvoY = -(ev.clientY / window.innerHeight - 0.5) * 12;
      if (!quadro) quadro = requestAnimationFrame(passo);
    };
    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", aoMover);
      cancelAnimationFrame(quadro);
    };
  }, []);

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const texto = rascunho.trim();
    if (!texto) return;
    if (roteiroAtivo.current) {
      esperas.current.forEach((n) => window.clearTimeout(n));
      roteiroAtivo.current = false;
      despachar({ t: "roteiro-inteiro" });
    }
    setRascunho("");
    despachar({ t: "eu", tipo: "texto", texto });
    despachar({ t: "digitando" });
    const gasto = interpretar(texto);
    window.setTimeout(
      () => despachar(gasto ? { t: "bot", texto: anotado(gasto), gasto } : { t: "bot", texto: "Não achei o valor. Tente assim: gastei 32 no almoço." }),
      reduzMovimento() ? 0 : 900,
    );
  }

  const { total, categorias } = agregar([...MES, ...estado.extras]);
  const ultimo = estado.extras.at(-1) ?? null;
  const maiorBarra = categorias[0]?.total ?? 1;

  return (
    <section data-barra-oculta="topo" className="nv-grao relative overflow-hidden pb-16 pt-24 md:pb-24 md:pt-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="nv-aurora left-[-10%] top-[-20%] h-[620px] w-[620px] bg-[rgba(39,224,139,0.22)]" />
        <div className="nv-aurora right-[-12%] top-[10%] h-[520px] w-[520px] bg-[rgba(200,246,93,0.14)]" />
        <div className="nv-aurora bottom-[-30%] left-[30%] h-[480px] w-[480px] bg-[rgba(63,213,255,0.10)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-start gap-14 px-4 md:px-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7 lg:pt-[clamp(1rem,6vh,5rem)]">
          <p className="nv-sobe inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] py-2 pl-3 pr-4 text-[15px] font-medium shadow-[inset_0_0_0_1px_var(--nv-linha-forte)]" style={{ "--i": 0 } as React.CSSProperties}>
            <span aria-hidden className="nv-vivo size-2.5 rounded-full bg-[var(--nv-verde)]" />
            7 dias grátis, sem cartão
          </p>

          <h1 className="nv-titulo mt-6 text-[min(7.8vw,4.5rem)] lg:text-[min(3.7vw,3.5rem)]">
            <span className="nv-palavra" style={{ "--i": 1 } as React.CSSProperties}>Controle</span>{" "}
            <span className="nv-palavra" style={{ "--i": 2 } as React.CSSProperties}>financeiro</span>
            <br />
            <span className="nv-palavra nv-degrade-texto pb-[0.12em]" style={{ "--i": 3 } as React.CSSProperties}>em uma mensagem.</span>
          </h1>

          <p className="nv-sobe nv-suave mt-6 max-w-[50ch] text-[clamp(1.0625rem,0.95rem+0.5vw,1.3125rem)] leading-relaxed" style={{ "--i": 5 } as React.CSSProperties}>
            Mande o gasto por texto, áudio ou foto no WhatsApp. O {brand.name} anota, categoriza e mostra no painel para onde o seu dinheiro foi.
          </p>

          <div className="nv-sobe mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ "--i": 6 } as React.CSSProperties}>
            <Link href="/cadastro" className="nv-botao !px-8 !py-4 !text-[18px]">
              Começar grátis
              <ArrowRight size={20} weight="bold" aria-hidden />
            </Link>
            <a href="#como-funciona" className="nv-botao-2 !px-7 !py-4">Ver como funciona</a>
          </div>

          <ul className="nv-sobe mt-9 flex flex-col gap-x-7 gap-y-2.5 text-[15px] sm:flex-row sm:flex-wrap" style={{ "--i": 7 } as React.CSSProperties}>
            {["Sem instalar aplicativo", "Sem conectar a conta do banco", "Sem renovação automática"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check size={17} weight="bold" aria-hidden className="text-[var(--nv-lima)]" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-col items-center lg:col-span-5">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[326px] -z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            <div className="nv-anel size-[560px] rounded-full border border-dashed border-[var(--nv-linha-forte)]">
              <span className="absolute -top-1.5 left-1/2 size-3 rounded-full bg-[var(--nv-lima)] shadow-[0_0_18px_var(--nv-lima)]" />
              <span className="absolute -bottom-1.5 left-[30%] size-3 rounded-full bg-[var(--nv-ciano)] shadow-[0_0_18px_var(--nv-ciano)]" />
            </div>
            <div data-inverso className="nv-anel absolute inset-[70px] rounded-full border border-[var(--nv-linha)]">
              <span className="absolute -left-1.5 top-1/2 size-3 rounded-full bg-[var(--nv-rosa)] shadow-[0_0_18px_var(--nv-rosa)]" />
              <span className="absolute -right-1.5 top-[30%] size-3 rounded-full bg-[var(--nv-laranja)] shadow-[0_0_18px_var(--nv-laranja)]" />
            </div>
          </div>

          <div className="nv-palco nv-fone-flutua">
            <div ref={fone} className="nv-fone">
              <span aria-hidden className="nv-fone-ilha" />
              <span aria-hidden className="nv-fone-reflexo" />
              <div data-ui className="nv-fone-tela">
                <div aria-hidden className="flex h-10 flex-none items-end justify-between bg-[#1f2c34] px-6 pb-1 text-[12px] font-semibold text-white">
                  <span>9:41</span>
                  <span className="flex items-center gap-1"><WifiHigh size={14} weight="bold" /><BatteryFull size={18} weight="fill" /></span>
                </div>
                <div className="flex flex-none items-center gap-2 bg-[#1f2c34] px-3 pb-2.5 pt-1 text-white">
                  <ArrowLeft size={18} aria-hidden className="text-white/80" />
                  <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[var(--nv-lima)] text-[#04130b]"><Gauge size={20} weight="fill" /></span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[15px] font-semibold">{brand.name}</span>
                    <span className="block text-[11px] text-white/60">{estado.digitando ? "digitando..." : "online"}</span>
                  </span>
                  <VideoCamera size={19} aria-hidden className="text-white/80" />
                  <Phone size={18} aria-hidden className="text-white/80" />
                </div>

                <div ref={conversa} className="nv-conversa flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3" aria-live="polite">
                  <span className="mx-auto mb-1 rounded-md bg-[#182229] px-2.5 py-1 text-[10px] font-medium text-white/60">Hoje</span>
                  {estado.msgs.map((m) => (
                    <Balao key={m.id} m={m} />
                  ))}
                  {estado.digitando && (
                    <span className="nv-balao nv-entra flex items-center gap-1 !py-3" data-de="bot" aria-label="O assistente está digitando">
                      <span className="nv-ponto" /><span className="nv-ponto" /><span className="nv-ponto" />
                    </span>
                  )}
                </div>

                <form onSubmit={enviar} className="flex flex-none items-center gap-2 bg-[#0b141a] px-2.5 pb-4 pt-2">
                  <input
                    id="nv-gasto"
                    aria-label="Escreva um gasto"
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    placeholder="Escreva um gasto"
                    autoComplete="off"
                    maxLength={80}
                    className="h-11 min-w-0 flex-1 rounded-full bg-[#2a3942] px-4 text-[16px] text-white placeholder:text-white/45"
                  />
                  <button type="submit" aria-label="Enviar" className="grid size-11 flex-none place-items-center rounded-full bg-[#00a884] text-white transition-transform active:scale-90">
                    <PaperPlaneRight size={20} weight="fill" aria-hidden />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Cartões do painel: no computador flutuam em volta do celular; no celular viram uma grade logo abaixo. */}
          <div data-ui className="mt-6 grid w-full max-w-[420px] grid-cols-2 gap-3 lg:contents">
            <div className="nv-cartao nv-flutua-2 col-span-2 p-4 backdrop-blur-md lg:!absolute lg:-left-[24%] lg:top-[5%] lg:w-[230px] lg:!bg-[rgba(10,21,16,0.82)]">
              <p className="nv-suave text-[13px]">Gasto do mês no painel</p>
              <Numero data-total-topo valor={total} className="nv-num mt-1 block text-[28px] font-semibold" />
              <p className="nv-suave mt-1 text-[12px]">Mês passado: {brl(MES_ANTERIOR)}</p>
            </div>

            <div className="nv-cartao nv-flutua-3 p-4 backdrop-blur-md lg:!absolute lg:-right-[16%] lg:top-[42%] lg:w-[200px] lg:!bg-[rgba(10,21,16,0.82)]">
              <p className="nv-suave text-[13px]">Por categoria</p>
              <ul className="mt-2.5 flex flex-col gap-2.5">
                {categorias.slice(0, 3).map((c) => (
                  <li key={c.categoria}>
                    <span className="flex justify-between gap-2 text-[12px]">
                      <span className="truncate">{c.categoria}</span>
                      <span className="nv-suave tabular-nums">{Math.round(c.pct)}%</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="nv-barra block h-full rounded-full" style={{ background: corDe(c.categoria), transform: `scaleX(${c.total / maiorBarra})` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nv-cartao nv-flutua-2 p-4 backdrop-blur-md lg:!absolute lg:-left-[26%] lg:bottom-[7%] lg:w-[220px] lg:!bg-[rgba(10,21,16,0.82)]">
              <p className="nv-suave text-[13px]">Último lançamento</p>
              {ultimo ? (
                <div key={estado.extras.length} className="nv-pulsa mt-2 rounded-[14px] bg-white/[0.06] p-2.5">
                  <p className="flex items-center justify-between gap-2 text-[14px] font-semibold">
                    <span className="truncate">{ultimo.descricao}</span>
                    <span className="nv-num flex-none">{brl(ultimo.valor)}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px]">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: corDe(ultimo.categoria) }} />
                    <span className="nv-suave truncate">{ultimo.categoria}</span>
                  </p>
                </div>
              ) : (
                <p className="nv-suave mt-2 text-[13px] leading-snug">Aparece aqui assim que o assistente anota.</p>
              )}
            </div>
          </div>

          <p className="nv-suave mt-6 max-w-[34ch] text-center text-[14px] lg:mt-8">
            Teste agora: escreva um gasto no celular acima e veja o painel somar.
          </p>
        </div>
      </div>
    </section>
  );
}
