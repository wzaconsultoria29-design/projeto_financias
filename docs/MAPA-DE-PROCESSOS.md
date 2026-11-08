# Mapa de processos do produto

Atualizado em 2026-11-06 (decisões de pagamento, login e cadastro confirmadas pelo dono do produto). É a visão de conjunto: cada etapa tem o que é, o que já existe hoje e o que falta. Cada etapa é fechada uma de cada vez. O painel é o centro do produto; o bot do WhatsApp é um complemento para registrar rápido.

## A jornada do cliente

1. Vê o anúncio no nosso site e quer testar ou assinar.
2. Faz o cadastro completo em três passos (veja "Fluxo do cadastro"): celular verificado pelo WhatsApp, senha e e-mail confirmado.
3. Começa o teste grátis de 7 dias, sem cartão, e recebe no WhatsApp as boas-vindas e como funciona. Perto do fim do teste informa o cartão de crédito para a renovação.
4. Entra no site com e-mail e senha e usa o painel: gráficos, categorias, lançamentos, metas.
5. No painel há um botão que abre o WhatsApp com o bot, e também dá para lançar gastos e entradas direto no painel.
6. Em Configurações troca senha, ajusta dados e muda de plano quando quiser. No plano Família, convida pessoas até o limite do plano.

## Etapas, estado e o que falta

| # | Etapa | Hoje | Falta |
|---|---|---|---|
| 0 | Fundação: marca, domínio, e-mail transacional, Mercado Pago, captcha | Nome provisório, link de teste na Vercel protegido por login | Nome e domínio, provedor de e-mail, conta Mercado Pago, Turnstile, link público |
| 1 | Anúncio que vende (landing) | Pronta: topo com painel vivo, celulares, planos, perguntas, privacidade | Domínio, análise de visitas, provas reais depois do beta, textos legais revisados |
| 2 | Cadastro completo | Nome, e-mail, WhatsApp e aceite; banco recusa dado incompleto; e-mail único | Novo fluxo em 3 passos: **celular verificado primeiro**, **senha**, **e-mail confirmado**, captcha, retomar de onde parou |
| 3 | Pagamento e assinatura | Nada na v3 (existe um workflow antigo, no banco antigo) | **Cartão de crédito pedido perto do fim do teste** (com CPF), cobrança recorrente no Mercado Pago, avisos por e-mail, falha de pagamento, cancelamento, reset da cota, recibo |
| 4 | Conectar WhatsApp e boas-vindas | Bot fechado, só `ATIVAR` conecta, teste de 7 dias conta da conexão, boas-vindas simples | Verificação do celular no passo 1 do cadastro (o cliente envia a mensagem), boas-vindas completa com instruções ao terminar o cadastro, botão e detecção no painel |
| 5 | Login e acesso | Entra com código pelo WhatsApp | **E-mail e senha**, esqueci a senha por e-mail, link de recuperação pelo WhatsApp, sessões, sair de todos os aparelhos, registro de entradas |
| 6 | **Painel (centro do produto)** | Visão geral simples, lançamentos (criar, editar, apagar, CSV), conta | **Refazer com métricas eficazes** (ver abaixo), orçamentos, metas, lançar rápido, tela de primeiros passos |
| 7 | Configurações da conta | Página Conta só de leitura | Trocar senha, ajustar nome, e-mail e número (com reconfirmação), mudar de plano, excluir conta |
| 8 | Plano Família | À venda no site (pedido registrado, sem pagamento online). Convite por link construído (migração 018 aplicada) | Visão compartilhada dos valores, cota compartilhada de mensagens, pagamento (Mercado Pago) |
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

## Fluxo do cadastro (confirmado)

1. **Celular:** nome completo, número, aceite dos termos e da política (com a confirmação de 18 anos ou mais; novidades à parte, desmarcado) e captcha. A pessoa toca em "Verificar pelo WhatsApp", o WhatsApp abre com a mensagem pronta, ela envia, e a tela avança sozinha. **O contato sempre começa no cliente**: o bot não escreve primeiro para ninguém. Comprovar o número antes de qualquer outro dado elimina a disputa por número de terceiros (a regra de 48 horas e o `NÃO FUI EU` deixam de ser necessários para cadastros novos).
2. **Senha:** com indicador de força e botão para mostrar. Guardada só pelo serviço de autenticação do Supabase.
3. **E-mail:** informar e confirmar com um código de 6 dígitos. Fim do cadastro.
4. **Painel e boas-vindas no WhatsApp:** o teste de 7 dias começa agora (+3 dias para quem registrar 5 gastos).
5. **Perto do fim do teste:** pedido de cartão de crédito e CPF (Mercado Pago). Avisos por **e-mail** e por aviso no painel, porque o bot nunca escreve primeiro. Quem não informar o cartão no prazo fica com o acesso pausado e os dados preservados.

Também no fluxo: retomar o cadastro de onde parou; número já cadastrado leva ao login; cancelar a qualquer momento antes da primeira cobrança; renda mensal e meta pedidas depois, já no painel (não no cadastro).

## Decisões

1. **Teste e pagamento:** teste grátis de 7 dias sem cartão; o cartão de crédito é pedido para a renovação. (Decidido.)
2. **Login:** e-mail e senha, com e-mail confirmado por código, esqueci a senha por e-mail, link de recuperação pelo WhatsApp, limite de tentativas e captcha. (Decidido.)
3. **Verificação do celular:** o cliente envia a mensagem pelo WhatsApp. Enviar o código pelo bot só quando usarmos a API oficial do WhatsApp. (Decidido.)
4. **Família:** cada membro tem cadastro, senha e WhatsApp próprios, entra no grupo por convite do dono e conta no limite do plano (4 no Família). (Proposto, aguardando confirmação.)
5. **Pagamento:** Mercado Pago com cartão recorrente. Depende da conta do dono do produto. (Pendente.)

## Ordem sugerida

1. **Painel novo** (não depende de nenhuma conta externa): refazer a visão geral com o modelo acima, lançar rápido e botão do WhatsApp.
2. **Em paralelo, o dono providencia:** nome e domínio, provedor de e-mail, conta Mercado Pago, Turnstile.
3. **Cadastro com senha e login** (e-mail e senha, confirmação, esqueci a senha, sessões).
4. **Pagamento e regras de plano**, com as boas-vindas completas no WhatsApp.
5. **Configurações da conta e troca de plano.**
6. **Plano Família.**
7. **Orçamentos e metas** (pedem as telas da etapa 1 prontas).
8. **Operação, jurídico e beta fechado.**
