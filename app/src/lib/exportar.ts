import { listarLancamentos, type FiltrosLancamentos, type LancamentoItem } from "@/lib/api";

const PAGINA = 200;
const LIMITE_SEGURANCA = 50; // 10 mil lançamentos; evita laço sem fim se o total vier errado

type Fonte = (f: FiltrosLancamentos) => Promise<{ total: number; itens: LancamentoItem[] }>;

/** Busca todas as páginas (200 por vez) dos lançamentos que batem com o filtro. */
export async function coletarTodos(filtros: FiltrosLancamentos, fonte: Fonte = listarLancamentos): Promise<LancamentoItem[]> {
  const todos: LancamentoItem[] = [];
  for (let pagina = 0; pagina < LIMITE_SEGURANCA; pagina++) {
    const { total, itens } = await fonte({ ...filtros, limite: PAGINA, offset: pagina * PAGINA });
    todos.push(...itens);
    if (itens.length === 0 || todos.length >= total) break;
  }
  return todos;
}

/** Entrega o texto como arquivo para download no navegador. */
export function baixarArquivo(nome: string, conteudo: string, tipo = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
