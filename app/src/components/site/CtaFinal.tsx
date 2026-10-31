import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="revela rounded-[var(--raio-cartao)] bg-bloco px-8 py-16 text-sobre-bloco md:px-16 md:py-20">
        <h2 className="max-w-[18ch] font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          Comece pelo seu próximo gasto.
        </h2>
        <p className="mt-4 max-w-[44ch] leading-relaxed opacity-80">7 dias grátis, sem cartão.</p>
        <Link href="/cadastro" className="botao-bloco mt-8">Começar grátis</Link>
      </div>
    </section>
  );
}
