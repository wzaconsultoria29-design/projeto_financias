import { Plus } from "@phosphor-icons/react/dist/ssr";

const perguntas = [
  {
    p: "Preciso instalar algum aplicativo?",
    r: "Não. Você usa o WhatsApp que já tem. O painel abre no navegador, no celular ou no computador.",
  },
  {
    p: "Como entro no painel?",
    r: "Sem senha. O site mostra um código e você o envia pelo seu próprio WhatsApp. Assim sabemos que o número é seu.",
  },
  {
    p: "O teste grátis pede cartão?",
    r: "Não. São 7 dias e 50 mensagens para experimentar. Se as mensagens acabarem antes, o assistente avisa como continuar.",
  },
  {
    p: "O assistente dá dicas de investimento?",
    r: "Não. Ele trabalha só com os lançamentos que você registrou: anota, resume e compara.",
  },
  {
    p: "Posso apagar meus dados?",
    r: "Pode, a qualquer momento. Envie MEUS DADOS para receber uma cópia ou EXCLUIR MEUS DADOS para apagar tudo.",
  },
];

export function Faq() {
  return (
    <section id="perguntas" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 md:px-8">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">Perguntas frequentes</h2>
      <div className="mt-8 flex max-w-3xl flex-col">
        {perguntas.map(({ p, r }) => (
          <details key={p} className="group border-t border-linha py-5 last:border-b">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium text-tinta [&::-webkit-details-marker]:hidden">
              {p}
              <Plus size={18} weight="bold" className="shrink-0 text-floresta transition-transform duration-200 group-open:rotate-45" aria-hidden />
            </summary>
            <p className="mt-3 max-w-[60ch] leading-relaxed text-suave">{r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
