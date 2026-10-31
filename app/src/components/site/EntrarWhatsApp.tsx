"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/config/brand";
import { iniciarLogin, statusLogin, type SessaoLogin } from "@/lib/login";

type Fase = "inicial" | "gerando" | "aguardando" | "expirado" | "erro";

const INTERVALO_MS = 2000;

function formatarContagem(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function EntrarWhatsApp() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("inicial");
  const [sessao, setSessao] = useState<SessaoLogin | null>(null);
  const [restante, setRestante] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const geracao = useRef(0);

  const gerar = useCallback(async () => {
    const minha = ++geracao.current;
    setFase("gerando");
    setMensagem("");
    try {
      const nova = await iniciarLogin();
      if (minha !== geracao.current) return;
      setSessao(nova);
      setRestante(new Date(nova.expiraEm).getTime() - Date.now());
      setFase("aguardando");
    } catch (e) {
      if (minha !== geracao.current) return;
      setMensagem(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
      setFase("erro");
    }
  }, []);

  // Contagem regressiva; ao zerar, o código vence mesmo que o servidor ainda não tenha respondido.
  useEffect(() => {
    if (fase !== "aguardando" || !sessao) return;
    const fim = new Date(sessao.expiraEm).getTime();
    const id = setInterval(() => {
      const falta = fim - Date.now();
      setRestante(falta);
      if (falta <= 0) setFase("expirado");
    }, 1000);
    return () => clearInterval(id);
  }, [fase, sessao]);

  // Polling a cada 2 s; a limpeza cancela o ciclo ao desmontar ou ao trocar de código.
  useEffect(() => {
    if (fase !== "aguardando" || !sessao) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout>;
    const consultar = async () => {
      try {
        const estado = await statusLogin(sessao.sessaoId);
        if (!ativo) return;
        if (estado === "ok") return router.replace("/painel");
        if (estado === "expirado") return setFase("expirado");
        timer = setTimeout(consultar, INTERVALO_MS);
      } catch (e) {
        if (!ativo) return;
        setMensagem(e instanceof Error ? e.message : "Algo deu errado. Gere um novo código.");
        setFase("erro");
      }
    };
    timer = setTimeout(consultar, 0);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [fase, sessao, router]);

  return (
    <div className="cartao flex flex-col gap-6 p-6 md:p-8">
      {(fase === "inicial" || fase === "gerando") && (
        <>
          <p className="max-w-[48ch] leading-relaxed text-suave">
            Você entra enviando um código pelo WhatsApp, do mesmo número que usa com o {brand.name}. Não precisa de senha.
          </p>
          <button type="button" className="botao w-full" onClick={gerar} disabled={fase === "gerando"}>
            {fase === "gerando" ? "Gerando…" : "Gerar código"}
          </button>
        </>
      )}

      {fase === "aguardando" && sessao && (
        <>
          <div>
            <p className="text-sm text-suave">Seu código</p>
            <p className="mt-1 font-display text-5xl font-semibold tracking-[0.2em] text-tinta" aria-label={`Código ${sessao.codigo.split("").join(" ")}`}>
              {sessao.codigo}
            </p>
            <p className="mt-3 text-sm text-suave">
              Vale por <span className="font-medium tabular-nums text-tinta">{formatarContagem(restante)}</span>
            </p>
          </div>
          <a
            className="botao w-full"
            href={brand.botWaUrl(`PAINEL ${sessao.codigo}`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir WhatsApp
          </a>
          <p className="text-sm leading-relaxed text-suave">
            Envie a mensagem que vai aparecer pronta e volte para esta página. Ela entra sozinha assim que o bot confirmar. Nunca envie este código a pedido de outra pessoa: ele dá acesso ao seu painel.
          </p>
        </>
      )}

      {fase === "expirado" && (
        <>
          <p className="font-display text-2xl font-semibold tracking-tight text-tinta">Código vencido</p>
          <p className="leading-relaxed text-suave">Por segurança, cada código vale só 5 minutos e funciona uma vez.</p>
          <button type="button" className="botao w-full" onClick={gerar}>
            Gerar novo código
          </button>
        </>
      )}

      {fase === "erro" && (
        <>
          <p role="alert" className="rounded-[12px] bg-folha px-4 py-3 text-sm text-tinta">{mensagem}</p>
          <button type="button" className="botao w-full" onClick={gerar}>
            Gerar novo código
          </button>
        </>
      )}
    </div>
  );
}
