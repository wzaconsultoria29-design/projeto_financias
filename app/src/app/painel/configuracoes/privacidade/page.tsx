"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { minhaConta, type Conta } from "@/lib/api";
import { dataLonga } from "@/lib/format";

export default function PrivacidadePage() {
  const [consentimento, setConsentimento] = useState<Conta["consentimento"] | null>(null);

  useEffect(() => {
    let ativo = true;
    minhaConta()
      .then((c) => ativo && setConsentimento(c.consentimento))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">Privacidade e dados</h2>
        <p className="mt-1 text-suave">Os seus dados são seus: baixe tudo ou apague tudo, sem perguntas em série.</p>
      </div>

      <section className="cartao p-5 md:p-6" aria-labelledby="t-baixar">
        <h3 id="t-baixar" className="font-display text-lg font-semibold text-tinta">Baixar os meus dados</h3>
        <p className="mt-2 max-w-[65ch] leading-relaxed text-suave">
          O pedido é feito pelo WhatsApp, do seu número, para termos certeza de que é você. Você recebe um resumo e um arquivo com todos os lançamentos.
        </p>
        <a href={brand.botWaUrl("MEUS DADOS")} target="_blank" rel="noopener noreferrer" className="botao-contorno mt-4 inline-flex">Baixar meus dados</a>
        <p className="mt-3 text-sm text-suave">Na página de Lançamentos também dá para exportar a lista em CSV.</p>
      </section>

      <section className="cartao p-5 md:p-6" aria-labelledby="t-docs">
        <h3 id="t-docs" className="font-display text-lg font-semibold text-tinta">Documentos e aceite</h3>
        <ul className="mt-3 flex flex-col gap-2">
          <li><Link href="/termos" className="font-medium text-floresta underline underline-offset-4">Termos de uso</Link></li>
          <li><Link href="/privacidade" className="font-medium text-floresta underline underline-offset-4">Política de privacidade</Link></li>
        </ul>
        <p className="mt-4 text-sm text-suave">
          {consentimento === null
            ? "Aceite dos termos: …"
            : consentimento.em
              ? `Aceite dos termos: ${dataLonga(consentimento.em)}, versão ${consentimento.versao ?? "-"}.`
              : "Aceite dos termos: não registrado."}
        </p>
      </section>

      <details className="cartao p-5 md:p-6">
        <summary className="cursor-pointer select-none font-display text-lg font-semibold text-ruim-ink">Zona de risco</summary>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-suave">
          Apagar remove os seus lançamentos e conversas e anonimiza o cadastro. Antes de apagar, o assistente pede uma confirmação. Depois de
          confirmada, a exclusão não pode ser desfeita.
        </p>
        <a href={brand.botWaUrl("EXCLUIR MEUS DADOS")} target="_blank" rel="noopener noreferrer" className="botao-contorno mt-4 inline-flex !border-ruim-ink !text-ruim-ink">
          Apagar meus dados
        </a>
      </details>
    </div>
  );
}
