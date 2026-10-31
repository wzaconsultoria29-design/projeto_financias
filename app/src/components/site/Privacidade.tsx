import Link from "next/link";

export function Privacidade() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="revela max-w-4xl border-t border-linha pt-14">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">Seus dados são só seus</h2>
        <p className="mt-6 max-w-[34ch] font-display text-2xl leading-snug tracking-tight text-tinta md:text-4xl md:leading-[1.2]">
          Não acessamos sua conta bancária. Você registra só o que quiser. E apaga tudo com uma mensagem.
        </p>
        <p className="mt-6 max-w-[60ch] leading-relaxed text-suave">
          O assistente trabalha apenas com os lançamentos que você enviou: não dá dica de investimento e não indica produtos.
          Envie MEUS DADOS para receber uma cópia ou EXCLUIR MEUS DADOS para encerrar, quando quiser.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link href="/privacidade" className="text-floresta underline underline-offset-4">Política de privacidade</Link>
          <Link href="/termos" className="text-floresta underline underline-offset-4">Termos de uso</Link>
        </div>
      </div>
    </section>
  );
}
