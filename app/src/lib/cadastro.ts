export type CadastroInput = {
  nome: string;
  email: string;
  telefone: string;
  plano: string;
  aceite: boolean;
  aceiteMarketing: boolean;
  website: string;
};

export type CadastroResultado =
  | { ok: true; whatsappUrl: string; codigo: string }
  | { ok: false; mensagem: string };

/** Celular brasileiro -> 55DD9XXXXXXXX (mesma regra do banco); null se não for celular válido. */
export function normalizarTelefone(entrada: string): string | null {
  let d = entrada.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length === 10 && /^[1-9][1-9][6-9]/.test(d)) d = `${d.slice(0, 2)}9${d.slice(2)}`;
  if (d.length !== 11 || d[2] !== "9" || !/^[1-9][1-9]/.test(d)) return null;
  return `55${d}`;
}

export async function enviarCadastro(d: CadastroInput): Promise<CadastroResultado> {
  const telefone = normalizarTelefone(d.telefone);
  if (!telefone) return { ok: false, mensagem: "Informe um celular com DDD, por exemplo (11) 99999-8888." };
  if (!d.aceite) return { ok: false, mensagem: "Para continuar, aceite os termos e a política de privacidade." };
  const url = process.env.NEXT_PUBLIC_CADASTRO_URL;
  if (!url) return { ok: false, mensagem: "Cadastro indisponível no momento. Tente de novo mais tarde." };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nome: d.nome.trim(),
        email: d.email.trim(),
        telefone,
        plano: d.plano,
        aceite: true,
        aceite_marketing: d.aceiteMarketing,
        website: d.website,
      }),
    });
    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) return { ok: true, whatsappUrl: j.whatsapp_url, codigo: j.codigo_ativacao ?? "" };
    return { ok: false, mensagem: j?.mensagem ?? "Não foi possível concluir o cadastro. Tente de novo." };
  } catch {
    return { ok: false, mensagem: "Não foi possível conectar. Verifique sua internet e tente de novo." };
  }
}

/** Máscara de celular enquanto a pessoa digita: (11) 99999-8888. */
export function mascararTelefone(entrada: string): string {
  const d = entrada.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
