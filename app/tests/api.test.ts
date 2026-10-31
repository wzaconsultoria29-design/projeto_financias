import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { visaoGeral, listarLancamentos, salvarLancamento, excluirLancamento, minhaConta, ApiError } from "@/lib/api";

beforeEach(() => rpc.mockReset());

describe("api do painel", () => {
  it("visaoGeral chama a função com o intervalo", async () => {
    rpc.mockResolvedValue({ data: { totais: { despesas: 35 } }, error: null });
    const r = await visaoGeral({ de: "2026-10-01", ate: "2026-10-31" });
    expect(rpc).toHaveBeenCalledWith("app_visao_geral", { p_de: "2026-10-01", p_ate: "2026-10-31" });
    expect(r.totais.despesas).toBe(35);
  });

  it("traduz erros conhecidos do banco em mensagem para o cliente", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "sem_cadastro" } });
    await expect(visaoGeral({ de: "2026-10-01", ate: "2026-10-31" })).rejects.toMatchObject({
      codigo: "sem_cadastro",
      message: expect.stringContaining("cadastro"),
    });
  });

  it("erro desconhecido vira mensagem genérica sem vazar detalhe técnico", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'relation "x" does not exist' } });
    const e = await visaoGeral({ de: "2026-10-01", ate: "2026-10-31" }).catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.message).not.toContain("relation");
  });

  it("listarLancamentos manda filtros e usa padrões de paginação", async () => {
    rpc.mockResolvedValue({ data: { total: 0, itens: [] }, error: null });
    await listarLancamentos({ busca: "mercado" });
    expect(rpc).toHaveBeenCalledWith("app_lancamentos", {
      p_de: null, p_ate: null, p_categoria: null, p_busca: "mercado", p_limite: 20, p_offset: 0,
    });
  });

  it("salvarLancamento cria com id nulo e edita com o id", async () => {
    rpc.mockResolvedValue({ data: { ok: true, id: "novo" }, error: null });
    expect(await salvarLancamento(null, { tipo: "despesa", valor: 10 })).toBe("novo");
    expect(rpc).toHaveBeenLastCalledWith("app_salvar_lancamento", { p_id: null, p_dados: { tipo: "despesa", valor: 10 } });
    await salvarLancamento("abc", { valor: 12 });
    expect(rpc).toHaveBeenLastCalledWith("app_salvar_lancamento", { p_id: "abc", p_dados: { valor: 12 } });
  });

  it("salvarLancamento lança erro com o motivo quando o banco recusa", async () => {
    rpc.mockResolvedValue({ data: { ok: false, motivo: "data_futura: use uma data ate hoje (2026-10-31)" }, error: null });
    await expect(salvarLancamento(null, { tipo: "despesa", valor: 1, data: "2999-01-01" })).rejects.toMatchObject({
      codigo: "data_futura",
      message: "A data não pode ser no futuro.",
    });
  });

  it("excluirLancamento devolve se excluiu", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    expect(await excluirLancamento("abc")).toBe(true);
    rpc.mockResolvedValue({ data: { ok: false }, error: null });
    expect(await excluirLancamento("abc")).toBe(false);
  });

  it("minhaConta devolve os dados da conta", async () => {
    rpc.mockResolvedValue({ data: { nome: "Ana", plano: { codigo: "trial" } }, error: null });
    expect((await minhaConta()).plano?.codigo).toBe("trial");
    expect(rpc).toHaveBeenCalledWith("app_minha_conta");
  });
});
