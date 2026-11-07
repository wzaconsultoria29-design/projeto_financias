"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "@/config/brand";
import { painel, type Painel } from "@/lib/api";
import { dataCurta } from "@/lib/format";
import { veredito } from "@/lib/painel";
import { deslocarMes, hojeIso, intervalo, intervaloDoMes, mesDe, type Intervalo } from "@/lib/periodo";
import { MaioresGastos } from "@/components/painel/MaioresGastos";
import { CabecalhoPainel, type Modo } from "@/components/painel/visao/CabecalhoPainel";
import { FixosVariaveis } from "@/components/painel/visao/FixosVariaveis";
import { LancarRapido } from "@/components/painel/visao/LancarRapido";
import { Notou } from "@/components/painel/visao/Notou";
import { ParaOndeFoi } from "@/components/painel/visao/ParaOndeFoi";
import { PrimeirosPassos } from "@/components/painel/visao/PrimeirosPassos";
import { Resumo } from "@/components/painel/visao/Resumo";
import { Ritmo } from "@/components/painel/visao/Ritmo";
import { Tendencia } from "@/components/painel/visao/Tendencia";
import { TiposGasto } from "@/components/painel/visao/TiposGasto";

type Resultado = { chave: string } & ({ estado: "erro"; mensagem: string } | { estado: "ok"; dados: Painel });

/** O mesmo desenho da tela pronta, com cada valor trocado por uma barra do seu tamanho: nada pula quando os dados chegam. */
function Esqueleto() {
  const bloco = "cartao bg-folha/40";
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-busy="true" aria-label="Carregando">
      <div className={`${bloco} h-[360px] lg:col-span-5`} />
      <div className={`${bloco} h-[360px] lg:col-span-7`} />
      <div className={`${bloco} h-[300px] lg:col-span-7`} />
      <div className={`${bloco} h-[300px] lg:col-span-5`} />
    </div>
  );
}

export default function PainelPage() {
  const [modo, setModo] = useState<Modo>("mes");
  const [mes, setMes] = useState(() => mesDe(new Date()));
  const [custom, setCustom] = useState<Intervalo>();
  const [resultado, setResultado] = useState<Resultado>();
  const [tentativa, setTentativa] = useState(0);
  const [lancando, setLancando] = useState(false);

  const mesAtual = mesDe(new Date());
  const periodo = useMemo(() => (modo === "mes" ? intervaloDoMes(mes) : intervalo(modo, new Date(), custom)), [modo, mes, custom]);
  // Um resultado só vale para o período e a tentativa que o geraram; qualquer outro caso é "carregando".
  const chave = `${periodo.de}|${periodo.ate}|${tentativa}`;
  const carga = resultado?.chave === chave ? resultado : ({ estado: "carregando" } as const);

  useEffect(() => {
    let ativo = true;
    painel(periodo)
      .then((dados) => ativo && setResultado({ chave, estado: "ok", dados }))
      .catch((e: unknown) => {
        if (!ativo) return;
        setResultado({ chave, estado: "erro", mensagem: e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes." });
      });
    return () => {
      ativo = false;
    };
  }, [periodo, chave]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);
  const dados = carga.estado === "ok" ? carga.dados : undefined;
  const subtitulo = dados ? veredito(dados) : `De ${dataCurta(periodo.de)} a ${dataCurta(periodo.ate)}`;

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPainel
        titulo="Visão geral"
        subtitulo={subtitulo}
        modo={modo}
        mes={mes}
        mesAtual={mesAtual}
        custom={custom}
        maximo={hojeIso(new Date())}
        onModo={setModo}
        onMes={(d) => setMes((m) => deslocarMes(m, d))}
        onCustom={(r) => {
          setCustom(r);
          setModo("custom");
        }}
        onLancar={() => setLancando(true)}
      />

      {carga.estado === "carregando" && <Esqueleto />}

      {carga.estado === "erro" && (
        <div role="alert" className="cartao flex flex-col items-start gap-4 p-6">
          <p className="text-tinta">{carga.mensagem}</p>
          <button type="button" className="botao-contorno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {dados && (
        <>
          <PrimeirosPassos p={dados} whatsappUrl={brand.botWaUrl("")} onLancar={() => setLancando(true)} />
          {/*
            Duas colunas (5 + 7 de 12, vão de 16px) que terminam quase niveladas. No celular os invólucros somem
            (display: contents) e a ordem abaixo põe o saldo, o ritmo e o destino do dinheiro primeiro.
          */}
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start">
            <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-4">
              <div className="order-1 lg:order-none"><Resumo p={dados} /></div>
              <div className="order-4 lg:order-none"><Notou p={dados} /></div>
              <div className="order-5 lg:order-none"><TiposGasto p={dados} /></div>
              <div className="order-6 lg:order-none"><FixosVariaveis p={dados} /></div>
              <div className="order-8 lg:order-none"><MaioresGastos itens={dados.maiores} /></div>
            </div>
            <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-4">
              <div className="order-2 lg:order-none"><Ritmo p={dados} /></div>
              <div className="order-3 lg:order-none"><ParaOndeFoi p={dados} /></div>
              <div className="order-7 lg:order-none"><Tendencia p={dados} /></div>
            </div>
          </div>
        </>
      )}

      <LancarRapido aberto={lancando} onFechar={() => setLancando(false)} onSalvo={recarregar} />
    </div>
  );
}
