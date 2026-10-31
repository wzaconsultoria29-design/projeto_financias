import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizarTelefone, enviarCadastro } from "@/lib/cadastro";

describe("normalizarTelefone", () => {
  it("aceita celular com máscara, com +55 e só dígitos", () => {
    expect(normalizarTelefone("(11) 99999-8888")).toBe("5511999998888");
    expect(normalizarTelefone("+55 11 99999-8888")).toBe("5511999998888");
    expect(normalizarTelefone("11999998888")).toBe("5511999998888");
    expect(normalizarTelefone("5511999998888")).toBe("5511999998888");
    expect(normalizarTelefone("(82) 9 9113-0317")).toBe("5582991130317");
  });
  it("completa o nono dígito de celular no formato antigo", () => {
    expect(normalizarTelefone("558291624554")).toBe("5582991624554");
    expect(normalizarTelefone("(82) 9162-4554")).toBe("5582991624554");
  });
  it("recusa fixo, curto e vazio", () => {
    expect(normalizarTelefone("1133334444")).toBeNull();
    expect(normalizarTelefone("+55 11 3333-4444")).toBeNull();
    expect(normalizarTelefone("99999-8888")).toBeNull();
    expect(normalizarTelefone("")).toBeNull();
    expect(normalizarTelefone("abc")).toBeNull();
  });
});

describe("enviarCadastro", () => {
  const dados = {
    nome: " Maria Silva ", email: "maria@exemplo.com", telefone: "(11) 99999-8888",
    plano: "essencial", aceite: true, aceiteMarketing: false, website: "",
  };

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CADASTRO_URL", "https://exemplo.test/cadastro");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("envia o telefone normalizado e o aceite, e devolve o link do WhatsApp", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, whatsapp_url: "https://wa.me/55829?text=ATIVAR%20ABC", codigo_ativacao: "ABC" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const r = await enviarCadastro(dados);
    expect(r).toEqual({ ok: true, whatsappUrl: "https://wa.me/55829?text=ATIVAR%20ABC", codigo: "ABC" });
    const corpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corpo).toMatchObject({ nome: "Maria Silva", telefone: "5511999998888", aceite: true, aceite_marketing: false, website: "" });
  });

  it("não chama a rede quando o telefone é inválido", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await enviarCadastro({ ...dados, telefone: "1133334444" });
    expect(r).toEqual({ ok: false, mensagem: "Informe um celular com DDD, por exemplo (11) 99999-8888." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não chama a rede sem o aceite dos termos", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await enviarCadastro({ ...dados, aceite: false });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mostra a mensagem enviada pelo servidor quando há erro 400", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, mensagem: "Confira seu nome." }) }));
    expect(await enviarCadastro(dados)).toEqual({ ok: false, mensagem: "Confira seu nome." });
  });

  it("trata falha de rede com mensagem amigável", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const r = await enviarCadastro(dados);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.mensagem).toContain("conectar");
  });
});
