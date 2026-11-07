import type { ReactNode } from "react";

/** Uma barra cinza chapada do tamanho do valor que vai chegar (sem brilho nem animação). */
function Barra({ w = "100%", h = 14, className = "" }: { w?: number | string; h?: number; className?: string }) {
  return <span aria-hidden="true" className={`block rounded-[6px] bg-d-trilho ${className}`} style={{ width: w, height: h }} />;
}

function Cartao({ altura, children }: { altura: number; children: ReactNode }) {
  return (
    <div data-esqueleto-cartao className="cartao p-5 md:p-6" style={{ minHeight: altura }}>
      {children}
    </div>
  );
}

const Titulo = ({ w = 190 }: { w?: number }) => <Barra w={w} h={22} />;

function Linhas({ n, gap = 16 }: { n: number; gap?: number }) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex justify-between gap-6">
            <Barra w={110} h={16} />
            <Barra w={90} h={16} />
          </div>
          <Barra h={8} />
        </div>
      ))}
    </div>
  );
}

/**
 * O carregamento tem o desenho da tela pronta: as mesmas duas colunas, os mesmos nove cartões e alturas parecidas.
 * Quando os dados chegam, nada muda de lugar.
 */
export function EsqueletoPainel() {
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start" aria-busy="true" aria-label="Carregando">
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Cartao altura={326}>
          <Barra w={120} h={14} />
          <div className="mt-4">
            <Barra w={230} h={36} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-linha pt-4">
            <div className="flex flex-col gap-2">
              <Barra w={70} h={12} />
              <Barra w={120} h={22} />
            </div>
            <div className="flex flex-col gap-2">
              <Barra w={70} h={12} />
              <Barra w={120} h={22} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex justify-between">
              <Barra w={110} h={14} />
              <Barra w={50} h={14} />
            </div>
            <Barra h={8} />
          </div>
        </Cartao>
        <Cartao altura={320}>
          <Titulo w={200} />
          <div className="mt-5 flex flex-col gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Barra h={14} />
                <Barra w="70%" h={14} />
              </div>
            ))}
          </div>
        </Cartao>
        <Cartao altura={338}>
          <Titulo w={260} />
          <div className="mt-4">
            <Barra h={12} className="!rounded-full" />
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between gap-6">
                <Barra w={120} h={16} />
                <Barra w={150} h={16} />
              </div>
            ))}
          </div>
        </Cartao>
        <Cartao altura={222}>
          <Titulo w={160} />
          <div className="mt-4">
            <Barra h={12} className="!rounded-full" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Barra w={130} h={34} />
            <Barra w={130} h={34} />
          </div>
        </Cartao>
        <Cartao altura={170}>
          <Titulo w={140} />
          <div className="mt-5 flex justify-between gap-6">
            <div className="flex flex-col gap-2">
              <Barra w={180} h={16} />
              <Barra w={110} h={12} />
            </div>
            <Barra w={90} h={16} />
          </div>
        </Cartao>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-7">
        <Cartao altura={536}>
          <Titulo w={170} />
          <div className="mt-4 flex gap-10">
            <Barra w={110} h={34} />
            <Barra w={150} h={34} />
          </div>
          <div className="mt-5">
            <Barra h={210} />
          </div>
          <div className="mt-6 border-t border-linha pt-5">
            <Barra w="60%" h={14} />
            <div className="mt-3 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => (
                <Barra key={i} h={56} />
              ))}
            </div>
          </div>
        </Cartao>
        <Cartao altura={430}>
          <Titulo w={240} />
          <div className="mt-5">
            <Linhas n={4} gap={22} />
          </div>
        </Cartao>
        <Cartao altura={295}>
          <Titulo w={190} />
          <div className="mt-4">
            <Barra h={200} />
          </div>
        </Cartao>
        <Cartao altura={150}>
          <Titulo w={230} />
          <div className="mt-4 flex gap-2">
            <Barra w={170} h={44} className="!rounded-full" />
            <Barra w={230} h={44} className="!rounded-full" />
          </div>
        </Cartao>
      </div>
    </div>
  );
}
