import type { ReactNode } from "react";
import { MenuConfiguracoes } from "@/components/painel/configuracoes/MenuConfiguracoes";

export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-tinta">Configurações</h1>
      <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
        <MenuConfiguracoes />
        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
