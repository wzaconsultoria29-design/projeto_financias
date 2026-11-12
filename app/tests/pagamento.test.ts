import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: () => getSession() }, rpc: vi.fn() } }));

import { iniciarPagamento } from "@/lib/api";

const CHECKOUT = "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  getSession.mockResolvedValue({ data: { session: { access_token: "jwt-da-pessoa" } } });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  getSession.mockReset();
});

describe("iniciarPagamento", () => {
  it("pede o checkout ao servidor com o login da pessoa e só o código do plano", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ url: CHECKOUT }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await iniciarPagamento("family")).toBe(CHECKOUT);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://proj.supabase.co/functions/v1/pagamento-criar");
    expect(opcoes.headers.authorization).toBe("Bearer jwt-da-pessoa");
    expect(JSON.parse(opcoes.body)).toEqual({ plano: "family" }); // o preço nunca sai do navegador
  });

  it("sem sessão, pede para entrar de novo e nem chama o servidor", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(iniciarPagamento("family")).rejects.toThrow(/entre de novo/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("traduz os erros do servidor em mensagens para a pessoa", async () => {
    const com = (status: number, erro: string) => vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({ erro }) }));
    com(503, "pagamento_indisponivel");
    await expect(iniciarPagamento("family")).rejects.toThrow(/ainda não está disponível/i);
    com(429, "muitas_cobrancas");
    await expect(iniciarPagamento("family")).rejects.toThrow(/muitas tentativas/i);
    com(502, "falha_mercado_pago");
    await expect(iniciarPagamento("family")).rejects.toThrow(/mercado pago/i);
    com(500, "detalhe interno qualquer");
    await expect(iniciarPagamento("family")).rejects.toThrow("Algo deu errado. Tente de novo em instantes.");
  });

  it("falha de rede vira mensagem clara", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(iniciarPagamento("family")).rejects.toThrow(/conexão/i);
  });

  it("só aceita endereço https do Mercado Pago (nunca leva a pessoa a outro site)", async () => {
    const com = (url: unknown) => vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ url }) }));
    for (const ruim of ["https://mercadopago.com.br.golpe.example/x", "http://www.mercadopago.com.br/x", "javascript:alert(1)", "", null, 42]) {
      com(ruim);
      await expect(iniciarPagamento("family")).rejects.toThrow("Algo deu errado. Tente de novo em instantes.");
    }
    com("https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=9");
    expect(await iniciarPagamento("family")).toContain("www.mercadopago.com.br");
  });
});
