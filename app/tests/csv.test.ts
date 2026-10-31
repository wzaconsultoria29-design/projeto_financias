import { describe, it, expect } from "vitest";
import { lancamentosParaCsv } from "@/lib/csv";
import type { LancamentoItem } from "@/lib/api";

const item = (extra: Partial<LancamentoItem> = {}): LancamentoItem => ({
  id: "1", data: "2026-10-31", tipo: "despesa", valor: 87.5, categoria: "Alimentação", subcategoria: "Supermercado",
  descricao: "Mercado", metodo_pagamento: "pix", origem: "texto", codigo: "DEL#ABC123", ...extra,
});

describe("lancamentosParaCsv", () => {
  it("começa com BOM e o cabeçalho separado por ponto e vírgula", () => {
    const csv = lancamentosParaCsv([]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.replace("﻿", "")).toBe("data;tipo;valor;categoria;subcategoria;descricao;metodo_pagamento;origem;codigo");
  });

  it("formata data e valor no padrão brasileiro", () => {
    const linha = lancamentosParaCsv([item()]).split("\n")[1];
    expect(linha).toBe("31/10/2026;despesa;87,50;Alimentação;Supermercado;Mercado;pix;texto;DEL#ABC123");
  });

  it("protege campos com ponto e vírgula, aspas e quebra de linha", () => {
    const linha = lancamentosParaCsv([item({ descricao: 'a;b "c"' })]).split("\n")[1];
    expect(linha).toContain('"a;b ""c"""');
    const quebra = lancamentosParaCsv([item({ descricao: "x\ny" })]);
    expect(quebra).toContain('"x\ny"');
  });

  it("neutraliza fórmulas que o Excel executaria", () => {
    const linha = lancamentosParaCsv([item({ descricao: '=HYPERLINK("http://x")' })]).split("\n")[1];
    expect(linha).toContain("'=HYPERLINK");
    expect(lancamentosParaCsv([item({ descricao: "+cmd" })])).toContain("'+cmd");
    expect(lancamentosParaCsv([item({ descricao: "@soma" })])).toContain("'@soma");
  });

  it("aceita campos vazios", () => {
    const linha = lancamentosParaCsv([item({ categoria: null, subcategoria: null, descricao: null, metodo_pagamento: null })]).split("\n")[1];
    expect(linha).toBe("31/10/2026;despesa;87,50;;;;;texto;DEL#ABC123");
  });
});
