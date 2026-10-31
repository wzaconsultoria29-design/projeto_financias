import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { verifyOtp: (...a: unknown[]) => verifyOtp(...a) } } }));

import { iniciarLogin, statusLogin } from "@/lib/login";

beforeEach(() => {
  verifyOtp.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("login pelo WhatsApp", () => {
  it("iniciarLogin pede um código à função pública", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sessao_id: "s1", codigo: "123456", expira_em: "2026-10-31T20:00:00Z" }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await iniciarLogin()).toEqual({ sessaoId: "s1", codigo: "123456", expiraEm: "2026-10-31T20:00:00Z" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://proj.supabase.co/functions/v1/login-iniciar");
  });

  it("iniciarLogin falha com mensagem clara quando o servidor recusa", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    await expect(iniciarLogin()).rejects.toThrow("código");
  });

  it("statusLogin repassa pendente e expirado sem abrir sessão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ estado: "pendente" }) }));
    expect(await statusLogin("s1")).toBe("pendente");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ estado: "expirado" }) }));
    expect(await statusLogin("s1")).toBe("expirado");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("statusLogin ok troca o token só com token_hash e type (sem email)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ estado: "ok", token_hash: "abc", email: "u@painel.invalid" }) }));
    verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    expect(await statusLogin("s1")).toBe("ok");
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type: "magiclink" });
  });

  it("statusLogin falha com mensagem amigável se o token for recusado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ estado: "ok", token_hash: "abc" }) }));
    verifyOtp.mockResolvedValue({ data: null, error: { message: "token expired" } });
    await expect(statusLogin("s1")).rejects.toThrow("novo código");
  });
});
