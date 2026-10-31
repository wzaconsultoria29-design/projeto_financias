import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { planos } from "@/config/planos";

export function Planos() {
  return (
    <section id="planos" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 md:px-8">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">Preço fixo, sem surpresa</h2>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-suave">
        Comece de graça por 7 dias, sem cartão. Depois escolha o plano que cabe no seu mês.
      </p>

      <div className="revela mt-12 grid items-stretch gap-5 lg:grid-cols-3">
        {planos.map((p) => (
          <article
            key={p.codigo}
            data-plano={p.codigo}
            className={`cartao flex flex-col p-8 ${p.destaque ? "border-floresta ring-1 ring-floresta lg:-my-4 lg:py-12" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold text-tinta">{p.nome}</h3>
              {p.destaque && <span className="rounded-full bg-folha px-3 py-1 text-xs font-semibold text-floresta">Recomendado</span>}
              {p.emBreve && <span className="rounded-full bg-folha px-3 py-1 text-xs font-semibold text-floresta">Em breve</span>}
            </div>
            <p className="mt-1 text-sm text-suave">{p.resumo}</p>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold tracking-tight text-tinta">{p.preco}</span>
              <span className="text-sm text-suave">{p.periodo}</span>
            </p>
            <ul className="mt-8 flex flex-1 flex-col gap-3 text-[0.95rem] text-tinta">
              {p.itens.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-floresta" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href={p.cta.href} className={`mt-10 ${p.destaque ? "botao" : "botao-contorno"}`}>
              {p.cta.texto}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
