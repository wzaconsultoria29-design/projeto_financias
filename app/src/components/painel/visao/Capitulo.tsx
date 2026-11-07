import type { ReactNode } from "react";

type Props = {
  id: string;
  titulo: string;
  /** A frase que diz a conclusão do capítulo, antes de o leitor olhar o gráfico. */
  manchete?: string | null;
  /** Explicação curta, em palavras do dia a dia, de como ler o gráfico e os termos. */
  comoLer?: ReactNode;
  children: ReactNode;
};

/** Um capítulo da história do período: título, manchete, o conteúdo e o "Como ler". O cartão se estica para fechar a linha da grade. */
export function Capitulo({ id, titulo, manchete, comoLer, children }: Props) {
  return (
    <section className="cartao flex flex-col p-5 md:p-6" aria-labelledby={`t-${id}`}>
      <h2 id={`t-${id}`} className="flex items-center gap-2.5 font-display text-lg font-semibold text-tinta">
        <span aria-hidden="true" className="h-[18px] w-2 flex-none rounded-[3px] bg-floresta" />
        {titulo}
      </h2>
      {manchete && <p className="mt-1.5 text-[1.0625rem] leading-snug text-tinta">{manchete}</p>}
      <div className="mt-4 flex-1">{children}</div>
      {comoLer && (
        <details open className="mt-5 border-t border-linha pt-3 text-sm text-suave">
          <summary className="cursor-pointer select-none font-medium text-tinta">Como ler</summary>
          <p className="mt-1.5 leading-relaxed">{comoLer}</p>
        </details>
      )}
    </section>
  );
}
