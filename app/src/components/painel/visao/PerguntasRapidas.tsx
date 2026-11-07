import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/config/brand";

const PERGUNTAS = ["Onde posso economizar?", "Estou gastando muito com alimentação?", "Quanto gastei esta semana?"];

/** Atalhos: cada pergunta abre a conversa do assistente no WhatsApp com o texto já escrito. */
export function PerguntasRapidas() {
  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-perguntas">
      <h2 id="t-perguntas" className="font-display text-lg font-semibold text-tinta">
        Pergunte pelo WhatsApp
      </h2>
      <p className="mt-1 text-sm text-suave">Toque numa pergunta e a conversa abre já escrita. O assistente responde só com os seus lançamentos.</p>
      <ul aria-label="Perguntas sugeridas" className="mt-4 flex flex-wrap gap-2">
        {PERGUNTAS.map((q) => (
          <li key={q}>
            <a
              href={brand.botWaUrl(q)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-linha px-4 text-sm text-tinta transition-colors hover:border-floresta hover:bg-folha"
            >
              <ChatCircleDots size={18} aria-hidden="true" />
              {q}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
