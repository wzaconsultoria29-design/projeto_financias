/** Categorias oferecidas nos filtros e no formulário. O bot pode criar outras; elas aparecem na lista, só não nos filtros. */
export const CATEGORIAS = ["Alimentação", "Transporte", "Moradia", "Saúde", "Educação", "Lazer", "Compras", "Contas", "Assinaturas", "Outros"];

export const METODOS = ["Pix", "Débito", "Crédito", "Dinheiro", "Boleto", "Outro"];

const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Categorias padrão mais as que o cliente já usa, sem repetir (ignora maiúsculas e acentos). */
export function mesclarCategorias(usadas: string[]): string[] {
  const vistas = new Set(CATEGORIAS.map(semAcento));
  const extras = usadas.filter((c) => {
    const k = semAcento(c);
    if (!c.trim() || vistas.has(k)) return false;
    vistas.add(k);
    return true;
  });
  return [...CATEGORIAS, ...extras.sort((a, b) => a.localeCompare(b, "pt-BR"))];
}

/** Devolve a grafia da lista que corresponde ao valor ("pix" -> "Pix"); se não houver, o próprio valor. */
export function canonico(valor: string, lista: string[]): string {
  const k = semAcento(valor.trim());
  return lista.find((o) => semAcento(o) === k) ?? valor;
}
