const PERGUNTAS = [
  { q: "Preciso instalar algum aplicativo?", a: "Não. Você usa o WhatsApp que já tem. O painel abre no navegador, no celular ou no computador." },
  { q: "O teste grátis pede cartão?", a: "Não. São 7 dias sem cartão, com 50 mensagens. Quem registra 5 gastos ganha mais 3 dias." },
  { q: "Como entro no painel?", a: "Pelo site, confirmando que o número é seu pelo WhatsApp. Se perder o acesso, é só pedir de novo." },
  { q: "O assistente dá dicas?", a: "Só se você perguntar. Ele analisa os seus gastos e sugere algo leve, como um teto para uma categoria. Não dá conselho de investimento nem indica bancos, aplicativos ou produtos." },
  { q: "Vocês acessam minha conta bancária?", a: "Não. Você registra só o que quiser, e nós só vemos o que você mandar." },
  { q: "Posso apagar meus dados?", a: "Sim. MEUS DADOS baixa tudo o que guardamos. EXCLUIR MEUS DADOS apaga lançamentos e conversas e anonimiza o cadastro." },
  { q: "O plano Family já existe?", a: "Está em desenvolvimento. Cadastre-se para ser avisado quando abrir." },
];

export function Faq() {
  return (
    <section id="perguntas" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 pb-24 md:px-8 md:pb-32" aria-labelledby="titulo-faq">
      <div className="grid gap-10 md:grid-cols-12 md:gap-8">
        <h2 id="titulo-faq" className="lp-display rise text-[clamp(2rem,4vw,3.25rem)] text-tinta md:sticky md:top-24 md:col-span-4 md:self-start">Perguntas frequentes</h2>
        <div className="flex flex-col gap-2 md:col-span-8">
          {PERGUNTAS.map((p) => (
            <details key={p.q} name="faq" className="pergunta rise rounded-[20px] bg-folha text-tinta transition-colors">
              <summary className="flex min-h-[72px] items-center justify-between gap-6 px-6 py-4 text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] font-medium">
                {p.q}
                <span aria-hidden className="mais" />
              </summary>
              <p className="max-w-[52ch] px-6 pb-6 text-[17px] leading-relaxed">{p.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
