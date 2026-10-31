"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mesclarCategorias } from "@/config/categorias";
import { excluirLancamento, listarCategorias, listarLancamentos, salvarLancamento, type LancamentoInput, type LancamentoItem } from "@/lib/api";
import { lancamentosParaCsv } from "@/lib/csv";
import { baixarArquivo, coletarTodos } from "@/lib/exportar";
import { hojeIso, intervalo, type Intervalo, type Preset } from "@/lib/periodo";
import { ConfirmarExclusao } from "@/components/painel/ConfirmarExclusao";
import { EstadoVazio } from "@/components/painel/EstadoVazio";
import { FormLancamento } from "@/components/painel/FormLancamento";
import { PeriodoSelect } from "@/components/painel/PeriodoSelect";
import { TabelaLancamentos } from "@/components/painel/TabelaLancamentos";

const POR_PAGINA = 20;
const ERRO_PADRAO = "Algo deu errado. Tente de novo em instantes.";
const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : ERRO_PADRAO);

type Resultado = { chave: string } & ({ estado: "erro"; mensagem: string } | { estado: "ok"; total: number; itens: LancamentoItem[] });

export default function LancamentosPage() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [custom, setCustom] = useState<Intervalo>();
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pagina, setPagina] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [resultado, setResultado] = useState<Resultado>();
  const [usadas, setUsadas] = useState<string[]>([]);

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<LancamentoItem | null>(null);
  const [excluindo, setExcluindo] = useState<LancamentoItem | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [exportando, setExportando] = useState(false);
  const [erroExportar, setErroExportar] = useState("");

  const periodo = useMemo(() => intervalo(preset, new Date(), custom), [preset, custom]);
  const filtros = useMemo(
    () => ({ de: periodo.de, ate: periodo.ate, busca: busca || undefined, categoria: categoria || undefined }),
    [periodo, busca, categoria],
  );
  const chave = JSON.stringify([filtros, pagina, recarga]);
  const carga = resultado?.chave === chave ? resultado : undefined;

  useEffect(() => {
    let ativo = true;
    listarLancamentos({ ...filtros, limite: POR_PAGINA, offset: pagina * POR_PAGINA })
      .then((r) => ativo && setResultado({ chave, estado: "ok", total: r.total, itens: r.itens }))
      .catch((e: unknown) => ativo && setResultado({ chave, estado: "erro", mensagem: mensagemDe(e) }));
    return () => {
      ativo = false;
    };
  }, [filtros, pagina, chave]);

  // As categorias do cliente vêm do banco (o bot cria categorias livres); recarrega depois de salvar ou excluir.
  useEffect(() => {
    let ativo = true;
    listarCategorias()
      .then((c) => ativo && setUsadas(c))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [recarga]);
  const categorias = useMemo(() => mesclarCategorias(usadas), [usadas]);

  const mudarFiltro = useCallback((fn: () => void) => {
    fn();
    setPagina(0);
  }, []);

  async function salvar(dados: LancamentoInput) {
    setOcupado(true);
    setErroAcao("");
    try {
      await salvarLancamento(editando?.id ?? null, dados);
      setFormAberto(false);
      setEditando(null);
      setRecarga((n) => n + 1);
    } catch (e) {
      setErroAcao(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setOcupado(true);
    setErroAcao("");
    try {
      await excluirLancamento(excluindo.id);
      setExcluindo(null);
      setRecarga((n) => n + 1);
    } catch (e) {
      setErroAcao(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  }

  async function exportar() {
    setExportando(true);
    setErroExportar("");
    try {
      const todos = await coletarTodos(filtros);
      baixarArquivo(`lancamentos-${hojeIso(new Date())}.csv`, lancamentosParaCsv(todos));
    } catch (e) {
      setErroExportar(mensagemDe(e));
    } finally {
      setExportando(false);
    }
  }

  const total = carga?.estado === "ok" ? carga.total : 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const fecharForm = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
    setErroAcao("");
  }, []);
  const fecharExclusao = useCallback(() => {
    setExcluindo(null);
    setErroAcao("");
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-tinta md:text-4xl">Lançamentos</h1>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="botao-contorno" onClick={exportar} disabled={exportando}>
            {exportando ? "Preparando…" : "Exportar CSV"}
          </button>
          <button
            type="button"
            className="botao"
            onClick={() => {
              setEditando(null);
              setErroAcao("");
              setFormAberto(true);
            }}
          >
            Novo lançamento
          </button>
        </div>
      </div>

      {erroExportar && <p role="alert" className="rounded-[12px] bg-folha px-4 py-3 text-sm text-tinta">{erroExportar}</p>}

      <PeriodoSelect
        preset={preset}
        custom={custom}
        maximo={hojeIso(new Date())}
        onPreset={(p) => mudarFiltro(() => setPreset(p))}
        onCustom={(r) =>
          mudarFiltro(() => {
            setCustom(r);
            setPreset("custom");
          })
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="flex flex-1 gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            mudarFiltro(() => setBusca(campoBusca.trim()));
          }}
        >
          <input
            type="search"
            value={campoBusca}
            onChange={(e) => setCampoBusca(e.target.value)}
            placeholder="Buscar por descrição ou categoria"
            aria-label="Buscar"
            className="min-w-0 flex-1 rounded-[12px] border border-linha bg-superficie px-3 py-2.5 text-tinta"
          />
          <button type="submit" className="botao-contorno">Buscar</button>
        </form>
        <label className="flex items-center gap-2 text-sm text-suave">
          Categoria
          <select
            value={categoria}
            onChange={(e) => mudarFiltro(() => setCategoria(e.target.value))}
            className="rounded-[12px] border border-linha bg-superficie px-3 py-2.5 text-tinta"
          >
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <section className="cartao py-4" aria-label="Lista de lançamentos">
        {!carga && (
          <div className="flex flex-col gap-3 px-4" aria-busy="true" aria-label="Carregando">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-[12px] bg-folha/50" />)}
          </div>
        )}
        {carga?.estado === "erro" && (
          <div role="alert" className="flex flex-col items-start gap-4 px-6 py-4">
            <p className="text-tinta">{carga.mensagem}</p>
            <button type="button" className="botao-contorno" onClick={() => setRecarga((n) => n + 1)}>Tentar de novo</button>
          </div>
        )}
        {carga?.estado === "ok" && carga.itens.length === 0 && <div className="px-6"><EstadoVazio /></div>}
        {carga?.estado === "ok" && carga.itens.length > 0 && (
          <TabelaLancamentos
            itens={carga.itens}
            onEditar={(i) => {
              setEditando(i);
              setErroAcao("");
              setFormAberto(true);
            }}
            onExcluir={(i) => {
              setErroAcao("");
              setExcluindo(i);
            }}
          />
        )}
      </section>

      {carga?.estado === "ok" && total > 0 && (
        <nav aria-label="Paginação" className="flex items-center justify-between gap-4 text-sm text-suave">
          <span>{total} {total === 1 ? "lançamento" : "lançamentos"} · página {pagina + 1} de {paginas}</span>
          <span className="flex gap-2">
            <button type="button" className="botao-contorno" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
            <button type="button" className="botao-contorno" disabled={pagina + 1 >= paginas} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
          </span>
        </nav>
      )}

      {formAberto && <FormLancamento inicial={editando} categorias={categorias} ocupado={ocupado} erro={erroAcao} onSalvar={salvar} onCancelar={fecharForm} />}
      {excluindo && <ConfirmarExclusao item={excluindo} ocupado={ocupado} erro={erroAcao} onConfirmar={confirmarExclusao} onCancelar={fecharExclusao} />}
    </div>
  );
}
