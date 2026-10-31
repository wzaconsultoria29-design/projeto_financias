export type EntradaSeguranca = {
  supabaseUrl: string | undefined;
  cadastroUrl: string | undefined;
  dev: boolean;
};

function origem(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Política de conteúdo: o navegador só conversa com o próprio site, o Supabase e o webhook de cadastro.
 * `unsafe-inline` em scripts é necessário para a hidratação do Next sem nonce; o restante é restrito.
 */
export function montarCsp({ supabaseUrl, cadastroUrl, dev }: EntradaSeguranca): string {
  const conexoes = ["'self'", origem(supabaseUrl), origem(cadastroUrl)].filter((o): o is string => o !== null);
  if (dev) conexoes.push("ws:", "wss:");
  const scripts = ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])];
  return [
    "default-src 'self'",
    `script-src ${scripts.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${[...new Set(conexoes)].join(" ")}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function cabecalhosDeSeguranca(entrada: EntradaSeguranca): { key: string; value: string }[] {
  const cabecalhos = [
    { key: "Content-Security-Policy", value: montarCsp(entrada) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ];
  if (!entrada.dev) cabecalhos.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  return cabecalhos;
}
