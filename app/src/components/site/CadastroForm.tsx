"use client";

import Link from "next/link";
import { useState } from "react";
import { enviarCadastro, mascararTelefone, normalizarTelefone } from "@/lib/cadastro";

const PLANOS = [
  { codigo: "trial", rotulo: "Trial (grátis por 7 dias)" },
  { codigo: "essencial", rotulo: "Essencial (R$ 19 por mês)" },
  { codigo: "family", rotulo: "Family (R$ 39 por mês)" },
];

type Erros = { nome?: string; email?: string; telefone?: string };

const campo =
  "w-full rounded-[12px] border border-linha bg-superficie px-4 py-3 text-tinta placeholder:text-suave/70 focus-visible:border-floresta";

export function CadastroForm({ planoInicial, emailInicial = "" }: { planoInicial: string; emailInicial?: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(emailInicial);
  const [telefone, setTelefone] = useState("");
  const [plano, setPlano] = useState(planoInicial);
  const [aceite, setAceite] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [website, setWebsite] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<{ whatsappUrl: string; codigo: string } | null>(null);

  function validar(): Erros {
    const e: Erros = {};
    if (nome.trim().length < 2) e.nome = "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Informe um e-mail válido.";
    if (!normalizarTelefone(telefone)) e.telefone = "Informe um celular com DDD, por exemplo (11) 99999-8888.";
    return e;
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    setErroGeral("");
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    const r = await enviarCadastro({ nome, email, telefone, plano, aceite, aceiteMarketing: marketing, website });
    setEnviando(false);
    if (r.ok) setSucesso({ whatsappUrl: r.whatsappUrl, codigo: r.codigo });
    else setErroGeral(r.mensagem);
  }

  if (sucesso) {
    return (
      <div className="cartao p-8 md:p-10" role="status">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-tinta">Falta 1 passo</h2>
        <p className="mt-4 max-w-[46ch] leading-relaxed text-suave">
          Abra o WhatsApp e envie a mensagem que já vai aparecer pronta. É assim que confirmamos que o número é seu.
        </p>
        <a href={sucesso.whatsappUrl} target="_blank" rel="noopener noreferrer" className="botao mt-8">
          Abrir o WhatsApp
        </a>
        {sucesso.codigo && (
          <p className="mt-6 text-sm text-suave">
            Se a mensagem não aparecer, envie <strong className="font-semibold text-tinta">ATIVAR {sucesso.codigo}</strong> para o nosso número.
          </p>
        )}
        <div className="mt-8 border-t border-linha pt-6">
          <p className="max-w-[46ch] leading-relaxed text-suave">
            Quando o assistente responder, entre no painel. No primeiro acesso você escolhe o seu objetivo e cria a senha.
          </p>
          <Link href="/entrar?modo=whatsapp" className="botao-contorno mt-4">
            Já ativei: entrar no painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="cartao flex flex-col gap-5 p-8 md:p-10">
      <div>
        <label htmlFor="nome" className="mb-2 block text-sm font-medium text-tinta">Nome</label>
        <input id="nome" name="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)}
          aria-invalid={!!erros.nome} aria-describedby={erros.nome ? "erro-nome" : undefined} className={campo} />
        {erros.nome && <p id="erro-nome" className="mt-2 text-sm text-[#b3261e] dark:text-[#ffb4a9]">{erros.nome}</p>}
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-tinta">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!erros.email} aria-describedby={erros.email ? "erro-email" : "ajuda-email"} className={campo} />
        {erros.email ? (
          <p id="erro-email" className="mt-2 text-sm text-[#b3261e] dark:text-[#ffb4a9]">{erros.email}</p>
        ) : (
          <p id="ajuda-email" className="mt-2 text-xs text-suave">Usamos só para avisos importantes sobre a sua conta.</p>
        )}
      </div>

      <div>
        <label htmlFor="telefone" className="mb-2 block text-sm font-medium text-tinta">WhatsApp</label>
        <input id="telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(11) 99999-8888"
          value={telefone} onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
          aria-invalid={!!erros.telefone} aria-describedby={erros.telefone ? "erro-telefone" : undefined} className={campo} />
        {erros.telefone && <p id="erro-telefone" className="mt-2 text-sm text-[#b3261e] dark:text-[#ffb4a9]">{erros.telefone}</p>}
      </div>

      <div>
        <label htmlFor="plano" className="mb-2 block text-sm font-medium text-tinta">Plano</label>
        <select id="plano" name="plano" value={plano} onChange={(e) => setPlano(e.target.value)} className={campo}>
          {PLANOS.map((p) => (
            <option key={p.codigo} value={p.codigo}>{p.rotulo}</option>
          ))}
        </select>
        {plano === "family" && (
          <p className="mt-2 text-sm text-suave">
            Você começa com 7 dias grátis. O pagamento online do Family está sendo liberado, e avisamos quando você puder assinar. O convite para o seu grupo fica em Configurações.
          </p>
        )}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Site
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-3 pt-1 text-sm text-suave">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-4 accent-[var(--floresta)]" />
          <span>
            Li e aceito os <a href="/termos" target="_blank" className="font-medium text-floresta underline underline-offset-4">Termos de uso</a> e a{" "}
            <a href="/privacidade" target="_blank" className="font-medium text-floresta underline underline-offset-4">Política de privacidade</a>.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 size-4 accent-[var(--floresta)]" />
          <span>Quero receber novidades do produto (opcional).</span>
        </label>
      </div>

      {erroGeral && (
        <p role="alert" className="rounded-[12px] bg-folha px-4 py-3 text-sm text-tinta">{erroGeral}</p>
      )}

      <button type="submit" disabled={!aceite || enviando} className="botao w-full disabled:cursor-not-allowed disabled:opacity-50">
        {enviando ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
