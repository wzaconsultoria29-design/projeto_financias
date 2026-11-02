# Cadastro, login e plano: desenho

Data: 2026-11-02. Estado: **para aprovação**. Substitui a parte de login do desenho de 2026-10-31 (`2026-10-31-app-e-familia-design.md`). Nada deste documento foi construído.

## Por quê

O produto só vale se o cliente for **conhecido**: nome, e-mail confirmado e WhatsApp confirmado, com aceite dos termos. Isso vale também para o teste grátis. O login precisa ser simples para o cliente e seguro, e não pode parar de funcionar se o bot cair. Além disso, o cliente precisa poder **trocar de plano a qualquer momento** pelo app.

## Metas

1. Ninguém usa o bot sem cadastro completo (nome, e-mail, WhatsApp, aceite), inclusive no teste grátis.
2. Entrar no painel é simples (e-mail e código) e continua funcionando se o bot estiver fora.
3. Recuperar o acesso pelo WhatsApp sem código para colar.
4. Trocar de plano pelo app, sempre.
5. Fechar as falhas encontradas na auditoria do login atual (abaixo).

## Não metas

- Senha. Login social (Google) e passkeys ficam para depois.
- Cobrança. O gateway (Mercado Pago v3) é outra entrega; este desenho só define como o plano muda e onde o pagamento se encaixa.
- Plano Family com grupo compartilhado (fase seguinte).

## Anti-metas (seria falha mesmo funcionando)

- O bot criar conta para número desconhecido.
- Um estranho conseguir entrar na conta de outra pessoa, nem por golpe do código, nem por adivinhação.
- O login depender de um serviço só (hoje: o bot).
- O cliente ser cobrado ou trocar de plano sem uma ação clara e confirmada.

## Auditoria do login atual (fatos lidos no código)

Sérias: (1) golpe do código, pois quem gera o código no site e convence outra pessoa a enviá-lo ao bot entra na conta dela; (2) o bot é ponto único de falha do login; (3) um cliente cadastrado pode atribuir a própria conta à sessão de outra pessoa enviando códigos aleatórios (acertos não contam como falha) e não há limite por IP em `login-iniciar`.

Médias: (4) aba recarregada no celular perde o código e o login fica sem quem o conclua; (5) código marcado como usado antes de a sessão abrir; (6) conta presa só ao número (reciclagem de número, troca de chip clonada); (7) sem "sair de todos os aparelhos" nem prazo de inatividade; (8) sem registro de eventos de login; (9) código de 5 minutos curto.

Achado novo, e crítico para esta entrega: **`verificar_acesso(telefone, p_criar = true)` cria uma conta de teste para qualquer número desconhecido** que escreva ao bot, sem nome, e-mail ou aceite. E `cadastrar_usuario` aceita nome e e-mail vazios.

## Jornada do cliente

1. **Landing** → "Começar grátis".
2. **Cadastro** (uma tela): nome, e-mail, WhatsApp (celular com DDD), aceite dos termos (obrigatório), novidades (opcional, desmarcado). Todos obrigatórios, exceto "novidades".
3. **Código de 6 dígitos no e-mail**, digitado na tela. Prova que o e-mail é real. Ao acertar, a pessoa entra no painel.
4. **Painel em modo "falta conectar o WhatsApp"**: dados de exemplo e um passo em destaque, "Conectar WhatsApp", que abre o bot com `ATIVAR <código>` pronto.
5. **O bot confirma o número** e só então **libera o uso**. O teste de 7 dias começa nesse momento. A tela do painel percebe sozinha e passa a mostrar os dados reais.
6. **Depois**: entra de novo com e-mail e código. Se perder o acesso ao e-mail, escreve "painel" ao bot e recebe um link de uso único.

O bot **nunca cria conta**. Para número desconhecido ou ainda não conectado, responde uma vez com o link de cadastro e não grava nada.

## Estados da conta

| Estado | Como chega | Pode |
|---|---|---|
| `cadastrado` | enviou o formulário | nada, ainda não confirmou o e-mail |
| `email_verificado` | acertou o código do e-mail | entrar no painel (modo "conectar WhatsApp"); o bot continua bloqueado |
| `whatsapp_conectado` (teste ou plano) | enviou `ATIVAR` do número cadastrado | usar o bot e o painel completo |
| `bloqueado`, `cancelado` | regras de plano ou administração | conforme o plano |

Número não confirmado dentro de 48 horas é liberado para quem o confirmar primeiro. O bot nunca entrega dados a número não confirmado.

## Regras do teste grátis

7 dias a partir da conexão do WhatsApp, 50 mensagens. Quem registrar 5 gastos ganha mais 3 dias (uma única vez). Não precisa de cartão. O cadastro completo continua obrigatório.

## Login: regras de segurança

**Entrada principal (e-mail e código digitado)**
- Código de 6 dígitos, validade de 10 minutos, 5 tentativas por código, de uso único.
- Reenvio só depois de 60 segundos; limite por e-mail e por IP; captcha (Turnstile) no pedido do código.
- Resposta idêntica exista ou não o e-mail (sem enumeração de contas).
- Código digitado, não link, para os antivírus de e-mail não o gastarem.

**Recuperação pelo WhatsApp (link de uso único)**
- A pessoa escreve "painel" ao bot. O bot responde, só àquele número, com um link de 128 bits, válido por 10 minutos.
- Abrir o link mostra uma página com o aparelho e a cidade aproximada e um botão "Entrar neste aparelho". A sessão só abre ao clicar (o GET não consome o link).
- Não há código para colar nem para ser enganado a enviar.

**Sessão**
- Renovação com troca do token. Prazo de inatividade. Botão "sair de todos os aparelhos".
- Registro de cada entrada (data, aparelho, cidade aproximada, forma). Aviso no WhatsApp na próxima conversa quando for aparelho novo.
- A sessão só é aberta depois de tudo conferido (o código não é gasto antes).
- O estado do login sobrevive à recarga da aba (sessionStorage).

**Identidade**
- Trocar e-mail ou número exige confirmar o novo e o antigo.
- Conta não depende só do número: o e-mail é a segunda chave (reciclagem de número deixa de dar acesso automático ao painel).

**Bot**
- `verificar_acesso` passa a chamar com `p_criar = false`. Número desconhecido recebe só o convite de cadastro.
- `cadastrar_usuario` passa a recusar nome vazio, e-mail inválido e telefone que não seja celular com DDD, e a exigir o aceite.

## Troca de plano

Em **Conta > Plano**: três planos (Teste grátis, Essencial, Family), o atual destacado, uso do período, data da próxima renovação e botão "Mudar para X". Disponível a qualquer hora.

Regras propostas:
- **Subir de plano** (por exemplo Teste → Essencial): vale na hora, novo período começa hoje, o limite novo vale já.
- **Descer de plano**: vale no fim do período já pago; o cliente vê "muda em dd/mm".
- **Cancelar**: mantém o acesso até o fim do período; depois fica sem plano (os dados continuam dele).
- **Family**: aparece como "em breve" e permite entrar na lista de espera.
- Toda mudança pede **confirmação** com o resumo (preço, data, o que muda). Cada mudança fica registrada.
- Plano pago só é efetivado depois da confirmação do pagamento pelo gateway.

Função no banco: `app_mudar_plano(p_plano)` (somente usuário logado, só para a própria conta), com a máquina de estados acima.

## Dados (resumo das mudanças)

- `usuarios`: `email` obrigatório e único (sem diferenciar maiúsculas), `email_verificado_em`, `whatsapp_conectado_em`.
- `login_codigos` (e-mail): `email`, hash do código, tentativas, expiração, uso.
- `login_links` (WhatsApp): hash do token, usuário, expiração, uso, aparelho que pediu.
- `login_eventos`: usuário, tipo, resultado, IP aproximado, aparelho.
- `assinaturas`/`mudancas_plano`: plano atual, plano agendado, data de efeito, origem.
- Políticas de acesso (RLS) iguais ao padrão atual: cada pessoa só enxerga a própria linha.

## O que fica para o construtor decidir

Nomes de tabelas e colunas, formato das telas (seguindo a landing e o painel atuais), textos de e-mail e de bot em português do Brasil, e a ordem interna das migrações.

## Pendências que dependem do dono do produto

1. **Nome da marca e domínio** (para o e-mail não cair no spam).
2. **Provedor de e-mail** (Resend ou Brevo) com o domínio verificado.
3. **Conta no Cloudflare Turnstile** (captcha).
4. **Plano pago antes do gateway existir.** Opção A: o botão registra a intenção e leva ao checkout assim que houver. Opção B (não recomendada): liberar o plano sem cobrança durante o pré-lançamento. Recomendação: A.
5. **Cadastro que já existe** (o seu número, sem nome e e-mail): precisa completar os dados no primeiro acesso.

## Ordem de construção sugerida

1. Banco e bot: fechar a criação automática, validar o cadastro, e-mail obrigatório, estados da conta.
2. Cadastro e código por e-mail (depende dos itens 1 a 3).
3. Painel em modo "conectar WhatsApp" e detecção da conexão.
4. Link de recuperação pelo WhatsApp e sessões (sair de todos, registro de eventos).
5. Troca de plano (tela e função; cobrança depois).
6. Testes de ponta a ponta e de isolamento, e nova auditoria.

## Como saberemos que deu certo

- Mensagem de número desconhecido ao bot não cria nenhuma linha no banco.
- Cadastro sem nome, e-mail ou aceite é recusado no banco, não só na tela.
- O painel abre com e-mail e código e com o bot desligado.
- Código errado 5 vezes invalida o código; reenvio antes de 60 s é recusado.
- Link do WhatsApp só funciona uma vez, só no prazo e só após o clique.
- Um cliente não consegue anexar a própria conta a um login que outra pessoa está esperando.
- Trocar de plano mostra confirmação, grava o evento e respeita as regras de subir, descer e cancelar.
