"use client";

import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { minhaConta } from "@/lib/api";

const COMANDOS = [
  { cmd: "MEUS DADOS", texto: "Recebe um resumo e um arquivo com todos os seus lançamentos." },
  { cmd: "EXCLUIR MEUS DADOS", texto: "Apaga os seus dados, com confirmação antes." },
  { cmd: "DEL#XXXXXX", texto: "Apaga um lançamento seu (o código aparece na resposta do assistente)." },
];

export default function WhatsappPage() {
  const [numero, setNumero] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    minhaConta()
      .then((c) => ativo && setNumero(c.telefone_mascarado))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">WhatsApp</h2>
        <p className="mt-1 text-suave">O jeito mais rápido de lançar é conversar com o assistente.</p>
      </div>

      <section className="cartao p-5 md:p-6" aria-labelledby="t-numero">
        <h3 id="t-numero" className="font-display text-lg font-semibold text-tinta">Número conectado</h3>
        <p className="mt-2 text-lg tabular-nums text-tinta">{numero ?? "…"}</p>
        <p className="mt-1 text-sm text-suave">É o número que você usou no cadastro. Só ele conversa com o assistente.</p>
        <a href={brand.botWaUrl("")} target="_blank" rel="noopener noreferrer" className="botao mt-4 inline-flex">Abrir a conversa</a>
      </section>

      <section className="cartao p-5 md:p-6" aria-labelledby="t-mandar">
        <h3 id="t-mandar" className="font-display text-lg font-semibold text-tinta">O que você pode mandar</h3>
        <p className="mt-2 text-suave">Texto, áudio ou foto do cupom, do jeito que você falaria com uma pessoa. Também dá para perguntar, como &ldquo;quanto gastei esta semana?&rdquo;.</p>
        <ul className="mt-4 flex flex-col divide-y divide-linha">
          {COMANDOS.map((c) => (
            <li key={c.cmd} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
              <code className="w-52 flex-none font-medium text-tinta">{c.cmd}</code>
              <span className="text-sm text-suave">{c.texto}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-suave">O assistente nunca escreve primeiro: ele só responde quando você manda uma mensagem.</p>
      </section>
    </div>
  );
}
