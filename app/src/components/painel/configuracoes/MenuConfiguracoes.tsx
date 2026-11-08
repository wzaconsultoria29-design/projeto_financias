"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AREAS = [
  { href: "/painel/configuracoes/conta", rotulo: "Conta" },
  { href: "/painel/configuracoes/aparencia", rotulo: "Aparência e segurança" },
  { href: "/painel/configuracoes/plano", rotulo: "Plano e pagamentos" },
  { href: "/painel/configuracoes/acesso", rotulo: "Acesso compartilhado" },
  { href: "/painel/configuracoes/whatsapp", rotulo: "WhatsApp" },
  { href: "/painel/configuracoes/notificacoes", rotulo: "Notificações" },
  { href: "/painel/configuracoes/privacidade", rotulo: "Privacidade e dados" },
];

/** Áreas das Configurações: lista ao lado no computador, fileira que rola de lado no celular. */
export function MenuConfiguracoes() {
  const caminho = usePathname();
  return (
    <nav aria-label="Configurações" className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
      {AREAS.map((a) => {
        const ativo = caminho.startsWith(a.href);
        return (
          <Link
            key={a.href}
            href={a.href}
            aria-current={ativo ? "page" : undefined}
            className={`whitespace-nowrap rounded-[12px] px-3.5 py-2.5 text-[0.9375rem] transition-colors ${ativo ? "bg-folha font-semibold text-tinta" : "text-suave hover:bg-folha/60 hover:text-tinta"}`}
          >
            {a.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
