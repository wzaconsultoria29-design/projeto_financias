"use client";

import { useRef, useState } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { interpretar, type Gasto } from "@/lib/demo";
import { MES, MES_ANTERIOR } from "@/lib/demo-dados";
import { brl } from "@/lib/format";
import { PainelFragmento } from "./PainelFragmento";

type Mensagem = { de: "voce" | "bot"; texto: string };

const EXEMPLOS = ["gastei 32 no almoço", "uber 18,50", "mercado 120"];
const MAXIMO_ITENS = 30;

/** Demonstração viva do topo: o visitante escreve um gasto e vê o painel mudar. Nada é enviado a lugar nenhum. */
export function LivePanel() {
  const [itens, setItens] = useState<Gasto[]>(MES);
  const [texto, setTexto] = useState("");
  const [conversa, setConversa] = useState<Mensagem[]>([
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
    setConversa((atual) => [...atual, { de: "voce" as const, texto: frase.slice(0, 80) }, resposta].slice(-6));
    setTexto("");
    campo.current?.focus();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div data-ui className="flex flex-col rounded-[20px] bg-superficie p-5 md:p-6">
        <p className="text-[15px] font-medium">Conversa no WhatsApp</p>
        <ol className="mt-4 flex min-h-[150px] flex-1 flex-col justify-end gap-2" aria-live="polite" aria-label="Mensagens">
          {conversa.map((m, i) => (
            <li
              key={`${i}-${m.texto}`}
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[16px] leading-snug ${
                m.de === "voce" ? "self-end bg-[var(--botao)] text-[var(--botao-fg)]" : "self-start bg-papel text-tinta"
              }`}
            >
              {m.texto}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXEMPLOS.map((e) => (
            <button key={e} type="button" onClick={() => enviar(e)} className="ctl rounded-full bg-folha px-3.5 py-2 text-[14px] font-medium text-tinta hover:bg-papel">
              {e}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
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
            className="min-w-0 flex-1 rounded-full bg-papel px-4 py-3 text-[16px] text-tinta placeholder:text-suave"
          />
          <button type="submit" aria-label="Enviar" className="ctl botao !px-4">
            <PaperPlaneRight size={20} weight="fill" aria-hidden />
          </button>
        </form>
      </div>

      <PainelFragmento titulo="Painel deste mês" itens={itens} anterior={MES_ANTERIOR} anteriorRotulo="mês passado" comparar recentes={2} maxCategorias={4} />
    </div>
  );
}
