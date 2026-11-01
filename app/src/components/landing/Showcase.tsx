"use client";

import { useMemo, useState } from "react";
import { interpretar, type Gasto } from "@/lib/demo";
import { MES_ANTERIOR } from "@/lib/demo-dados";
import { Objeto3d } from "./Objeto3d";
import { PainelFragmento } from "./PainelFragmento";

const INICIAL = ["restaurante 142", "farmácia 87", "netflix 55,90", "uber 64,80", "conta de luz 128,40", "aluguel 1.150", "mercado 412,30"].join("\n");

/** Duas metades: o que a pessoa manda, solto, e o que o painel faz com isso. Editar a esquerda muda a direita. */
export function Showcase() {
  const [texto, setTexto] = useState(INICIAL);

  const { itens, linhas } = useMemo(() => {
    const todas = texto.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40);
    const achados = todas.map(interpretar).filter((g): g is Gasto => g !== null);
    return { itens: achados, linhas: todas.length };
  }, [texto]);

  return (
    <section id="painel" className="relative scroll-mt-16" aria-labelledby="titulo-painel">
      <h2 id="titulo-painel" className="sr-only">Do WhatsApp ao painel</h2>
      <div className="grid md:min-h-[90svh] md:grid-cols-2">
        <div className="fundo-noite relative flex min-h-[62svh] flex-col overflow-hidden px-5 pb-8 pt-12 text-sobre-bloco md:px-[8%] md:pt-[18%]">
          <Objeto3d nome="moeda" className="absolute -right-4 top-6 size-32 md:right-8 md:size-44" />
          <label htmlFor="mensagens" className="text-[17px] text-sobre-bloco/80">
            Mensagens do mês, uma por linha. Pode editar.
          </label>
          <textarea
            id="mensagens"
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 1200))}
            rows={8}
            spellCheck={false}
            className="mt-4 w-full max-w-[34ch] resize-none bg-transparent text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-[1.5] text-sobre-bloco outline-offset-8"
          />
          <p aria-hidden className="lp-display mt-auto pt-10 text-[clamp(2.25rem,5vw,5rem)]">Do WhatsApp</p>
        </div>

        <div className="flex min-h-[62svh] flex-col bg-superficie px-5 pb-8 pt-12 md:px-[8%] md:pt-[18%]">
          <div className="w-full max-w-[520px]">
            <PainelFragmento titulo={`Painel com ${itens.length} de ${linhas} ${linhas === 1 ? "mensagem entendida" : "mensagens entendidas"}`} itens={itens} anterior={MES_ANTERIOR} anteriorRotulo="mês passado" comparar={itens.length > 0} recentes={0} />
            {itens.length === 0 && <p className="mt-4 text-[16px] text-suave">Escreva um gasto ao lado, como faria no WhatsApp, e o painel aparece aqui.</p>}
          </div>
          <p aria-hidden className="lp-display mt-auto pt-10 text-[clamp(2.25rem,5vw,5rem)] text-tinta md:text-right">ao painel</p>
        </div>
      </div>
    </section>
  );
}
