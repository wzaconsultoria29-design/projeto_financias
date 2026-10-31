import { describe, it, expect } from "vitest";
import { brand } from "@/config/brand";

describe("brand", () => {
  it("tem um nome de marca não vazio", () => {
    expect(brand.name.trim().length).toBeGreaterThan(0);
  });

  it("monta o link do WhatsApp com o texto codificado", () => {
    expect(brand.botWaUrl("ATIVAR ABC123")).toBe(
      "https://wa.me/5582991130317?text=ATIVAR%20ABC123",
    );
  });

  it("monta o link do WhatsApp sem texto quando vazio", () => {
    expect(brand.botWaUrl("")).toBe("https://wa.me/5582991130317");
  });
});
