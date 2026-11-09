import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Info } from "@phosphor-icons/react/dist/ssr";

type Props = {
  id: string;
  titulo: string;
  /** A frase que diz a conclusão do capítulo, antes de o leitor olhar o gráfico. */
  manchete?: string | null;
  /** Explicação curta, em palavras do dia a dia, de como ler o gráfico e os termos. */
  comoLer?: ReactNode;
  /** Ícone do capítulo, no quadrado ao lado do título. */
  icone?: Icon;
  children: ReactNode;
};

/** Um capítulo da história do período: ícone e título, manchete, o conteúdo e o "Como ler". O cartão se estica para fechar a linha da grade. */
export function Capitulo({ id, titulo, manchete, comoLer, icone: Icone, children }: Props) {
  return (
    <section className="cartao flex flex-col p-5 md:p-6" aria-labelledby={`t-${id}`}>
      <div className="flex items-center gap-3">
        {Icone && (
          <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-folha text-verde-escuro">
            <Icone size={21} />
          </span>
        )}
        <h2 id={`t-${id}`} className="min-w-0 flex-1 font-display text-[1.1875rem] font-bold leading-tight tracking-tight text-tinta">
          {titulo}
        </h2>
      </div>
      {manchete && <p className="mt-3 text-[0.9375rem] leading-snug text-tinta">{manchete}</p>}
      <div className="mt-4 flex-1">{children}</div>
      {comoLer && (
        <details open className="mt-5 rounded-[14px] bg-papel px-3.5 py-2.5 text-[0.8125rem] text-suave">
          <summary className="flex cursor-pointer select-none list-none items-center gap-2 font-medium text-tinta [&::-webkit-details-marker]:hidden">
            <Info size={16} weight="bold" aria-hidden="true" className="flex-none text-verde-escuro" />
            Como ler
          </summary>
          <p className="mt-1.5 leading-relaxed">{comoLer}</p>
        </details>
      )}
    </section>
  );
}
