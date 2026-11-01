import type { Metadata } from "next";
import { CadastroForm } from "@/components/site/CadastroForm";

export const metadata: Metadata = { title: "Criar conta" };

const VALIDOS = ["trial", "essencial", "family"];

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  const { plano, email } = await searchParams;
  const inicial = typeof plano === "string" && VALIDOS.includes(plano) ? plano : "trial";
  // Vem da chamada final da landing; é só um preenchimento, o formulário valida de novo.
  const emailInicial = typeof email === "string" && email.length <= 120 && !/[\s<>]/.test(email) ? email : "";

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-12 px-4 py-16 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-tinta md:text-5xl">
          Crie sua conta grátis
        </h1>
        <ul className="mt-8 flex max-w-[44ch] flex-col gap-4 leading-relaxed text-suave">
          <li>7 dias para testar, sem cartão.</li>
          <li>Você confirma que o número é seu enviando uma mensagem pelo WhatsApp.</li>
          <li>Seus dados são só seus: você pode baixar ou apagar tudo quando quiser.</li>
        </ul>
      </div>
      <CadastroForm planoInicial={inicial} emailInicial={emailInicial} />
    </main>
  );
}
