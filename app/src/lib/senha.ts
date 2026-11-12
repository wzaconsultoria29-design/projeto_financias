/** Regras de e-mail e senha usadas no login, no primeiro acesso e em Configurações (o servidor confere de novo). */

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export function limparEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** E-mail comum; o endereço interno antigo (…@painel.invalid) não vale para entrar. */
export function validarEmail(email: string): boolean {
  const limpo = limparEmail(email);
  return EMAIL.test(limpo) && !limpo.endsWith(".invalid");
}

/** Devolve o problema da senha, ou null quando ela serve. */
export function validarSenha(senha: string): string | null {
  if (senha.length < 8) return "Use pelo menos 8 caracteres.";
  if (senha.length > 72) return "Use no máximo 72 caracteres.";
  return null;
}

/** De 0 (vazia) a 4 (forte): conta o tamanho e a variedade (minúsculas, maiúsculas, números, outros sinais). */
export function forcaSenha(senha: string): number {
  if (!senha) return 0;
  const tipos = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(senha)).length;
  const pontos = (senha.length >= 8 ? 1 : 0) + (senha.length >= 12 ? 1 : 0) + (tipos >= 2 ? 1 : 0) + (tipos >= 3 ? 1 : 0);
  return Math.min(4, Math.max(1, pontos));
}

export const ROTULO_FORCA = ["", "Fraca", "Razoável", "Boa", "Forte"];
