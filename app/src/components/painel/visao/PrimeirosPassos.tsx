import type { Painel } from "@/lib/api";

const POUCOS = 5;

type Props = { p: Painel; whatsappUrl: string; onLancar?: () => void };

/** Só enquanto a conta tem poucos lançamentos: o que fazer para o painel começar a responder. */
export function PrimeirosPassos({ p, whatsappUrl, onLancar }: Props) {
  if (p.historico_total >= POUCOS) return null;

  return (
    <section className="cartao flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6" aria-labelledby="t-passos">
      <div>
        <h2 id="t-passos" className="font-display text-lg font-semibold text-tinta">
          Primeiros passos
        </h2>
        <ol className="mt-3 flex flex-col gap-1.5 text-tinta">
          <li>Registre a sua renda do mês.</li>
          <li>Lance o primeiro gasto, aqui ou pelo WhatsApp.</li>
          <li>Volte amanhã: o painel aprende o seu ritmo.</li>
        </ol>
      </div>
      <div className="flex flex-wrap gap-3">
        {onLancar && (
          <button type="button" onClick={onLancar} className="botao">
            Lançar agora
          </button>
        )}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="botao-contorno">
          Conversar no WhatsApp
        </a>
      </div>
    </section>
  );
}
