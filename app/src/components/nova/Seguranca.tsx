import Link from "next/link";
import { Bank, CheckCircle, LockKey } from "@phosphor-icons/react/dist/ssr";
import { AFIRMACOES } from "./dados";

/** Privacidade dita sem rodeio. As frases são as mesmas da landing atual e da política de privacidade. */
export function Seguranca() {
  return (
    <section id="privacidade" className="relative scroll-mt-20 overflow-hidden py-24 md:py-32" aria-labelledby="titulo-privacidade">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="titulo-privacidade" data-revela className="nv-titulo text-[clamp(2rem,4.6vw,3.75rem)]">
            Seus dados são seus.
          </h2>
          <p data-revela style={{ "--i": 1 } as React.CSSProperties} className="nv-suave mt-5 max-w-[42ch] text-[18px] leading-relaxed">
            O assistente só sabe o que você conta. Nenhuma senha de banco, nenhuma conexão com a sua conta.
          </p>

          <div data-revela="escala" aria-hidden className="relative mx-auto mt-12 grid size-[300px] place-items-center md:size-[340px]">
            <span className="nv-anel absolute inset-0 rounded-full border border-dashed border-[var(--nv-linha-forte)]">
              <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[var(--nv-verde)] shadow-[0_0_22px_var(--nv-verde)]" />
            </span>
            <span data-inverso className="nv-anel absolute inset-[44px] rounded-full border border-[var(--nv-linha-forte)]">
              <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[var(--nv-lima)] shadow-[0_0_22px_var(--nv-lima)]" />
            </span>
            <span className="absolute inset-[92px] rounded-full bg-[rgba(39,224,139,0.14)] blur-xl" />
            <span className="relative grid size-28 place-items-center rounded-[34px] bg-[var(--nv-lima)] text-[#04130b] shadow-[0_0_80px_-10px_var(--nv-lima)]">
              <LockKey size={56} weight="fill" />
            </span>
            <span className="absolute -right-2 top-8 flex items-center gap-2 rounded-full bg-[var(--nv-sup2)] px-3.5 py-2 text-[13px] font-medium text-[var(--nv-suave)] shadow-[inset_0_0_0_1px_var(--nv-linha-forte)]">
              <Bank size={17} className="text-[var(--nv-vermelho)]" />
              <s>Conta do banco</s>
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-3 lg:col-span-7">
          {AFIRMACOES.map((a, i) => (
            <li key={a.frase} data-revela style={{ "--i": i } as React.CSSProperties} className="nv-cartao nv-foco flex gap-4 p-5 md:p-6">
              <CheckCircle size={28} weight="fill" aria-hidden className="mt-0.5 flex-none text-[var(--nv-verde)]" />
              <div>
                <p className="text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] font-semibold leading-snug">{a.frase}</p>
                <p className="nv-suave mt-1.5 text-[16px] leading-relaxed">{a.detalhe}</p>
              </div>
            </li>
          ))}
          <li data-revela className="nv-suave mt-3 text-[15px]">
            Leia a{" "}
            <Link href="/privacidade" className="font-medium text-[var(--nv-texto)] underline decoration-[var(--nv-lima)] decoration-2 underline-offset-4">política de privacidade</Link> e os{" "}
            <Link href="/termos" className="font-medium text-[var(--nv-texto)] underline decoration-[var(--nv-lima)] decoration-2 underline-offset-4">termos de uso</Link>.
          </li>
        </ul>
      </div>
    </section>
  );
}
