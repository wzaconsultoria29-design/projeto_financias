"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { minhaConta, salvarPerfil, type Conta } from "@/lib/api";
import { lerReais } from "@/lib/format";
import { supabase } from "@/lib/supabase";

type Estado = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; conta: Conta };

const campo = "w-full rounded-[12px] border border-linha bg-superficie px-3.5 py-3 text-tinta read-only:bg-folha/50 read-only:text-suave";

function emReais(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Formulario({ conta }: { conta: Conta }) {
  const router = useRouter();
  const [nome, setNome] = useState(conta.nome ?? "");
  const [renda, setRenda] = useState(emReais(conta.renda_mensal));
  const [custo, setCusto] = useState(emReais(conta.custo_vida_mensal));
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const editar = (definir: (v: string) => void) => (v: string) => {
    definir(v);
    setAviso(null);
  };

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const rendaN = lerReais(renda);
    const custoN = lerReais(custo);
    if (!nome.trim()) return setAviso({ tipo: "erro", texto: "Informe o seu nome." });
    if (rendaN === "invalido") return setAviso({ tipo: "erro", texto: "Confira a renda mensal: use só números, como 3.500,00." });
    if (custoN === "invalido") return setAviso({ tipo: "erro", texto: "Confira o custo de vida mensal: use só números, como 1.900,00." });
    setOcupado(true);
    setAviso(null);
    try {
      await salvarPerfil({ nome: nome.trim(), renda: rendaN, custo: custoN });
      setRenda(emReais(rendaN));
      setCusto(emReais(custoN));
      setAviso({ tipo: "ok", texto: "Salvo." });
    } catch (err) {
      setAviso({ tipo: "erro", texto: err instanceof Error ? err.message : "Algo deu errado. Tente de novo em instantes." });
    } finally {
      setOcupado(false);
    }
  }

  async function sair(escopo: "local" | "global") {
    await supabase.auth.signOut({ scope: escopo });
    router.replace("/entrar");
  }

  const inicial = (nome.trim() || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={salvar} className="cartao p-5 md:p-6" noValidate>
        <div className="flex items-center gap-5">
          <span aria-hidden="true" className="grid h-[76px] w-[76px] flex-none place-items-center rounded-full bg-floresta font-display text-3xl font-semibold text-realce">
            {inicial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-tinta">{nome.trim() || "Sem nome"}</p>
            <p className="text-[0.9375rem] text-suave">{conta.plano ? `Plano ${conta.plano.nome}` : "Sem plano ativo"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-nome" className="text-sm font-medium text-tinta">Nome</label>
            <input id="c-nome" value={nome} onChange={(e) => editar(setNome)(e.target.value)} maxLength={80} autoComplete="name" className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-email" className="text-sm font-medium text-tinta">E-mail</label>
            <input id="c-email" value={conta.email ?? ""} readOnly className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-whats" className="text-sm font-medium text-tinta">WhatsApp</label>
            <input id="c-whats" value={conta.telefone_mascarado} readOnly className={campo} />
          </div>
          <span className="hidden sm:block" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-renda" className="text-sm font-medium text-tinta">Renda mensal</label>
            <input id="c-renda" value={renda} onChange={(e) => editar(setRenda)(e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-custo" className="text-sm font-medium text-tinta">Custo de vida mensal</label>
            <input id="c-custo" value={custo} onChange={(e) => editar(setCusto)(e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className={campo} />
          </div>
        </div>
        <p className="mt-3 text-sm text-suave">A renda e o custo de vida ajudam o painel a ler o seu mês com mais precisão. Nada disso é compartilhado.</p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={ocupado} className="botao">
            {ocupado ? "Salvando…" : "Salvar"}
          </button>
          {aviso?.tipo === "ok" && <p role="status" className="text-sm font-medium text-floresta">{aviso.texto}</p>}
          {aviso?.tipo === "erro" && <p role="alert" className="text-sm text-ruim-ink">{aviso.texto}</p>}
        </div>
      </form>

      <section className="cartao p-5 md:p-6" aria-labelledby="t-sessao">
        <h3 id="t-sessao" className="font-display text-lg font-semibold text-tinta">Sessões</h3>
        <p className="mt-1 text-sm text-suave">Você está conectado neste navegador. Para encerrar o acesso, escolha uma das opções.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => sair("local")} className="botao-contorno">Sair deste navegador</button>
          <button type="button" onClick={() => sair("global")} className="botao-contorno">Sair de todos os aparelhos</button>
        </div>
      </section>
    </div>
  );
}

export default function ContaPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    minhaConta()
      .then((conta) => ativo && setEstado({ tipo: "ok", conta }))
      .catch((e: unknown) => ativo && setEstado({ tipo: "erro", mensagem: e instanceof Error ? e.message : "Algo deu errado. Tente de novo em instantes." }));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">Sua conta</h2>
        <p className="mt-1 text-suave">Seus dados e o que deixa a leitura do painel mais precisa.</p>
      </div>

      {estado.tipo === "carregando" && <div className="cartao h-72 bg-folha/40" aria-busy="true" aria-label="Carregando" />}

      {estado.tipo === "erro" && (
        <div role="alert" className="cartao flex flex-col items-start gap-4 p-6">
          <p className="text-tinta">{estado.mensagem}</p>
          <button type="button" className="botao-contorno" onClick={() => { setEstado({ tipo: "carregando" }); setTentativa((n) => n + 1); }}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.tipo === "ok" && <Formulario conta={estado.conta} />}
    </div>
  );
}
