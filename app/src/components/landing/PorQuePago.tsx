import { brand } from "@/config/brand";

const PONTOS = [
  { titulo: "Sem anúncios", texto: "Nenhum banner nem oferta no meio dos seus lançamentos. O painel é só seu." },
  { titulo: "Você sabe o que paga", texto: "Preço final à vista antes de assinar, sem taxa escondida e sem fidelidade." },
  { titulo: "Incentivo alinhado", texto: "Só continuamos de pé se você achar que vale a pena, mês após mês." },
];

/** Responde antes da objeção: aplicativo grátis costuma se pagar de outro jeito. */
export function PorQuePago() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8 md:pb-32" aria-labelledby="titulo-por-que-pago">
      <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div className="rise">
          <h2 id="titulo-por-que-pago" className="lp-display text-[clamp(1.75rem,3.6vw,3rem)] text-tinta">{`Por que o ${brand.name} é pago?`}</h2>
          <p className="mt-4 max-w-[40ch] text-[18px] leading-relaxed text-suave">
            Aplicativo de finanças grátis costuma se pagar de outro jeito: com anúncios ou com ofertas de crédito no meio da tela. Aqui, quem sustenta o produto é a assinatura.
          </p>
        </div>
        <ul className="flex flex-col gap-8">
          {PONTOS.map((p) => (
            <li key={p.titulo} className="rise">
              <p className="text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] font-semibold leading-tight text-tinta">{p.titulo}</p>
              <p className="mt-1.5 max-w-[52ch] text-[17px] leading-relaxed text-suave">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
