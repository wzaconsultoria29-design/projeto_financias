import type { Metadata } from "next";
import { PainelShell } from "@/components/painel/PainelShell";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel" },
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return <PainelShell>{children}</PainelShell>;
}
