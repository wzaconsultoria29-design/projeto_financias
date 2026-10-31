"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { brand } from "@/config/brand";
import { visaoGeral, type VisaoGeral } from "@/lib/api";
import { dataCurta } from "@/lib/format";
import { hojeIso, intervalo, type Intervalo, type Preset } from "@/lib/periodo";
import { KpiCards } from "@/components/painel/KpiCards";
import { MaioresGastos } from "@/components/painel/MaioresGastos";
import { PeriodoSelect } from "@/components/painel/PeriodoSelect";
import { PorCategoria } from "@/components/painel/PorCategoria";
import { Projecao } from "@/components/painel/Projecao";
import { SerieDiaria } from "@/components/painel/SerieDiaria";

type Resultado = { chave: string } & ({ estado: "erro"; mensagem: string } | { estado: "ok"; dados: VisaoGeral });

function Esqueleto() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="cartao h-[118px] animate-pulse bg-folha/50" />
        ))}
      </div>
      <div className="cartao h-80 animate-pulse bg-folha/50" />
    </div>
  );
}

export default function PainelPage() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [custom, setCustom] = useState<Intervalo>();
  const [resultado, setResultado] = useState<Resultado>();
  const [tentativa, setTentativa] = useState(0);

  const periodo = useMemo(() => intervalo(preset, new Date(), custom), [preset, custom]);
  // Um resultado só vale para o período e a tentativa que o geraram; qualquer outro caso é "carregando".
  const chave = `${periodo.de}|${periodo.ate}|${tentativa}`;
  const carga = resultado?.chave === chave ? resultado : ({ estado: "carregando" } as const);
  const maximo = hojeIso(new Date());

  useEffect(() => {
    let ativo = true;
    visaoGeral(periodo)
      .then((dados) => ativo && setResultado({ chave, estado: "ok", dados }))
      .catch((e: unknown) => {
        if (!ativo) return;
        setResultado({ chave, estado: "erro", mensagem: e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes." });
      });
    return () => {
      ativo = false;
    };
  }, [periodo, chave]);

  const tentarDeNovo = useCallback(() => setTentativa((n) => n + 1), []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">Visão geral</h1>
          <p className="mt-2 text-sm text-suave">
            De {dataCurta(periodo.de)} a {dataCurta(periodo.ate)}
          </p>
        </div>
        <a href={brand.botWaUrl("")} target="_blank" rel="noopener noreferrer" className="botao self-start">
          Registrar pelo WhatsApp
        </a>
      </div>

      <PeriodoSelect
        preset={preset}
        custom={custom}
        maximo={maximo}
        onPreset={setPreset}
        onCustom={(r) => {
          setCustom(r);
          setPreset("custom");
        }}
      />

      {carga.estado === "carregando" && <Esqueleto />}

      {carga.estado === "erro" && (
        <div role="alert" className="cartao flex flex-col items-start gap-4 p-6">
          <p className="text-tinta">{carga.mensagem}</p>
          <button type="button" className="botao-contorno" onClick={tentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      )}

      {carga.estado === "ok" && (
        <>
          <KpiCards dados={carga.dados} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <SerieDiaria serie={carga.dados.serie_diaria} />
              <MaioresGastos itens={carga.dados.maiores} />
            </div>
            <div className="flex flex-col gap-6">
              <Projecao projecao={carga.dados.projecao_mes} />
              <PorCategoria itens={carga.dados.por_categoria} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
