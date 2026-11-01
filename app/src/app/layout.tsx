import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";

// Uma só família para o site e o painel: o texto de marketing e a interface do produto parecem a mesma coisa.
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${brand.name}: controle de gastos pelo WhatsApp`, template: `%s | ${brand.name}` },
  description: "Mande o gasto por texto, áudio ou foto no WhatsApp. O painel mostra para onde o dinheiro foi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jost.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Marca que o JavaScript está ativo; as animações de entrada só se escondem com ele (sem JS o conteúdo fica visível). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
