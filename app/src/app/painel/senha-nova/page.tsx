"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { minhaConta } from "@/lib/api";
import { FormSenha } from "@/components/acesso/FormSenha";

/** Depois de recuperar o acesso pelo WhatsApp: a pessoa cria uma senha nova, e os outros aparelhos saem da conta. */
export default function SenhaNovaPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    minhaConta()
      .then((c) => ativo && setEmail(c.email))
      .catch(() => ativo && setEmail(null));
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10">
      <div className="cartao w-full max-w-[28rem] p-6 md:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-bom-ink">
          <CheckCircle size={20} weight="fill" aria-hidden="true" />
          Número confirmado pelo WhatsApp
        </p>
        <h1 className="mt-3 font-display text-[1.75rem] font-bold tracking-tight text-tinta">Crie uma senha nova</h1>
        <p className="mb-6 mt-1 text-suave">Da próxima vez, entre com o e-mail e esta senha.</p>
        {email !== undefined && <FormSenha emailInicial={email} botao="Salvar e entrar" sairDosOutros onPronto={() => router.replace("/painel")} />}
      </div>
    </main>
  );
}
