import { describe, it, expect } from "vitest";
import { saudacao } from "@/lib/saudacao";

// Horários em São Paulo (UTC-3): 12:00Z = 09:00, 17:00Z = 14:00, 23:00Z = 20:00.
describe("saudacao", () => {
  it("de manhã, à tarde e à noite, com o primeiro nome", () => {
    expect(saudacao("Maria Silva", new Date("2026-11-08T12:00:00Z"))).toBe("Bom dia, Maria");
    expect(saudacao("Maria Silva", new Date("2026-11-08T17:00:00Z"))).toBe("Boa tarde, Maria");
    expect(saudacao("Maria Silva", new Date("2026-11-08T23:00:00Z"))).toBe("Boa noite, Maria");
  });
  it("de madrugada diz boa noite", () => {
    expect(saudacao("Maria", new Date("2026-11-08T05:00:00Z"))).toBe("Boa noite, Maria");
  });
  it("sem nome, só a saudação", () => {
    expect(saudacao(null, new Date("2026-11-08T12:00:00Z"))).toBe("Bom dia");
    expect(saudacao("   ", new Date("2026-11-08T12:00:00Z"))).toBe("Bom dia");
  });
});
