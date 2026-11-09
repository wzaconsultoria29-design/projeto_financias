import { ArrowsClockwise, Car, DotsThreeCircle, ForkKnife, GraduationCap, Heartbeat, House, Popcorn, Receipt, ShoppingBag, Tag, Wallet } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { corDaCategoria } from "@/lib/narrativa";

const ICONES: Record<string, Icon> = {
  alimentacao: ForkKnife,
  moradia: House,
  habitacao: House,
  transporte: Car,
  lazer: Popcorn,
  saude: Heartbeat,
  educacao: GraduationCap,
  compras: ShoppingBag,
  roupas: ShoppingBag,
  vestuario: ShoppingBag,
  assinaturas: ArrowsClockwise,
  contas: Receipt,
  "despesas fixas": Receipt,
  seguros: Receipt,
  outras: DotsThreeCircle,
  outros: DotsThreeCircle,
};

function chave(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Quadrado de ícone da categoria: o desenho vem do nome e a cor é sempre a mesma para a mesma categoria. Receita usa a carteira. */
export function IconeCategoria({ categoria, receita = false, tamanho = 44 }: { categoria: string | null; receita?: boolean; tamanho?: number }) {
  const Icone = receita ? Wallet : (categoria && ICONES[chave(categoria)]) || Tag;
  const cor = receita ? "var(--verde-escuro)" : corDaCategoria(categoria ?? "outros");
  return (
    <span
      aria-hidden="true"
      className="flex flex-none items-center justify-center rounded-[14px]"
      style={{ width: tamanho, height: tamanho, color: cor, background: receita ? "var(--lima)" : `color-mix(in srgb, ${cor} 15%, transparent)` }}
    >
      <Icone size={Math.round(tamanho * 0.5)} />
    </span>
  );
}
