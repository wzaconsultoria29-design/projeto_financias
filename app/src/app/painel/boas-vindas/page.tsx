import type { Metadata } from "next";
import { PrimeiroAcesso } from "@/components/acesso/PrimeiroAcesso";

export const metadata: Metadata = { title: "Boas-vindas" };

export default function BoasVindasPage() {
  return <PrimeiroAcesso />;
}
