import type { Metadata } from "next";
import { Checks, Clock, ShieldCheck, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { CadastroForm } from "@/components/site/CadastroForm";

export const metadata: Metadata = { title: "Criar conta" };

const VALIDOS = ["trial", "essencial", "family"];

const VANTAGENS = [
  { Icone: Clock, texto: "7 dias para testar, sem cartão." },
  { Icone: WhatsappLogo, texto: "Você confirma que o número é seu enviando uma mensagem pelo WhatsApp." },
  { Icone: ShieldCheck, texto: "Seus dados são só seus: você pode baixar ou apagar tudo quando quiser." },
];

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  const { plano, email } = await searchParams;
  const inicial = typeof plano === "string" && VALIDOS.includes(plano) ? plano : "trial";
  // Vem da chamada final da landing; é só um preenchimento, o formulário valida de novo.
  const emailInicial = typeof email === "string" && email.length <= 120 && !/[\s<>]/.test(email) ? email : "";

  return (
    <main className="relative mx-auto grid w-full max-w-7xl flex-1 gap-12 px-4 pb-20 pt-28 md:px-8 md:pt-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-[-10vw] top-0 -z-10 h-[520px]">
        <div className="nv-aurora left-[-8%] top-[-30%] h-[460px] w-[520px] bg-[rgba(39,224,139,0.2)]" />
        <div className="nv-aurora right-[-6%] top-[-10%] h-[380px] w-[440px] bg-[rgba(200,246,93,0.12)]" />
      </div>

      <div>
        <h1 className="nv-titulo text-[clamp(2.25rem,5vw,3.75rem)]">
          Crie sua conta <span className="nv-degrade-texto">grátis</span>
        </h1>
        <ul className="mt-8 flex max-w-[46ch] flex-col gap-5">
          {VANTAGENS.map(({ Icone, texto }) => (
            <li key={texto} className="flex items-start gap-4 text-[17px] leading-relaxed">
              <span aria-hidden className="grid size-11 flex-none place-items-center rounded-[14px] bg-[rgba(200,246,93,0.12)] text-[var(--nv-lima)]">
                <Icone size={22} weight="fill" />
              </span>
              <span className="pt-2">{texto}</span>
            </li>
          ))}
        </ul>

        <div aria-hidden data-ui className="nv-conversa mt-10 hidden max-w-[360px] flex-col gap-2 rounded-[24px] p-4 shadow-[inset_0_0_0_1px_var(--nv-linha-forte)] lg:flex">
          <p className="nv-balao" data-de="eu">ATIVAR 4K7P2M</p>
          <p className="nv-balao" data-de="bot">
            Número confirmado! Agora é só me mandar um gasto, como &quot;gastei 32 no almoço&quot;.
            <Checks size={14} weight="bold" className="ml-2 inline text-[#53bdeb]" />
          </p>
        </div>
      </div>
      <CadastroForm planoInicial={inicial} emailInicial={emailInicial} />
    </main>
  );
}
