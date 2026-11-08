"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const FORMATO = /^[A-Za-z2-9]{10}$/;

/** Página que o convidado abre pelo link: guarda o código e leva a entrar ou criar a conta. O aceite acontece ao abrir o painel. */
export default function ConvitePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const valido = typeof codigo === "string" && FORMATO.test(codigo);

  useEffect(() => {
    if (!valido) return;
    try {
      window.localStorage.setItem("convite-pendente", codigo.toUpperCase());
    } catch {
      // sem armazenamento: a pessoa pode abrir o link de novo depois de entrar
    }
  }, [valido, codigo]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-16 md:py-24">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-tinta">
        {valido ? "Você recebeu um convite" : "Este convite não está completo"}
      </h1>
      {valido ? (
        <>
          <p className="text-lg leading-relaxed text-suave">
            Alguém convidou você para um grupo do plano Family. Entre na sua conta ou crie uma: assim que o painel abrir, o convite é aceito sozinho.
          </p>
          <p className="text-suave">Entrar no grupo não muda o seu plano nem mostra os seus lançamentos para ninguém.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/entrar" className="botao">Já tenho conta: entrar</Link>
            <Link href="/cadastro" className="botao-contorno">Criar a minha conta</Link>
          </div>
        </>
      ) : (
        <p className="text-lg leading-relaxed text-suave">Confira se o link foi copiado inteiro ou peça um novo para quem convidou.</p>
      )}
    </div>
  );
}
