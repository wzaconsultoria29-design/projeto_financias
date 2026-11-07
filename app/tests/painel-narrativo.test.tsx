import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Capitulo } from "@/components/painel/visao/Capitulo";
import { OQueMudou } from "@/components/painel/visao/OQueMudou";
import { ProximosPassos } from "@/components/painel/visao/ProximosPassos";
import { Resumo } from "@/components/painel/visao/Resumo";
import { ParaOndeFoi } from "@/components/painel/visao/ParaOndeFoi";
import { base, SEM_DADOS } from "./painel-fixture";

describe("Capitulo", () => {
  it("tem título, a frase que resume o capítulo e um 'Como ler' que explica o gráfico", () => {
    render(
      <Capitulo id="teste" titulo="Para onde foi" manchete="Moradia levou mais da metade." comoLer="Cada barra é uma categoria.">
        <p>conteúdo</p>
      </Capitulo>,
    );
    expect(screen.getByRole("heading", { name: "Para onde foi" })).toBeInTheDocument();
    expect(screen.getByText("Moradia levou mais da metade.")).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Como ler")).toBeInTheDocument();
    expect(screen.getByText("Cada barra é uma categoria.")).toBeInTheDocument();
  });

  it("sem manchete e sem explicação, só mostra o título e o conteúdo", () => {
    render(
      <Capitulo id="x" titulo="Só título">
        <p>miolo</p>
      </Capitulo>,
    );
    expect(screen.queryByText("Como ler")).not.toBeInTheDocument();
    expect(screen.getByText("miolo")).toBeInTheDocument();
  });
});

describe("Resumo como abertura da história", () => {
  it("começa pela manchete que responde 'como estou?'", () => {
    render(<Resumo p={base()} />);
    expect(screen.getByText("Sobraram R$ 1.600,00: você poupou 45,7% da renda.")).toBeInTheDocument();
  });

  it("sem renda a manchete pede a renda e não inventa saldo", () => {
    render(<Resumo p={base({ sem_receita: true, resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 } })} />);
    expect(screen.getByText("Você gastou R$ 800,00. Falta registrar a renda para saber quanto sobra.")).toBeInTheDocument();
  });

  it("explica o que é a taxa de poupança", () => {
    render(<Resumo p={base()} />);
    expect(screen.getByText(/a parte da renda que sobrou/i)).toBeInTheDocument();
  });
});

describe("OQueMudou", () => {
  it("mostra o antes e o depois, a diferença, e marca se é bom ou ruim", () => {
    render(<OQueMudou p={base()} />);
    expect(screen.getByRole("heading", { name: "O que mudou" })).toBeInTheDocument();
    const lista = screen.getByRole("list", { name: /mudanças/i });

    const despesas = within(lista).getByText("Despesas").closest("li")!;
    expect(despesas).toHaveTextContent("R$ 1.500,00");
    expect(despesas).toHaveTextContent("R$ 1.900,00");
    expect(despesas).toHaveTextContent("+R$ 400,00");
    expect(despesas).toHaveTextContent("+26,7%");
    expect(despesas).toHaveAttribute("data-bom", "false");

    const receitas = within(lista).getByText("Receitas").closest("li")!;
    expect(receitas).toHaveAttribute("data-bom", "true");

    const subiu = within(lista).getByText("Alimentação").closest("li")!;
    expect(subiu).toHaveTextContent(/categoria que mais subiu/i);
    expect(subiu).toHaveTextContent("+R$ 200,00");
    expect(subiu).toHaveAttribute("data-bom", "false");
  });

  it("traz a manchete do capítulo", () => {
    render(<OQueMudou p={base()} />);
    expect(screen.getByText(/Você gastou 26,7% a mais que no período anterior/)).toBeInTheDocument();
  });

  it("sem período anterior explica por que não há comparação", () => {
    const sem = base({ variacao_despesas_pct: null, anterior: { de: "2026-08-31", ate: "2026-09-30", receitas: 0, despesas: 0, despesas_mesmo_ponto: 0 }, categorias: [{ categoria: "Moradia", total: 1000, qtd: 1, pct: 100, anterior: 0 }] });
    render(<OQueMudou p={sem} />);
    expect(screen.getByText(/ainda não há um período anterior para comparar/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/NaN|undefined/);
  });
});

describe("ProximosPassos", () => {
  it("cada passo tem um botão que leva à ação", () => {
    const aoLancar = vi.fn();
    render(<ProximosPassos p={base({ sem_receita: true, resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 } })} onLancar={aoLancar} />);
    expect(screen.getByRole("heading", { name: "O que fazer agora" })).toBeInTheDocument();
    expect(screen.getByText("Registre a sua renda deste período para ver quanto sobra de verdade.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Registrar renda" }));
    expect(aoLancar).toHaveBeenCalledTimes(1);
  });

  it("passo de categoria leva aos lançamentos já filtrados", () => {
    render(<ProximosPassos p={base()} onLancar={() => {}} />);
    expect(screen.getByText("Alimentação subiu R$ 200,00. Veja os lançamentos dessa categoria.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver lançamentos" })).toHaveAttribute("href", "/painel/lancamentos?categoria=Alimenta%C3%A7%C3%A3o&de=2026-10-01&ate=2026-10-31");
  });

  it("passo de pergunta abre o WhatsApp do assistente já escrito", () => {
    render(<ProximosPassos p={base()} onLancar={() => {}} />);
    const link = screen.getByRole("link", { name: "Perguntar no WhatsApp" });
    expect(link).toHaveAttribute("href", "https://wa.me/5582991130317?text=Onde%20posso%20economizar%3F");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("oferece perguntas prontas para o assistente", () => {
    render(<ProximosPassos p={base()} onLancar={() => {}} />);
    const lista = screen.getByRole("list", { name: /perguntas sugeridas/i });
    expect(within(lista).getAllByRole("link").length).toBeGreaterThanOrEqual(3);
    expect(within(lista).getByRole("link", { name: /quanto gastei esta semana/i })).toHaveAttribute("href", expect.stringContaining("wa.me/5582991130317?text="));
  });

  it("conta vazia convida a lançar, sem NaN", () => {
    render(<ProximosPassos p={base(SEM_DADOS)} onLancar={() => {}} />);
    expect(screen.getByRole("button", { name: "Lançar agora" })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/NaN|undefined/);
  });
});

describe("ParaOndeFoi colorido e explicado", () => {
  it("traz a manchete e dá a cada categoria a sua cor fixa", () => {
    render(<ParaOndeFoi p={base()} />);
    expect(screen.getByText("Moradia levou mais da metade do que você gastou.")).toBeInTheDocument();
    const lista = screen.getByRole("list", { name: /categorias/i });
    const cor = (nome: string) => within(within(lista).getByText(nome).closest("li")!).getByTestId("cor-categoria").getAttribute("data-cor");
    expect(cor("Moradia")).toBe("var(--c1)");
    expect(cor("Alimentação")).toBe("var(--c2)");
  });

  it("explica como ler as barras", () => {
    render(<ParaOndeFoi p={base()} />);
    expect(screen.getByText(/cada barra é uma categoria/i)).toBeInTheDocument();
  });
});
