import { Waveform } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/config/brand";

type Mensagem =
  | { de: "voce"; texto: string }
  | { de: "voce"; audio: string }
  | { de: "bot"; linhas: string[] };

// Exemplo ilustrativo (valores inventados, coerentes entre si: 87,50 + 120,00 = 207,50).
const conversa: Mensagem[] = [
  { de: "voce", texto: "gastei 87,50 no mercado" },
  { de: "bot", linhas: ["Anotado.", "Despesa de R$ 87,50", "Alimentação / Supermercado"] },
  { de: "voce", audio: "0:04" },
  { de: "bot", linhas: ["Entendi: R$ 120,00 de luz.", "Despesas Fixas / Luz"] },
  { de: "voce", texto: "quanto gastei essa semana?" },
  { de: "bot", linhas: ["Esta semana: R$ 207,50.", "Maior categoria: Despesas Fixas."] },
];

export function ChatDemo() {
  return (
    <figure className="mx-auto w-full max-w-md">
      <div
        role="img"
        aria-label="Exemplo de conversa: o cliente envia um gasto por texto e por áudio, e o assistente anota e responde o total da semana."
        className="overflow-hidden rounded-3xl border border-linha bg-superficie shadow-[0_24px_60px_-28px_rgba(14,74,58,0.35)]"
      >
        <div className="flex items-center gap-3 border-b border-linha px-5 py-4">
          <span className="grid size-9 place-items-center rounded-full bg-floresta text-sm font-semibold text-papel" aria-hidden>
            {brand.name.charAt(0)}
          </span>
          <span className="text-sm font-semibold text-tinta">{brand.name}</span>
        </div>
        <ol className="flex flex-col gap-3 bg-folha/50 px-4 py-5" aria-hidden>
          {conversa.map((m, i) => (
            <li
              key={i}
              style={{ "--i": i } as React.CSSProperties}
              className={`bolha max-w-[82%] rounded-2xl px-4 py-2.5 text-[0.92rem] leading-snug ${
                m.de === "voce"
                  ? "self-end rounded-br-md bg-floresta text-papel"
                  : "self-start rounded-bl-md border border-linha bg-superficie text-tinta"
              }`}
            >
              {"texto" in m && m.texto}
              {"audio" in m && (
                <span className="flex items-center gap-2">
                  <Waveform size={20} weight="bold" aria-hidden />
                  <span>Áudio {m.audio}</span>
                </span>
              )}
              {"linhas" in m && m.linhas.map((l, k) => <span key={k} className={`block ${k === 0 ? "font-semibold" : ""}`}>{l}</span>)}
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="mt-3 text-center text-xs text-suave">Exemplo ilustrativo de conversa.</figcaption>
    </figure>
  );
}
