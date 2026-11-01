import { Camera, Microphone } from "@phosphor-icons/react/dist/ssr";
import { PainelFragmento } from "./PainelFragmento";
import type { Gasto } from "@/lib/demo";

const SEMANA: Gasto[] = [
  { descricao: "Mercado", valor: 350.7, categoria: "Alimentação" },
  { descricao: "Uber e combustível", valor: 142.5, categoria: "Transporte" },
  { descricao: "Cinema e jantar", valor: 148, categoria: "Lazer" },
];

function Resposta({ children }: { children: React.ReactNode }) {
  return <div data-ui className="rounded-[20px] bg-superficie p-5 text-[16px] leading-snug text-tinta">{children}</div>;
}

function Chamada({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[20px] bg-folha p-5 text-[17px] text-tinta">{children}</div>;
}

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-24 md:px-8 md:py-32">
      <div className="lg:ml-[25%]">
        <h2 className="lp-display rise text-[clamp(2rem,4.2vw,3.5rem)] text-tinta">Como funciona</h2>

        <div className="mt-14 flex max-w-[560px] flex-col gap-20">
          <div className="rise">
            <p className="text-xl font-medium text-tinta">Primeiro, mande o gasto.</p>
            <div className="mt-4">
              <Chamada>gastei 87,50 no mercado</Chamada>
            </div>
            <div className="mt-4 md:ml-14">
              <Resposta>
                <p className="font-medium">Anotado.</p>
                <p className="mt-2 text-suave">Despesa de <span className="font-medium text-tinta">R$ 87,50</span></p>
                <p className="text-suave">Alimentação, Supermercado</p>
                <p className="mt-2 text-suave">Para apagar, envie o código que vem junto.</p>
              </Resposta>
            </div>
          </div>

          <div className="rise">
            <p className="text-xl font-medium text-tinta">Depois, por áudio ou foto.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Chamada>
                <span className="flex items-center gap-3"><Microphone size={22} aria-hidden /> Áudio, 4 segundos</span>
              </Chamada>
              <Chamada>
                <span className="flex items-center gap-3"><Camera size={22} aria-hidden /> Foto do cupom</span>
              </Chamada>
            </div>
            <div className="mt-4 md:ml-14">
              <Resposta>
                <p className="font-medium">Entendi: R$ 120,00 de luz.</p>
                <p className="mt-2 text-suave">Despesas Fixas, Luz</p>
                <p className="text-suave">Se algo estiver errado, é só responder corrigindo.</p>
              </Resposta>
            </div>
          </div>
        </div>

        <div className="rise mt-20">
          <p className="max-w-[560px] text-xl font-medium text-tinta">Por fim, pergunte.</p>
          <div className="mt-4 max-w-[560px]">
            <Chamada>quanto gastei essa semana?</Chamada>
          </div>
          <div className="mt-4 lg:w-[760px] lg:max-w-[calc(100vw-25%-4rem)]">
            <PainelFragmento titulo="Esta semana" itens={SEMANA} recentes={0} />
          </div>
        </div>
      </div>
    </section>
  );
}
