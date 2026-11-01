# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brasileiros que cuidam do próprio dinheiro e não mantêm planilha: autônomos, casais e famílias. Vivem no WhatsApp e querem anotar um gasto em segundos, muitas vezes com a mão ocupada, logo depois de gastar. (Inferência confirmada como rascunho pelo dono do produto; público exato ainda não validado com clientes.)

Mais tarde: grupos familiares de até 4 pessoas (plano Family, em desenvolvimento).

## Product Purpose

Registrar gastos e receitas por texto, áudio ou foto do cupom no WhatsApp, e acompanhar tudo em um painel por dia, semana, mês e categoria, com comparação com o período anterior e previsão de fechamento do mês.

Sucesso: a pessoa registra com constância e entende para onde o dinheiro foi.

## Positioning

- Não há aplicativo para instalar: o registro acontece onde a pessoa já está, no WhatsApp.
- Os números do painel e das respostas são calculados no banco de dados; a IA só interpreta a mensagem. Ela nunca faz conta por conta própria.
- O assistente só trata do dinheiro da própria pessoa. Quando a pessoa pergunta, ele pode analisar os gastos dela (por exemplo "onde posso economizar?") e sugerir algo leve com base nesses dados, sem ser intrometido e sem oferecer análise por conta própria. Nunca dá conselho de investimento nem indica bancos, aplicativos ou produtos.

## Operating Context

Jornada do cliente: vê a landing e o painel, cria a conta no site (nome, e-mail, WhatsApp, aceite dos termos), confirma o e-mail com um código de 6 dígitos, entra no painel e conecta o WhatsApp (mensagem `ATIVAR`). Só então o bot é liberado para o número dele. Quem manda mensagem sem ter conta recebe o link para criar uma.

Teste grátis de 7 dias, contados a partir da conexão do WhatsApp, com 50 mensagens; prorroga +3 dias para quem registrar pelo menos 5 gastos.

Recuperação de acesso: link de uso único enviado pelo WhatsApp, só para número já confirmado.

## Capabilities and Constraints

- Planos: Teste grátis (7 dias, 50 mensagens); Essencial R$ 19 por mês (300 mensagens); Family R$ 39 por mês (800 mensagens, até 4 pessoas, "em breve").
- Não acessa conta bancária nem movimenta dinheiro.
- LGPD: o cliente baixa os dados (`MEUS DADOS`) ou apaga tudo (`EXCLUIR MEUS DADOS`) pelo WhatsApp. Exclusão apaga lançamentos e conversas e anonimiza o cadastro.
- WhatsApp pela Evolution API (não oficial) por enquanto; migração para a API oficial é uma decisão futura.
- Nome "Gastômetro" é provisório e deve ser trocável em um só lugar. Domínio, provedor de e-mail e textos legais definitivos ainda não definidos.

## Brand Commitments

Nome provisório (trocável). Português do Brasil, tom claro e direto. O dono do produto escolheu, para a landing, um tom de confiança premium.

## Evidence on Hand

Existem e podem ser mostrados: o painel funcionando (Visão geral, Lançamentos, Conta) e o fluxo de conversa do bot.

Não existem, e não devem ser inventados: depoimentos, clientes, números de uso, fotografias, logotipo, avaliações.

## Product Principles

1. Mostrar o produto real cedo: o painel aparece na primeira dobra da landing.
2. Privacidade dita sem rodeio, com a prova do que o produto faz e não faz.
3. Prova só se for verdadeira.
4. O menor caminho possível até o primeiro gasto registrado.
5. Números sempre vêm do banco, nunca de estimativa da IA.

## Accessibility & Inclusion

Uso predominante no celular, com uma mão. Contraste mínimo AA. Português do Brasil.
