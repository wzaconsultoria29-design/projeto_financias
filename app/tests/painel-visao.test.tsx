import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Resumo } from "@/components/painel/visao/Resumo";
import { ParaOndeFoi } from "@/components/painel/visao/ParaOndeFoi";
import { TiposGasto } from "@/components/painel/visao/TiposGasto";
import { Ritmo } from "@/components/painel/visao/Ritmo";
import { Tendencia } from "@/components/painel/visao/Tendencia";
import { Notou } from "@/components/painel/visao/Notou";
import { PrimeirosPassos } from "@/components/painel/visao/PrimeirosPassos";
import { base, SEM_DADOS } from "./painel-fixture";

describe("Resumo", () => {
  it("o saldo é o número principal, com receitas e despesas ao lado", () => {
    render(<Resumo p={base()} />);
    expect(screen.getByText("R$ 1.600,00")).toBeInTheDocument();
    expect(screen.getByText("+R$ 3.500,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.900,00")).toBeInTheDocument();
  });

  it("a taxa de poupança aparece num medidor contra a referência de 20%", () => {
    render(<Resumo p={base()} />);
    const medidor = screen.getByRole("meter", { name: /taxa de poupança/i });
    expect(medidor).toHaveAttribute("aria-valuenow", "45.7");
    expect(screen.getByText("45,7%")).toBeInTheDocument();
    expect(screen.getByText(/referência 20%/i)).toBeInTheDocument();
  });

  it("a variação das despesas diz contra o quê foi medida", () => {
    render(<Resumo p={base()} />);
    expect(screen.getByText(/\+26,7% contra o período anterior/)).toBeInTheDocument();
  });

  it("saldo negativo mostra o sinal e nenhum medidor positivo", () => {
    render(<Resumo p={base({ resumo: { receitas: 1000, despesas: 1300, saldo: -300, taxa_poupanca: -30, media_diaria: 40, quantidade: 5 } })} />);
    expect(screen.getByText("-R$ 300,00")).toBeInTheDocument();
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
  });

  it("sem renda registrada convida a registrar e não inventa taxa", () => {
    render(<Resumo p={base({ sem_receita: true, resumo: { receitas: 0, despesas: 800, saldo: -800, taxa_poupanca: null, media_diaria: 30, quantidade: 4 } })} />);
    expect(screen.getByText(/registre a sua renda/i)).toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/NaN|undefined/);
  });
});

describe("ParaOndeFoi", () => {
  it("lista as categorias com valor, participação e a variação contra o período anterior", () => {
    render(<ParaOndeFoi p={base()} />);
    const lista = screen.getByRole("list", { name: /categorias/i });
    expect(within(lista).getByText("Moradia")).toBeInTheDocument();
    expect(within(lista).getByText("52,6%")).toBeInTheDocument();
    const alimentacao = within(lista).getByText("Alimentação").closest("li")!;
    expect(alimentacao).toHaveTextContent("R$ 500,00");
    expect(alimentacao).toHaveTextContent("+R$ 200,00");
  });

  it("categoria que não mudou não ganha sinal de variação", () => {
    render(<ParaOndeFoi p={base()} />);
    const moradia = screen.getByText("Moradia").closest("li")!;
    expect(moradia).not.toHaveTextContent(/\+R\$|-R\$ 0/);
  });

  it("diz quanto as três maiores somam", () => {
    render(<ParaOndeFoi p={base()} />);
    expect(screen.getByText(/as 3 maiores somam 86,8%/i)).toBeInTheDocument();
  });

  it("sem despesas mantém o quadro e explica", () => {
    render(<ParaOndeFoi p={base(SEM_DADOS)} />);
    expect(screen.getByText(/nenhuma despesa neste período/i)).toBeInTheDocument();
  });
});

describe("TiposGasto", () => {
  it("mostra essencial, supérfluo e investimento com valor e parte da renda", () => {
    render(<TiposGasto p={base()} />);
    expect(screen.getByRole("img", { name: /essencial.*supérfluo.*investimento/i })).toBeInTheDocument();
    const essencial = screen.getByText("Essencial").closest("li")!;
    expect(essencial).toHaveTextContent("R$ 1.300,00");
    expect(essencial).toHaveTextContent("37,1%");
    expect(screen.getByText(/referência 50\/30\/20/i)).toBeInTheDocument();
  });

  it("o que não tem tipo aparece como sem classificação", () => {
    render(<TiposGasto p={base()} />);
    expect(screen.getByText(/sem classificação/i).closest("li")).toHaveTextContent("R$ 100,00");
  });

  it("sem renda calcula as partes sobre o gasto", () => {
    render(<TiposGasto p={base({ sem_receita: true, resumo: { receitas: 0, despesas: 1900, saldo: -1900, taxa_poupanca: null, media_diaria: 61, quantidade: 9 } })} />);
    expect(screen.getByText("Essencial").closest("li")).toHaveTextContent("68,4%");
    expect(screen.getByText(/do que você gastou/i)).toBeInTheDocument();
  });

  it("sem gasto não desenha barra", () => {
    render(<TiposGasto p={base(SEM_DADOS)} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/nenhuma despesa neste período/i)).toBeInTheDocument();
  });
});

describe("Ritmo", () => {
  it("mostra a média diária e traz o gráfico com tabela acessível", () => {
    render(<Ritmo p={base()} />);
    expect(screen.getByText("R$ 61,29")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /gasto acumulado/i })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /gasto acumulado/i })).toBeInTheDocument();
  });

  it("no mês em andamento mostra a previsão de fechamento", () => {
    render(<Ritmo p={base({ projecao: { previsto: 2100, dias_decorridos: 15, dias_no_mes: 31 } })} />);
    expect(screen.getByText("R$ 2.100,00")).toBeInTheDocument();
    expect(screen.getByText(/previsão de fechamento/i)).toBeInTheDocument();
  });

  it("período longo, sem série acumulada, ainda mostra a média e o dia da semana", () => {
    render(<Ritmo p={base({ acumulado: null })} />);
    expect(screen.getByText("R$ 61,29")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /gasto acumulado/i })).not.toBeInTheDocument();
    expect(screen.getByText(/sexta/i)).toBeInTheDocument();
  });

  it("aponta o dia da semana em que mais se gasta, em média", () => {
    render(<Ritmo p={base()} />);
    expect(screen.getByText(/mais gasta às sextas/i)).toBeInTheDocument();
  });
});

describe("Tendencia", () => {
  it("mostra seis meses e uma tabela com receitas e despesas", () => {
    render(<Tendencia p={base()} />);
    const tabela = screen.getByRole("table", { name: /últimos seis meses/i });
    expect(within(tabela).getAllByRole("row")).toHaveLength(7);
    expect(within(tabela).getByText("R$ 1.900,00")).toBeInTheDocument();
  });

  it("sem histórico mantém o quadro com uma frase", () => {
    render(<Tendencia p={base(SEM_DADOS)} />);
    expect(screen.getByText(/ainda não há meses para comparar/i)).toBeInTheDocument();
  });
});

describe("Notou", () => {
  it("lista as frases geradas a partir dos números", () => {
    render(<Notou p={base()} />);
    expect(screen.getByRole("heading", { name: /o que o painel notou/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(screen.getByText(/45,7%/)).toBeInTheDocument();
  });

  it("sem dados não renderiza o quadro", () => {
    const { container } = render(<Notou p={base(SEM_DADOS)} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PrimeirosPassos", () => {
  it("aparece enquanto há poucos lançamentos, com os três passos", () => {
    render(<PrimeirosPassos p={base({ historico_total: 1 })} whatsappUrl="https://wa.me/5582991130317" />);
    expect(screen.getByText(/registre a sua renda/i)).toBeInTheDocument();
    expect(screen.getByText(/lance o primeiro gasto/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /conversar no whatsapp/i })).toHaveAttribute("href", "https://wa.me/5582991130317");
  });

  it("some quando já existe histórico", () => {
    const { container } = render(<PrimeirosPassos p={base({ historico_total: 14 })} whatsappUrl="https://wa.me/1" />);
    expect(container).toBeEmptyDOMElement();
  });
});
