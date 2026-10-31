import { ChartBar, ChatCircleText, ListChecks } from "@phosphor-icons/react/dist/ssr";

const passos = [
  {
    verbo: "Mande",
    texto: "Escreva, grave um áudio ou fotografe o cupom. Do jeito que você falaria com um amigo.",
    Icone: ChatCircleText,
  },
  {
    verbo: "Organizamos",
    texto: "Valor, data e categoria entram sozinhos. A resposta mostra o que foi anotado e você corrige se precisar.",
    Icone: ListChecks,
  },
  {
    verbo: "Acompanhe",
    texto: "Abra o painel e veja o dinheiro por dia, semana, mês e categoria, com comparação e projeção do mês.",
    Icone: ChartBar,
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 md:px-8">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">
            Sem aplicativo novo. Sem planilha.
          </h2>
          <p className="mt-4 max-w-[40ch] leading-relaxed text-suave">
            Você já usa o WhatsApp todo dia. É lá que o gasto entra.
          </p>
        </div>
        <ol className="flex flex-col gap-12">
          {passos.map(({ verbo, texto, Icone }) => (
            <li key={verbo} className="revela flex gap-5">
              <span className="mt-1 grid size-12 shrink-0 place-items-center rounded-full bg-folha text-floresta">
                <Icone size={24} weight="duotone" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-tinta">{verbo}</h3>
                <p className="mt-2 max-w-[52ch] leading-relaxed text-suave">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
