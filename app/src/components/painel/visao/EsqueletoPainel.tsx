import type { ReactNode } from "react";

/** Uma barra cinza chapada do tamanho do valor que vai chegar (sem brilho nem animação). */
function Barra({ w = "100%", h = 14, className = "" }: { w?: number | string; h?: number; className?: string }) {
  return <span aria-hidden="true" className={`block rounded-[6px] bg-d-trilho ${className}`} style={{ width: w, height: h }} />;
}

function Cartao({ altura, className, children }: { altura: number; className: string; children: ReactNode }) {
  return (
    <div data-esqueleto-cartao className={`cartao p-5 md:p-6 ${className}`} style={{ minHeight: altura }}>
      {children}
    </div>
  );
}

const Titulo = ({ w = 190 }: { w?: number }) => (
  <div className="flex flex-col gap-2.5">
    <Barra w={w} h={22} />
    <Barra w="75%" h={16} />
  </div>
);

function Linhas({ n, gap = 20 }: { n: number; gap?: number }) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex justify-between gap-6">
            <Barra w={120} h={16} />
            <Barra w={90} h={16} />
          </div>
          <Barra h={10} className="!rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * O carregamento tem o desenho da tela pronta: a abertura em cor cheia e, abaixo, as mesmas linhas de cartões na mesma ordem
 * (nove cartões no total). Quando os dados chegam, nada muda de lugar.
 */
export function EsqueletoPainel() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
      <div data-esqueleto-cartao className="rounded-[24px] bg-hero/90 p-6 md:grid md:min-h-[260px] md:grid-cols-[1.15fr_1fr] md:gap-9 md:p-8">
        <div className="flex flex-col gap-4">
          <span aria-hidden="true" className="block h-3.5 w-28 rounded-[6px] bg-white/20" />
          <span aria-hidden="true" className="block h-8 w-[80%] rounded-[6px] bg-white/20" />
          <span aria-hidden="true" className="block h-10 w-56 rounded-[6px] bg-white/20" />
          <div className="flex gap-2.5">
            <span aria-hidden="true" className="block h-8 w-40 rounded-full bg-white/15" />
            <span aria-hidden="true" className="block h-8 w-40 rounded-full bg-white/15" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4 md:mt-0">
          <span aria-hidden="true" className="block h-3 w-full rounded-full bg-white/20" />
          <span aria-hidden="true" className="block h-24 w-full rounded-[16px] bg-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Cartao altura={380} className="lg:col-span-5">
          <Titulo w={150} />
          <div className="mt-5 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Barra key={i} h={62} className="!rounded-[14px]" />
            ))}
          </div>
        </Cartao>
        <Cartao altura={450} className="lg:col-span-7">
          <Titulo w={240} />
          <div className="mt-5">
            <Linhas n={4} />
          </div>
        </Cartao>
        <Cartao altura={400} className="lg:col-span-7">
          <Titulo w={270} />
          <div className="mt-5">
            <Barra h={14} className="!rounded-full" />
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between gap-6">
                <Barra w={130} h={16} />
                <Barra w={170} h={16} />
              </div>
            ))}
          </div>
        </Cartao>
        <Cartao altura={300} className="lg:col-span-5">
          <Titulo w={160} />
          <div className="mt-5">
            <Barra h={14} className="!rounded-full" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Barra w={130} h={34} />
            <Barra w={130} h={34} />
          </div>
        </Cartao>
        <Cartao altura={480} className="lg:col-span-12">
          <Titulo w={200} />
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px]">
            <Barra h={230} />
            <div className="flex flex-col gap-4">
              <Barra w={200} h={34} />
              <Barra h={70} />
            </div>
          </div>
        </Cartao>
        <Cartao altura={330} className="lg:col-span-7">
          <Titulo w={190} />
          <div className="mt-5">
            <Barra h={200} />
          </div>
        </Cartao>
        <Cartao altura={260} className="lg:col-span-5">
          <Titulo w={150} />
          <div className="mt-5 flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between gap-6">
                <Barra w={150} h={18} />
                <Barra w={90} h={18} />
              </div>
            ))}
          </div>
        </Cartao>
        <Cartao altura={200} className="lg:col-span-12">
          <Titulo w={210} />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Barra key={i} h={92} className="!rounded-[16px]" />
            ))}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
