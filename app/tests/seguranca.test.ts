import { describe, it, expect } from "vitest";
import { cabecalhosDeSeguranca, montarCsp } from "@/lib/seguranca";

const ENTRADA = {
  supabaseUrl: "https://proj.supabase.co",
  cadastroUrl: "https://webhook.exemplo.shop/webhook/cadastro",
  dev: false,
};

function diretiva(csp: string, nome: string): string[] {
  const parte = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${nome} `) || s === nome);
  return parte ? parte.split(/\s+/).slice(1) : [];
}

describe("montarCsp", () => {
  it("conexões só para o próprio site, o Supabase e o webhook de cadastro", () => {
    const csp = montarCsp(ENTRADA);
    expect(diretiva(csp, "connect-src").sort()).toEqual(["'self'", "https://proj.supabase.co", "https://webhook.exemplo.shop"].sort());
  });

  it("proíbe ser embutido em outra página, plugins e base externa", () => {
    const csp = montarCsp(ENTRADA);
    expect(diretiva(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(diretiva(csp, "object-src")).toEqual(["'none'"]);
    expect(diretiva(csp, "base-uri")).toEqual(["'self'"]);
    expect(diretiva(csp, "form-action")).toEqual(["'self'"]);
  });

  it("produção não permite eval nem curinga", () => {
    const csp = montarCsp(ENTRADA);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/\s\*[\s;]|\s\*$/);
  });

  it("desenvolvimento libera eval e websocket para o recarregamento", () => {
    const csp = montarCsp({ ...ENTRADA, dev: true });
    expect(diretiva(csp, "script-src")).toContain("'unsafe-eval'");
    expect(diretiva(csp, "connect-src")).toContain("ws:");
  });

  it("ignora endereço ausente ou inválido sem quebrar", () => {
    const csp = montarCsp({ supabaseUrl: undefined, cadastroUrl: "não é url", dev: false });
    expect(diretiva(csp, "connect-src")).toEqual(["'self'"]);
  });
});

describe("cabecalhosDeSeguranca", () => {
  it("inclui os cabeçalhos essenciais", () => {
    const mapa = Object.fromEntries(cabecalhosDeSeguranca(ENTRADA).map((h) => [h.key, h.value]));
    expect(mapa["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(mapa["X-Content-Type-Options"]).toBe("nosniff");
    expect(mapa["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(mapa["X-Frame-Options"]).toBe("DENY");
    expect(mapa["Strict-Transport-Security"]).toContain("max-age=");
    expect(mapa["Permissions-Policy"]).toContain("camera=()");
  });

  it("não envia HSTS em desenvolvimento", () => {
    const chaves = cabecalhosDeSeguranca({ ...ENTRADA, dev: true }).map((h) => h.key);
    expect(chaves).not.toContain("Strict-Transport-Security");
  });
});
