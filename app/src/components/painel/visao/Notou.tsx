import type { Painel } from "@/lib/api";
import { gerarInsights } from "@/lib/painel";

/** Até quatro frases montadas dos números do período. Sem dados que sustentem uma frase, o quadro nem aparece. */
export function Notou({ p }: { p: Painel }) {
  const frases = gerarInsights(p);
  if (frases.length === 0) return null;

  return (
    <section className="cartao p-5 md:p-6" aria-labelledby="t-notou">
      <h2 id="t-notou" className="font-display text-lg font-semibold text-tinta">
        O que o painel notou
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {frases.map((f) => (
          <li key={f} className="flex gap-3 text-tinta">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-floresta" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
