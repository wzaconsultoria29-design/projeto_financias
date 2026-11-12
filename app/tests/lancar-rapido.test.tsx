import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  listarCategorias: vi.fn(),
  salvarLancamento: vi.fn(),
}));

import { listarCategorias } from "@/lib/api";
import { CATEGORIAS } from "@/config/categorias";
import { LancarRapido } from "@/components/painel/visao/LancarRapido";

function opcoes(): string[] {
  const select = screen.getByLabelText("Categoria") as HTMLSelectElement;
  return [...select.options].map((o) => o.value).filter(Boolean);
}

describe("Lançar da Visão geral: categorias oferecidas", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("oferece todas as categorias padrão mesmo quando a pessoa só usou algumas", async () => {
    vi.mocked(listarCategorias).mockResolvedValue(["Alimentação", "Pets"]);
    render(<LancarRapido aberto onFechar={() => {}} onSalvo={() => {}} />);
    // a lista usada chega depois da abertura: espera a categoria própria aparecer
    await waitFor(() => expect(opcoes()).toContain("Pets"));
    for (const c of CATEGORIAS) expect(opcoes()).toContain(c);
  });

  it("não repete a categoria que já é padrão, mesmo com outra grafia", async () => {
    vi.mocked(listarCategorias).mockResolvedValue(["alimentacao", "Pets"]);
    render(<LancarRapido aberto onFechar={() => {}} onSalvo={() => {}} />);
    await waitFor(() => expect(opcoes()).toContain("Pets"));
    expect(opcoes().filter((c) => c.toLowerCase().startsWith("aliment"))).toHaveLength(1);
  });

  it("se a leitura das categorias usadas falhar, ainda oferece as padrão", async () => {
    vi.mocked(listarCategorias).mockRejectedValue(new Error("falha"));
    render(<LancarRapido aberto onFechar={() => {}} onSalvo={() => {}} />);
    await waitFor(() => expect(listarCategorias).toHaveBeenCalled());
    for (const c of CATEGORIAS) expect(opcoes()).toContain(c);
  });
});
