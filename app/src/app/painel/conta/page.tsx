"use client";

import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { minhaConta, type Conta } from "@/lib/api";
import { brl, dataLonga } from "@/lib/format";
import { UsoPlano } from "@/components/painel/UsoPlano";

const STATUS: Record<string, string> = { trial: "Teste grátis", ativa: "Ativa", inadimplente: "Pagamento pendente" };

type Estado = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; conta: Conta };

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-suave">{rotulo}</dt>
      <dd className="text-tinta sm:text-right">{children}</dd>
    </div>
  );
}

export default function ContaPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    minhaConta()
      .then((conta) => ativo && setEstado({ tipo: "ok", conta }))
      .catch((e: unknown) => ativo && setEstado({ tipo: "erro", mensagem: e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes." }));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">Conta</h1>

      {estado.tipo === "carregando" && <div className="cartao h-64 animate-pulse bg-folha/50" aria-busy="true" aria-label="Carregando" />}

      {estado.tipo === "erro" && (
        <div role="alert" className="cartao flex flex-col items-start gap-4 p-6">
          <p className="text-tinta">{estado.mensagem}</p>
          <button type="button" className="botao-contorno" onClick={() => { setEstado({ tipo: "carregando" }); setTentativa((n) => n + 1); }}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.tipo === "ok" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="cartao p-6" aria-labelledby="plano-titulo">
            <h2 id="plano-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Plano e uso</h2>
            <dl className="mt-3 divide-y divide-linha">
              <Linha rotulo="Plano">
                {estado.conta.plano ? `${estado.conta.plano.nome}${estado.conta.plano.preco_centavos > 0 ? `, ${brl(estado.conta.plano.preco_centavos / 100)} por mês` : ""}` : "Nenhum plano ativo"}
              </Linha>
              {estado.conta.assinatura && (
                <Linha rotulo="Situação">
                  {STATUS[estado.conta.assinatura.status] ?? estado.conta.assinatura.status}
                  {estado.conta.assinatura.periodo_fim ? `, até ${dataLonga(estado.conta.assinatura.periodo_fim)}` : ""}
                </Linha>
              )}
            </dl>
            <div className="mt-4 border-t border-linha pt-5">
              <UsoPlano uso={estado.conta.uso} />
            </div>
          </section>

          <section className="cartao p-6" aria-labelledby="dados-titulo">
            <h2 id="dados-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Seus dados</h2>
            <dl className="mt-3 divide-y divide-linha">
              <Linha rotulo="Nome">{estado.conta.nome ?? "-"}</Linha>
              <Linha rotulo="E-mail">{estado.conta.email ?? "-"}</Linha>
              <Linha rotulo="WhatsApp">{estado.conta.telefone_mascarado}</Linha>
              <Linha rotulo="Aceite dos termos">
                {estado.conta.consentimento.em ? `${dataLonga(estado.conta.consentimento.em)}, versão ${estado.conta.consentimento.versao ?? "-"}` : "Não registrado"}
              </Linha>
            </dl>
          </section>

          <section className="cartao p-6 lg:col-span-2" aria-labelledby="privacidade-titulo">
            <h2 id="privacidade-titulo" className="font-display text-xl font-semibold tracking-tight text-tinta">Privacidade</h2>
            <p className="mt-3 max-w-[65ch] leading-relaxed text-suave">
              Os seus dados são só seus. Você pode baixar tudo o que guardamos ou apagar tudo quando quiser. Os dois pedidos são feitos pelo WhatsApp, do
              seu número, para termos certeza de que é você.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={brand.botWaUrl("MEUS DADOS")} target="_blank" rel="noopener noreferrer" className="botao-contorno">Baixar meus dados</a>
              <a href={brand.botWaUrl("EXCLUIR MEUS DADOS")} target="_blank" rel="noopener noreferrer" className="botao-contorno">Apagar meus dados</a>
            </div>
            <p className="mt-4 text-sm text-suave">
              Antes de apagar, o bot pede uma confirmação. Depois de confirmada, a exclusão não pode ser desfeita.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
