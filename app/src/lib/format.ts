const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "R$ 1.234,50" (espaço comum no lugar do espaço não separável do Intl). */
export function brl(valor: number): string {
  return moeda.format(valor).replace(/ /g, " ");
}

/** Variação percentual com uma casa e sinal; "—" quando não existe. */
export function pct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const texto = Math.abs(n).toFixed(1).replace(".", ",");
  if (n > 0) return `+${texto}%`;
  if (n < 0) return `-${texto}%`;
  return `${texto}%`;
}

/** "2026-10-31" -> "31/10" */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

/** "2026-10-31" -> "31/10/2026" */
export function dataLonga(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Lê "12,50", "1.234,56", "R$ 45" ou "12.5"; devolve null quando não é um valor positivo. */
export function lerValor(texto: string): number | null {
  const limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!/^\d[\d.,]*$/.test(limpo)) return null;
  let normal: string;
  if (limpo.includes(",")) normal = limpo.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normal = limpo.replace(/\./g, "");
  else normal = limpo;
  const n = Number(normal);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Lê um valor em reais digitado em um campo: "3.500,50", "R$ 1.900", "1900,5". Campo vazio devolve null (limpa o valor),
 * zero é um valor válido, e o que não for número devolve "invalido".
 */
export function lerReais(texto: string): number | null | "invalido" {
  const limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (limpo === "") return null;
  if (!/^\d[\d.,]*$/.test(limpo)) return "invalido";
  let normal: string;
  if (limpo.includes(",")) {
    if ((limpo.match(/,/g) ?? []).length > 1) return "invalido";
    normal = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normal = limpo.replace(/\./g, "");
  else normal = limpo;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 ? n : "invalido";
}
