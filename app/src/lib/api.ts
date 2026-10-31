import { supabase } from "@/lib/supabase";
import type { Intervalo } from "@/lib/periodo";

export type VisaoGeral = {
  periodo: { de: string; ate: string; dias: number };
  totais: { despesas: number; receitas: number; saldo: number; quantidade: number };
  anterior: { de: string; ate: string; despesas: number; receitas: number };
  variacao_despesas_pct: number | null;
  serie_diaria: { data: string; despesas: number; receitas: number }[];
  por_categoria: { categoria: string; total: number; qtd: number; pct: number }[];
  maiores: { id: string; data: string; categoria: string | null; descricao: string | null; valor: number }[];
  projecao_mes: { previsto: number; dias_decorridos: number; dias_no_mes: number } | null;
};

export type LancamentoItem = {
  id: string;
  data: string;
  tipo: "despesa" | "receita";
  valor: number;
  categoria: string | null;
  subcategoria: string | null;
  descricao: string | null;
  metodo_pagamento: string | null;
  origem: string;
  codigo: string;
};

export type LancamentoInput = {
  tipo?: "despesa" | "receita";
  valor?: number;
  data?: string;
  categoria?: string | null;
  subcategoria?: string | null;
  descricao?: string | null;
  metodo_pagamento?: string | null;
};

export type FiltrosLancamentos = {
  de?: string;
  ate?: string;
  categoria?: string;
  busca?: string;
  limite?: number;
  offset?: number;
};

export type Conta = {
  nome: string | null;
  email: string | null;
  telefone_mascarado: string;
  plano: { codigo: string; nome: string; preco_centavos: number; mensagens_limite: number | null; membros_max: number } | null;
  assinatura: { status: string; periodo_inicio: string; periodo_fim: string | null } | null;
  uso: { mensagens: number; limite: number | null; restantes: number | null };
  consentimento: { em: string | null; versao: string | null };
};

export class ApiError extends Error {
  constructor(public codigo: string, mensagem: string) {
    super(mensagem);
    this.name = "ApiError";
  }
}

const MENSAGENS: Record<string, string> = {
  sem_cadastro: "Não encontramos o seu cadastro. Entre pelo WhatsApp de novo.",
  periodo_invalido: "Período inválido. Escolha outras datas.",
  valor_invalido: "Informe um valor maior que zero.",
  tipo_invalido: "Escolha despesa ou receita.",
  data_futura: "A data não pode ser no futuro.",
  data_muito_antiga: "Confira o ano da data.",
  nao_encontrado: "Lançamento não encontrado.",
};

function erro(motivo: string): ApiError {
  const codigo = motivo.split(":")[0].trim();
  return new ApiError(codigo, MENSAGENS[codigo] ?? "Algo deu errado. Tente de novo em instantes.");
}

export async function visaoGeral(r: Intervalo): Promise<VisaoGeral> {
  const { data, error } = await supabase.rpc("app_visao_geral", { p_de: r.de, p_ate: r.ate });
  if (error) throw erro(error.message);
  return data as VisaoGeral;
}

export async function listarLancamentos(f: FiltrosLancamentos = {}): Promise<{ total: number; itens: LancamentoItem[] }> {
  const { data, error } = await supabase.rpc("app_lancamentos", {
    p_de: f.de ?? null,
    p_ate: f.ate ?? null,
    p_categoria: f.categoria ?? null,
    p_busca: f.busca ?? null,
    p_limite: f.limite ?? 20,
    p_offset: f.offset ?? 0,
  });
  if (error) throw erro(error.message);
  return data as { total: number; itens: LancamentoItem[] };
}

/** Cria (id nulo) ou edita um lançamento; devolve o id. */
export async function salvarLancamento(id: string | null, dados: LancamentoInput): Promise<string> {
  const { data, error } = await supabase.rpc("app_salvar_lancamento", { p_id: id, p_dados: dados });
  if (error) throw erro(error.message);
  if (!data?.ok) throw erro(String(data?.motivo ?? "desconhecido"));
  return String(data.id);
}

export async function excluirLancamento(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("app_excluir_lancamento", { p_id: id });
  if (error) throw erro(error.message);
  return data?.ok === true;
}

export async function minhaConta(): Promise<Conta> {
  const { data, error } = await supabase.rpc("app_minha_conta");
  if (error) throw erro(error.message);
  return data as Conta;
}

/** Categorias que o cliente já usa (o bot cria categorias livres). */
export async function listarCategorias(): Promise<string[]> {
  const { data, error } = await supabase.rpc("app_categorias");
  if (error) throw erro(error.message);
  return Array.isArray(data) ? (data as unknown[]).filter((c): c is string => typeof c === "string") : [];
}
