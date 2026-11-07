# Mapa de processos do produto

Atualizado em 2026-11-06. É a visão de conjunto: cada etapa tem o que é, o que já existe hoje e o que falta. Cada etapa é fechada uma de cada vez. O painel é o centro do produto; o bot do WhatsApp é um complemento para registrar rápido.

## A jornada do cliente

1. Vê o anúncio no nosso site e quer testar ou assinar.
2. Faz o cadastro completo: nome completo, e-mail, senha e o número de WhatsApp que vai usar.
3. Paga (ou começa o teste, ver decisão 1). Depois recebe no WhatsApp as boas-vindas e como funciona.
4. Entra no site com e-mail e senha e usa o painel: gráficos, categorias, lançamentos, metas.
5. No painel há um botão que abre o WhatsApp com o bot, e também dá para lançar gastos e entradas direto no painel.
6. Em Configurações troca senha, ajusta dados e muda de plano quando quiser. No plano Família, convida pessoas até o limite do plano.

## Etapas, estado e o que falta

| # | Etapa | Hoje | Falta |
|---|---|---|---|
| 0 | Fundação: marca, domínio, e-mail transacional, Mercado Pago, captcha | Nome provisório, link de teste na Vercel protegido por login | Nome e domínio, provedor de e-mail, conta Mercado Pago, Turnstile, link público |
| 1 | Anúncio que vende (landing) | Pronta: topo com painel vivo, celulares, planos, perguntas, privacidade | Domínio, análise de visitas, provas reais depois do beta, textos legais revisados |
| 2 | Cadastro completo | Nome, e-mail, WhatsApp e aceite; banco recusa dado incompleto; e-mail único | **Senha**, confirmação do e-mail, captcha |
| 3 | Pagamento e assinatura | Nada na v3 (existe um workflow antigo, no banco antigo) | Checkout (Pix e cartão), renovação, falha de pagamento, cancelamento, reset da cota, recibo |
| 4 | Conectar WhatsApp e boas-vindas | Bot fechado, só `ATIVAR` conecta, teste de 7 dias conta da conexão, boas-vindas simples | Boas-vindas completa com instruções, envio no momento certo (após pagamento ou início do teste), botão e detecção no painel |
| 5 | Login e acesso | Entra com código pelo WhatsApp | **E-mail e senha**, esqueci a senha, sessões, sair de todos os aparelhos, registro de entradas |
| 6 | **Painel (centro do produto)** | Visão geral simples, lançamentos (criar, editar, apagar, CSV), conta | **Refazer com métricas eficazes** (ver abaixo), orçamentos, metas, lançar rápido, tela de primeiros passos |
| 7 | Configurações da conta | Página Conta só de leitura | Trocar senha, ajustar nome, e-mail e número (com reconfirmação), mudar de plano, excluir conta |
| 8 | Plano Família | Plano existe no banco (até 4), marcado "em breve" | Grupo, convites, limite do plano, visão compartilhada, permissões |
| 9 | Bot do WhatsApp (complemento) | Pronto: registra, consulta, apaga, analisa sob pedido, baixa e apaga dados, só atende cadastrados | Comando "painel" com link, alertas de orçamento (só em resposta), ajustes de texto |
| 10 | Operação e confiança | Segurança e LGPD documentadas, isolamento por cliente testado | Monitoramento do n8n e do chip, backups, suporte, agendar limpeza, trocar chaves antigas, decidir a API oficial do WhatsApp |
| 11 | Lançamento | Preview privado | Domínio, e-mail, revisão jurídica, beta fechado com poucos clientes, checklist final |

## Painel: avaliação e modelo novo

**O que o painel atual faz:** total de despesas, receitas e saldo, gráfico por dia, categorias em barras, maiores gastos, previsão do mês. É um bom começo técnico, mas só descreve o passado: não diz se a pessoa está bem, não compara com uma meta e não sugere nada.

**Modelo proposto** (práticas conhecidas de finanças pessoais, tudo calculado a partir dos lançamentos que já existem):

1. **Resumo do mês:** receitas, despesas, saldo e **taxa de poupança** (a parte da renda que sobrou), com uma meta editável.
2. **Para onde foi:** categorias em barras, com a regra do Pareto (as 3 maiores explicam quanto do total) e variação em relação ao mês passado.
3. **Essencial, supérfluo e investimento:** barra dividida usando o tipo do gasto, comparada com a referência 50/30/20 (50% essenciais, 30% desejos, 20% poupança e investimento).
4. **Ritmo do mês:** média diária, previsão de fechamento e comparação no mesmo dia do mês anterior. Gasto por dia da semana.
5. **Tendência de 6 meses:** receitas, despesas e saldo, para ver se a vida financeira melhora ou piora.
6. **Compromissos:** gastos fixos e recorrentes, assinaturas detectadas e parcelas dos próximos meses.
7. **Orçamentos por categoria:** limite mensal com barra de progresso e alerta em 80% e 100%.
8. **Metas simples:** reserva de emergência (quantos meses de despesa já estão cobertos) e economizar X por mês.
9. **Frases de análise** feitas com os dados da própria pessoa (a categoria que mais subiu, quanto sobrou, o ritmo).
10. **Lançar rápido** em um toque, busca e filtros, estados vazios que ensinam, e o botão do WhatsApp sempre à vista.

Observações: sem **receitas** registradas, saldo e taxa de poupança enganam; o painel precisa pedir a renda no começo. No plano Família, cada gráfico ganha o filtro "eu, todos, por pessoa".

## Decisões pendentes

1. **Teste grátis e pagamento.** O teste de 7 dias sem cartão foi decidido antes. A jornada nova diz que as boas-vindas vêm depois do pagamento. As duas coisas cabem juntas: o teste começa com cadastro completo e conexão do WhatsApp, as boas-vindas saem nesse momento, e o pagamento passa a ser exigido no fim do teste (ou antes, para quem quiser). A outra opção é exigir cartão ou Pix já no cadastro.
2. **Login por e-mail e senha.** Muda a recomendação anterior (código por e-mail). Fica: cadastro com senha, e-mail confirmado por código, esqueci a senha por e-mail, link de recuperação pelo WhatsApp, limite de tentativas e captcha. A senha em si é guardada pelo serviço de autenticação do Supabase, nunca por nós.
3. **Família.** Cada membro tem o próprio cadastro, senha e WhatsApp, entra num grupo por convite do dono e conta no limite do plano (4 no Família).
4. **Pagamento.** Mercado Pago (Pix e cartão recorrente). Depende da conta do dono do produto.

## Ordem sugerida

1. **Painel novo** (não depende de nenhuma conta externa): refazer a visão geral com o modelo acima, lançar rápido e botão do WhatsApp.
2. **Em paralelo, o dono providencia:** nome e domínio, provedor de e-mail, conta Mercado Pago, Turnstile.
3. **Cadastro com senha e login** (e-mail e senha, confirmação, esqueci a senha, sessões).
4. **Pagamento e regras de plano**, com as boas-vindas completas no WhatsApp.
5. **Configurações da conta e troca de plano.**
6. **Plano Família.**
7. **Orçamentos e metas** (pedem as telas da etapa 1 prontas).
8. **Operação, jurídico e beta fechado.**
