import { Camera, Microphone, TextT } from "@phosphor-icons/react/dist/ssr";
import { PERGUNTAS, responder } from "@/lib/demo-dados";

const BARRAS = [
  { nome: "Alimentação", pct: 62 },
  { nome: "Transporte", pct: 34 },
  { nome: "Lazer", pct: 18 },
];

/** Um passo: o número, a linha tracejada que se preenche até o próximo e o cartão com a demonstração. */
function Passo({ n, ultimo, titulo, texto, children }: { n: number; ultimo?: boolean; titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <li className="rise flex flex-col" style={{ transitionDelay: `${(n - 1) * 140}ms` }}>
      <div aria-hidden className="mb-4 flex items-center gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-[var(--botao)] text-[17px] font-semibold text-[var(--botao-fg)]">{n}</span>
        {!ultimo && (
          <span className="trilha hidden lg:block">
            <span className="preenche" style={{ transitionDelay: `${n * 450}ms` }} />
          </span>
        )}
      </div>
      <article className="cartao-vivo flex flex-1 flex-col overflow-hidden p-7 md:p-8">
        <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold leading-tight text-tinta">{titulo}</h3>
        <p className="mt-3 max-w-[34ch] text-[17px] leading-relaxed text-suave">{texto}</p>
        <div data-ui className="mt-8 flex min-h-[230px] flex-1 flex-col justify-end gap-2.5 rounded-[20px] bg-papel p-4">
          {children}
        </div>
      </article>
    </li>
  );
}

export function ComoFunciona() {
  const resposta = responder(PERGUNTAS[1]).split(". ")[0] + ".";
  return (
    <section id="como-funciona" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-24 md:px-8 md:py-32">
      <h2 className="lp-display rise mx-auto text-center text-[clamp(2rem,4.4vw,3.75rem)] text-tinta">Como funciona</h2>
      <p className="rise mx-auto mt-4 max-w-[48ch] text-center text-[18px] leading-relaxed text-suave">Você manda. O assistente entende, organiza e responde. O painel mostra o resto.</p>

      <ol aria-label="Três passos" className="mt-14 grid gap-8 lg:grid-cols-3 lg:gap-5">
        <Passo n={1} titulo="Mande do seu jeito" texto="Escreva, grave um áudio ou fotografe o cupom. Do jeito que você falaria com um amigo.">
          <div className="mb-1 flex gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-folha px-3 py-1.5 text-[14px] text-tinta"><TextT size={16} aria-hidden /> Texto</span>
            <span className="flex items-center gap-1.5 rounded-full bg-folha px-3 py-1.5 text-[14px] text-tinta"><Microphone size={16} aria-hidden /> Áudio</span>
            <span className="flex items-center gap-1.5 rounded-full bg-folha px-3 py-1.5 text-[14px] text-tinta"><Camera size={16} aria-hidden /> Foto</span>
          </div>
          <p className="entra-msg self-end rounded-2xl rounded-br-md bg-[var(--botao)] px-4 py-2.5 text-[16px] text-[var(--botao-fg)]">gastei 87,50 no mercado</p>
          <p className="flex w-fit items-center gap-1 self-start rounded-2xl rounded-bl-md bg-superficie px-4 py-3" aria-hidden>
            <span className="ponto size-2 rounded-full bg-suave" />
            <span className="ponto size-2 rounded-full bg-suave" />
            <span className="ponto size-2 rounded-full bg-suave" />
          </p>
        </Passo>

        <Passo n={2} titulo="Tudo no lugar, sozinho" texto="Valor, data e categoria entram sem você preencher nada. Se algo estiver errado, é só corrigir.">
          {BARRAS.map((b) => (
            <div key={b.nome}>
              <div className="flex justify-between text-[15px] text-tinta">
                <span className="font-medium">{b.nome}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-folha">
                <div className="cresce h-full rounded-full bg-floresta" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </Passo>

        <Passo n={3} ultimo titulo="Pergunte e ele analisa" texto="Quando você perguntar, ele olha só os seus lançamentos e sugere algo leve. Nunca puxa assunto.">
          <p className="self-end rounded-2xl rounded-br-md bg-[var(--botao)] px-4 py-2.5 text-[16px] text-[var(--botao-fg)]">{PERGUNTAS[1]}</p>
          <p className="self-start rounded-2xl rounded-bl-md bg-superficie px-4 py-2.5 text-[15px] leading-snug text-tinta">{resposta}</p>
        </Passo>
      </ol>
    </section>
  );
}
