"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { ArrowRight, ChartLineUp, ChatCircleDots, Confetti, Gauge, Lifebuoy, Microphone, PiggyBank, Receipt, TextT, UsersThree, WhatsappLogo, type Icon } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { concluirPrimeiroAcesso, listarLancamentos, minhaConta, salvarObjetivo, salvarRenda, type Conta, type LancamentoItem, type Objetivo } from "@/lib/api";
import { brl, lerReais } from "@/lib/format";
import { FormSenha } from "./FormSenha";
import { IconeCategoria } from "@/components/painel/IconeCategoria";

type Passo = "objetivo" | "renda" | "senha" | "whatsapp" | "esperando" | "chegou";

const OBJETIVOS: { id: Objetivo; titulo: string; texto: string; icone: Icon; cor: string }[] = [
  { id: "dia_a_dia", titulo: "Controlar o dia a dia", texto: "Saber para onde vai cada real", icone: Receipt, cor: "var(--c3)" },
  { id: "guardar", titulo: "Guardar dinheiro", texto: "Sobrar no fim do mês e criar uma reserva", icone: PiggyBank, cor: "var(--verde-escuro)" },
  { id: "aperto", titulo: "Sair do aperto", texto: "Gastar menos do que entra", icone: Lifebuoy, cor: "var(--c8)" },
  { id: "familia", titulo: "Organizar a família", texto: "Quem divide a casa, divide o controle", icone: UsersThree, cor: "var(--c1)" },
];

/** Faixas de renda para quem não sabe o número exato: preenchem um valor do meio da faixa, que a pessoa pode ajustar. */
const FAIXAS: { rotulo: string; valor: string }[] = [
  { rotulo: "até R$ 2.000", valor: "1.500" },
  { rotulo: "R$ 2.000 a 4.000", valor: "3.000" },
  { rotulo: "R$ 4.000 a 7.000", valor: "5.500" },
  { rotulo: "mais de R$ 7.000", valor: "8.000" },
];

const NUMERO_DO_PASSO: Partial<Record<Passo, number>> = { objetivo: 1, renda: 2, senha: 3, whatsapp: 4 };

/** As telas do primeiro acesso ao painel: objetivo, renda, senha e o primeiro gasto pelo WhatsApp. */
export function PrimeiroAcesso({ intervaloMs = 3000 }: { intervaloMs?: number }) {
  const router = useRouter();
  const [conta, setConta] = useState<Conta | null>(null);
  const [passo, setPasso] = useState<Passo>("objetivo");
  const [renda, setRenda] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [qr, setQr] = useState("");
  const [primeiro, setPrimeiro] = useState<LancamentoItem | null>(null);
  const linkWhatsApp = brand.botWaUrl("mercado 100");

  useEffect(() => {
    let ativo = true;
    minhaConta()
      .then((c) => ativo && setConta(c))
      .catch(() => ativo && setErro("Não foi possível carregar a sua conta. Atualize a página."));
    return () => {
      ativo = false;
    };
  }, []);

  async function finalizar() {
    setOcupado(true);
    await concluirPrimeiroAcesso().catch(() => {});
    router.replace("/painel");
  }

  async function escolher(o: Objetivo) {
    setOcupado(true);
    setErro("");
    try {
      await salvarObjetivo(o);
      setPasso("renda");
    } catch (x) {
      setErro(x instanceof Error ? x.message : "Algo deu errado. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  // Atalho de teclado: 1 a 4 escolhem o objetivo.
  useEffect(() => {
    if (passo !== "objetivo") return;
    const tecla = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (OBJETIVOS[i] && !e.ctrlKey && !e.metaKey && !e.altKey) void escolher(OBJETIVOS[i].id);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  const aposRenda = () => setPasso(conta?.tem_senha ? "whatsapp" : "senha");

  async function guardarRenda() {
    const n = lerReais(renda);
    if (n === "invalido") return setErro("Confira o valor: use só números, como 4.500.");
    setErro("");
    if (n === null) return aposRenda();
    setOcupado(true);
    try {
      await salvarRenda(n);
      aposRenda();
    } catch (x) {
      setErro(x instanceof Error ? x.message : "Algo deu errado. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  // QR code da conversa com o assistente (para quem está no computador).
  useEffect(() => {
    if (passo !== "whatsapp") return;
    let ativo = true;
    QRCode.toString(linkWhatsApp, { type: "svg", margin: 1, color: { dark: "#0f1a14", light: "#ffffff" } })
      .then((svg) => ativo && setQr(svg))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [passo, linkWhatsApp]);

  // Espera o primeiro lançamento: guarda o total atual e confere de tempos em tempos até ele crescer.
  useEffect(() => {
    if (passo !== "esperando") return;
    let ativo = true;
    let base: number | null = null;
    let timer: ReturnType<typeof setTimeout>;
    const conferir = async () => {
      try {
        const r = await listarLancamentos({ limite: 1 });
        if (!ativo) return;
        if (base === null) base = r.total;
        else if (r.total > base && r.itens[0]) {
          setPrimeiro(r.itens[0]);
          setPasso("chegou");
          return;
        }
      } catch {
        // falha passageira: tenta de novo no próximo ciclo
      }
      if (ativo) timer = setTimeout(conferir, intervaloMs);
    };
    void conferir();
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [passo, intervaloMs]);

  const numero = NUMERO_DO_PASSO[passo];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between gap-4 px-5 pt-5 md:px-9 md:pt-7">
        <span className="flex items-center gap-2.5 font-display text-lg font-bold text-tinta">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-ativo-bg text-ativo-fg">
            <Gauge size={22} weight="fill" />
          </span>
          {brand.name}
        </span>
        <div className="flex items-center gap-4">
          {numero && (
            <span className="flex items-center gap-2 text-[0.8125rem] text-suave">
              <span>{`Passo ${numero} de 4`}</span>
              <span aria-hidden="true" className="hidden gap-1.5 sm:flex">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className={`h-1.5 w-7 rounded-full ${n < numero ? "bg-lima" : n === numero ? "bg-ativo-bg" : "bg-d-trilho"}`} />
                ))}
              </span>
            </span>
          )}
          {passo !== "chegou" && (
            <button type="button" onClick={finalizar} disabled={ocupado} className="text-sm font-medium text-suave hover:text-tinta">
              Fazer depois
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-12 pt-8 text-center md:px-10">
        {passo === "objetivo" && (
          <>
            <p className="mb-2.5 text-xs font-semibold tracking-wide text-verde-escuro">Boas-vindas · leva menos de 1 minuto</p>
            <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-tinta md:text-[2.375rem]">O que você quer resolver primeiro?</h1>
            <p className="mt-2 text-suave">Isso define o que o painel mostra em destaque. Dá para mudar depois.</p>
            <div className="mt-8 grid w-full max-w-[65rem] gap-3.5 text-left sm:grid-cols-2 lg:grid-cols-4">
              {OBJETIVOS.map((o, i) => {
                const Icone = o.icone;
                const escolhido = conta?.objetivo === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={ocupado}
                    onClick={() => escolher(o.id)}
                    className={`flex flex-row items-center gap-3 rounded-[22px] border-2 bg-superficie p-4 text-left shadow-[var(--sombra)] transition-colors hover:border-linha-forte lg:min-h-[10.5rem] lg:flex-col lg:items-start lg:p-5 ${escolhido ? "border-ativo-bg" : "border-transparent"}`}
                  >
                    <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px]" style={{ color: o.cor, background: `color-mix(in srgb, ${o.cor} 15%, transparent)` }}>
                      <Icone size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.0625rem] font-bold text-tinta">{o.titulo}</span>
                      <span className="mt-1 block text-[0.8125rem] text-suave">{o.texto}</span>
                    </span>
                    <span aria-hidden="true" className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-papel text-xs font-bold text-suave">{i + 1}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 hidden text-xs text-suave md:block">use as teclas 1 a 4 · a escolha já avança</p>
          </>
        )}

        {passo === "renda" && (
          <>
            <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-tinta md:text-[2.375rem]">Quanto entra por mês, mais ou menos?</h1>
            <p className="mt-2 max-w-[34rem] text-suave">Com isso o painel já mostra quanto sobra e quanto dá para gastar por dia. Fica só com você.</p>
            <label className="mt-8 flex items-center gap-2 rounded-[22px] border-2 border-ativo-bg bg-superficie px-5 py-2.5 shadow-[var(--sombra)]">
              <span className="font-display text-2xl font-semibold text-suave">R$</span>
              <input
                aria-label="Renda mensal em reais"
                inputMode="decimal"
                placeholder="4.500"
                value={renda}
                onChange={(e) => { setRenda(e.target.value); setErro(""); }}
                className="w-44 bg-transparent font-display text-4xl font-semibold tracking-tight text-tinta outline-none placeholder:text-linha-forte"
              />
            </label>
            <div className="mt-4 flex max-w-[40rem] flex-wrap justify-center gap-2">
              {FAIXAS.map((f) => (
                <button key={f.rotulo} type="button" onClick={() => { setRenda(f.valor); setErro(""); }} className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium ${renda === f.valor ? "border-ativo-bg font-bold text-tinta" : "border-linha bg-superficie text-tinta"}`}>
                  {f.rotulo}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.8125rem] text-suave">Se a renda varia muito, use a média dos últimos meses.</p>
            {erro && <p role="alert" className="mt-4 rounded-[12px] bg-ruim-bg px-4 py-3 text-sm text-ruim-ink">{erro}</p>}
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={aposRenda} className="botao-contorno">Pular por agora</button>
              <button type="button" onClick={guardarRenda} disabled={ocupado} className="botao min-w-[12rem]">
                Continuar
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {passo === "senha" && (
          <>
            <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-tinta md:text-[2.375rem]">Crie a sua senha</h1>
            <p className="mt-2 max-w-[32rem] text-suave">Da próxima vez você entra com e-mail e senha, sem precisar do código.</p>
            <div className="cartao mt-7 w-full max-w-[28rem] p-6 md:p-8">
              <FormSenha emailInicial={conta?.email ?? null} botao="Criar senha e continuar" onPronto={() => setPasso("whatsapp")} aoPular={() => setPasso("whatsapp")} />
            </div>
          </>
        )}

        {passo === "whatsapp" && (
          <div className="grid w-full max-w-[62rem] items-center gap-9 text-left md:grid-cols-[1.1fr_0.9fr]">
            <div className="order-2 overflow-hidden rounded-[24px] bg-[#efe7dc] shadow-[var(--sombra)] md:order-1" aria-hidden="true">
              <div className="flex items-center gap-2.5 bg-[#0b6b4f] px-4 py-3 font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lima text-[#0b3a22]"><Gauge size={18} weight="fill" /></span>
                <span>{brand.name}<span className="block text-xs font-normal text-white/80">assistente · online</span></span>
              </div>
              <div className="flex flex-col gap-2 p-4 text-[0.8125rem] text-[#111b21]">
                <p className="self-end rounded-[12px] bg-[#d9fdd3] px-3 py-2">mercado 100</p>
                <p className="max-w-[85%] rounded-[12px] bg-white px-3 py-2">Anotei: <b>R$ 100,00</b> em Alimentação · hoje. Responda <b>corrigir</b> se algo estiver errado.</p>
                <p className="self-end rounded-[12px] bg-[#d9fdd3] px-3 py-2">áudio · &quot;gastei 32 no almoço&quot;</p>
                <p className="max-w-[85%] rounded-[12px] bg-white px-3 py-2">Anotei: <b>R$ 32,00</b> em Alimentação · almoço</p>
                <p className="self-end rounded-[12px] bg-[#d9fdd3] px-3 py-2">quanto gastei esta semana?</p>
                <p className="max-w-[85%] rounded-[12px] bg-white px-3 py-2">Esta semana: <b>R$ 412,90</b>. O maior foi Alimentação.</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-tinta md:text-[2rem]">Seu assistente já está no WhatsApp</h1>
              <p className="mt-2 text-suave">Mande o primeiro gasto agora para ver aparecer aqui.</p>
              <ul className="my-5 flex flex-col gap-3 text-[0.9375rem] text-tinta">
                <li className="flex items-center gap-2.5"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-lima-suave text-verde-escuro"><TextT size={17} /></span>Texto, áudio ou foto do recibo</li>
                <li className="flex items-center gap-2.5"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-lima-suave text-verde-escuro"><ChatCircleDots size={17} /></span>Perguntas: &quot;quanto gastei com mercado?&quot;</li>
                <li className="flex items-center gap-2.5"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-lima-suave text-verde-escuro"><ChartLineUp size={17} /></span>O painel atualiza na hora</li>
              </ul>
              {qr && (
                <div className="hidden items-center gap-4 md:flex">
                  <div role="img" aria-label="QR code para abrir a conversa no WhatsApp" className="h-36 w-36 rounded-[18px] bg-white p-2.5 shadow-[var(--sombra)] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
                  <p className="max-w-[13rem] text-[0.8125rem] text-suave">No computador? Aponte a câmera do celular para abrir a conversa direto.</p>
                </div>
              )}
              <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" onClick={() => setPasso("esperando")} className="botao mt-5 w-full !bg-[#1fa855] !py-3.5 !text-white">
                <WhatsappLogo size={18} weight="fill" aria-hidden="true" />
                Mandar meu primeiro gasto
              </a>
              {conta?.telefone_mascarado && <p className="mt-3 text-center text-[0.8125rem] text-suave">{`Ligado ao seu número ${conta.telefone_mascarado}`}</p>}
            </div>
          </div>
        )}

        {passo === "esperando" && (
          <>
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[3px] border-lima-suave" aria-hidden="true">
              <span className="absolute -inset-3.5 rounded-full border-2 border-dashed border-linha" />
              <span className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-ativo-bg text-ativo-fg"><WhatsappLogo size={46} weight="fill" /></span>
            </div>
            <h1 className="mt-8 font-display text-[1.75rem] font-bold tracking-tight text-tinta">Esperando o seu primeiro gasto…</h1>
            <p className="mt-2 text-suave">Mande &quot;mercado 100&quot; ou um áudio. Ele aparece aqui na hora.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[0.8125rem]">
              <span className="flex items-center gap-1.5 rounded-full border border-linha bg-superficie px-3.5 py-1.5"><TextT size={14} aria-hidden="true" />&quot;mercado 100&quot;</span>
              <span className="flex items-center gap-1.5 rounded-full border border-linha bg-superficie px-3.5 py-1.5"><Microphone size={14} aria-hidden="true" />áudio</span>
              <span className="flex items-center gap-1.5 rounded-full border border-linha bg-superficie px-3.5 py-1.5"><Receipt size={14} aria-hidden="true" />foto do recibo</span>
            </div>
            <p className="mt-5 flex items-center gap-2.5 text-sm text-suave" role="status">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-bom-ink shadow-[0_0_0_5px_rgba(28,154,82,0.18)]" />
              conferindo de tempos em tempos
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
              <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="font-semibold text-verde-escuro hover:underline">Abrir o WhatsApp de novo</a>
              <button type="button" onClick={finalizar} disabled={ocupado} className="font-medium text-suave hover:text-tinta">Pular e ir para o painel</button>
            </div>
          </>
        )}

        {passo === "chegou" && primeiro && (
          <>
            <Confetti size={96} weight="fill" aria-hidden="true" className="text-verde-escuro" />
            <h1 className="mt-3 font-display text-[1.875rem] font-bold tracking-tight text-tinta">Chegou! Já está no seu painel.</h1>
            <p className="mt-2 text-suave">Pronto: é só continuar mandando pelo WhatsApp.</p>
            <div className="mt-6 flex w-full max-w-[26rem] items-center gap-3.5 rounded-[22px] bg-superficie px-5 py-4 text-left shadow-[var(--sombra)]">
              <IconeCategoria categoria={primeiro.categoria} receita={primeiro.tipo === "receita"} tamanho={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-tinta">{primeiro.descricao?.trim() || "Sem descrição"}</p>
                <p className="text-[0.8125rem] text-suave">{primeiro.categoria ?? "Sem categoria"}</p>
              </div>
              <p className={`font-bold tabular-nums ${primeiro.tipo === "receita" ? "text-bom-ink" : "text-ruim-ink"}`}>{`${primeiro.tipo === "receita" ? "+" : "-"}${brl(primeiro.valor)}`}</p>
            </div>
            <button type="button" onClick={finalizar} disabled={ocupado} className="botao mt-6 min-w-[16rem]">
              Ir para o meu painel
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          </>
        )}

        {erro && passo !== "renda" && <p role="alert" className="mt-5 rounded-[12px] bg-ruim-bg px-4 py-3 text-sm text-ruim-ink">{erro}</p>}
      </main>
    </div>
  );
}
