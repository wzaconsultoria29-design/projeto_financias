import { describe, it, expect } from "vitest";
import { brl, pct, dataCurta, dataLonga } from "@/lib/format";

describe("brl", () => {
  it("formata em reais com separadores brasileiros", () => {
    expect(brl(1234.5)).toBe("R$ 1.234,50");
    expect(brl(0)).toBe("R$ 0,00");
  });
  it("mostra o sinal de negativo antes do símbolo", () => {
    expect(brl(-35)).toBe("-R$ 35,00");
  });
});

describe("pct", () => {
  it("devolve travessão quando não há valor", () => {
    expect(pct(null)).toBe("—");
    expect(pct(Number.NaN)).toBe("—");
  });
  it("mostra uma casa decimal e o sinal", () => {
    expect(pct(-30)).toBe("-30,0%");
    expect(pct(12.34)).toBe("+12,3%");
    expect(pct(0)).toBe("0,0%");
  });
});

describe("datas", () => {
  it("dataCurta mostra dia/mês", () => {
    expect(dataCurta("2026-10-31")).toBe("31/10");
  });
  it("dataLonga mostra dia/mês/ano", () => {
    expect(dataLonga("2026-10-31")).toBe("31/10/2026");
  });
});
