import Link from "next/link";
import { Objeto3d } from "./Objeto3d";

const AFIRMACOES = [
  { frase: "Não acessamos sua conta bancária.", detalhe: "Você registra só o que quiser, do jeito que quiser." },
  { frase: "Cada pessoa vê só os próprios dados.", detalhe: "O isolamento é feito no banco de dados, não só na tela." },
  { frase: "Baixe tudo quando quiser.", detalhe: "Envie MEUS DADOS no WhatsApp e receba um resumo e um arquivo com todos os lançamentos." },
  { frase: "Apague tudo com uma mensagem.", detalhe: "EXCLUIR MEUS DADOS remove lançamentos e conversas e anonimiza o cadastro." },
  { frase: "Sem anúncios nem oferta de crédito.", detalhe: "Quem sustenta o produto é a assinatura, não os seus dados. Só seguimos de pé se você achar que vale." },
];

export function Privacidade() {
  return (
    <section id="privacidade" className="fundo-noite grao relative scroll-mt-16 overflow-hidden text-sobre-bloco" aria-labelledby="titulo-privacidade">
      <Objeto3d nome="folha" lento className="absolute -right-6 top-10 hidden size-56 opacity-90 md:block lg:right-16 lg:size-72" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <h2 id="titulo-privacidade" className="lp-display rise text-[clamp(2rem,4.6vw,3.75rem)]">Seus dados são seus</h2>

        <ul className="mt-14 flex flex-col gap-10 md:ml-[12%] md:gap-12">
          {AFIRMACOES.map((a) => (
            <li key={a.frase} className="rise max-w-[640px]">
              <p className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold leading-tight">{a.frase}</p>
              <p className="mt-2 text-[17px] leading-relaxed text-sobre-bloco/80">{a.detalhe}</p>
            </li>
          ))}
        </ul>

        <p className="rise mt-14 text-[16px] text-sobre-bloco/80 md:ml-[12%]">
          Leia a{" "}
          <Link href="/privacidade" className="font-medium text-sobre-bloco underline decoration-2 underline-offset-4">política de privacidade</Link> e os{" "}
          <Link href="/termos" className="font-medium text-sobre-bloco underline decoration-2 underline-offset-4">termos de uso</Link>.
        </p>
      </div>
    </section>
  );
}
