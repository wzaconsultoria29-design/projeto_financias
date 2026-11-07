# Painel novo: desenho

Data: 2026-11-06. Estado: aprovado para construir (primeira entrega: Visão geral). Parte da etapa 6 de `docs/MAPA-DE-PROCESSOS.md`.

## Intenção

O painel é o centro do produto. Em um olhar a pessoa precisa saber: **estou bem este mês? para onde foi o dinheiro? vou fechar o mês no azul? o que mudou em relação ao mês passado?** Os gráficos existem para responder a essas perguntas, não para enfeitar. O bot do WhatsApp é um complemento; o painel tem o botão para conversar com ele e também permite lançar direto.

## Metas e não metas

- Metas: métricas de finanças pessoais que de fato orientam decisão; número grande onde há uma cifra só; cores validadas para daltonismo; tabela acessível por gráfico; funciona no celular com uma mão.
- Não metas (próximas entregas): orçamentos por categoria e metas editáveis (pedem tabelas novas), visão do plano Família, importação de extrato.
- Anti-metas: gráfico que só descreve, eixo duplo, pizza para comparar valores, mostrar saldo como se fosse certo quando a pessoa não registrou renda.

## Estrutura da Visão geral (de cima para baixo)

1. **Cabeçalho:** mês com setas (anterior e próximo), seletor de período (Mês, 30 dias, Ano, Personalizado), botão **Lançar** e botão **Conversar no WhatsApp**.
2. **Resumo:** saldo do período em número grande; receitas e despesas ao lado; **taxa de poupança** em um medidor contra a meta de 20% (referência); variação das despesas contra o mesmo ponto do mês passado.
   - Sem receita registrada: o resumo mostra só despesas e um convite claro para registrar a renda.
3. **Para onde foi o dinheiro:** barras horizontais ordenadas, uma cor só, com valor e participação, variação contra o mês anterior por categoria e a frase do Pareto ("as 3 maiores somam X%").
4. **Essencial, supérfluo e investimento:** barra segmentada do gasto por tipo, comparada com a referência 50/30/20 (percentuais sobre a renda; sem renda, sobre o gasto). Parte sem tipo aparece como "sem classificação".
5. **Ritmo do mês:** gasto acumulado dia a dia contra o mês passado (duas linhas), média diária, previsão de fechamento e gasto por dia da semana.
6. **Tendência de 6 meses:** colunas de receitas e despesas por mês.
7. **Fixos e variáveis:** quanto do gasto é compromisso (moradia, contas fixas, assinaturas, recorrentes) e quanto é variável, com os maiores fixos listados.
8. **O que o painel notou:** até quatro frases geradas a partir dos números (ex.: a categoria que mais subiu, quanto sobrou, o ritmo). Cada frase só aparece se houver dados para sustentá-la.
9. **Maiores gastos** do período (como hoje).
10. **Primeiros passos** (só enquanto houver poucos dados): registrar renda, lançar o primeiro gasto, conectar o WhatsApp.

## Navegação (app)

Barra lateral no computador (Visão geral, Lançamentos, Conta) com o botão do WhatsApp e o botão Sair; barra de abas embaixo no celular. A página Lançamentos e a página Conta continuam como estão.

## Contrato de dados

Nova função `app_painel(p_de, p_ate)`, na migração 015, no mesmo padrão de segurança das funções `app_*` (só cliente logado, leitura pela própria política de acesso). Devolve um objeto com: `periodo`, `resumo` (receitas, despesas, saldo, taxa de poupança, média diária, quantidade), `anterior` (mesmo tamanho e até o mesmo ponto), `variacao_despesas_pct`, `categorias` (com total do período anterior), `pareto`, `tipos`, `fixos`, `acumulado`, `dia_semana`, `tendencia` (6 meses), `maiores`, `projecao`, `sem_receita` e `historico_total`. Todos os números vêm do banco; as frases do item 8 são montadas no site a partir deles.

## Cores dos gráficos

Barras ordenadas em uma cor só (verde da marca). Receitas e despesas: verde-água e laranja da paleta validada. Essencial, supérfluo e investimento: azul, laranja e verde-água (as três primeiras posições da paleta validada, que passam em todos os pares). Rótulos diretos e tabela acessível em todo gráfico, porque três das cores ficam abaixo de 3:1 de contraste no tema claro.

## Limitações conhecidas

- `parcelas` guarda quantas parcelas tem a compra, mas não o calendário; por isso o painel ainda não projeta parcelas futuras.
- Fixos usam o campo recorrente e as categorias Moradia, Habitação, Despesas Fixas, Assinaturas e Seguros como critério.
- No plano Família, o painel mostrará "eu, todos, por pessoa" em entrega futura.
