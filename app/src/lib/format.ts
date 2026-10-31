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
