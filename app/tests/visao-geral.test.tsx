import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MaioresGastos } from "@/components/painel/MaioresGastos";

describe("MaioresGastos", () => {
  it("sem dados orienta o cliente", () => {
    render(<MaioresGastos itens={[]} />);
    expect(screen.getByText("Nenhum lançamento neste período")).toBeInTheDocument();
  });

  it("descrição com HTML aparece como texto e não cria elementos", () => {
    const { container } = render(
      <MaioresGastos itens={[{ id: "1", data: "2026-10-20", categoria: "Outros", descricao: "<img src=x onerror=alert(1)>", valor: 99.9 }]} />,
    );
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("descrição longa recebe truncamento", () => {
    const longa = "x".repeat(500);
    render(<MaioresGastos itens={[{ id: "1", data: "2026-10-20", categoria: null, descricao: longa, valor: 10 }]} />);
    const el = screen.getByText(longa);
    expect(el.className).toContain("truncate");
    expect(el).toHaveAttribute("title", longa);
  });

  it("descrição vazia usa a categoria ou um texto padrão", () => {
    render(<MaioresGastos itens={[{ id: "1", data: "2026-10-20", categoria: null, descricao: null, valor: 10 }]} />);
    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
  });
});
