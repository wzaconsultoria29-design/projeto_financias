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
  renda_mensal: number | null;
  custo_vida_mensal: number | null;
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
  nome_invalido: "Confira o nome: use de 2 a 80 caracteres.",
  renda_invalida: "Confira a renda mensal.",
  custo_invalido: "Confira o custo de vida mensal.",
  sem_plano_family: "O convite é do plano Family. Veja o plano em Plano e pagamentos.",
  limite_atingido: "O grupo já está completo: o titular e os convites pendentes contam no limite.",
  ja_no_grupo: "Esta conta já está em um grupo.",
  convite_invalido: "Convite inválido, vencido ou já usado. Peça um novo link.",
  proprio_grupo: "Este convite é do seu próprio grupo.",
  grupo_cheio: "O grupo já está completo.",
  nao_permitido: "Esta ação não é permitida.",
  plano_invalido: "Este plano não está disponível.",
  ja_no_plano: "Você já está neste plano.",
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

/** Tudo que a Visão geral nova mostra, calculado no banco (função app_painel, migração 015). */
export type Painel = {
  periodo: { de: string; ate: string; dias: number; dias_decorridos: number };
  resumo: { receitas: number; despesas: number; saldo: number; taxa_poupanca: number | null; media_diaria: number; quantidade: number };
  anterior: { de: string; ate: string; receitas: number; despesas: number; despesas_mesmo_ponto: number };
  variacao_despesas_pct: number | null;
  categorias: { categoria: string; total: number; qtd: number; pct: number; anterior: number }[];
  pareto: { top3_pct: number | null };
  tipos: { essencial: number; superfluo: number; investimento: number; sem_tipo: number };
  fixos: { fixos_total: number; variaveis_total: number; maiores: { descricao: string; categoria: string | null; valor: number }[] };
  acumulado: { dia: number; atual: number | null; anterior: number }[] | null;
  dia_semana: { dow: number; total: number; ocorrencias: number }[];
  tendencia: { mes: string; receitas: number; despesas: number }[];
  maiores: { id: string; data: string; categoria: string | null; descricao: string | null; valor: number }[];
  projecao: { previsto: number; dias_decorridos: number; dias_no_mes: number } | null;
  sem_receita: boolean;
  historico_total: number;
  /** Marcado no navegador (não vem do banco): a renda do período veio da renda mensal do perfil, não de lançamentos. */
  renda_do_perfil?: boolean;
};

export async function painel(r: Intervalo): Promise<Painel> {
  const { data, error } = await supabase.rpc("app_painel", { p_de: r.de, p_ate: r.ate });
  if (error) throw erro(error.message);
  return data as Painel;
}

/** Salva nome, renda mensal e custo de vida mensal da própria pessoa (migração 016). Valor nulo limpa o campo. */
export async function salvarPerfil(d: { nome: string; renda: number | null; custo: number | null }): Promise<void> {
  const { data, error } = await supabase.rpc("app_salvar_perfil", { p_nome: d.nome, p_renda: d.renda, p_custo: d.custo });
  if (error) throw erro(error.message);
  if (!data?.ok) throw erro(String(data?.motivo ?? "desconhecido"));
}

/** Chama uma função de escrita (devolve { ok, motivo }): o que não for ok vira um erro com mensagem amigável. */
async function executar<T extends Record<string, unknown> = Record<string, unknown>>(rpc: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(rpc, args);
  if (error) throw erro(error.message);
  if (!data?.ok) throw erro(String(data?.motivo ?? "desconhecido"));
  return data as T;
}

/** O grupo do plano Family de quem está logado (migração 018). */
export type Grupo = {
  elegivel: boolean;
  limite: number | null;
  papel: "titular" | "membro" | null;
  titular_nome: string | null;
  membros: { usuario_id: string; nome: string | null; papel: "titular" | "membro"; entrou_em: string; eu: boolean }[];
  convites: { id: string; criado_em: string; expira_em: string }[];
};

export async function grupoAtual(): Promise<Grupo> {
  const { data, error } = await supabase.rpc("app_grupo");
  if (error) throw erro(error.message);
  return data as Grupo;
}

/** Gera um convite. O código só vem agora; depois o banco guarda apenas o hash. */
export async function criarConvite(): Promise<{ codigo: string; expira_em: string }> {
  const d = await executar<{ codigo: string; expira_em: string }>("app_criar_convite");
  return { codigo: d.codigo, expira_em: d.expira_em };
}
export async function cancelarConvite(id: string): Promise<void> {
  await executar("app_cancelar_convite", { p_id: id });
}
export async function removerMembro(usuarioId: string): Promise<void> {
  await executar("app_remover_membro", { p_usuario_id: usuarioId });
}
export async function sairDoGrupo(): Promise<void> {
  await executar("app_sair_do_grupo");
}
export async function aceitarConvite(codigo: string): Promise<{ titular_nome: string | null }> {
  const d = await executar<{ titular_nome: string | null }>("app_aceitar_convite", { p_codigo: codigo });
  return { titular_nome: d.titular_nome };
}

/** Plano, pedido de assinatura e histórico de pagamentos (migração 017). */
export type PlanoEPagamentos = {
  atual: string | null;
  planos: { codigo: string; nome: string; preco_centavos: number; mensagens_limite: number | null; membros_max: number }[];
  solicitacao: { codigo: string; nome: string; criado_em: string } | null;
  pagamentos: { id: string; data: string; descricao: string; valor_centavos: number; status: "pago" | "pendente" | "falhou" | "reembolsado" }[];
};

export async function planoEPagamentos(): Promise<PlanoEPagamentos> {
  const { data, error } = await supabase.rpc("app_plano_e_pagamentos");
  if (error) throw erro(error.message);
  return data as PlanoEPagamentos;
}

/** Registra o pedido de assinar um plano. Não troca o plano: isso vem com o pagamento online. */
export async function solicitarPlano(codigo: string): Promise<{ nome: string }> {
  const d = await executar<{ nome: string }>("app_solicitar_plano", { p_codigo: codigo });
  return { nome: d.nome };
}
export async function cancelarPedidoPlano(): Promise<void> {
  await executar("app_cancelar_pedido_plano");
}
