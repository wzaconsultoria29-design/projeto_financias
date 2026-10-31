import { Camera, ChartLineUp, Microphone, UsersThree } from "@phosphor-icons/react/dist/ssr";

export function Recursos() {
  return (
    <section id="recursos" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 md:px-8">
      <h2 className="font-display max-w-[22ch] text-3xl font-semibold tracking-tight text-tinta md:text-4xl">
        Registrar é fácil. Entender o mês também.
      </h2>

      <div className="revela mt-10 grid gap-4 md:grid-cols-12">
        <article className="cartao relative overflow-hidden border-transparent p-8 md:col-span-7 md:min-h-72"
          style={{ background: "radial-gradient(120% 90% at 0% 0%, var(--folha) 0%, var(--superficie) 70%)" }}>
          <div className="flex gap-3 text-floresta" aria-hidden>
            <Microphone size={28} weight="duotone" />
            <Camera size={28} weight="duotone" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-tinta">Fale, escreva ou fotografe</h3>
          <p className="mt-3 max-w-[46ch] leading-relaxed text-suave">
            “Paguei 120 de luz” em áudio, “gastei 50 no mercado” em texto ou a foto do cupom. O assistente lê, categoriza e confirma.
          </p>
        </article>

        <article className="cartao p-8 md:col-span-5">
          <ChartLineUp size={28} weight="duotone" className="text-floresta" aria-hidden />
          <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-tinta">Painel de verdade</h3>
          <p className="mt-3 leading-relaxed text-suave">
            Gastos por dia, semana, mês e categoria. Os maiores gastos ficam à vista, e você escolhe o período que quiser.
          </p>
        </article>

        <article className="cartao p-8 md:col-span-5">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-tinta">Compare e antecipe</h3>
          <p className="mt-3 leading-relaxed text-suave">
            Veja se gastou mais ou menos que no período anterior e quanto o mês deve fechar no ritmo atual.
          </p>
        </article>

        <article
          className="cartao relative p-8 md:col-span-7"
          style={{ backgroundImage: "radial-gradient(var(--linha) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        >
          <div className="flex items-center gap-3">
            <UsersThree size={28} weight="duotone" className="text-floresta" aria-hidden />
            <span className="rounded-full bg-folha px-3 py-1 text-xs font-semibold text-floresta">Em breve</span>
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-tinta">Família no mesmo painel</h3>
          <p className="mt-3 max-w-[46ch] leading-relaxed text-suave">
            Até 4 pessoas, cada uma com o próprio WhatsApp, vendo juntas os gastos do grupo. Cada um entra por escolha e pode sair quando quiser.
          </p>
        </article>
      </div>
    </section>
  );
}
