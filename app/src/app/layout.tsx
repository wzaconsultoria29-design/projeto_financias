import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";

const titulo = Bricolage_Grotesque({ variable: "--font-titulo", subsets: ["latin"], display: "swap" });
const corpo = Geist({ variable: "--font-corpo", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${brand.name}: controle de gastos pelo WhatsApp`, template: `%s | ${brand.name}` },
  description: "Mande o gasto por texto, áudio ou foto no WhatsApp. O painel mostra para onde o dinheiro foi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
