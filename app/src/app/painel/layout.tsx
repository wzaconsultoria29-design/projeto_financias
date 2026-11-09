import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";
import { PainelShell } from "@/components/painel/PainelShell";

// O app logado tem o visual Verde-lima (ver docs/design-system): Urbanist nos títulos e números, Inter no texto.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel" },
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className={`app-vl ${inter.variable} ${urbanist.variable}`}>
      <PainelShell>{children}</PainelShell>
    </div>
  );
}
