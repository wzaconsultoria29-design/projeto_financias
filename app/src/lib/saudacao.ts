const hora = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false });

/** "Bom dia, Maria": a saudação pelo horário de São Paulo e o primeiro nome (sem nome, só a saudação). */
export function saudacao(nome: string | null, agora: Date): string {
  const h = Number(hora.format(agora)) % 24;
  const base = h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite";
  const primeiro = (nome ?? "").trim().split(/\s+/)[0];
  return primeiro ? `${base}, ${primeiro}` : base;
}
