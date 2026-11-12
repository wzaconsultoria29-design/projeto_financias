"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check } from "@phosphor-icons/react";
import { iniciarPagamento, minhaConta, planoEPagamentos, type Conta, type PlanoEPagamentos } from "@/lib/api";
import { irPara } from "@/lib/navegar";
import { brl, dataLonga } from "@/lib/format";
import { planos as VITRINE } from "@/config/planos";
import { UsoPlano } from "@/components/painel/UsoPlano";

const STATUS_ASSINATURA: Record<string, string> = { trial: "Teste grátis", ativa: "Ativa", inadimplente: "Pagamento pendente" };
const STATUS_PAGAMENTO: Record<string, string> = { pago: "Pago", pendente: "Pendente", falhou: "Falhou", reembolsado: "Reembolsado" };

type Dados = { conta: Conta; plano: PlanoEPagamentos };
type Estado = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; dados: Dados };

const RETORNO: Record<string, string> = {
  ok: "Pagamento aprovado. O seu plano é ativado em instantes; se ainda não mudou, atualize a página.",
  pendente: "Pagamento pendente. Assim que o Mercado Pago confirmar (Pix e boleto podem levar um tempo), o plano é ativado sozinho.",
  falhou: "O pagamento não foi concluído e o seu plano não mudou. Você pode tentar de novo.",
};
const DIAS_PARA_AVISAR = 7;
const semAssinar = () => () => {};

/** Como a pessoa voltou do checkout do Mercado Pago (?pagamento=ok|pendente|falhou), lido só no navegador. */
function useRetornoDoPagamento(): string | null {
  return useSyncExternalStore(semAssinar, () => new URLSearchParams(window.location.search).get("pagamento"), () => null);
}

/** Quantos dias faltam para o fim do período pago (negativo = já venceu); null quando não há vencimento. */
function diasParaVencer(fim: string | null): number | null {
  if (!fim) return null;
  return Math.ceil((Date.parse(fim) - Date.now()) / 86_400_000);
}

function mensagemDe(e: unknown): string {
  return e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes.";
}

export default function PlanoPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const [pagando, setPagando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const retorno = useRetornoDoPagamento();

  useEffect(() => {
    let ativo = true;
    Promise.all([minhaConta(), planoEPagamentos()])
      .then(([conta, plano]) => ativo && setEstado({ tipo: "ok", dados: { conta, plano } }))
      .catch((e: unknown) => ativo && setEstado({ tipo: "erro", mensagem: mensagemDe(e) }));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  // O aviso do Mercado Pago pode chegar um pouco depois da volta do checkout: relê o plano algumas vezes.
  useEffect(() => {
    if (retorno !== "ok" && retorno !== "pendente") return;
    const ids = [4000, 9000, 16000].map((ms) => setTimeout(() => setTentativa((n) => n + 1), ms));
    return () => ids.forEach(clearTimeout);
  }, [retorno]);

  /** Abre o checkout do plano. O botão fica desligado até a página sair, para não gerar duas cobranças. */
  async function pagar(codigo: string) {
    setPagando(codigo);
    setErro("");
    try {
      irPara(await iniciarPagamento(codigo));
    } catch (e) {
      setErro(mensagemDe(e));
      setPagando(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-tinta">Plano e pagamentos</h2>
        <p className="mt-1 text-suave">O que você tem hoje, como mudar e o histórico das cobranças.</p>
      </div>

      {retorno && RETORNO[retorno] && (
        <p role="status" className={`rounded-[16px] px-4 py-3 text-sm font-medium ${retorno === "ok" ? "bg-bom-bg text-bom-ink" : retorno === "falhou" ? "bg-ruim-bg text-ruim-ink" : "bg-folha text-tinta"}`}>
          {RETORNO[retorno]}
        </p>
      )}

      {estado.tipo === "carregando" && <div className="cartao h-64 bg-folha/40" aria-busy="true" aria-label="Carregando" />}

      {estado.tipo === "erro" && (
        <div role="alert" className="cartao flex flex-col items-start gap-4 p-6">
          <p className="text-tinta">{estado.mensagem}</p>
          <button type="button" className="botao-contorno" onClick={() => { setEstado({ tipo: "carregando" }); setTentativa((n) => n + 1); }}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.tipo === "ok" && (
        <>
          <section className="cartao p-5 md:p-6" aria-labelledby="t-plano-atual">
            <h3 id="t-plano-atual" className="font-display text-lg font-semibold text-tinta">Seu plano</h3>
            <p className="mt-2 text-xl font-semibold text-tinta">
              {estado.dados.conta.plano ? estado.dados.conta.plano.nome : "Nenhum plano ativo"}
              {estado.dados.conta.plano && estado.dados.conta.plano.preco_centavos > 0 && (
                <span className="ml-2 text-base font-normal text-suave">{`${brl(estado.dados.conta.plano.preco_centavos / 100)} por mês`}</span>
              )}
            </p>
            {estado.dados.conta.assinatura && (
              <p className="mt-1 text-suave">
                {STATUS_ASSINATURA[estado.dados.conta.assinatura.status] ?? estado.dados.conta.assinatura.status}
                {estado.dados.conta.assinatura.periodo_fim ? `, até ${dataLonga(estado.dados.conta.assinatura.periodo_fim)}` : ""}
              </p>
            )}
            {(() => {
              const { plano, assinatura } = estado.dados.conta;
              const dias = diasParaVencer(assinatura?.periodo_fim ?? null);
              if (!plano || plano.preco_centavos <= 0 || !assinatura?.periodo_fim || dias === null || dias > DIAS_PARA_AVISAR) return null;
              return (
                <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] px-4 py-3 ${dias <= 0 ? "bg-ruim-bg text-ruim-ink" : "bg-lima-suave text-tinta"}`}>
                  <p className="text-sm font-medium">
                    {dias <= 0
                      ? `O seu plano venceu em ${dataLonga(assinatura.periodo_fim)}. Renove para o assistente voltar a responder.`
                      : `O seu plano vence em ${dias} ${dias === 1 ? "dia" : "dias"}. Renovando agora, o mês novo começa depois do fim do atual.`}
                  </p>
                  <button type="button" disabled={pagando !== null} onClick={() => pagar(plano.codigo)} className="botao !px-5 !py-2.5 !text-sm">
                    {pagando === plano.codigo ? "Abrindo o pagamento…" : `Renovar o ${plano.nome} por mais 1 mês`}
                  </button>
                </div>
              );
            })()}
            <div className="mt-5 border-t border-linha pt-5">
              <UsoPlano uso={estado.dados.conta.uso} />
            </div>
          </section>

          <section aria-labelledby="t-mudar" className="flex flex-col gap-3">
            <h3 id="t-mudar" className="font-display text-lg font-semibold text-tinta">Mudar de plano</h3>

            <p className="text-sm text-suave">O pagamento é feito no Mercado Pago (Pix, cartão ou boleto) e vale por 1 mês. Não há renovação automática: perto do fim, avisamos aqui.</p>
            {erro && <p role="alert" className="text-sm text-ruim-ink">{erro}</p>}

            <div className="grid gap-3.5 md:grid-cols-3">
              {VITRINE.map((p) => {
                const atual = estado.dados.plano.atual === p.codigo;
                const pago = p.codigo !== "trial";
                return (
                  <article key={p.codigo} aria-label={p.nome} className={`flex flex-col gap-3 rounded-[28px] border-2 p-6 shadow-[var(--sombra)] ${atual ? "border-verde-escuro bg-superficie" : "border-transparent bg-superficie"}`}>
                    <h4 className="font-display text-lg font-semibold text-tinta">{p.nome}</h4>
                    <p className="flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-bold tracking-tight text-tinta">{p.preco}</span>
                      <span className="text-sm text-suave">{p.periodo}</span>
                    </p>
                    <ul className="flex flex-1 flex-col gap-1.5 text-sm text-suave">
                      {p.itens.map((i) => (
                        <li key={i} className="flex gap-2">
                          <Check aria-hidden="true" weight="bold" className="mt-0.5 h-4 w-4 flex-none text-floresta" />
                          {i}
                        </li>
                      ))}
                    </ul>
                    {atual && <span className="self-start rounded-full bg-lima px-3 py-1 text-xs font-bold text-[#0b3a22]">Seu plano</span>}
                    {!atual && pago && (
                      <button type="button" disabled={pagando !== null} onClick={() => pagar(p.codigo)} className="botao self-start !px-5 !py-2.5 !text-sm">
                        {pagando === p.codigo ? "Abrindo o pagamento…" : `Assinar o ${p.nome}`}
                      </button>
                    )}
                    {!atual && !pago && <span className="self-start text-sm text-suave">Teste de 7 dias, só no começo</span>}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="cartao p-5 md:p-6" aria-labelledby="t-historico">
            <h3 id="t-historico" className="font-display text-lg font-semibold text-tinta">Histórico de pagamentos</h3>
            {estado.dados.plano.pagamentos.length === 0 ? (
              <p className="mt-3 text-suave">Nenhuma cobrança ainda. O teste grátis não cobra.</p>
            ) : (
              <table aria-label="Histórico de pagamentos" className="mt-4 w-full text-left text-[0.9375rem]">
                <thead>
                  <tr className="text-[0.8125rem] text-suave">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Descrição</th>
                    <th className="pb-2 text-right font-medium">Valor</th>
                    <th className="pb-2 text-right font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {estado.dados.plano.pagamentos.map((p) => (
                    <tr key={p.id} className="border-t border-linha">
                      <td className="py-3 tabular-nums">{dataLonga(p.data)}</td>
                      <td className="py-3">{p.descricao}</td>
                      <td className="py-3 text-right tabular-nums">{brl(p.valor_centavos / 100)}</td>
                      <td className="py-3 text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${p.status === "pago" ? "bg-bom-bg text-bom-ink" : "bg-ruim-bg text-ruim-ink"}`}>{STATUS_PAGAMENTO[p.status] ?? p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
