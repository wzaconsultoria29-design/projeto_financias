"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCard, Palette, ShieldCheck, UserCircle, UsersThree, WhatsappLogo } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

const AREAS: { href: string; rotulo: string; icone: Icon }[] = [
  { href: "/painel/configuracoes/conta", rotulo: "Conta", icone: UserCircle },
  { href: "/painel/configuracoes/aparencia", rotulo: "Aparência e segurança", icone: Palette },
  { href: "/painel/configuracoes/plano", rotulo: "Plano e pagamentos", icone: CreditCard },
  { href: "/painel/configuracoes/acesso", rotulo: "Acesso compartilhado", icone: UsersThree },
  { href: "/painel/configuracoes/whatsapp", rotulo: "WhatsApp", icone: WhatsappLogo },
  { href: "/painel/configuracoes/notificacoes", rotulo: "Notificações", icone: Bell },
  { href: "/painel/configuracoes/privacidade", rotulo: "Privacidade e dados", icone: ShieldCheck },
];

/** Áreas das Configurações: lista ao lado no computador, fileira que rola de lado no celular. */
export function MenuConfiguracoes() {
  const caminho = usePathname();
  return (
    <nav aria-label="Configurações" className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:rounded-[28px] md:bg-superficie md:p-3 md:shadow-[var(--sombra)] md:[border:var(--borda-cartao)]">
      {AREAS.map((a) => {
        const ativo = caminho.startsWith(a.href);
        const Icone = a.icone;
        return (
          <Link
            key={a.href}
            href={a.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-[0.9375rem] transition-colors md:rounded-[16px] ${ativo ? "bg-lima font-bold text-[#0b3a22]" : "bg-superficie text-suave hover:bg-folha hover:text-tinta md:bg-transparent"}`}
          >
            <Icone size={20} weight={ativo ? "fill" : "regular"} aria-hidden="true" className="flex-none" />
            {a.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
