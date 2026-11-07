import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { planos, porDia } from "@/config/planos";

const GARANTIAS = ["Teste de 7 dias sem cartão", "Preço final à vista, sem taxa escondida", "Sem fidelidade: cancele quando quiser"];

export function Planos() {
  return (
    <section id="planos" data-barra-oculta="planos" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-24 md:px-8 md:py-32" aria-labelledby="titulo-planos">
      <h2 id="titulo-planos" className="lp-display rise text-center text-[clamp(2rem,4.4vw,3.75rem)] text-tinta">Planos</h2>
      <p className="rise mx-auto mt-4 max-w-[48ch] text-center text-[18px] leading-relaxed text-suave">Comece grátis por 7 dias, sem cartão. Depois escolha o que cabe no seu mês.</p>

      <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
        {planos.map((p) => {
          const destaque = p.destaque;
          return (
            <article
              key={p.codigo}
              data-plano={p.codigo}
              className={`rise relative flex flex-col rounded-[28px] p-8 ${
                destaque
                  ? "bg-[linear-gradient(160deg,#0e4a3a,#04261d)] text-white shadow-[0_40px_80px_-30px_rgba(4,38,29,0.8)] lg:-my-4 lg:py-12"
                  : "cartao-vivo text-tinta"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[22px] font-semibold">{p.nome}</h3>
                {destaque && (
                  <span className="rounded-full px-3 py-1 text-[14px] font-bold" style={{ background: "var(--lima)", color: "var(--noite)" }}>
                    Mais popular
                  </span>
                )}
                {p.emBreve && <span className="rounded-full bg-folha px-3 py-1 text-[14px] font-medium text-tinta">Em breve</span>}
              </div>
              <p className={`mt-2 text-[16px] ${destaque ? "text-white/80" : "text-suave"}`}>{p.resumo}</p>
              <p className="mt-8 flex items-baseline gap-2">
                <span className="text-[clamp(2.75rem,5vw,3.75rem)] font-bold leading-none tracking-tight tabular-nums">{p.preco}</span>
                <span className={`text-[16px] ${destaque ? "text-white/75" : "text-suave"}`}>{p.periodo}</span>
              </p>
              {porDia(p.preco) && (
                <p className={`mt-2 text-[15px] ${destaque ? "text-white/75" : "text-suave"}`}>{`Cerca de ${porDia(p.preco)} por dia`}</p>
              )}
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {p.itens.map((i) => (
                  <li key={i} className="flex items-start gap-3 text-[16px] leading-snug">
                    <Check size={20} weight="bold" aria-hidden className={`mt-0.5 shrink-0 ${destaque ? "text-[var(--lima)]" : "text-floresta"}`} />
                    {i}
                  </li>
                ))}
              </ul>
              <Link href={p.cta.href} className={`mt-10 ${destaque ? "botao-lima" : "botao"} !w-full`}>
                {p.cta.texto}
              </Link>
            </article>
          );
        })}
      </div>

      <ul className="rise mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center gap-x-10 gap-y-3 text-[16px] text-tinta sm:flex-row sm:flex-wrap">
        {GARANTIAS.map((g) => (
          <li key={g} className="flex items-center gap-2">
            <Check size={18} weight="bold" aria-hidden className="shrink-0 text-floresta" />
            {g}
          </li>
        ))}
      </ul>
    </section>
  );
}
