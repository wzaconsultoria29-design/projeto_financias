import { describe, expect, it } from "vitest";
import { lerFiltrosDaUrl } from "@/lib/periodo";

describe("lerFiltrosDaUrl", () => {
  it("lê categoria e período do endereço", () => {
    expect(lerFiltrosDaUrl("?categoria=Alimenta%C3%A7%C3%A3o&de=2026-10-01&ate=2026-10-31")).toEqual({
      categoria: "Alimentação",
      custom: { de: "2026-10-01", ate: "2026-10-31" },
    });
  });

  it("sem nada no endereço não filtra", () => {
    expect(lerFiltrosDaUrl("")).toEqual({ categoria: "", custom: undefined });
  });

  it("período só vale com as duas datas, válidas e em ordem", () => {
    expect(lerFiltrosDaUrl("?de=2026-10-01").custom).toBeUndefined();
    expect(lerFiltrosDaUrl("?de=ontem&ate=hoje").custom).toBeUndefined();
    expect(lerFiltrosDaUrl("?de=2026-10-31&ate=2026-10-01").custom).toBeUndefined();
    expect(lerFiltrosDaUrl("?de=2026-02-30&ate=2026-03-05").custom).toBeUndefined();
  });

  it("categoria absurda é ignorada", () => {
    expect(lerFiltrosDaUrl(`?categoria=${"x".repeat(200)}`).categoria).toBe("");
  });
});
