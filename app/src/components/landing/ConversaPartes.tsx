import { brand } from "@/config/brand";

export type Mensagem = { de: "voce" | "bot"; texto: string };

/** Topo verde de uma conversa de WhatsApp: a marca e uma linha de estado. */
export function CabecalhoConversa({ sub }: { sub: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pb-3 pt-12 text-white" style={{ background: "var(--esmeralda)" }}>
      <span aria-hidden className="grid size-9 place-items-center rounded-full text-[15px] font-bold" style={{ background: "var(--lima)", color: "var(--noite)" }}>
        {brand.name.charAt(0)}
      </span>
      <span className="leading-tight">
        <span className="block text-[16px] font-semibold">{brand.name}</span>
        <span className="block text-[13px] text-white/75">{sub}</span>
      </span>
    </div>
  );
}

export const BALAO_VOCE = "self-end rounded-br-md bg-[var(--botao)] text-[var(--botao-fg)]";
export const BALAO_BOT = "self-start rounded-bl-md bg-superficie text-tinta shadow-[0_1px_0_rgba(0,0,0,0.06)]";

export function Balao({ m }: { m: Mensagem }) {
  return (
    <li className={`entra-msg max-w-[88%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${m.de === "voce" ? BALAO_VOCE : BALAO_BOT}`}>{m.texto}</li>
  );
}

/** Os três pontinhos de "digitando". */
export function Digitando() {
  return (
    <li aria-hidden data-testid="digitando" className="flex w-fit items-center gap-1 self-start rounded-2xl rounded-bl-md bg-superficie px-3.5 py-3">
      <span className="ponto size-2 rounded-full bg-suave" />
      <span className="ponto size-2 rounded-full bg-suave" />
      <span className="ponto size-2 rounded-full bg-suave" />
    </li>
  );
}
