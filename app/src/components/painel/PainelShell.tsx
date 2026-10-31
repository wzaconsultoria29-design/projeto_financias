"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { brand } from "@/config/brand";
import { supabase } from "@/lib/supabase";
import { minhaConta } from "@/lib/api";

const LINKS = [
  { href: "/painel", rotulo: "Visão geral" },
  { href: "/painel/lancamentos", rotulo: "Lançamentos" },
  { href: "/painel/conta", rotulo: "Conta" },
];

type Estado = "verificando" | "autenticado";

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

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 border-b border-linha bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 md:h-16 md:flex-nowrap md:py-0 md:px-8">
          <Link href="/painel" className="font-display text-xl font-semibold tracking-tight text-tinta">
            {brand.name}
          </Link>
          <nav aria-label="Painel" className="order-3 flex w-full items-center gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
            {LINKS.map((l) => {
              const ativo = l.href === "/painel" ? caminho === "/painel" : caminho.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`rounded-full px-3 py-2 transition-colors ${ativo ? "bg-folha font-medium text-tinta" : "text-suave hover:text-tinta"}`}
                >
                  {l.rotulo}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-sm md:order-none">
            {nome && <span className="hidden max-w-[16ch] truncate text-suave sm:inline">{nome}</span>}
            <button type="button" onClick={sair} className="botao-contorno">
              Sair
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">{children}</div>
    </div>
  );
}
