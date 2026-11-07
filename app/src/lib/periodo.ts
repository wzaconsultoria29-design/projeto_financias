export type Preset = "hoje" | "semana" | "mes" | "ano" | "7d" | "30d" | "custom";
export type Intervalo = { de: string; ate: string };

const FUSO = "America/Sao_Paulo";
const formatoData = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });

/** Data de hoje em São Paulo no formato AAAA-MM-DD. */
export function hojeIso(ref: Date): string {
  return formatoData.format(ref);
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);
}

export function intervalo(preset: Preset, ref: Date, custom?: Intervalo): Intervalo {
  const hoje = hojeIso(ref);
  const [ano, mes] = hoje.split("-");
  switch (preset) {
    case "hoje":
      return { de: hoje, ate: hoje };
    case "semana": {
      const diaSemana = new Date(`${hoje}T00:00:00Z`).getUTCDay(); // 0 = domingo
      return { de: somarDias(hoje, -((diaSemana + 6) % 7)), ate: hoje };
    }
    case "mes":
      return { de: `${ano}-${mes}-01`, ate: hoje };
    case "ano":
      return { de: `${ano}-01-01`, ate: hoje };
    case "7d":
      return { de: somarDias(hoje, -6), ate: hoje };
    case "30d":
      return { de: somarDias(hoje, -29), ate: hoje };
    case "custom": {
      if (!custom?.de || !custom?.ate) return { de: `${ano}-${mes}-01`, ate: hoje };
      return custom.de <= custom.ate ? { de: custom.de, ate: custom.ate } : { de: custom.ate, ate: custom.de };
    }
  }
}

/** Período de mesmo tamanho imediatamente anterior (igual ao cálculo do banco). */
export function anterior(r: Intervalo): Intervalo {
  const dias = diasEntre(r.de, r.ate) + 1;
  const ate = somarDias(r.de, -1);
  return { de: somarDias(ate, -(dias - 1)), ate };
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10" do dia de referência, em São Paulo. */
export function mesDe(ref: Date): string {
  return hojeIso(ref).slice(0, 7);
}

/** Do primeiro ao último dia do mês "AAAA-MM". */
export function intervaloDoMes(ym: string): Intervalo {
  const [a, m] = ym.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { de: `${ym}-01`, ate: `${ym}-${String(ultimo).padStart(2, "0")}` };
}

/** Anda `n` meses (negativo volta), virando o ano quando precisa. */
export function deslocarMes(ym: string, n: number): string {
  const [a, m] = ym.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** "outubro de 2026". */
export function rotuloDoMes(ym: string): string {
  const [a, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

/** Nome curto para eixos: "out". */
export function mesCurto(ym: string): string {
  return MESES[Number(ym.split("-")[1]) - 1].slice(0, 3);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(iso: string): boolean {
  if (!ISO.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/** Filtros que vêm no endereço da página de Lançamentos (links do painel): categoria e período. O que for inválido é ignorado. */
export function lerFiltrosDaUrl(busca: string): { categoria: string; custom: Intervalo | undefined } {
  const q = new URLSearchParams(busca);
  const categoria = (q.get("categoria") ?? "").trim();
  const de = q.get("de") ?? "";
  const ate = q.get("ate") ?? "";
  return {
    categoria: categoria.length <= 60 ? categoria : "",
    custom: dataValida(de) && dataValida(ate) && de <= ate ? { de, ate } : undefined,
  };
}
