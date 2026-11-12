"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gauge, GearSix, ListBullets, SignOut, SquaresFour, type Icon } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { supabase } from "@/lib/supabase";
import { minhaConta } from "@/lib/api";
import { aplicarPreferenciasAoAbrir } from "@/lib/tema";
import { ConviteAoEntrar } from "@/components/painel/ConviteAoEntrar";
import { TermosAtualizados } from "@/components/painel/TermosAtualizados";
import { VERSAO_LEGAL } from "@/config/legal";

const LINKS: { href: string; rotulo: string; icone: Icon }[] = [
  { href: "/painel", rotulo: "Visão geral", icone: SquaresFour },
  { href: "/painel/lancamentos", rotulo: "Lançamentos", icone: ListBullets },
  { href: "/painel/configuracoes", rotulo: "Configurações", icone: GearSix },
];

type Estado = "verificando" | "autenticado";

/** O símbolo do produto: um medidor, da ideia de "gastômetro". */
function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-ativo-bg text-ativo-fg ${className}`} aria-hidden="true">
      <Gauge size={24} weight="fill" />
    </span>
  );
}

export function PainelShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const caminho = usePathname();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [nome, setNome] = useState<string | null>(null);
  // undefined = ainda não sabemos; só pedimos novo aceite depois de ler a conta.
  const [versaoAceita, setVersaoAceita] = useState<string | null | undefined>(undefined);

  // Tema escolhido e "ocultar valores ao abrir": valem assim que o painel abre.
  useEffect(() => {
    aplicarPreferenciasAoAbrir();
  }, []);

  useEffect(() => {
    let ativo = true;
    const voltar = () => {
      if (ativo) router.replace("/entrar");
    };

    async function verificar() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return voltar();
      // getSession lê só o armazenamento local; getUser confirma com o servidor (token revogado, usuário removido).
      const { error } = await supabase.auth.getUser();
      if (error && (error.status === 401 || error.status === 403 || error.name === "AuthSessionMissingError")) {
        await supabase.auth.signOut({ scope: "local" });
        return voltar();
      }
      if (!ativo) return;
      setEstado("autenticado");
      minhaConta()
        .then((c) => {
          if (!ativo) return;
          setNome(c.nome);
          setVersaoAceita(c.consentimento.versao);
          // Primeiro acesso ainda não feito: leva às telas de boas-vindas (menos na troca de senha, que tem tela própria).
          const aqui = window.location.pathname;
          if (c.primeiro_acesso_concluido === false && !aqui.startsWith("/painel/boas-vindas") && !aqui.startsWith("/painel/senha-nova")) {
            router.replace("/painel/boas-vindas");
          }
        })
        .catch(() => {});
    }
    void verificar();

    const { data: inscricao } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") voltar();
    });
    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [router]);

  async function sair() {
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/entrar");
  }

  if (estado === "verificando") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" role="status" aria-live="polite">
        <p className="text-sm text-suave">Abrindo o seu painel…</p>
      </div>
    );
  }

  // Boas-vindas e senha nova ocupam a tela inteira, sem trilho nem abas.
  if (caminho.startsWith("/painel/boas-vindas") || caminho.startsWith("/painel/senha-nova")) {
    return (
      <>
        {children}
        {versaoAceita !== undefined && <TermosAtualizados versaoAceita={versaoAceita} onAceito={() => setVersaoAceita(VERSAO_LEGAL)} />}
      </>
    );
  }

  const ativoEm = (href: string) => (href === "/painel" ? caminho === "/painel" : caminho.startsWith(href));
  const inicial = (nome ?? "").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-[100dvh] md:pl-[108px]">
      {/* Computador: trilho flutuante de ícones, com a marca no topo e a conta embaixo. */}
      <aside className="fixed bottom-5 left-5 top-5 z-40 hidden w-[68px] flex-col items-center rounded-[40px] bg-superficie py-[18px] shadow-[var(--sombra)] md:flex [border:var(--borda-cartao)]">
        <Link href="/painel" aria-label={brand.name} title={brand.name}>
          <Marca />
        </Link>
        <nav aria-label="Painel" className="mt-7 flex flex-col gap-2.5">
          {LINKS.map((l) => {
            const ativo = ativoEm(l.href);
            const Icone = l.icone;
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.rotulo}
                aria-label={l.rotulo}
                aria-current={ativo ? "page" : undefined}
                className={`flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors ${ativo ? "bg-ativo-bg text-ativo-fg" : "text-suave hover:bg-folha hover:text-tinta"}`}
              >
                <Icone size={22} weight={ativo ? "fill" : "regular"} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          {inicial && (
            <span title={nome ?? undefined} className="flex h-10 w-10 items-center justify-center rounded-full bg-lima font-display text-base font-bold text-[#0b3a22]" aria-hidden="true">
              {inicial}
            </span>
          )}
          <button type="button" onClick={sair} aria-label="Sair" title="Sair" className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-suave transition-colors hover:bg-folha hover:text-tinta">
            <SignOut size={22} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Celular: o produto no topo e os destinos embaixo, ao alcance do polegar. */}
      <header className="flex items-center gap-3 px-4 pt-4 md:hidden">
        <Marca className="!h-9 !w-9" />
        <span className="font-display text-lg font-bold tracking-tight text-tinta">{brand.name}</span>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
        <ConviteAoEntrar />
        {children}
        {versaoAceita !== undefined && <TermosAtualizados versaoAceita={versaoAceita} onAceito={() => setVersaoAceita(VERSAO_LEGAL)} />}
      </main>

      <nav aria-label="Painel (celular)" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 rounded-t-[24px] bg-superficie px-1.5 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-6px_20px_rgba(15,26,20,0.06)] md:hidden [border-top:var(--borda-cartao)]">
        {LINKS.map((l) => {
          const ativo = ativoEm(l.href);
          const Icone = l.icone;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium ${ativo ? "font-bold text-verde-escuro" : "text-suave"}`}
            >
              <Icone size={23} weight={ativo ? "fill" : "regular"} aria-hidden="true" />
              {l.rotulo}
            </Link>
          );
        })}
        <button type="button" onClick={sair} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium text-suave">
          <SignOut size={23} aria-hidden="true" />
          Sair
        </button>
      </nav>
    </div>
  );
}
