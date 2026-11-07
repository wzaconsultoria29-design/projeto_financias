"use client";

import { useEffect, useState } from "react";
import { listarCategorias, salvarLancamento, type LancamentoInput } from "@/lib/api";
import { CATEGORIAS } from "@/config/categorias";
import { FormLancamento } from "@/components/painel/FormLancamento";

type Props = { aberto: boolean; onFechar: () => void; onSalvo: () => void };

/** O mesmo formulário da página Lançamentos, aberto direto da Visão geral: o clique que mais se repete fica a um toque. */
export function LancarRapido({ aberto, onFechar, onSalvo }: Props) {
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    listarCategorias()
      .then((c) => ativo && c.length > 0 && setCategorias(c))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [aberto]);

  if (!aberto) return null;

  async function salvar(dados: LancamentoInput) {
    setOcupado(true);
    setErro("");
    try {
      await salvarLancamento(null, dados);
      onSalvo();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  return <FormLancamento inicial={null} categorias={categorias} ocupado={ocupado} erro={erro} onSalvar={salvar} onCancelar={onFechar} />;
}
