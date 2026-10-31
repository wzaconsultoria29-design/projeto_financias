import type { Metadata } from "next";
import { PaginaLegal } from "@/components/site/PaginaLegal";
import { termos } from "@/config/legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return <PaginaLegal titulo="Termos de uso" secoes={termos} />;
}
