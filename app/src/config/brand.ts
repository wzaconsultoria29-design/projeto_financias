/**
 * Único lugar onde a marca é escrita. Para trocar o nome do produto,
 * edite este arquivo (ou as variáveis NEXT_PUBLIC_*) e veja docs/RENOMEAR-MARCA.md.
 */
const botNumber = process.env.NEXT_PUBLIC_BOT_NUMBER ?? "5582991130317";

export const brand = {
  name: "Gastômetro",
  tagline: "Seu dinheiro, organizado pelo WhatsApp.",
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "contato@exemplo.com",
  legalEntity:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? "[Responsável pelo tratamento — a definir]",
  botNumber,
  botWaUrl(text: string): string {
    const base = `https://wa.me/${botNumber}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  },
};
