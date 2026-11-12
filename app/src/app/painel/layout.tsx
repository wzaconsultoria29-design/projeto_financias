import type { Metadata } from "next";
import { inter, urbanist } from "@/app/fontes";
import { PainelShell } from "@/components/painel/PainelShell";

// O app logado tem o visual Verde-lima (ver docs/design-system).

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
