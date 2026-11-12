"use client";

import { useState, type FormEvent } from "react";
import { Envelope, Eye, EyeSlash, LockSimple } from "@phosphor-icons/react";
import { definirSenha } from "@/lib/api";
import { forcaSenha, ROTULO_FORCA, validarEmail, validarSenha } from "@/lib/senha";

type Props = {
  /** O e-mail do cadastro, para conferir. O endereço interno antigo (…@painel.invalid) não aparece. */
  emailInicial: string | null;
  botao: string;
  onPronto: () => void;
  /** Encerra a sessão nos outros aparelhos (ao recuperar ou trocar a senha). */
  sairDosOutros?: boolean;
  /** Quando existe, mostra "Agora não". */
  aoPular?: () => void;
};

const CAMPO = "flex h-12 items-center gap-2.5 rounded-[14px] border border-linha-forte bg-superficie px-3.5 text-tinta focus-within:border-tinta focus-within:shadow-[0_0_0_3px_rgba(11,58,34,0.12)]";
const COR_FORCA = ["", "bg-ruim-ink", "bg-[#eda100]", "bg-bom-ink", "bg-bom-ink"];

/** Cria ou troca a senha. Confere tudo aqui antes de chamar o servidor, que confere de novo. */
export function FormSenha({ emailInicial, botao, onPronto, sairDosOutros = false, aoPular }: Props) {
  const [email, setEmail] = useState(emailInicial && !emailInicial.endsWith(".invalid") ? emailInicial : "");
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const forca = forcaSenha(senha);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!validarEmail(email)) return setErro("Confira o e-mail: ele precisa ser um endereço que você usa.");
    const problema = validarSenha(senha);
    if (problema) return setErro(problema);
    if (senha !== repetir) return setErro("As senhas não são iguais.");
    setOcupado(true);
    setErro("");
    try {
      await definirSenha({ email, senha, sairDosOutros });
      onPronto();
    } catch (x) {
      setErro(x instanceof Error ? x.message : "Algo deu errado. Tente de novo em instantes.");
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 text-left">
      <div>
        <label htmlFor="senha-email" className="mb-1.5 block text-[0.8125rem] font-semibold text-tinta">E-mail</label>
        <div className={CAMPO}>
          <Envelope size={18} aria-hidden="true" className="flex-none text-suave" />
          <input id="senha-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }} className="min-w-0 flex-1 bg-transparent outline-none" />
        </div>
        <p className="mt-1.5 text-[0.8125rem] text-suave">Confira: é com ele que você vai entrar.</p>
      </div>

      <div>
        <label htmlFor="senha-nova" className="mb-1.5 block text-[0.8125rem] font-semibold text-tinta">Senha</label>
        <div className={CAMPO}>
          <LockSimple size={18} aria-hidden="true" className="flex-none text-suave" />
          <input id="senha-nova" type={mostrar ? "text" : "password"} autoComplete="new-password" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} className="min-w-0 flex-1 bg-transparent outline-none" />
          <button type="button" onClick={() => setMostrar((m) => !m)} aria-label={mostrar ? "Esconder senha" : "Mostrar senha"} className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-suave hover:text-tinta">
            {mostrar ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= forca ? COR_FORCA[forca] : "bg-d-trilho"}`} />
          ))}
        </div>
        <p className="mt-1.5 text-[0.8125rem] text-suave" aria-live="polite">
          {forca > 0 ? `${ROTULO_FORCA[forca]}. ` : ""}Mínimo de 8 caracteres; uma frase fácil de lembrar funciona bem.
        </p>
      </div>

      <div>
        <label htmlFor="senha-repetir" className="mb-1.5 block text-[0.8125rem] font-semibold text-tinta">Repita a senha</label>
        <div className={CAMPO}>
          <LockSimple size={18} aria-hidden="true" className="flex-none text-suave" />
          <input id="senha-repetir" type={mostrar ? "text" : "password"} autoComplete="new-password" value={repetir} onChange={(e) => { setRepetir(e.target.value); setErro(""); }} className="min-w-0 flex-1 bg-transparent outline-none" />
        </div>
      </div>

      {erro && (
        <p role="alert" className="rounded-[12px] bg-ruim-bg px-4 py-3 text-sm text-ruim-ink">
          {erro}
        </p>
      )}

      <button type="submit" disabled={ocupado} className="botao w-full !py-3.5">
        {ocupado ? "Salvando…" : botao}
      </button>
      {aoPular && (
        <button type="button" onClick={aoPular} className="text-center text-sm font-medium text-suave underline-offset-4 hover:underline">
          Agora não (continuo entrando pelo WhatsApp)
        </button>
      )}
      {sairDosOutros && <p className="text-center text-[0.8125rem] text-suave">Por segurança, os outros aparelhos conectados saem da conta.</p>}
    </form>
  );
}
