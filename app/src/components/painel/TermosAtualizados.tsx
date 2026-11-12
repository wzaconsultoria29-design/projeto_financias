"use client";

import { useState } from "react";
import Link from "next/link";
import { aceitarTermos } from "@/lib/api";
import { VERSAO_LEGAL } from "@/config/legal";

type Props = { versaoAceita: string | null; onAceito: () => void };

/** Quando os termos mudam (ou a conta nunca registrou o aceite), pede um novo aceite antes de seguir usando o painel. */
export function TermosAtualizados({ versaoAceita, onAceito }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  if (versaoAceita === VERSAO_LEGAL) return null;

  async function aceitar() {
    setOcupado(true);
    setErro("");
    try {
      await aceitarTermos(VERSAO_LEGAL);
      onAceito();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-tinta/50 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="termos-titulo" className="cartao flex w-full max-w-md flex-col gap-4 p-6">
        <h2 id="termos-titulo" className="font-display text-xl font-bold tracking-tight text-tinta">
          Atualizamos os nossos termos
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-suave">
          Para continuar usando o painel, leia e aceite a versão atual dos{" "}
          <Link href="/termos" target="_blank" rel="noopener noreferrer" className="font-semibold text-tinta underline underline-offset-2">
            Termos de uso
          </Link>{" "}
          e da{" "}
          <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-semibold text-tinta underline underline-offset-2">
            Política de privacidade
          </Link>
          .
        </p>
        <p className="text-[0.8125rem] text-suave">{`Versão ${VERSAO_LEGAL}. O seu aceite fica registrado com a data e a versão.`}</p>
        {erro && (
          <p role="alert" className="rounded-[12px] bg-ruim-bg px-4 py-3 text-sm text-ruim-ink">
            {erro}
          </p>
        )}
        <button type="button" onClick={aceitar} disabled={ocupado} className="botao w-full">
          {ocupado ? "Registrando…" : "Li e aceito"}
        </button>
      </div>
    </div>
  );
}
