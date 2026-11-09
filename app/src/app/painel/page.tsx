"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "@/config/brand";
import { minhaConta, painel, type Painel } from "@/lib/api";
import { dataCurta } from "@/lib/format";
import { aplicarRendaDoPerfil, podeGastarPorDia, veredito } from "@/lib/painel";
import { saudacao } from "@/lib/saudacao";
import { useEscondido } from "@/lib/privacidade";
import { deslocarMes, hojeIso, intervalo, intervaloDoMes, mesDe, type Intervalo } from "@/lib/periodo";
import { MaioresGastos } from "@/components/painel/MaioresGastos";
import { CabecalhoPainel, type Modo } from "@/components/painel/visao/CabecalhoPainel";
import { EsqueletoPainel } from "@/components/painel/visao/EsqueletoPainel";
import { FixosVariaveis } from "@/components/painel/visao/FixosVariaveis";
import { LancarRapido } from "@/components/painel/visao/LancarRapido";
import { OQueMudou } from "@/components/painel/visao/OQueMudou";
import { ParaOndeFoi } from "@/components/painel/visao/ParaOndeFoi";
import { PrimeirosPassos } from "@/components/painel/visao/PrimeirosPassos";
import { ProximosPassos } from "@/components/painel/visao/ProximosPassos";
import { PodeGastar } from "@/components/painel/visao/PodeGastar";
import { Resumo } from "@/components/painel/visao/Resumo";
import { Ritmo } from "@/components/painel/visao/Ritmo";
import { Tendencia } from "@/components/painel/visao/Tendencia";
import { TiposGasto } from "@/components/painel/visao/TiposGasto";

/** Uma célula da grade: o cartão dentro dela se estica, para os cartões da mesma linha fecharem a mesma borda de baixo. */
function Celula({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={`flex flex-col [&>*]:flex-1 ${className}`}>{children}</div>;
}

type Resultado = { chave: string } & ({ estado: "erro"; mensagem: string } | { estado: "ok"; dados: Painel });

export default function PainelPage() {
  const [modo, setModo] = useState<Modo>("mes");
  const [mes, setMes] = useState(() => mesDe(new Date()));
  const [custom, setCustom] = useState<Intervalo>();
  const [resultado, setResultado] = useState<Resultado>();
  const [tentativa, setTentativa] = useState(0);
  const [lancando, setLancando] = useState(false);
  const [privado, alternarPrivado] = useEscondido();
  const [boasVindas, setBoasVindas] = useState<string | null>(null);

  const mesAtual = mesDe(new Date());
  const periodo = useMemo(() => (modo === "mes" ? intervaloDoMes(mes) : intervalo(modo, new Date(), custom)), [modo, mes, custom]);
  // Um resultado só vale para o período e a tentativa que o geraram; qualquer outro caso é "carregando".
  const chave = `${periodo.de}|${periodo.ate}|${tentativa}`;
  const carga = resultado?.chave === chave ? resultado : ({ estado: "carregando" } as const);

  useEffect(() => {
    let ativo = true;
    // A renda mensal do perfil só entra quando falta receita lançada; se a leitura da conta falhar, o painel segue sem ela.
    const conta = minhaConta().then((c) => c, () => null);
    Promise.all([painel(periodo), conta])
      .then(([dados, c]) => {
        if (!ativo) return;
        setBoasVindas(c ? saudacao(c.nome, new Date()) : null);
        setResultado({ chave, estado: "ok", dados: aplicarRendaDoPerfil(dados, c?.renda_mensal ?? null) });
      })
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
  const temFolga = dados ? podeGastarPorDia(dados) !== null : false;
  const temFixos = dados ? dados.fixos.fixos_total + dados.fixos.variaveis_total > 0 : false;
  const subtitulo = dados ? veredito(dados) : `De ${dataCurta(periodo.de)} a ${dataCurta(periodo.ate)}`;

  return (
    <div className="flex flex-col gap-6" data-privado={privado}>
      <CabecalhoPainel
        titulo="Visão geral"
        subtitulo={subtitulo}
        saudacao={boasVindas}
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
        privado={privado}
        onPrivado={alternarPrivado}
      />

      {carga.estado === "carregando" && <EsqueletoPainel />}

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
          {/* A história em ordem, de cima para baixo: o que mudou, para onde foi, como se divide, o ritmo, os meses e o que fazer. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Celula className={temFolga ? "lg:col-span-7" : "lg:col-span-12"}>
              <Resumo p={dados} />
            </Celula>
            {temFolga && (
              <Celula className="lg:col-span-5">
                <PodeGastar p={dados} />
              </Celula>
            )}
            <Celula className="lg:col-span-5">
              <OQueMudou p={dados} />
            </Celula>
            <Celula className="lg:col-span-7">
              <ParaOndeFoi p={dados} />
            </Celula>
            <Celula className={temFixos ? "lg:col-span-7" : "lg:col-span-12"}>
              <TiposGasto p={dados} />
            </Celula>
            {temFixos && (
              <Celula className="lg:col-span-5">
                <FixosVariaveis p={dados} />
              </Celula>
            )}
            <Celula className="lg:col-span-12">
              <Ritmo p={dados} />
            </Celula>
            <Celula className="lg:col-span-7">
              <Tendencia p={dados} />
            </Celula>
            <Celula className="lg:col-span-5">
              <MaioresGastos itens={dados.maiores} />
            </Celula>
            <Celula className="lg:col-span-12">
              <ProximosPassos p={dados} onLancar={() => setLancando(true)} />
            </Celula>
          </div>
        </>
      )}

      <LancarRapido aberto={lancando} onFechar={() => setLancando(false)} onSalvo={recarregar} />
    </div>
  );
}
