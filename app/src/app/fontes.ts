import { Inter, Urbanist } from "next/font/google";

// Fontes do visual Verde-lima (app logado e telas de acesso): Urbanist nos títulos e números, Inter no texto.
export const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
export const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
