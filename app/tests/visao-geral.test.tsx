import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCards } from "@/components/painel/KpiCards";
import { SerieDiaria } from "@/components/painel/SerieDiaria";
import { PorCategoria } from "@/components/painel/PorCategoria";
import { MaioresGastos } from "@/components/painel/MaioresGastos";
import { Projecao } from "@/components/painel/Projecao";
import type { VisaoGeral } from "@/lib/api";

const base: VisaoGeral = {
  periodo: { de: "2026-10-01", ate: "2026-10-31", dias: 31 },
  totais: { despesas: 700, receitas: 1000, saldo: 300, quantidade: 4 },
  anterior: { de: "2026-09-01", ate: "2026-09-30", despesas: 500, receitas: 900 },
  variacao_despesas_pct: 40,
  serie_diaria: [],
  por_categoria: [],
  maiores: [],
  projecao_mes: null,
};

describe("KpiCards", () => {
  it("mostra despesas, receitas e saldo em reais", () => {
    render(<KpiCards dados={base} />);
    expect(screen.getByText("R$ 700,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
  });

  it("variação nula mostra traço e nunca NaN", () => {
    const { container } = render(<KpiCards dados={{ ...base, variacao_despesas_pct: null }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
  });

  it("variação positiva mostra o sinal e o percentual", () => {
    render(<KpiCards dados={base} />);
    expect(screen.getByText(/\+40,0%/)).toBeInTheDocument();
  });
});

describe("estados vazios", () => {
  it("PorCategoria sem dados orienta o cliente", () => {
    render(<PorCategoria itens={[]} />);
    expect(screen.getByText("Nenhum lançamento neste período")).toBeInTheDocument();
  });

  it("SerieDiaria sem dados orienta o cliente", () => {
    render(<SerieDiaria serie={[]} />);
    expect(screen.getByText("Nenhum lançamento neste período")).toBeInTheDocument();
  });

  it("MaioresGastos sem dados orienta o cliente", () => {
    render(<MaioresGastos itens={[]} />);
    expect(screen.getByText("Nenhum lançamento neste período")).toBeInTheDocument();
  });
});

describe("PorCategoria", () => {
  it("lista categoria, valor e percentual, e trata categoria nula", () => {
    render(
      <PorCategoria
        itens={[
          { categoria: "Alimentação", total: 450, qtd: 3, pct: 64.3 },
          { categoria: null as unknown as string, total: 250, qtd: 1, pct: 35.7 },
        ]}
      />,
    );
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByText("R$ 450,00")).toBeInTheDocument();
    expect(screen.getByText("Sem categoria")).toBeInTheDocument();
  });
});

describe("MaioresGastos", () => {
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

describe("Projecao", () => {
  it("não renderiza nada sem projeção", () => {
    const { container } = render(<Projecao projecao={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o previsto e a base de cálculo", () => {
    render(<Projecao projecao={{ previsto: 1550, dias_decorridos: 10, dias_no_mes: 31 }} />);
    expect(screen.getByText("R$ 1.550,00")).toBeInTheDocument();
    expect(screen.getByText(/10 de 31 dias/)).toBeInTheDocument();
  });
});
