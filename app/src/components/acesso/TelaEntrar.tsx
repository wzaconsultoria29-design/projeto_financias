"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, DeviceMobile, Envelope, Eye, EyeSlash, Gauge, LockSimple, WhatsappLogo } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { entrarComSenha } from "@/lib/login";
import { EntrarWhatsApp } from "@/components/site/EntrarWhatsApp";

const CAMPO = "flex h-12 items-center gap-2.5 rounded-[14px] border border-linha-forte bg-superficie px-3.5 text-tinta focus-within:border-tinta focus-within:shadow-[0_0_0_3px_rgba(11,58,34,0.12)]";

function Marca({ clara = false }: { clara?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-display text-lg font-bold ${clara ? "text-white" : "text-tinta"}`}>
      <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#0b3a22] text-lima">
        <Gauge size={22} weight="fill" />
      </span>
      {brand.name}
    </Link>
  );
}

function FormEntrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) return setErro("Preencha o e-mail e a senha.");
    setOcupado(true);
    setErro("");
    try {
      await entrarComSenha(email, senha);
      router.replace("/painel");
    } catch (x) {
      setErro(x instanceof Error ? x.message : "Não foi possível entrar agora. Tente de novo em instantes.");
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="entrar-email" className="mb-1.5 block text-[0.8125rem] font-semibold text-tinta">E-mail</label>
        <div className={CAMPO}>
          <Envelope size={18} aria-hidden="true" className="flex-none text-suave" />
          <input id="entrar-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }} className="min-w-0 flex-1 bg-transparent outline-none" />
        </div>
      </div>
      <div>
        <label htmlFor="entrar-senha" className="mb-1.5 block text-[0.8125rem] font-semibold text-tinta">Senha</label>
        <div className={CAMPO}>
          <LockSimple size={18} aria-hidden="true" className="flex-none text-suave" />
          <input id="entrar-senha" type={mostrar ? "text" : "password"} autoComplete="current-password" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} className="min-w-0 flex-1 bg-transparent outline-none" />
          <button type="button" onClick={() => setMostrar((m) => !m)} aria-label={mostrar ? "Esconder senha" : "Mostrar senha"} className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-suave hover:text-tinta">
            {mostrar ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-[0.8125rem]">
        <span className="text-suave">Você continua conectado neste aparelho.</span>
        <Link href="/entrar?modo=recuperar" className="font-semibold text-verde-escuro hover:underline">
          Esqueci a senha
        </Link>
      </div>
      {erro && (
        <p role="alert" className="rounded-[12px] bg-ruim-bg px-4 py-3 text-sm text-ruim-ink">
          {erro}
        </p>
      )}
      <button type="submit" disabled={ocupado} className="botao w-full !py-3.5">
        {ocupado ? "Entrando…" : "Entrar"}
      </button>
      <div className="flex items-center gap-3 text-xs text-suave before:h-px before:flex-1 before:bg-linha after:h-px after:flex-1 after:bg-linha">ou</div>
      <Link href="/entrar?modo=whatsapp" className="botao-contorno w-full !py-3.5">
        <WhatsappLogo size={18} weight="fill" aria-hidden="true" className="text-[#1fa855]" />
        Entrar pelo WhatsApp
      </Link>
      <p className="text-center text-sm text-suave">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-verde-escuro hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}

/** Tela de acesso: e-mail e senha no dia a dia; WhatsApp para o primeiro acesso, aparelho novo ou senha esquecida. */
export function TelaEntrar() {
  const modo = useSearchParams().get("modo");
  const whatsapp = modo === "whatsapp";
  const recuperar = modo === "recuperar";

  return (
    <div className="grid min-h-[100dvh] md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-11 text-white md:flex hero-degrade">
        <Marca clara />
        <div className="relative">
          <h2 className="max-w-[26rem] font-display text-4xl font-bold leading-tight tracking-tight">Seu dinheiro, organizado pelo WhatsApp.</h2>
          <p className="mt-3 max-w-[25rem] text-[0.9375rem] text-white/80">Entre para ver para onde foi cada real, quanto ainda dá para gastar e o que mudou desde o mês passado.</p>
        </div>
        <ul className="relative flex flex-col gap-3 text-[0.9375rem]">
          <li className="flex items-center gap-2.5"><LockSimple size={18} weight="bold" aria-hidden="true" className="text-lima" />Seus dados só aparecem para você</li>
          <li className="flex items-center gap-2.5"><DeviceMobile size={18} weight="bold" aria-hidden="true" className="text-lima" />Fica conectado no seu aparelho</li>
          <li className="flex items-center gap-2.5"><WhatsappLogo size={18} weight="bold" aria-hidden="true" className="text-lima" />Esqueceu a senha? Recupera pelo seu WhatsApp</li>
        </ul>
        <svg aria-hidden="true" viewBox="0 0 100 100" className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 text-lima opacity-[0.12]">
          <path d="M50 4c4 26 20 42 46 46-26 4-42 20-46 46-4-26-20-42-46-46C30 46 46 30 50 4z" fill="currentColor" />
        </svg>
      </aside>

      <main className="flex flex-col px-5 py-8 md:items-center md:justify-center md:px-10">
        <div className="mb-8 md:hidden">
          <Marca />
        </div>
        <div className="w-full max-w-[26rem]">
          {!whatsapp && !recuperar && (
            <>
              <h1 className="font-display text-[2rem] font-bold tracking-tight text-tinta">Entrar</h1>
              <p className="mb-6 mt-1 text-suave">Bem-vindo de volta.</p>
              <FormEntrar />
            </>
          )}
          {(whatsapp || recuperar) && (
            <>
              <Link href="/entrar" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-verde-escuro hover:underline">
                <ArrowLeft size={16} aria-hidden="true" />
                Entrar com e-mail e senha
              </Link>
              <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-tinta">{recuperar ? "Recuperar o acesso" : "Entrar pelo WhatsApp"}</h1>
              <p className="mb-6 mt-2 text-suave">
                {recuperar
                  ? "Confirme que o número é seu enviando um código pelo WhatsApp. Em seguida você cria uma senha nova."
                  : "Para o primeiro acesso, um aparelho novo ou se você ainda não criou a senha."}
              </p>
              <EntrarWhatsApp destino={recuperar ? "/painel/senha-nova" : "/painel"} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
