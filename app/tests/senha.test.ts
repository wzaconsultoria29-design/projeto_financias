import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const getSession = vi.fn();
const signOut = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (a: unknown) => signInWithPassword(a),
      getSession: () => getSession(),
      signOut: (a: unknown) => signOut(a),
      verifyOtp: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

import { forcaSenha, validarEmail, validarSenha } from "@/lib/senha";
import { entrarComSenha } from "@/lib/login";
import { definirSenha } from "@/lib/api";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  getSession.mockResolvedValue({ data: { session: { access_token: "jwt-da-pessoa" } } });
  signOut.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  signInWithPassword.mockReset();
  getSession.mockReset();
  signOut.mockReset();
});

describe("regras de e-mail e senha", () => {
  it("aceita e-mail comum e recusa o que não é e-mail ou é interno", () => {
    expect(validarEmail("maria@exemplo.com")).toBe(true);
    expect(validarEmail("  Maria@Exemplo.com ")).toBe(true);
    for (const ruim of ["", "maria", "maria@", "@exemplo.com", "maria @exemplo.com", "u-1@painel.invalid"]) expect(validarEmail(ruim)).toBe(false);
  });

  it("senha precisa de 8 a 72 caracteres", () => {
    expect(validarSenha("1234567")).toBe("Use pelo menos 8 caracteres.");
    expect(validarSenha("12345678")).toBeNull();
    expect(validarSenha("x".repeat(73))).toBe("Use no máximo 72 caracteres.");
  });

  it("força vai de 0 a 4 e premia tamanho e variedade", () => {
    expect(forcaSenha("")).toBe(0);
    expect(forcaSenha("abc")).toBe(1);
    expect(forcaSenha("abcdefgh")).toBe(1);
    expect(forcaSenha("abcdefgh12")).toBe(2);
    expect(forcaSenha("Abcdefgh12!")).toBe(3);
    expect(forcaSenha("minha casa tem 3 janelas!")).toBe(4);
  });
});

describe("entrarComSenha", () => {
  it("entra pelo Supabase Auth com o e-mail limpo", async () => {
    signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    await entrarComSenha("  Maria@Exemplo.com ", "segredo123");
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "maria@exemplo.com", password: "segredo123" });
  });

  it("e-mail ou senha errados viram uma mensagem só (não diz qual dos dois)", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400, code: "invalid_credentials", message: "Invalid login credentials" } });
    await expect(entrarComSenha("maria@exemplo.com", "errada123")).rejects.toThrow("E-mail ou senha incorretos.");
  });

  it("muitas tentativas pedem para esperar", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { status: 429, code: "over_request_rate_limit", message: "rate limit" } });
    await expect(entrarComSenha("maria@exemplo.com", "errada123")).rejects.toThrow(/muitas tentativas/i);
  });

  it("falha de rede vira mensagem clara", async () => {
    signInWithPassword.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(entrarComSenha("maria@exemplo.com", "segredo123")).rejects.toThrow(/conexão/i);
  });
});

describe("definirSenha", () => {
  it("manda e-mail e senha à função do servidor com o login da pessoa", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    await definirSenha({ email: " Maria@Exemplo.com ", senha: "segredo123" });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://proj.supabase.co/functions/v1/senha-definir");
    expect(opcoes.headers.authorization).toBe("Bearer jwt-da-pessoa");
    expect(JSON.parse(opcoes.body)).toEqual({ email: "maria@exemplo.com", senha: "segredo123" });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("ao trocar a senha, pode tirar os outros aparelhos da conta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) }));
    await definirSenha({ email: "maria@exemplo.com", senha: "segredo123", sairDosOutros: true });
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
  });

  it("e-mail já usado em outra conta tem mensagem própria", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ erro: "email_em_uso" }) }));
    await expect(definirSenha({ email: "maria@exemplo.com", senha: "segredo123" })).rejects.toThrow(/já está em outra conta/i);
  });

  it("sem sessão, pede para entrar de novo", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(definirSenha({ email: "maria@exemplo.com", senha: "segredo123" })).rejects.toThrow(/entre de novo/i);
  });
});
