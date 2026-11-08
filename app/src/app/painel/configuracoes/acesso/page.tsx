"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cancelarConvite, criarConvite, grupoAtual, removerMembro, sairDoGrupo, type Grupo } from "@/lib/api";
import { dataLonga } from "@/lib/format";

type Estado = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; grupo: Grupo };

function mensagemDe(e: unknown): string {
  return e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes.";
}

function Inicial({ nome, destaque }: { nome: string | null; destaque?: boolean }) {
  return (
    <span aria-hidden="true" className={`grid h-10 w-10 flex-none place-items-center rounded-full font-semibold ${destaque ? "bg-floresta text-realce" : "bg-folha text-floresta"}`}>
      {(nome ?? "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function AcessoPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [link, setLink] = useState<{ url: string; expira: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    grupoAtual()
      .then((grupo) => ativo && setEstado({ tipo: "ok", grupo }))
      .catch((e: unknown) => ativo && setEstado({ tipo: "erro", mensagem: mensagemDe(e) }));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function agir(acao: () => Promise<void>) {
    setOcupado(true);
    setErro("");
    try {
      await acao();
      setTentativa((n) => n + 1);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  }

  const convidar = () =>
    agir(async () => {
      const c = await criarConvite();
      setLink({ url: `${window.location.origin}/convite/${c.codigo}`, expira: c.expira_em });
      setCopiado(false);
    });

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiado(true);
    } catch {
      setErro("Não deu para copiar sozinho. Selecione o link e copie.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">Acesso compartilhado</h2>
        <p className="mt-1 text-suave">Quem divide a vida, divide o Gastômetro. Cada pessoa entra com o próprio login e o próprio WhatsApp.</p>
      </div>

      {estado.tipo === "carregando" && <div className="cartao h-56 bg-folha/40" aria-busy="true" aria-label="Carregando" />}

      {estado.tipo === "erro" && (
        <div role="alert" className="cartao flex flex-col items-start gap-4 p-6">
          <p className="text-tinta">{estado.mensagem}</p>
          <button type="button" className="botao-contorno" onClick={() => { setEstado({ tipo: "carregando" }); setTentativa((n) => n + 1); }}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.tipo === "ok" && !estado.grupo.elegivel && estado.grupo.papel === null && (
        <section className="cartao flex flex-col items-start gap-4 p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold text-tinta">Disponível no plano Family</h3>
          <p className="max-w-[60ch] text-suave">
            No plano Family você reúne até 4 pessoas no mesmo grupo, cada uma com o próprio login e WhatsApp, e convida quem quiser por um link.
          </p>
          <Link href="/painel/configuracoes/plano" className="botao">Ver o plano Family</Link>
        </section>
      )}

      {estado.tipo === "ok" && estado.grupo.papel === "membro" && (
        <section className="cartao p-5 md:p-6" aria-labelledby="t-grupo">
          <h3 id="t-grupo" className="font-display text-lg font-semibold text-tinta">Pessoas do grupo</h3>
          <p className="mt-1 text-suave">{`Você está no grupo de ${estado.grupo.titular_nome ?? "outra pessoa"}.`}</p>
          <ul className="mt-3 divide-y divide-linha">
            {estado.grupo.membros.map((m) => (
              <li key={m.usuario_id} className="flex items-center gap-3.5 py-3">
                <Inicial nome={m.nome} destaque={m.papel === "titular"} />
                <p className="flex-1 font-medium text-tinta">
                  {m.nome ?? "Sem nome"} {m.eu && <span className="font-normal text-suave">(você)</span>}
                </p>
                <span className="rounded-full bg-folha px-3 py-1 text-sm font-medium text-tinta">{m.papel === "titular" ? "Titular" : "Membro"}</span>
              </li>
            ))}
          </ul>
          <button type="button" disabled={ocupado} onClick={() => agir(sairDoGrupo)} className="botao-contorno mt-4">Sair do grupo</button>
        </section>
      )}

      {estado.tipo === "ok" && (estado.grupo.papel === "titular" || (estado.grupo.papel === null && estado.grupo.elegivel)) && (() => {
        const g = estado.grupo;
        const limite = g.limite ?? 4;
        const total = Math.max(1, g.membros.length);
        const cheio = total + g.convites.length >= limite;
        return (
          <section className="cartao p-5 md:p-6" aria-labelledby="t-grupo">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="t-grupo" className="font-display text-lg font-semibold text-tinta">{`Pessoas do grupo · ${total} de ${limite}`}</h3>
              <button type="button" disabled={ocupado || cheio} onClick={convidar} className="botao !px-5 !py-2.5 !text-sm">Convidar alguém</button>
            </div>
            {cheio && <p className="mt-2 text-sm text-suave">O grupo está completo: o titular, as pessoas e os convites pendentes contam no limite.</p>}
            {erro && <p role="alert" className="mt-3 text-sm text-ruim-ink">{erro}</p>}

            {link && (
              <div className="mt-4 rounded-[14px] border border-linha bg-folha/50 p-4">
                <label htmlFor="link-convite" className="text-sm font-medium text-tinta">Link do convite</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input id="link-convite" readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-[12px] border border-linha bg-superficie px-3.5 py-2.5 text-sm text-tinta" />
                  <button type="button" onClick={copiar} className="botao-contorno !px-4 !py-2 !text-sm">Copiar link</button>
                </div>
                {copiado && <p role="status" className="mt-2 text-sm font-medium text-floresta">Link copiado.</p>}
                <p className="mt-2 text-sm text-suave">{`Este link aparece só agora. Envie para a pessoa: ele vale até ${dataLonga(link.expira)} e só funciona uma vez.`}</p>
              </div>
            )}

            {g.membros.length === 0 ? (
              <p className="mt-4 text-suave">Convide quem divide a vida com você. Você é o titular do grupo.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha">
                {g.membros.map((m) => (
                  <li key={m.usuario_id} className="py-3">
                    <div className="flex items-center gap-3.5">
                      <Inicial nome={m.nome} destaque={m.papel === "titular"} />
                      <p className="flex-1 font-medium text-tinta">
                        {m.nome ?? "Sem nome"} {m.eu && <span className="font-normal text-suave">(você)</span>}
                      </p>
                      {m.papel === "titular" ? (
                        <span className="rounded-full bg-folha px-3 py-1 text-sm font-medium text-tinta">Titular</span>
                      ) : (
                        <button type="button" aria-label={`Remover ${m.nome ?? "pessoa"}`} onClick={() => setRemovendo(m.usuario_id)} className="botao-contorno !px-4 !py-2 !text-sm">Remover</button>
                      )}
                    </div>
                    {removendo === m.usuario_id && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[12px] bg-ruim-bg px-4 py-3 text-sm text-ruim-ink">
                        <p className="flex-1">{`Remover ${m.nome ?? "esta pessoa"} do grupo? Ela continua com a conta e o plano dela.`}</p>
                        <button type="button" disabled={ocupado} onClick={() => agir(async () => { await removerMembro(m.usuario_id); setRemovendo(null); })} className="botao-contorno !border-ruim-ink !px-4 !py-2 !text-sm !text-ruim-ink">Confirmar remoção</button>
                        <button type="button" onClick={() => setRemovendo(null)} className="botao-contorno !px-4 !py-2 !text-sm">Cancelar</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {g.convites.length > 0 && (
              <ul aria-label="Convites pendentes" className="mt-2 flex flex-col gap-2">
                {g.convites.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-dashed border-linha px-4 py-3">
                    <div>
                      <p className="font-medium text-tinta">Convite pendente</p>
                      <p className="text-sm text-suave">{`Vale até ${dataLonga(c.expira_em)}.`}</p>
                    </div>
                    <button type="button" aria-label="Cancelar convite" disabled={ocupado} onClick={() => agir(() => cancelarConvite(c.id))} className="botao-contorno !px-4 !py-2 !text-sm">Cancelar</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })()}

      {estado.tipo === "ok" && (estado.grupo.papel !== null || estado.grupo.elegivel) && (
        <p className="rounded-[12px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
          Por enquanto cada pessoa vê só os próprios lançamentos e usa o próprio plano. A visão compartilhada do grupo, com todos os valores, chega em uma próxima etapa.
        </p>
      )}
    </div>
  );
}
