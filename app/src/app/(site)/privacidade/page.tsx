import type { Metadata } from "next";
import { PaginaLegal } from "@/components/site/PaginaLegal";
import { privacidade } from "@/config/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return <PaginaLegal titulo="Política de privacidade" secoes={privacidade} />;
}
