"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gauge, ListBullets, SignOut, SquaresFour, UserCircle, type Icon } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { supabase } from "@/lib/supabase";
import { minhaConta } from "@/lib/api";

const LINKS: { href: string; rotulo: string; icone: Icon }[] = [
  { href: "/painel", rotulo: "Visão geral", icone: SquaresFour },
  { href: "/painel/lancamentos", rotulo: "Lançamentos", icone: ListBullets },
  { href: "/painel/conta", rotulo: "Conta", icone: UserCircle },
];

type Estado = "verificando" | "autenticado";

/** O símbolo do produto: um medidor, da ideia de "gastômetro". */
function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-floresta text-papel ${className}`} aria-hidden="true">
      <Gauge size={22} weight="bold" />
    </span>
  );
}

export function PainelShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const caminho = usePathname();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [nome, setNome] = useState<string | null>(null);

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
        .then((c) => ativo && setNome(c.nome))
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

  const ativoEm = (href: string) => (href === "/painel" ? caminho === "/painel" : caminho.startsWith(href));
  const inicial = (nome ?? "").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-[100dvh] md:pl-[72px]">
      {/* Computador: trilho de ícones, com a marca no topo e a conta embaixo. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center border-r border-linha bg-papel py-5 md:flex">
        <Link href="/painel" aria-label={brand.name} title={brand.name}>
          <Marca />
        </Link>
        <nav aria-label="Painel" className="mt-8 flex flex-col gap-1.5">
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
                className={`flex h-11 w-11 items-center justify-center rounded-[12px] transition-colors ${ativo ? "bg-folha text-tinta" : "text-suave hover:bg-folha/60 hover:text-tinta"}`}
              >
                <Icone size={22} weight={ativo ? "fill" : "regular"} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          {inicial && (
            <span title={nome ?? undefined} className="flex h-9 w-9 items-center justify-center rounded-full bg-folha text-sm font-semibold text-floresta" aria-hidden="true">
              {inicial}
            </span>
          )}
          <button type="button" onClick={sair} aria-label="Sair" title="Sair" className="flex h-11 w-11 items-center justify-center rounded-[12px] text-suave transition-colors hover:bg-folha/60 hover:text-tinta">
            <SignOut size={22} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Celular: o produto no topo e as quatro destinos embaixo, ao alcance do polegar. */}
      <header className="flex items-center gap-3 px-4 pt-4 md:hidden">
        <Marca className="!h-9 !w-9" />
        <span className="font-display text-lg font-semibold tracking-tight text-tinta">{brand.name}</span>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>

      <nav aria-label="Painel (celular)" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-linha bg-papel pb-[env(safe-area-inset-bottom)] md:hidden">
        {LINKS.map((l) => {
          const ativo = ativoEm(l.href);
          const Icone = l.icone;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium ${ativo ? "text-floresta" : "text-suave"}`}
            >
              <Icone size={22} weight={ativo ? "fill" : "regular"} aria-hidden="true" />
              {l.rotulo}
            </Link>
          );
        })}
        <button type="button" onClick={sair} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium text-suave">
          <SignOut size={22} aria-hidden="true" />
          Sair
        </button>
      </nav>
    </div>
  );
}
