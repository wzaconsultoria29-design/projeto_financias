import Link from "next/link";
import { ChatCircleDots, Compass } from "@phosphor-icons/react/dist/ssr";
import type { Painel } from "@/lib/api";
import { brand } from "@/config/brand";
import { proximosPassos, type AcaoPasso } from "@/lib/narrativa";
import { Capitulo } from "./Capitulo";

const PERGUNTAS = ["Onde posso economizar?", "Estou gastando muito com alimentação?", "Quanto gastei esta semana?"];

const BOTAO_PRIMARIO = "botao !px-5 !py-2.5 !text-sm self-start";
const BOTAO_SECUNDARIO = "botao-contorno !px-5 !py-2.5 !text-sm self-start";

function Acao({ acao, primario, onLancar }: { acao: AcaoPasso; primario: boolean; onLancar: () => void }) {
  const classe = primario ? BOTAO_PRIMARIO : BOTAO_SECUNDARIO;
  if (acao.tipo === "lancar") {
    return (
      <button type="button" onClick={onLancar} className={classe}>
        {acao.rotulo}
      </button>
    );
  }
  if (acao.tipo === "link") {
    return (
      <Link href={acao.href} className={classe}>
        {acao.rotulo}
      </Link>
    );
  }
  return (
    <a href={brand.botWaUrl(acao.pergunta)} target="_blank" rel="noopener noreferrer" className={classe}>
      {acao.rotulo}
    </a>
  );
}

/** O fim da história: o que fazer agora, escolhido pelos números do período, e perguntas prontas para o assistente. */
export function ProximosPassos({ p, onLancar }: { p: Painel; onLancar: () => void }) {
  const passos = proximosPassos(p);

  return (
    <Capitulo id="passos" titulo="O que fazer agora" icone={Compass} manchete="Passos escolhidos pelos seus números deste período.">
      <ul className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        {passos.map((passo, i) => (
          <li key={passo.id} className="flex flex-col justify-between gap-4 rounded-[16px] bg-papel p-[18px]">
            <p className="leading-snug text-tinta">{passo.texto}</p>
            <Acao acao={passo.acao} primario={i === 0} onLancar={onLancar} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="text-sm text-suave">Ou pergunte direto:</span>
        <ul aria-label="Perguntas sugeridas" className="contents">
          {PERGUNTAS.map((q) => (
            <li key={q}>
              <a
                href={brand.botWaUrl(q)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-linha px-4 text-sm text-tinta transition-colors hover:border-floresta hover:bg-folha"
              >
                <ChatCircleDots size={18} aria-hidden="true" />
                {q}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Capitulo>
  );
}
