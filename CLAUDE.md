# CLAUDE.md: memória viva do projeto Gastômetro

**Última atualização: 2026-11-07.** Este é o arquivo que o Claude lê primeiro, em qualquer conversa, para não se perder. O dono do produto (Wesley, WZA Consultoria) pediu que ele guarde **tudo que for vigente**, em detalhe, até o dia em que o aplicativo for ao ar e depois dele.

> **Este projeto fica na pasta `5 - App Financias\gastometro-v3`.** Não tem relação com o projeto **Corpelle** (pasta `4. Corpelle\repo`), mesmo que a janela do Claude abra apontando para lá. Se o diretório de trabalho for o do Corpelle, vá para a pasta do Gastômetro antes de mexer em qualquer coisa.

## 0. REGRA DE MANUTENÇÃO (obrigatória, vale para toda conversa futura)

1. **Quando o dono pedir para mudar, desconsiderar ou criar uma regra, decisão, preço, texto, fluxo ou comportamento, atualize este arquivo na mesma tarefa**, antes de dizer que terminou. Ajuste a seção afetada **e** acrescente uma linha em "13. Registro de decisões" (data, o que mudou, por quê).
2. **Quando uma decisão for substituída, não apague o histórico:** marque a antiga como **(superado em AAAA-MM-DD)** e escreva a nova.
3. Quando entregar algo (código, migração aplicada, workflow publicado, deploy), atualize "4. Estado atual" e acrescente em "14. Histórico de entregas".
4. Cada afirmação vem com um estado: **Decidido**, **Proposto** (aguarda confirmação), **Pendente** (falta fazer ou falta o dono providenciar), **Feito** ou **Superado**.
5. **Nunca coloque segredos aqui:** chaves, senhas, caminho secreto do webhook, tokens, `service_role`, e-mails ou telefones pessoais. Só identificadores que não dão acesso (ids de projeto, nomes de workflow).
6. Se este arquivo e o código discordarem, **o código vence**; corrija o arquivo e avise o dono.
7. Os outros documentos do repositório (README, `docs/`) são a base; este arquivo os resume e aponta para eles. Onde o README estiver desatualizado, este arquivo diz qual é a versão certa (veja a seção 15).

---

## 1. O que é o produto

**Gastômetro** (nome **provisório**, trocável; veja `docs/RENOMEAR-MARCA.md`) é um assistente de finanças pessoais **pelo WhatsApp**, com um **site e painel web**.

- A pessoa manda o gasto em **texto, áudio ou foto do cupom** e o assistente anota, categoriza e responde. O **painel** mostra para onde o dinheiro foi.
- **O painel é o centro do produto; o bot do WhatsApp é um complemento** para registrar rápido. O painel também permite lançar gastos e entradas direto, e tem botão que abre o WhatsApp com o bot.
- **Não acessa conta bancária nem movimenta dinheiro.** Não há conexão com banco (diferente de concorrentes como o Dinzo, que usa Open Finance). Isso é um ponto de venda.
- Público: brasileiros que cuidam do próprio dinheiro e não mantêm planilha (autônomos, casais, famílias). Depois, grupos de até 4 pessoas (plano Family).
- Idioma e tom: **português do Brasil**, claro e direto, confiança premium (o dono escolheu isso para a landing).
- Dono: Wesley, WZA Consultoria. Quer **vender**: "começar pequeno, mas deixar pronto para escalar".

### Princípios de produto (`app/PRODUCT.md`)
1. Mostrar o produto real cedo (painel na primeira dobra da landing).
2. Privacidade dita sem rodeio, com a prova do que o produto faz e não faz.
3. **Prova só se for verdadeira:** não inventar depoimentos, clientes, números de uso, fotos, logotipo ou avaliações. (A landing do Gastômetro **não tem depoimentos**; confirmado no código em 2026-11-07.)
4. O menor caminho possível até o primeiro gasto registrado.
5. **Números sempre vêm do banco**, nunca de estimativa da IA. A IA só interpreta a mensagem e **nunca faz conta**.
6. O assistente só trata do dinheiro da própria pessoa. Analisa **só quando perguntado** ("onde posso economizar?"), de forma leve, e **nunca puxa assunto**. Nunca dá conselho de investimento nem indica bancos, aplicativos ou produtos.

---

## 2. Como trabalhar com o dono (regras combinadas)

- **Sempre avisar e esperar o OK antes de qualquer ação fora do computador local:** aplicar migração no Supabase, rodar SQL que altera ou apaga dados, publicar Edge Function, editar ou ativar workflow no n8n, enviar webhook ao bot (isso manda WhatsApp de verdade), criar repositório, **commit/push para o GitHub e deploy na Vercel**, apagar dados. Trabalho local (código, testes locais) segue sem pedir.
  - Por quê: em 2026-10-31 apliquei migração, apaguei dados de teste e disparei mensagens pelo bot sem avisar, e o dono reclamou.
  - Padrão que funciona: dizer o que vai fazer e o que apaga ou envia; **ensaiar antes** (veja a seção 6); aplicar; **conferir no banco** e relatar.
- **Testes reais com o bot só com o número do dono** e só depois do OK. Nunca enviar mensagem ao bot em nome de outros números.
- **Fases 1 e 2 antigas** (workflows e banco antigo) e os fluxos "Fluxo 3 - Cadastro Landing Page" e "Pagamento Mercado Pago" antigos **não podem ser alterados**. A v3 roda em paralelo.
- **Nunca repetir no chat chaves** que apareçam em JSON de workflows antigos (OpenAI e Evolution). O dono foi avisado para trocá-las (pendente).
- O dono prefere: **Figma e Playwright para desenhar, construir, testar e tirar capturas de tela**; usar as skills de design instaladas (seção 8.7); ver o resultado de verdade (captura) antes de dizer que ficou bom.
- **Honestidade nos relatórios:** dizer o que foi e o que não foi verificado. Corrigir os próprios erros na hora (ex.: em 2026-11-07 corrigi uma afirmação falsa sobre depoimentos).
- O dono gosta de respostas objetivas, em português, com o que mudou e o que ele precisa decidir. Fechar tarefas com "o que falta" e uma pergunta única quando houver decisão.
- Textos do site: **sem travessão (— ou –)** no texto visível (há teste que falha se aparecer); sem emoji; sem inventar prova.

---

## 3. Onde está tudo

### 3.1 Pastas
```
5 - App Financias\gastometro-v3\          (raiz do repositório git)
  CLAUDE.md                               este arquivo
  README.md                               visão geral, comandos do bot (parcialmente desatualizado, veja seção 15)
  app\                                    site + painel (Next.js 16)
    PRODUCT.md                            princípios e restrições do produto
    AGENTS.md                             aviso: Next 16 mudou; ler node_modules/next/dist/docs antes de codar
    src\app\(landing)\                    landing (layout, page, landing.css)
    src\app\(site)\                       /cadastro, /entrar, /termos, /privacidade
    src\app\painel\                       /painel (Visão geral), /painel/lancamentos, /painel/conta
    src\components\landing\               seções da landing
    src\components\painel\                shell, lançamentos, conta; visao\ = Visão geral nova
    src\components\site\                  cabeçalho, rodapé, formulários do site
    src\config\                           brand.ts, planos.ts, categorias.ts, legal.ts
    src\lib\                              api.ts, painel.ts, periodo.ts, format.ts, privacidade.ts, demo*.ts, ...
    tests\                                Vitest (unitários)
    e2e\                                  Playwright (navegador real, serviços simulados)
    scripts\verificar-segredos.mjs        confere que nenhuma chave secreta foi para o build
  supabase\migrations\                    001 a 007 e 009 a 015 (não existe 008)
  supabase\tests\                         testes SQL (010, 011, 012, 013, 015)
  supabase\functions\                     Edge Functions login-iniciar e login-status
  docs\                                   MAPA-DE-PROCESSOS, SEGURANCA-E-LGPD, RENOMEAR-MARCA, screens\ (capturas)
  docs\superpowers\specs\                 desenhos aprovados (veja seção 12)
  docs\superpowers\plans\                 plano da Fase 1 do app
```

### 3.2 Contas e identificadores (sem acesso embutido)
| Peça | Identificador |
|---|---|
| **GitHub** | repositório `wzaconsultoria29-design/projeto_financias`, branch de trabalho e de produção **`feat/fase-1-app`** (existe também `main` local, base `749a593`) |
| **Vercel** | projeto `projeto-financias` (`prj_fT8zgPJ26k0MNnxfRVsB3wKmPVEu`), equipe **WZA CONSULTORIA**, slug `wza-consultoria1`, id **`team_H6QUeLtHcdZVJt4ZQsdqT5uY`** (atenção: já digitei `HQU` por engano; use `list_teams` se der 403). Root Directory = `app`. Alias de produção: `projeto-financias-pi.vercel.app`. Cada push na `feat/fase-1-app` gera um deploy de **produção** |
| **Supabase** (conta nova) | projeto `bfgmjovveboyidvhggpq`, região `us-east-1`. URL pública: `https://bfgmjovveboyidvhggpq.supabase.co`. O Supabase antigo (Fase 1/2) fica em **outra conta** e o conector não o enxerga |
| **n8n** | `webhook.servidorwza.shop`; pasta **"Gastômetro v3"** (id `CNlHV9c1n4IxUfas`) |
| Workflow Cadastro | `GASTOMETRO v3 - Cadastro Landing` id `a8ZDOhiKcSWYJZwp` (ativo) |
| Workflow Agente | `GASTOMETRO v3 - Agente WhatsApp` id `By3B5EEDaRqXD2s5` (ativo) |
| Workflows antigos (não mexer) | Fase 2 `eUWXueth35xPluHJ` (ativo), Fluxo 3 Cadastro `74c6BI3vGO405fUQ` (ativo), Pagamento MP `D6vAiU3HkMJkKMSn` |
| Credenciais no n8n | "Projeto Financias - Supabase" (id `54a2pkQoTdCU0Bkv`) e "Projeto Financias - Evolution API Key" (id `XuxFuKyAeGrQRzz7`) |
| **WhatsApp / Evolution API** | versão 2.3.7, instância `Projeto_financias`, número do bot `5582991130317` (chip dedicado). A Evolution 2.3.7 **não aceita header customizado**, então o webhook do bot é protegido por **caminho secreto** (fica só no workflow e na instância; trate como senha) |
| Webhook de cadastro | `POST https://webhook.servidorwza.shop/webhook/gastometro-v3-cadastro` |
| Figma | arquivo "Landing - objetos 3D" na conta do dono (3 gerações de imagem de IA consumidas) |

### 3.3 Variáveis do site (`app/.env.example`; todas públicas, nunca `service_role`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CADASTRO_URL`, `NEXT_PUBLIC_BOT_NUMBER`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_ENTITY`. As variáveis `NEXT_PUBLIC_*` são gravadas no build: mudou, faça redeploy. Na Vercel foram cadastradas em sessão anterior (conferir se o domínio mudar).

---

## 4. Estado atual (2026-11-12)

| Área | Estado |
|---|---|
| Banco (Supabase) | Migrações **001 a 007 e 009 a 021 aplicadas** (021 em 2026-11-12: objetivo, primeiro acesso e senha) (016 a 018 em 2026-11-08; **019 e 020 em 2026-11-12**; todas com OK do dono, depois de ensaio). `pg_cron` ligado; tarefa `limpar-dados-antigos` roda todo dia às 06:15 UTC. A 015 (painel novo) foi aplicada em 2026-11-07 depois de ensaio que achou e corrigiu um bug de acento. |
| Bot (n8n + Evolution) | **Ativo**. Bot **fechado**: só atende quem tem cadastro e conectou o WhatsApp. |
| Site e painel | **Publicados na Vercel** (último deploy READY em 2026-11-12: commit `a8351ef`, login com senha e primeiro acesso). Abre sem login da Vercel. Endereço atual: `projeto-financias-pi.vercel.app` (domínio definitivo pendente). |
| Landing | Nova versão no ar (seção 9). |
| Painel Visão geral | **Narrativa em 2026-11-07 e visual Verde-lima em 2026-11-08** (seções 8.3 e 8.4), no ar. Usa a renda do perfil quando falta receita lançada. Lançamentos e Configurações também no visual novo. |
| Cadastro | **Fluxo antigo ainda em uso:** nome, e-mail, WhatsApp e aceite; devolve link `wa.me` com `ATIVAR <código>`. O fluxo novo em 3 passos **não foi construído**. |
| Login | **E-mail e senha no dia a dia (2026-11-12)**, com o código do WhatsApp para primeiro acesso, aparelho novo e recuperar a senha (`/entrar`, `/entrar?modo=whatsapp`, `/entrar?modo=recuperar` → `/painel/senha-nova`). Senha só no Supabase Auth (função de borda `senha-definir`, mín. 8 e máx. 72 caracteres); o e-mail de login vira o real quando a pessoa cria a senha (antes era `u-<id>@painel.invalid`). E-mail **não confirmado por mensagem** (sem provedor de e-mail); a identidade vem do WhatsApp. Sessão fica no navegador e se renova sozinha. |
| Pagamento | **Mercado Pago no servidor desde 2026-11-12 (pagamento mensal avulso, Checkout Pro): migração 020 aplicada, token de TESTE gravado em `segredos_app`, funções de borda publicadas. O botão do site só passa a pagar depois do push do código do app. Nenhum pagamento de teste completo foi feito ainda.** Migração 020 (`cobrancas`, `cobranca_criar`, `cobranca_vincular_preferencia`, `cobranca_processar`), funções de borda `pagamento-criar` (exige login; o preço vem do banco) e `pagamento-webhook` (pública; busca o pagamento na API do Mercado Pago antes de confiar; idempotente). Aprovado = plano ativo por 1 mês (renovar antes do fim soma 1 mês). Sem renovação automática; o painel oferece Renovar a partir de 7 dias antes do fim. **Só chaves de teste**; o token fica em `segredos_app` (chave `mp_access_token`), nunca no repositório nem no navegador. O dono passou as chaves de teste em conversa: gerar novas antes de produção. A Public Key não é usada (Checkout Pro só redireciona). O antigo "pedido de plano" (migração 017) saiu da tela; a tabela `solicitacoes_plano` continua e o pedido pendente vira "atendida" quando o pagamento aprova. |
| Plano Family | **À venda no site** (landing, cadastro e Configurações têm "Assinar o Family"; sem "em breve"). Convite de pessoas no ar (migração 018 aplicada e telas enviadas). A **visão compartilhada dos valores e a cota compartilhada de mensagens NÃO existem**: cada pessoa do grupo vê só os próprios lançamentos e usa o próprio plano. |
| Testes | 280 unitários (Vitest) e 130 de ponta a ponta (Playwright, 2 pulados), tudo verde em 2026-11-11. |
| Configurações | **Blocos A, B e C construídos localmente em 2026-11-07** (menu, Conta com renda e custo de vida, Aparência com tema, Plano e pagamentos com assinar/pedido/histórico, Acesso compartilhado com convites, WhatsApp, Notificações, Privacidade, página `/convite/<código>`). **Migrações 016, 017 e 018 APLICADAS no banco em 2026-11-08** (ensaiadas antes, "FALHAS: 0" cada). O código do site que as usa **ainda não foi commitado nem enviado**: até o push, o site publicado não mostra as telas novas. |
| Conta do dono | Colocada **manualmente no plano Family** em 2026-11-07 (seção 5.6). |

---

## 5. Regras de negócio vigentes

### 5.1 Planos (tabela `planos`; espelhados em `app/src/config/planos.ts`)
| Código | Nome | Preço | Mensagens/mês | Números | Validade | Observação |
|---|---|---|---|---|---|---|
| `trial` | Teste grátis | R$ 0 | 50 | 1 | 7 dias (ciclo único) | +3 dias para quem registrar 5 gastos (regra anunciada; conferir implementação ao mexer) |
| `essencial` | Essencial | R$ 19 (1900 centavos) | 300 | 1 | mensal | "Mais popular" na landing |
| `family` | Family | R$ 39 (3900 centavos) | 800 compartilhadas | até 4 (`membros_max`) | mensal | À venda no site ("Assinar o Family"); sem pagamento online ainda |

- **(superado em 2026-10-31)** Planos antigos da memória: Trial 30 msgs, Solo R$ 19,90/150, Família R$ 44,90/500.
- Mensagens recebidas contam na cota (texto, áudio, imagem); `DEL#` e `ATIVAR` **não contam**. Uso por período em `uso_periodo` (chave: `assinatura_id` + `periodo_inicio`).
- Alerta de 80% da cota é registrado em `uso_periodo.alerta_80_em`.
- **A landing não promete o que o negócio não decidiu:** não há plano anual, preço riscado nem garantia de reembolso (decisão de 2026-11-07). O "teste de 7 dias sem cartão" faz o papel de garantia.

### 5.2 Assinaturas (tabela `assinaturas`)
- Status válidos: `trial`, `ativa`, `inadimplente`, `cancelada`, `expirada`.
- **Só pode existir UMA assinatura vigente por usuário** (índice único `assinaturas_vigente_uq`, para `trial`, `ativa`, `inadimplente`). Para trocar de plano, **atualize a assinatura vigente**, não crie outra.
- Um gatilho preenche `periodo_fim` do trial usando `planos.dias_validade`.
- `periodo_fim` nulo = **sem expiração** (usado na liberação manual).
- Acesso do bot (`verificar_acesso`): bloqueia se o usuário estiver `bloqueado`/`cancelado`, se não houver assinatura vigente, se o período expirou (tolerância: `ativa` +1 dia, `inadimplente` +3 dias) ou se a cota estourou.
- `usuarios.status`: `pendente`, `trial`, `ativo`, `inadimplente`, `bloqueado`, `cancelado`, `excluido`.

### 5.3 Bot fechado (decidido 2026-11-04; em vigor)
O contato **sempre começa no cliente**, vindo da landing. O bot **nunca escreve primeiro e nunca cria conta**.
- **Número sem cadastro:** recebe o link de cadastro (`cadastro_url` no nó Config), no máximo 1 vez por hora. A mensagem recebida é apagada na hora (`descartar_mensagem`); fica só um carimbo com **hash** do número por 24 h (`bot_convites`).
- **Cadastro pendente** (número não conectado): só `ATIVAR <código>` conecta; outras mensagens recebem "falta conectar". `NÃO FUI EU` cancela e apaga o cadastro pendente.
- **Conectado:** atendimento normal.
- O **teste de 7 dias começa quando o WhatsApp é conectado**, não no cadastro.
- Cadastro exige: nome (2 a 80 caracteres), e-mail válido e **único** (índice em `lower(email)`), celular com DDD (10 a 15 dígitos) e aceite. O banco recusa dado incompleto.
- Regra de número alheio (código antigo, valerá só para o fluxo atual): cadastro pendente do mesmo número dentro de 48 h bloqueia outro cadastro; depois de 48 h pode ser retomado. **Será dispensada no fluxo novo**, em que o celular é verificado primeiro.

### 5.4 Fluxo de cadastro **novo** (decidido 2026-11-06; **ainda não construído**)
1. **Celular:** nome completo, número, aceite dos termos e da política (com confirmação de 18+; novidades à parte, **desmarcado**) e captcha (Turnstile). A pessoa toca "Verificar pelo WhatsApp", o WhatsApp abre com a mensagem pronta, ela envia, e a tela avança sozinha. **O bot nunca escreve primeiro.**
2. **Senha:** indicador de força, botão mostrar. Guardada só pelo Supabase Auth.
3. **E-mail:** informar e **confirmar com código de 6 dígitos**. Fim do cadastro.
4. **Painel + boas-vindas no WhatsApp** (completas, com instruções): o teste de 7 dias começa agora.
5. **Perto do fim do teste:** pedir **cartão de crédito e CPF** (Mercado Pago, cobrança recorrente). Avisos por **e-mail** e por aviso no painel (o bot nunca inicia). Quem não informar o cartão fica com o acesso pausado e **os dados preservados**.
- Também: retomar o cadastro de onde parou; número já cadastrado leva ao login; cancelar antes da primeira cobrança; renda mensal e meta pedidas **depois, no painel**.
- **Verificação do celular:** o cliente envia a mensagem. Enviar código pelo bot só quando migrarmos para a **API oficial** do WhatsApp.

### 5.5 Login (decidido 2026-11-06; **ainda não construído**; hoje vale o login por código)
- **E-mail e senha**, com e-mail confirmado por código, **esqueci a senha por e-mail**, **link de recuperação pelo WhatsApp** (uso único, só para número confirmado), limite de tentativas, captcha, sessões, "sair de todos os aparelhos", registro de entradas.
- **Hoje (em uso):** `/entrar` mostra um código de 6 dígitos (vale 5 minutos, uso único, bloqueio após 5 erros em 10 minutos); a pessoa envia `PAINEL <código>` ao bot e a sessão abre com `verifyOtp` do Supabase Auth. Edge Functions `login-iniciar` e `login-status` (aceitam qualquer origem enquanto `SITE_ORIGIN` estiver vazio).

### 5.6 Plano Família
- **Decidido 2026-11-06:** o **dono do grupo convida** membros; **cada membro tem cadastro, senha e WhatsApp próprios**; conta no limite do plano (**4**). No app: "Convidados 0 de 4", só o dono convida, remove e muda papéis; convite por código via WhatsApp ou e-mail.
- Desenho original (`2026-10-31-app-e-familia-design.md`, **proposta**): todos os membros veem **todos os valores do grupo**; no painel, filtro "eu, todos, por pessoa".
- **Não construído:** grupo, convites, visão compartilhada, permissões.
- **Liberação manual (2026-11-07):** a conta do dono (Wesley) foi colocada no Family por SQL: assinatura `ativa`, sem gateway, sem `periodo_fim`, `usuarios.status = ativo`; contador de mensagens zerado (novo `periodo_inicio`). O bot reconhece Family com 800 mensagens. Para reverter: voltar a assinatura para `trial` ou outro plano e o status do usuário para `trial`.

### 5.7 Pagamento (**pendente**)
Mercado Pago, cartão recorrente (depende da conta do dono). Falta: ativar assinatura, renovar período, inadimplência (3 dias de tolerância já no `verificar_acesso`), reset da cota, recibo, e-mails de aviso, link de checkout com identificação do cliente, cancelamento (**cancelar mantém o acesso até o fim do período pago**, com confirmação e registro), troca de plano a qualquer momento (**upgrade imediato; downgrade no fim do período**).
- **O que a landing já afirma (desde 2026-11-12):** "Pix, cartão ou boleto pelo Mercado Pago", "Preço final, sem taxa escondida", "Sem renovação automática: você renova se quiser" (o pagamento é mensal avulso). Se um dia virar cobrança recorrente, trocar esse selo e a pergunta "Como eu pago?".

### 5.8 Comandos do bot
| Mensagem | Efeito |
|---|---|
| `ACEITO` | registra o aceite dos termos (para quem chega sem passar pelo site) |
| `ATIVAR <código>` | confirma o número do cadastro feito no site |
| `PAINEL <código>` | confirma o login no painel |
| `DEL#XXXXXX` | apaga (lógico) um lançamento do próprio cliente |
| `MEUS DADOS` | resumo + CSV com todos os lançamentos |
| `EXCLUIR MEUS DADOS` → `CONFIRMAR EXCLUSAO` | elimina dados e anonimiza o cadastro |
| qualquer outra coisa | classificador de escopo → agente (ou resposta fixa fora do escopo) |
- Fora do escopo (resposta fixa, nunca chega ao agente): dicas de economia genéricas, investimentos, indicação de aplicativos.
- Análise **sob pedido** é permitida ("onde posso economizar?"): o agente usa só os dados da própria pessoa.
- Variáveis do nó **Config** do agente: `evolution_url`, `instancia`, `checkout_url`, `termos_versao`, `politica_url`, `termos_url`, `nome_produto`, `cadastro_url`. `termos_versao` deve ser **igual** a `VERSAO_LEGAL` (hoje `v1-2026-10`) em `app/src/config/legal.ts`.

---

## 6. Banco de dados (Supabase)

### 6.1 Princípios
- Identidade do usuário = **telefone do WhatsApp** (mensagem recebida comprova a posse da linha).
- **RLS ligado em todas as tabelas.** Com a chave pública só se lê `planos`; o resto devolve `permission denied`.
- O **painel só executa funções `app_*`** (papel `authenticated`, `SECURITY INVOKER`/leitura pela política de acesso; escritas via funções `SECURITY DEFINER`). As funções do bot são **exclusivas do `service_role`** (n8n). Nenhuma função do bot é executável por `anon` ou `authenticated`.
- **Somas e métricas são calculadas no banco** (`resumo_periodo`, `app_visao_geral`, `app_painel`). O navegador nunca soma lista bruta.
- **"Apagar" é lógico** (`deleted_at`). "Excluir meus dados" apaga lançamentos e conversas e **anonimiza** o cadastro, mantendo a prova de consentimento. Decisão do dono: nada de apagar definitivo por enquanto.
- O modelo de IA **nunca recebe o id do usuário como parâmetro**: ele é fixado nos nós, então um prompt malicioso não acessa dados de outra pessoa.
- Datas relativas ("ontem", "esta semana") e períodos são **calculados no banco**, não pelo modelo.

### 6.2 Tabelas principais (conhecidas)
`usuarios` (telefone, nome, e-mail, `telefone_verificado_em`, `email_verificado_em`, `cadastro_em`, `boas_vindas_em`, status, consentimento), `planos`, `assinaturas`, `uso_periodo`, `lancamentos`, `conversa_mensagens` (IA lê só as últimas 12 h; limpeza após 7 dias), `mensagens_entrada` (limpeza após 90 dias; mensagens de desconhecidos são descartadas), `consentimentos`, `eventos_pagamento`, `segredos_app` (pepper do hash), `bot_convites`, tabelas de login por código (migração 010).
- **`lancamentos`:** `tipo` (`despesa`/`receita`), `valor`, `data_lancamento`, `categoria`, `descricao`, `metodo_pagamento`, `parcelas` (só guarda **quantas** parcelas, não o calendário), `recorrente`, `tipo_gasto`, `deleted_at`.
- **`tipo_gasto` aceita só `essencial`, `supérfluo` (COM ACENTO), `investimento`** (constraint do banco). Foi um bug real: tratar `supérfluo` sem o `é` joga o gasto em "sem classificação".

### 6.3 Funções
- **Bot (`service_role`):** `verificar_acesso(telefone, p_criar)`, `registrar_uso`, `cadastrar_usuario`, `ativar_por_codigo`, `cancelar_cadastro_pendente`, `bot_convite`, `descartar_mensagem`, `registrar_consentimento`, `exportar_dados`, `excluir_dados`, `apagar_lancamento`, `resumo_periodo`, `limpar_dados_antigos` (**não agendada**).
- **Painel (`authenticated`):** `app_painel(p_de, p_ate)`, `app_visao_geral`, `app_salvar_lancamento`, `app_minha_conta`, `app_categorias`, listagem e exclusão de lançamentos (veja migrações 009 a 012 e 015).
- `verificar_acesso` com `p_criar=false` **nunca cria conta** (bot fechado).

### 6.4 Migrações (em `supabase/migrations`, todas aplicadas)
001 schema base · 002 funções do bot · 003 RLS e permissões · 004 dedup de conversa · 005 respostas em objeto para o n8n · 006 períodos calculados no banco · 007 LGPD (consentimento, exportar, excluir) · **(008 não existe)** · 009 planos e app (Essencial, Family, trial 7 dias) · 010 login pelo WhatsApp · 011 painel · 012 categorias · **013 cadastro completo e bot fechado** · **014 descartar mensagem de desconhecido** · **015 métricas do painel (`app_painel`)** · **016 perfil: renda e custo de vida mensais em `usuarios`, `app_minha_conta` com os dois campos e `app_salvar_perfil` (ESCRITA e com teste SQL, NÃO APLICADA em 2026-11-07)**.
- Na época da 013 o banco **estava diferente do repositório** nas funções `cadastrar_usuario`, `ativar_por_codigo` e `verificar_acesso`; a 013 as redefiniu. Lição: conferir o banco real antes de assumir o repositório.

### 6.5 Como mudar o banco com segurança
1. Escrever a migração e o **teste SQL** em `supabase/tests/` (bloco `DO` que termina com **erro proposital** para desfazer tudo; sucesso = mensagem com **`FALHAS: 0`**).
2. **Ensaio:** executar migração + teste **na mesma chamada** (`execute_sql`): o erro proposital faz tudo ser desfeito. Foi assim que o bug do acento da 015 apareceu antes de ir para o banco.
3. **Pedir o OK do dono**, aplicar com `apply_migration` (nome em snake_case, ex.: `015_painel_metricas`) e **conferir** (função existe, permissões corretas).
4. Mudanças de dados pontuais (ex.: liberar plano) seguem o mesmo ritmo: olhar, ensaiar em transação desfeita, aplicar, conferir.

### 6.6 Contrato de `app_painel(p_de, p_ate)` (migração 015)
Só leitura; `authenticated`; período inválido (invertido ou maior que 3660 dias) gera `periodo_invalido`; sem cadastro gera `sem_cadastro`. Devolve um JSON com: `periodo` (de, ate, dias, dias_decorridos), `resumo` (receitas, despesas, saldo, `taxa_poupanca`, `media_diaria`, quantidade), `anterior` (período do mesmo tamanho imediatamente antes; inclui `despesas_mesmo_ponto` para comparação justa), `variacao_despesas_pct`, `categorias` (7 maiores + "Outras", cada uma com `pct` e `anterior`), `pareto.top3_pct`, `tipos` (essencial, superfluo, investimento, sem_tipo), `fixos` (fixos_total, variaveis_total, maiores), `acumulado` (gasto dia a dia contra o período anterior; só para períodos de até 62 dias; `atual` nulo nos dias futuros), `dia_semana` (total e ocorrências por dia), `tendencia` (6 meses terminando no mês de `p_ate`), `maiores` (5), `projecao` (**só no mês corrente em andamento**), `sem_receita`, `historico_total`.
- **Fixos** = lançamento recorrente **ou** categoria em `Despesas Fixas`, `Moradia`, `Habitação`, `Assinaturas`, `Seguros`.
- Teste: `supabase/tests/015_painel_metricas.test.sql` (17 verificações, usa outubro/2026 como mês fixo).

---

## 7. Bot, n8n e Evolution

- **Agente WhatsApp** (n8n): recebe o webhook da Evolution, deduplica, verifica acesso (`verificar_acesso` com `p_criar:false`), trata comandos, classifica o escopo, e chama o agente (modelo **gpt-4o-mini**) com ferramentas que apontam para funções do banco. Tem ramo "sem acesso" que responde o link de cadastro (máximo 1/hora) e descarta a mensagem.
- **Cadastro Landing** (n8n): valida nome, e-mail e telefone, traduz erros do banco em mensagens claras e devolve `{ ok, whatsapp_url, codigo_ativacao, ja_cadastrado }`. O corpo tem uma **isca para robôs** (`website`, deve ir vazio). Não envia mensagem ativa.
- **Lições do agente:** não deixar o modelo calcular datas; não deixar apagar sozinho; escopo travado pelo nó "Classificar Escopo"; análise sob pedido tem regra própria no prompt (regra 10).
- **n8n MCP:** `update_workflow` com operações (`setNodeParameter` com arrays completos, `addNode`, `addConnection` com `sourceIndex`, `removeConnection`, `setNodeCredential`) e depois **`publish_workflow`**. O conector é **instável em chamadas grandes**: dividir em edições pequenas. Atualizações podem **não atribuir credenciais sozinhas**: definir com `setNodeCredential` e conferir. Funções RPC do Supabase devem devolver **objeto JSON** (lista vira vários itens; booleano é embrulhado). Busca de workflows é **sensível a acento** ("Gastômetro" ≠ "gastometro"). O n8n MCP não cria credenciais; o dono cadastra.
- **Logs do n8n** guardam texto das mensagens: em produção, não salvar execuções bem-sucedidas (pendente).

---

## 8. Site e painel (`app/`)

### 8.1 Stack e convenções
- **Next.js 16.4.3** (App Router; **versão com mudanças de API**: leia `node_modules/next/dist/docs/` antes de codar), **React 19.3**, **Tailwind v4**, TypeScript, ícones **Phosphor** (`@phosphor-icons/react`), fonte **Jost** (via `next/font`), **Recharts** instalado mas os gráficos do painel são **SVG próprio**.
- Grupos de rotas: `(landing)` com layout e `landing.css` próprios; `(site)` para cadastro, entrar, termos, privacidade; `/painel` é um shell de cliente com guarda de login.
- Marca em **um só lugar**: `src/config/brand.ts` (`name`, `tagline`, `botWaUrl(texto)`, número do bot). Veja `docs/RENOMEAR-MARCA.md` para trocar o nome (site, bot, domínio, origens).
- Segurança do site: **CSP** montada em `src/lib/seguranca.ts` (conexões só para o próprio site, Supabase e webhook de cadastro), `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`. `npm run verificar:segredos` confere o build (a palavra "service_role" no código do supabase-js é falso positivo conhecido).
- Regra do lint `react-hooks/set-state-in-effect`: **não chamar `setState` direto dentro de efeito**; para ler o navegador (ex.: `localStorage`) use `useSyncExternalStore` (veja `src/lib/privacidade.ts`).

### 8.2 Testes
- **Vitest + Testing Library** (`npm test`): unitários e de componentes (`tests/`). Limpeza automática em `tests/setup.ts`.
- **Playwright** (`npm run test:e2e`): servidor de desenvolvimento na **porta 3100** com variáveis falsas (`*.exemplo.test`); projetos `desktop` (1280×720) e `mobile` (375×812). Serviços simulados em `e2e/apoio.ts` (`simular`, `entrar`, `SUPABASE`). Relógio fixo (`page.clock.setFixedTime`).
- O E2E da landing **espera a hidratação do React** antes de digitar (senão o texto digitado se mistura com o valor inicial). Foi preciso quando a página ficou mais pesada.
- `innerText` devolve **MAIÚSCULAS** em títulos com `text-transform: uppercase` (classe `lp-display`): compare sem diferenciar caixa.
- As capturas dos testes vão para `docs/screens/` (versionadas).
- Metodologia: **TDD** (teste primeiro, ver falhar pelo motivo certo, depois implementar). Antes de dizer "pronto": `tsc --noEmit`, `eslint .`, `vitest run`, `playwright test`, `npm run verificar:segredos`, e **olhar as capturas**.
- Comandos: `cd app`, `npm run dev` (porta 3000), `npm test`, `npm run test:e2e`, `npm run build && npm run verificar:segredos`.

### 8.3 Sistema visual (tokens em `src/app/globals.css`)
- **App logado = design system "Verde-lima" (2026-11-08), aprovado pelas maquetes `docs/mockups/2026-11-08/` e documentado em `docs/design-system/` (`index.html` e `tokens.css`).** Vale **só dentro de `.app-vl`** (envolve o painel em `app/painel/layout.tsx`); a landing, o cadastro e o login continuam no visual antigo (abaixo) até a reforma da landing. Fundo cinza-esverdeado `#eef1ed`, cartões brancos com raio 28 e sombra suave (sem borda no claro; borda fina no escuro), **verde-escuro de ação `#0b3a22`** e **uma cor de destaque, a lima `#bff25f`** (cartão "pode gastar por dia", botão de ação, item ativo do menu, coluna do mês atual). Fontes **Urbanist** (títulos e números grandes, classe `numero-grande`) e **Inter** (texto), carregadas em `app/painel/layout.tsx`; o alias `--fonte-ui`/`--fonte-titulo` faz `font-sans`/`font-display` valerem Inter/Urbanist só dentro de `.app-vl`. Os mesmos nomes de variável (`--papel`, `--superficie`, `--tinta`, `--floresta`...) ganham valores novos dentro de `.app-vl`, mais `--lima`, `--ativo-bg/--ativo-fg` (item ativo; no escuro vira lima com texto verde), `--linha-forte`, `--sombra`, `--borda-cartao`. **Tema escuro** pronto (`:root[data-tema="escuro"] .app-vl` e `prefers-color-scheme`): fundo `#0a120e`, cartões `#121c17`, a lima vira a cor viva. Atenção: variantes `dark:` do Tailwind seguem só o aparelho, não o seletor de tema; use variáveis. Utilitários de cor novos: `bg-lima`, `bg-ativo-bg`, `text-ativo-fg`, `text-verde-escuro`, `border-linha-forte`. O degradê verde do cartão de abertura no celular é a classe `.hero-degrade` (o único degradê; no computador o cartão é branco). Ícones: Phosphor, contorno no repouso e `fill` quando ativo; `IconeCategoria` dá o quadrado colorido por categoria.
- **Casca nova:** trilho flutuante branco de 68px no computador (marca, 3 destinos, avatar e sair); barra de abas arredondada no celular; cabeçalho com saudação por horário (`lib/saudacao.ts`) e avatar. **Visão geral:** `Resumo` (branco no computador, degradê no celular) ao lado do cartão lima `PodeGastar` (só no mês em andamento com renda), depois O que mudou, rosca de categorias, tipos de gasto em barras com marca de referência, fixos e variáveis, ritmo, colunas dos últimos meses (alternam despesas/receitas, mês atual em lima com balão), maiores gastos com ícone, próximos passos. Cada cartão mantém ícone, manchete e "Como ler". **Lançamentos:** período em controle segmentado, busca e filtro em pílula, ícone de categoria em cada linha. **Configurações:** menu em cartão com ícones e área ativa em lima.
- **Visual antigo (landing, cadastro, login):**
- Tema claro por padrão, segue `prefers-color-scheme` (um tema por página).
- Neutro frio esverdeado + **uma cor de marca (verde-floresta)**: `--papel #f3f5f1`, `--superficie #fafbf9`, `--tinta #10201a`, `--suave #475a52`, `--linha #d9e1db`, `--floresta #0e4a3a`, `--folha #ddebe3`. Escuro: papel `#0b1411`, floresta `#7fd6ae`, etc.
- **Raio:** cartões 20px, botões em pílula, campos 12px (regra única).
- **Oito cores de categoria** `--c1` a `--c8` (azul, laranja, verde-água, amarelo, magenta, verde, violeta, vermelho; validadas, com versão escura): **a cor segue a categoria, nunca a posição** (`corDaCategoria` em `src/lib/narrativa.ts`: Alimentação laranja, Moradia/Habitação azul, Transporte verde-água, Lazer magenta, Saúde vermelho, Educação amarelo, Compras/Roupas/Assinaturas violeta, Contas/Despesas fixas/Seguros verde, Outras/Outros cinza; categoria nova recebe uma das oito por cálculo estável). **Essencial/supérfluo/investimento** usam tons da marca `--t1`, `--t2`, `--t3` para não repetir as cores das categorias. **Abertura** `--hero` (verde-escuro cheio), `--realce` (lima), `--coral`; **etiquetas** `--bom-bg/ink` (verde) e `--ruim-bg/ink` (laranja). Anteriores:  `--d-azul #2a78d6` (escuro `#3987e5`), `--d-laranja #d9541a` (`#e8703a`), `--d-agua #159a69` (`#199e70`), `--d-cinza`, `--d-trilho`. **Receitas = verde-floresta; despesas = laranja; essencial/supérfluo/investimento = azul/laranja/verde-água; barras ordenadas = verde da marca (uma cor só).**
- **Landing nas cores Verde-lima (2026-11-12):** `landing.css` redefine dentro de `.lp` os mesmos tokens do app (`--papel #eef1ed`, `--floresta`/`--botao #0b3a22`, `--folha #e6efe1`, `--lima-suave #edfad0`, com versão escura igual à do `.app-vl`) e os próprios: `--noite #072a18`, `--esmeralda #0b3a22`, `--vivo #1f8a4c`, `--lima #bff25f`, `--menta #d8f2e4`. Degradês, brilho lima, grão e objetos 3D **continuam** (o dono gosta dos efeitos). Fonte segue Jost em caixa alta nos títulos.
- Regras de dataviz seguidas: número grande para cifra única, medidor para razão contra limite, barra fina segmentada para partes, **sem eixo duplo**, rótulo direto + **tabela acessível** (`sr-only`) em cada gráfico, tooltip no gráfico de linha, sem gradiente nem sombra em repouso no painel, **cor diz bom/ruim, não subiu/desceu** (despesa subindo não é pintada de vermelho: tom calmo).
- Acessibilidade: tabelas escondidas visualmente para leitor de tela, `role="img"` com resumo nos gráficos, alvos de toque de 44px+, `aria-pressed` no botão do olho, respeito a `prefers-reduced-motion`.

### 8.4 Painel: Visão geral (refeita em 2026-11-06/07)
Desenho: `docs/superpowers/specs/2026-11-06-painel-novo-design.md`. Estilo: **pastel-consumer** (da skill de design) com a paleta e a fonte da marca. **Pergunta da tela:** "Este mês estou no azul e para onde foi o dinheiro?" O **saldo é o maior número**; a frase abaixo do título (`veredito`) responde.
- **Shell:** trilho de ícones no computador (marca + Visão geral, Lançamentos, Conta + inicial da pessoa + Sair), barra de abas no celular. Sem barra superior.
- **Cabeçalho:** período (Mês, 30 dias, Ano, Personalizado), setas de mês (próximo desativado no mês atual), **Lançar** (abre o formulário na própria tela), **olho** (esconder valores), **Conversar no WhatsApp**.
- **Ordem da história (2026-11-07, substitui as duas colunas):** abertura em cor cheia (`Resumo`) e, abaixo, uma grade de 12 colunas em que cada linha fecha a mesma borda (`Celula` estica o cartão): **O que mudou** (5) e **Para onde foi o dinheiro** (7) · **Essencial/supérfluo/investimento** (7) e **Fixos e variáveis** (5) · **O ritmo do período** (12, gráfico à esquerda e números à direita) · **Nos últimos meses** (7) e **Maiores gastos** (5) · **O que fazer agora** (12). No celular, uma coluna na mesma ordem.
- **Componentes:** `src/components/painel/visao/` (`Capitulo` = título, manchete, conteúdo e "Como ler" aberto por padrão; `Resumo` = abertura; `OQueMudou`, `ParaOndeFoi`, `TiposGasto`, `FixosVariaveis`, `Ritmo`, `Tendencia`, `ProximosPassos`, `PrimeirosPassos`, `EsqueletoPainel`, `CabecalhoPainel`, `LancarRapido`, `useLargura`). **Removidos:** `Notou` ("O que o painel notou") e `PerguntasRapidas` (viraram `ProximosPassos`). Regras puras e testadas: `src/lib/narrativa.ts` (`manchetes`, `oQueMudou`, `proximosPassos`, `corDaCategoria`) e `src/lib/painel.ts` (`veredito`, `podeGastarPorDia`, `eixo`, `valorCurto`, `partesBrl`, `somarDias`, `mediaPorDiaSemana`, `participacao`; `gerarInsights` ainda existe e é testado, mas a tela não o usa mais).
- **Abertura (`Resumo`):** a **manchete** ("Sobraram R$ 1.600,00: você poupou 45,7% da renda."), o saldo (centavos menores), receitas (lima, com `+`) e despesas (coral), **taxa de poupança** em medidor com marca em 20%, "pode gastar por dia" e a explicação "a taxa de poupança é a parte da renda que sobrou". **Sem renda registrada:** mostra "Gasto no período", pede a renda e **não inventa taxa nem saldo**. A variação das despesas saiu daqui e mora em "O que mudou".
- **Manchetes** (uma frase por capítulo, só com números do banco, nunca acusa nem dá conselho de investimento; `null` quando os dados não sustentam): comparam o **mês em andamento com o mesmo ponto** do mês anterior; **receitas só são comparadas em período fechado**; a tendência **ignora o mês em andamento**; "Outras" nunca é apontada como categoria que subiu ou caiu; variações de categoria menores que R$ 10 são ruído; o passo "categoria subiu" só aparece se subiu **≥ R$ 50 e ≥ 15%**; poupança abaixo de **20%** gera um passo calmo.
- **O que fazer agora:** até 3 passos que dependem dos dados (registrar renda, passou da renda, categoria que subiu com link para `/painel/lancamentos?categoria=…&de=…&ate=…`, poupança baixa, perguntar ao assistente) e 3 perguntas prontas que abrem `wa.me/<bot>?text=…`. A página Lançamentos lê categoria e período do endereço (`lerFiltrosDaUrl`).
- **Pode gastar por dia até o fim do mês (2026-11-07):** `(receitas − despesas)` dividido pelos **dias que faltam** (mínimo 1; no último dia conta o dia de hoje); só no mês em andamento e com renda; se passou da renda, frase direta em vez de número negativo.
- **Esconder valores (olho):** classe `.dado` desfoca valores em reais (`[data-privado="true"] .dado`); a escolha fica no `localStorage` (`painel-valores-escondidos`) e sincroniza entre abas; sem armazenamento, vale até recarregar. O desfoque é só visual (leitor de tela ainda lê).
- **Esqueleto de carregamento:** abertura em cor cheia e as mesmas linhas de cartões na mesma ordem (**9 cartões**, `data-esqueleto-cartao`), cinza chapado, sem animação.
- **Cor com significado:** gastar mais ou categoria que subiu = etiqueta laranja; gastar menos ou receber mais = verde. Tema escuro conferido.
- Estados: vazio mantém o quadro com uma frase; erro dentro da tela com "Tentar de novo"; conta nova mostra "Primeiros passos" (enquanto `historico_total < 5`).
- **Limitação conhecida:** `parcelas` guarda só a quantidade; o painel **não projeta parcelas futuras**.
- **Lançamentos** (busca, filtros, criar, editar, excluir, exportar CSV) e **Conta** (plano, uso, dados, baixar/apagar) seguem da Fase 1. A página Conta ainda é de leitura.

### 8.5 Configurações (desenho aprovado em 2026-11-07; **blocos A, B e C construídos localmente**)
Rota `/painel/configuracoes` com menu lateral (lista no celular); `/painel/conta` redireciona; o ícone "Conta" do trilho vira "Configurações". Maquetes em `docs/mockups/2026-11-07/`; desenho completo em `docs/superpowers/specs/2026-11-07-painel-narrativo-e-configuracoes-design.md`.
- **Conta:** nome editável; e-mail e WhatsApp somente leitura (mascarados); **renda mensal** e **custo de vida mensal** ("nada disso é compartilhado"). **A renda mensal alimenta a Visão geral** quando o período tem gasto e nenhuma receita lançada (`aplicarRendaDoPerfil` em `src/lib/painel.ts`; o painel lê `minhaConta` junto com `app_painel`); receita lançada sempre vale mais; o Resumo avisa "Renda mensal informada no seu perfil". Período proporcional: mês de 28 a 31 dias e "30 dias" = 1 renda, ano = 12, períodos curtos proporcionais. **O custo de vida mensal fica salvo mas ainda NÃO é usado em nenhuma tela**; sessão atual e "Sair da conta". Criar senha só quando existir o login por e-mail e senha. **Migração 016 (proposta):** colunas novas em `usuarios`.
- **Aparência e segurança:** tema **claro, escuro ou automático** (hoje o tema só segue o aparelho; o manual exige `data-theme` no CSS, no padrão da paleta de dataviz) e "**Ocultar valores ao abrir**" (liga o modo do olho já na entrada). Só no navegador.
- **Plano e pagamentos:** plano atual, situação, período e uso das mensagens; comparação dos 3 planos; "**Assinar o Family / Essencial**" registra o pedido e **não troca o plano** (decisão de 2026-11-07); **histórico de pagamentos** (hoje "Nenhuma cobrança ainda"; as linhas da maquete são exemplo). **Migração 017 (proposta):** pedidos de plano e leitura de pagamentos.
- **Acesso compartilhado (Family):** "Pessoas do grupo · n de 4", convite por **link com código** (vale 7 dias), copiar, cancelar, remover; só o titular gerencia; quem não tem Family vê o que o plano oferece e vai para "Plano e pagamentos". **Migração 018 (proposta):** grupos, membros e convites. **Visão compartilhada dos valores NÃO entra nesta etapa** (muda a RLS de `lancamentos` e das funções `app_*`); a tela avisa isso.
- **WhatsApp, Notificações, Privacidade e dados:** páginas simples; Privacidade com exportar CSV, documentos e "Zona de risco" recolhida (excluir dados, com confirmação). O bot nunca escreve primeiro.
- **Já construído (bloco A, local):** rotas `/painel/configuracoes/{conta,aparencia,plano,acesso,whatsapp,notificacoes,privacidade}` com layout e menu (`MenuConfiguracoes`); `/painel/conta` e `/painel/configuracoes` redirecionam para `/painel/configuracoes/conta`; o trilho e a barra do celular têm o item **Configurações** (ícone de engrenagem). **Conta:** `salvarPerfil` (RPC `app_salvar_perfil`, migração 016) com valores lidos por `lerReais` (campo vazio limpa, zero vale, texto inválido não é enviado), "Sair deste navegador" (`signOut local`) e "Sair de todos os aparelhos" (`signOut global`). **Aparência:** tema manual em `src/lib/tema.ts` (`data-tema="claro|escuro"` na página; automático solta o atributo; escolha em `localStorage` `painel-tema`; `useTema`) e "Ocultar valores ao abrir" (`painel-ocultar-ao-abrir`; `aplicarPreferenciasAoAbrir` roda uma vez por aba, no `PainelShell`). O CSS escuro vale por `:root[data-tema="escuro"]` e por `prefers-color-scheme` quando o tema não está fixado em claro. **Privacidade:** mostra versão e data do aceite, baixar dados, documentos e "Zona de risco" recolhida. **Notificações:** só informativa.
- **Bloco B (Plano e pagamentos, migração 017):** `plano/page.tsx` lê `minhaConta` + `planoEPagamentos` (RPC `app_plano_e_pagamentos` → atual, planos, solicitacao, pagamentos). Cartões vêm de `config/planos.ts`; o atual leva a marca "Seu plano"; os outros pagos têm o botão **"Assinar o <plano>"** (`solicitarPlano` → `app_solicitar_plano`, que só grava o pedido em `solicitacoes_plano`, um pendente por pessoa; recusa trial e o plano que a pessoa já tem). Com pedido: "Pedido registrado… O seu plano atual não muda até lá" e **Cancelar pedido** (`cancelarPedidoPlano`). **Histórico de pagamentos** = tabela `pagamentos` (hoje vazia: "Nenhuma cobrança ainda"). Sem gateway, nada cobra.
- **Bloco C (Acesso compartilhado, migração 018):** `acesso/page.tsx` usa `grupoAtual` (`app_grupo` → elegivel, limite, papel, titular_nome, membros, convites). Sem Family: texto "disponível no plano Family" e link para Plano. Titular: "Pessoas do grupo · n de 4", **Convidar alguém** (`criarConvite`; link `/convite/<código de 10 caracteres>` mostrado **uma única vez**, o banco guarda só o hash; vale 7 dias, uso único), Copiar link, Cancelar convite, Remover (com confirmação). O limite conta membros + convites pendentes. Membro: "Você está no grupo de X" e **Sair do grupo**. O link abre `app/(site)/convite/[codigo]/page.tsx`, que guarda o código em `localStorage` (`convite-pendente`) e leva a entrar ou criar conta; **`ConviteAoEntrar`** (montado no `PainelShell`) aceita o convite guardado uma vez (`aceitarConvite` → `app_aceitar_convite`) e avisa o resultado. A tela avisa que **a visão compartilhada e a cota compartilhada ainda não existem**.
- **Ritmo de entrega:** cada migração é escrita, **ensaiada** (teste SQL em transação desfeita), e só aplicada com o **OK do dono**.

### 8.6 Rotas
`/` landing · `/cadastro` · `/entrar` · `/termos` · `/privacidade` (textos são **rascunho em revisão jurídica**, `src/config/legal.ts`) · `/painel` · `/painel/lancamentos` · `/painel/configuracoes/*` (conta, aparencia, plano, acesso, whatsapp, notificacoes, privacidade; `/painel/conta` redireciona).

### 8.7 Skills e ferramentas de design usadas
Instaladas globalmente em `~/.claude/skills` (o dono pediu `npx skills add Leonxlnx/taste-skill`; já estava instalada): **`design-taste-frontend`** (v2; para telas de app segue `references/app-screens.md`; comandos `draw.mjs`, `lint.mjs`, `inspect.mjs`; arquivos de trabalho em `.taste-skill/`, ignorado pelo git), **`dataviz`**, **`impeccable`**, **`emil-design-eng`**, e as skills `superpowers` (TDD, planos, revisão). Figma (MCP) para objetos 3D; Playwright para capturas.

---

## 9. Landing page

Ordem das seções (enxugada em 2026-11-12): Hero → Faixa (marquee) → Como funciona → Recursos ("Monte o seu painel", link "Painel" do menu aponta para `#recursos`) → Privacidade → Planos → Perguntas → Chamada final (+ **barra de CTA fixa**). **Saíram por repetição:** Conversa clicável (o chat já está no topo), Showcase "Do WhatsApp ao painel" (o topo já faz escrever e ver o painel mudar), Por que é pago (virou o item "Sem anúncios nem oferta de crédito." da Privacidade) e o passo "Pergunte" dos Recursos (já está no passo 3 de Como funciona). Cada demonstração aparece **uma vez só** (E2E "estrutura enxuta").
- **Hero:** fundo verde com luz e grão; título em 2 linhas **"Gastou? / Manda no WhatsApp."** (2026-11-12, o dono não gostou de "Seu mês inteiro, sem planilha.") com **sublinhado desenhado à mão** em "WhatsApp." (`.sublinhado`); o tamanho da letra é limitado pela largura da tela para a segunda linha caber em uma linha até em celular estreito; selo "7 dias grátis, sem cartão"; **3 celulares em CSS** (painel, conversa interativa, análise) com objetos 3D (moeda, folha, recibo; PNG com fundo preto e `mix-blend-mode: screen`); **cartões de lançamento flutuantes** (Uber, Netflix, "Categorizado sozinho"); **contador** "N lançamentos organizados" que acompanha o painel de demonstração (**não é número de usuários**).
- **Como funciona:** 3 passos numerados (número lima sobre verde-escuro) com **linha tracejada que se preenche** ao rolar (`.trilha` e `.preenche`).
- **Recursos:** painel fixo ao lado (fundo lima-suave) com período, comparar e categoria.
- **Privacidade:** 5 afirmações; a última é "Sem anúncios nem oferta de crédito." **Não diz "não vendemos seus dados"** porque a política de privacidade ainda não afirma isso; se o dono quiser a frase, ela **precisa entrar na política primeiro**.
- **Planos:** 3 cartões (Essencial em destaque), **custo por dia** calculado (`porDia`: "Cerca de R$ 0,63 por dia"), faixa de garantias (Mercado Pago, preço final, sem renovação automática).
- **Perguntas:** 5 (instalar, teste pede cartão, como entro = e-mail e senha, como pago, dicas). Sem as perguntas que repetiam a Privacidade.
- **Barra de CTA fixa** (`BarraCta.tsx`): aparece depois do topo; **some** quando topo, planos ou chamada final estão na tela (elementos com `data-barra-oculta`).
- Cabeçalho some ao rolar para baixo (`OcultaAoRolar`); entrada das seções com `RevealObserver`; `devIndicators: false`.
- Texto da landing: sem travessão; sem emoji; sem prova inventada.
- Aviso de independência: "sem vínculo com a Meta nem com o WhatsApp".

---

## 10. Pesquisa de concorrente: Dinzo (2026-11-07)

Analisado `dinzo.com.br` (landing) e `app.dinzo.com.br` (app logado, só leitura, na sessão do dono). O Dinzo depende de **Open Finance** (conexão com banco); o Gastômetro **não** conecta banco e isso é diferencial.
**Já adotado:** conversa clicável, topo vivo, planos com custo por dia, "por que é pago", barra de CTA fixa, trilha de passos (landing); gasto por dia, olho de privacidade, esqueleto fiel, perguntas para o WhatsApp (painel).
**Ideias ainda não feitas (backlog):**
- **Metas e limites por categoria** (barra com alerta em 80%/100%; exige tabela nova no banco).
- **Assinaturas detectadas** (a partir de `recorrente`) e **parcelas com progresso** (exige calendário de parcelas).
- **Fechamento do mês** em formato de "story" (entrou, saiu, guardou) e **ofensiva** leve (dias seguidos lançando); **sem** XP/níveis pesados (tom calmo).
- **"Como você chegou até o Gastômetro?"** (pergunta de origem de um toque, "agora não"; exige tabela nova).
- Paleta de comandos (Ctrl+K), atalhos de teclado (`/` busca, `j/k`), "Salvar visão" e filtros no Extrato, painel lateral de detalhe do lançamento.
- Configurações com **uma página por área**: Conta, Aparência e segurança, WhatsApp (vários números, avisos granulares com "como desligar"), Notificações, Privacidade e dados (exportar no navegador, **"Zona de risco"** recolhida para reiniciar/excluir conta), Acesso compartilhado (convidados "n de 4", só o dono convida). Cada integração diz o que faz e o que **não** faz.
- "Próximos 30 dias" (compromissos futuros) exige calendário de contas e parcelas.

---

## 11. Segurança e LGPD (resumo de `docs/SEGURANCA-E-LGPD.md`)

Levantamento técnico, **não é parecer jurídico**.
- **Pronto e testado:** isolamento por cliente (RLS, testado com dois clientes); perímetro (chave pública só lê `planos`); `service_role` só no n8n; modelo não escolhe o usuário; exclusão só pelo dono; escopo do bot travado; webhook com caminho secreto, dedup e cota; consentimento com versão; `MEUS DADOS` e `EXCLUIR MEUS DADOS`.
- **Pendências obrigatórias antes de vender:** políticas e termos revisados por advogado (razão social/CNPJ, canal do titular, **encarregado/DPO**); logs do n8n sem texto de mensagens; **trocar as chaves expostas da Fase 2** (OpenAI e Evolution); autenticação em dois fatores (Supabase, n8n, Evolution, GitHub, Vercel, gateway).
- **Importantes:** transferência internacional (banco e IA nos EUA; opção de recriar o banco em São Paulo enquanto está quase vazio; o dono decidiu **não mudar agora**); contratos/DPAs (OpenAI, Supabase, gateway); dados sensíveis em descrições livres; **Evolution é não oficial** (risco de bloqueio; migrar para a API oficial antes de escalar); plano de incidente e backups; retenção definida e `limpar_dados_antigos()` agendado (pg_cron); exigir 18+ nos termos (já no fluxo novo); Turnstile e limite de requisições no cadastro.
- **Decisões do dono ainda abertas:** razão social/CNPJ e encarregado; região do banco; prazo de guarda após cancelamento; quem redige as políticas; quando migrar para a API oficial.
- **Cuidados de dados no desenvolvimento:** nunca enviar mensagem ao bot em nome de outros números; mensagens de desconhecidos são descartadas; não guardar número de quem não é cliente.

---

## 12. Documentos de desenho (onde ler o detalhe)

| Arquivo | Para quê | Estado |
|---|---|---|
| `docs/MAPA-DE-PROCESSOS.md` | Jornada, 12 etapas (0 a 11), estado e o que falta, decisões, ordem sugerida | **Vigente** (decisão 4 sobre Família ainda diz "Proposto"; é **Decidida** desde 2026-11-06) |
| `docs/superpowers/specs/2026-11-02-cadastro-login-planos-design.md` | Cadastro completo, login por e-mail, recuperação pelo WhatsApp, troca de plano | **Parcialmente superado** pelo fluxo de 3 passos do mapa |
| `docs/superpowers/specs/2026-11-06-painel-novo-design.md` | Painel novo (primeira versão) | **Superado em partes** pela narrativa de 2026-11-07 |
| `docs/superpowers/specs/2026-11-07-painel-narrativo-e-configuracoes-design.md` | **Painel narrativo e Configurações** (desenho aprovado) | Painel construído; Configurações a construir |
| `docs/mockups/2026-11-12-landing/index.html` (+ prints e `capturas/`) | Proposta de landing refeita do zero em 7 seções, sem os efeitos | **Recusada** pelo dono em 2026-11-12 ("sem vida"); em vez dela, a landing atual foi enxugada e recolorida |
| `docs/mockups/2026-11-12/index.html` (+ PNGs) | Login (e-mail e senha, entrar pelo WhatsApp, esqueci a senha pelo WhatsApp) e primeiro acesso (objetivo, renda, criar senha, assistente no WhatsApp, primeiro gasto) | Aprovado e construído em 2026-11-12 |
| `docs/CHECKLIST-LANCAMENTO.md` | O que falta para abrir: aplicar, pagamento, dono, operação, dia de abrir | Vivo: marcar ao conferir |
| `docs/design-system/index.html` e `tokens.css` | Design system Verde-lima (cores, tipos, formas, componentes, regras) | Fonte do visual do app logado |
| `docs/mockups/2026-11-08/index.html` (+ PNGs) | Maquetes aprovadas do app no estilo Verde-lima (Visão geral, Lançamentos, Plano, 3 telas de celular) | Referência visual |
| `docs/mockups/2026-11-07/index.html` | Maquetes aprovadas pelo dono (Visão geral, celular, Conta, Aparência, Plano e pagamentos, Acesso compartilhado) | Referência visual |
| `docs/superpowers/specs/2026-10-31-app-e-familia-design.md` | Site, painel e plano Família (visão compartilhada) | Parte construída; Família pendente |
| `docs/superpowers/plans/2026-10-31-fase-1-app.md` | Plano da Fase 1 | Concluído |
| `docs/SEGURANCA-E-LGPD.md` | Mapa de dados e lacunas | Vigente |
| `docs/RENOMEAR-MARCA.md` | Como trocar o nome da marca | Vigente |
| `app/PRODUCT.md` | Princípios do produto | Vigente |

---

## 13. Registro de decisões (mais novas no fim)

| Data | Decisão | Motivo / efeito |
|---|---|---|
| 2026-10-31 | v3 roda **em paralelo** às Fases 1/2 antigas, que **não são alteradas** | Não quebrar o que está no ar |
| 2026-10-31 | Falhas da Fase 2 corrigidas na v3 (chaves no JSON dos nós, webhook sem auth, `DEL#` sem filtro por usuário, usuário novo não criado, sem dedup) | Segurança e escala |
| 2026-10-31 | **Não** mudar para São Paulo nem criar CNPJ agora | "Começar pequeno, mas pronto para escalar" |
| 2026-10-31 | "Apagar" é lógico; "excluir meus dados" anonimiza | LGPD sem perder prova de consentimento |
| 2026-10-31 | Planos reais: Teste 7d/50 msgs, Essencial R$ 19/300, Family R$ 39/800/até 4 | Substitui os planos antigos da memória |
| 2026-10-31 | Nome "Gastômetro" **provisório**, trocável em um lugar | Marca ainda não definida |
| 2026-11-02 | Desenho de cadastro completo e login por e-mail com recuperação pelo WhatsApp | Auditoria achou 9 falhas no login por código |
| 2026-11-04 | **Bot fechado**: só atende cadastrados e conectados; desconhecido recebe link (máx. 1/h); mensagem descartada; migrações 013 e 014 | O contato começa sempre no cliente |
| 2026-11-06 | Jornada confirmada: teste 7 dias **sem cartão**; **cartão pedido perto do fim**; cadastro em **3 passos** (celular verificado → senha → e-mail com código) | Elimina disputa por número de terceiros |
| 2026-11-06 | **Verificação do celular: o cliente envia a mensagem**; código pelo bot só com a API oficial | O bot nunca escreve primeiro |
| 2026-11-06 | **Login por e-mail e senha** (esqueci por e-mail, link pelo WhatsApp, sessões) | Substitui o código pelo WhatsApp |
| 2026-11-06 | **Família:** dono convida; cada membro com cadastro, senha e WhatsApp próprios; limite 4 | Confirmado pelo dono |
| 2026-11-06 | **Painel é o centro; o bot é complemento.** Painel com botão do WhatsApp e lançamento direto | Direção do produto |
| 2026-11-06 | Pagamento: Mercado Pago recorrente | **Pendente** da conta do dono |
| 2026-11-06/07 | Painel novo: métricas de finanças pessoais (poupança 20%, 50/30/20, ritmo, Pareto, tendência 6 meses, fixos x variáveis, insights em TS) | Painel que responde, não só descreve |
| 2026-11-07 | Migração 015 aplicada depois de **ensaio que achou bug de acento** (`supérfluo`) | Corrigido antes de ir para o banco |
| 2026-11-07 | Landing: **não inventar** plano anual, preço riscado, garantia, "não vendemos dados" ou números de usuários | Prova só se for verdadeira; política ainda não diz isso |
| 2026-11-07 | Aplicar na landing (A a E) e no painel (4 ajustes) o que se aprendeu no Dinzo | Seção 10 |
| 2026-11-07 | Conta do dono colocada **manualmente** no Family (sem gateway, sem fim) | Testar o plano e o bot com Family |
| 2026-11-07 | **Corrigido:** a landing do Gastômetro **não tem** depoimentos (aviso anterior era erro meu, confundi com o projeto Corpelle) | Evitar ação desnecessária |
| 2026-11-07 | Criado este `CLAUDE.md` com a regra de manutenção | Não perder nada ao longo de meses ou anos |
| 2026-11-07 | **Nova direção do painel:** o dono achou o painel pouco didático, sem leitura clara e fraco de cor. Passa a ser uma **narrativa** (abertura, capítulos com manchete e "Como ler", "O que fazer agora"), com **cor forte e com significado** | Aprovado pelas maquetes ("Sim, construir") |
| 2026-11-07 | Essencial/supérfluo/investimento mantêm esses nomes também nas frases (não "necessário/desejo/futuro") | Mesma palavra em toda a tela |
| 2026-11-07 | **Configurações** completas como as do Dinzo: Conta (renda e custo de vida), Aparência e segurança (tema, ocultar ao abrir), Plano e pagamentos, Acesso compartilhado (Família), WhatsApp, Notificações, Privacidade e dados | Aprovado pelas maquetes |
| 2026-11-07 | **Upgrade sem pagamento:** "Assinar" só **registra o pedido** e avisa; **não troca o plano** até o Mercado Pago existir | Ninguém ganha plano pago de graça *(minha escolha)* |
| 2026-11-08 | **Renda do perfil alimenta o painel** (só quando não há receita lançada no período). Feito no navegador, sem mudar o banco; custo de vida segue sem uso | Dono salvou renda e custo nas Configurações e o painel continuava pedindo a renda *(minha escolha: aplicar no navegador, sem nova migração)* |
| 2026-11-12 | **Login com e-mail e senha + código do WhatsApp só para primeiro acesso, aparelho novo e recuperar senha**; primeiro acesso em 4 passos (objetivo, renda, criar senha, primeiro gasto pelo WhatsApp), inspirado no fluxo do Dinzo sem o que depende da API oficial | Aprovado pelas maquetes ("Sim, construir") |
| 2026-11-12 | Recuperar a senha usa o mesmo código `PAINEL` (não uma palavra nova `SENHA`): assim o bot no n8n não precisou mudar. Sem a opção "continuar conectado": a sessão sempre fica no aparelho | Menos risco e nenhuma mudança no bot *(minha escolha)* |
| 2026-11-12 | **Pagamento mensal avulso pelo Mercado Pago (Checkout Pro)**, não assinatura recorrente: aceita Pix, cartão e boleto e é mais simples de testar. Recorrência no cartão fica para depois | Escolha do dono |
| 2026-11-12 | Reembolso só é **registrado**; não corta o plano sozinho. Valor ou moeda diferentes do preço marcam a cobrança como `divergente` e não ativam nada | Evitar corte ou ativação indevidos *(minha escolha; rever com o dono)* |
| 2026-11-08 | **Novo visual do app logado (Verde-lima)** a partir de três imagens do dono (painel de saldo com cartão lima, painel de fluxo de caixa com coluna em destaque, app de celular verde). Escopo: Visão geral, Lançamentos e Configurações, com tema escuro; landing fica para depois. Não copiamos o que o app não tem (busca global, sino, cartão de crédito, transferência) | Aprovado pelas maquetes ("Sim, construir") |
| 2026-11-12 | **Landing: enxugar e recolorir, não refazer.** O dono recusou a maquete nova ("não tem vida") e pediu para manter os efeitos e animações da atual, tirar só o que se repete e trazer o verde-limão. Título novo "Gastou? Manda no WhatsApp." | Pedido do dono |
| 2026-11-07 | **Family à venda, sem "em breve":** o dono mandou colocar a opção de comprar. Os itens do cartão listam só o que existe (sem prometer visão compartilhada) | Pedido do dono; honestidade sobre o que já funciona |
| 2026-11-07 | **Convite da Família por link com código** (sem depender de e-mail); **visão compartilhada dos valores fica para etapa própria** | Mexe em quem enxerga o quê no banco *(minha escolha)* |
| 2026-11-07 | Ordem: painel (feito localmente) → Configurações → migrações 016 (renda e custo de vida), 017 (pedidos de plano e pagamentos), 018 (grupos e convites), cada uma **ensaiada e só aplicada com OK** | Segurança do banco |

---

## 14. Histórico de entregas

- **2026-10-31:** v3 criada (banco, cadastro e agente no n8n, bot fechado depois); consentimento, `MEUS DADOS` e `EXCLUIR MEUS DADOS` no bot; **Fase 1 do app** (landing, cadastro, termos/privacidade, `/entrar`, painel Visão geral/Lançamentos/Conta), migrações 009 a 012, CSP.
- **Entre 2026-10-31 e 2026-11-02 (datas exatas não registradas):** repositório no GitHub e projeto na Vercel; landing v3 (painel vivo, planos por nome); depois atmosfera de cor, celulares com profundidade, objetos 3D (commits `3b1ed27`, `b261e3d`). O primeiro deploy de produção da landing v3 aparece na Vercel por volta de 2026-11-01.
- **2026-11-04/05:** migrações **013** e **014** aplicadas; bot fechado no n8n; documentos `MAPA-DE-PROCESSOS` e desenhos de cadastro/login.
- **2026-11-06/07:** painel novo (commit `b10bc45`) com a migração **015** aplicada; landing com conversa clicável, topo vivo, planos, "por que é pago", barra fixa e trilha (`b17c513`); 4 ajustes do painel (`a401844`); conta do dono no Family; este arquivo.
- **2026-11-07 (commit `4a83975`):** painel narrativo (abertura, `Capitulo`, `OQueMudou`, `ProximosPassos`, `narrativa.ts`, cores por categoria, esqueleto novo), filtro de Lançamentos por endereço; maquetes e desenho em `docs/`. 221 unitários e 104 E2E verdes.
- **2026-11-07 (local, ainda sem commit):** Configurações bloco A (rotas, menu, Conta, Aparência com tema claro/escuro/automático, WhatsApp, Notificações, Privacidade, Plano básico); migração 016 e teste SQL escritos; `lerReais`, `tema.ts`, `salvarPerfil`. 245 unitários e 118 E2E verdes.
- **2026-11-07 (local, ainda sem commit):** Configurações completas: Plano e pagamentos (assinar, pedido, histórico), Acesso compartilhado (convites por link), página `/convite/<código>`, `ConviteAoEntrar`; Family sem "em breve" na landing, cadastro e Configurações; migrações 017 e 018 escritas com teste SQL. 266 unitários e 128 E2E verdes.
- **2026-11-08:** ensaio das migrações 016, 017 e 018 (teste SQL de cada uma, tudo desfeito): zero falhas. O teste da 018 tinha um defeito (escolhia o convite "primeiro da lista", ambíguo porque as horas são iguais dentro de uma transação) e foi corrigido para achar o convite pelo hash; a migração não mudou.
- **2026-11-08:** migrações 016, 017 e 018 aplicadas no Supabase (conferido: colunas, 5 tabelas com RLS, 10 funções, nenhuma aberta ao `anon`, tabelas vazias). Os avisos do advisor sobre `SECURITY DEFINER` e "RLS sem política" são o padrão intencional (acesso só pelas funções `app_*`).
- **2026-11-08 (local, ainda sem commit):** correção: a renda salva em Configurações agora aparece na Visão geral (`aplicarRendaDoPerfil`, nota no Resumo). Confirmado no banco que Salvar grava (renda 10000 e custo 20000 na conta do dono). 274 unitários e 130 E2E verdes.
- **2026-11-08 (local, ainda sem commit):** novo visual Verde-lima no painel, Lançamentos e Configurações (tokens com escopo `.app-vl`, fontes Urbanist e Inter, casca flutuante, `PodeGastar`, rosca, `IconeCategoria`, tema escuro). Testes ajustados ao novo desenho (`PodeGastar`, rosca, fundo `.app-vl`); E2E de convite agora espera a requisição.
- **2026-11-11 (local, ainda sem commit):** correção: o formulário "Lançar" da Visão geral (`LancarRapido`) mostrava só as categorias que a pessoa já usou; agora mistura as 10 padrão com as dela (`mesclarCategorias`), como a página Lançamentos já fazia. Teste novo `tests/lancar-rapido.test.tsx`; 280 unitários verdes.
- **2026-11-12 (local, ainda sem commit; migrações 019 e 020 escritas com teste SQL, NÃO aplicadas; funções de borda NÃO publicadas):** pagamento pelo Mercado Pago (acima); novo aceite dos termos quando `VERSAO_LEGAL` muda (`app_aceitar_termos`, `TermosAtualizados` no `PainelShell`); limite de 20 códigos de login por IP a cada 10 minutos (`login_iniciar_limitado`, só o hash do IP; `login-iniciar` devolve 429); limpeza diária agendada com `pg_cron` às 06:15 UTC (`limpar_dados_antigos` ampliada); `docs/CHECKLIST-LANCAMENTO.md`. 296 unitários verdes; E2E de Configurações e painel verdes.
- **2026-11-12:** ensaio das migrações 019 (21 verificações) e 020 (41 verificações) no banco real, tudo desfeito: zero falhas; conferido que nada ficou gravado. O teste da 020 tinha um defeito (usuários de teste sem `telefone_verificado_em`, e o bot fechado barra antes de olhar o plano); corrigido no teste, a migração não mudou. Continuam NÃO aplicadas.
- **2026-11-12:** migrações 019 e 020 aplicadas; token de teste do Mercado Pago gravado (`segredos_app.mp_access_token`, só o servidor lê); funções de borda publicadas com `verify_jwt` desligado e autenticação própria: `login-iniciar` v2 (limite por IP), `pagamento-criar` v1, `pagamento-webhook` v1. Conferido por chamada: login-iniciar 200; pagamento-criar sem login ou com token falso 401; preflight 204; webhook ignora pagamento inexistente, outros assuntos e id malformado com 200 (a consulta ao Mercado Pago respondeu, então o token de teste é aceito). **Não testado:** criar preferência com usuário logado e um pagamento de teste de ponta a ponta. O código do app (botão Assinar, termos) segue sem commit.
- **2026-11-12:** login com senha e primeiro acesso. Migração 021 aplicada (ensaio com 15 verificações, zero falhas): `usuarios.objetivo`, `primeiro_acesso_em`, `senha_definida_em`; `app_minha_conta` devolve `objetivo`, `primeiro_acesso_concluido`, `tem_senha`; `app_salvar_objetivo`, `app_salvar_renda`, `app_concluir_primeiro_acesso`; `senha_registrada` (só servidor). Funções de borda: `senha-definir` v1 (nova) e `login-status` v2 (usa o usuário do Auth ligado ao cadastro, não mais um e-mail fixo). App: `/entrar` em grupo próprio `(acesso)` no visual Verde-lima (`TelaEntrar`, `EntrarWhatsApp` com destino), `/painel/boas-vindas` (`PrimeiroAcesso`, QR code com a biblioteca `qrcode`), `/painel/senha-nova`, senha em Configurações › Conta, `FormSenha`, `lib/senha.ts`, `passoDoObjetivo` em "O que fazer agora". O `PainelShell` leva às boas-vindas quem não concluiu o primeiro acesso (a conta do dono também, uma vez). 333 unitários e 146 E2E verdes. **Não testado de verdade:** criar a senha e entrar com ela em produção (depende do login real do dono).
- **2026-11-12 (commit adff359, publicado na Vercel):** landing enxugada e recolorida (o dono recusou a maquete refeita do zero). Saíram Conversa, Showcase, Por que é pago e o passo "Pergunte" dos Recursos (e `lib/demo-conversa.ts`); "Sem anúncios" entrou na Privacidade; perguntas, garantias dos planos e chamada final atualizadas (login com senha, Mercado Pago, sem renovação automática); cores Verde-lima em `landing.css` mantendo degradês e animações; título "Gastou? Manda no WhatsApp.". 321 unitários verdes (saíram os testes das seções removidas) e 34 E2E da landing verdes nas duas larguras.
- **2026-11-12 (banco, a pedido do dono):** conta de teste do dono (wesley.zeferino@live.com, WhatsApp 5531995927294, plano Family liberado por SQL) **apagada de vez** para ele refazer o cadastro do zero: `usuarios` (com cascata em lançamentos, assinatura, uso, consentimentos, grupo etc.), `auth.users`, `mensagens_entrada` e `login_falhas` desse número. Exceção pontual de teste à regra "nada de apagar definitivo"; o Family não volta sozinho (pagar no modo teste do Mercado Pago ou liberar por SQL com OK).
- **2026-11-13 (banco, a pedido do dono):** o recadastro de teste com o mesmo e-mail e número (criado às 00:52 UTC, ainda sem login no painel) foi apagado de novo do mesmo jeito, para outro teste do cadastro do zero. Fica só o outro usuário (5582...).
- **2026-11-13 (local, ainda sem commit):** a tela "Falta 1 passo" do cadastro ganhou o botão **"Já ativei: entrar no painel"** (`/entrar?modo=whatsapp`), com a frase de que o primeiro acesso pede objetivo e senha. Antes o cadastro parava no ATIVAR e a pessoa não sabia que as boas-vindas ficam no painel. E2E do cadastro cobre o link (16 verdes); capturas `docs/screens/cadastro-ativar-*.png`. O link do painel na mensagem de boas-vindas do bot (n8n) **não** foi mexido.
- Deploys de produção da Vercel acompanham cada push na `feat/fase-1-app` (último verificado: `a401844`, READY).

---

## 15. Onde a documentação antiga está desatualizada

- **`README.md`**: descreve o cadastro e o login **antigos** (código pelo WhatsApp, sem senha) e diz "falta GitHub e Vercel" (já foram feitos). A tabela de peças ainda cita migrações "001 a 014" (agora até **015**). Vale como referência dos **comandos do bot** e de como publicar, mas **a direção vigente é a deste arquivo e do `MAPA-DE-PROCESSOS`**.
- **Memória do Claude** (pasta de memória do projeto): tinha planos antigos e "nada construído"; deve apontar para este arquivo como fonte de verdade.
- `docs/superpowers/specs/2026-10-31-app-e-familia-design.md`: marcado "proposta, aguardando aprovação", mas parte já foi construída.

---

## 16. Pendências e próximos passos (por prioridade)

**Depende do dono (fora do código):** nome definitivo e **domínio**; provedor de **e-mail** transacional (Resend ou Brevo); **conta Mercado Pago**; **Cloudflare Turnstile**; remover a proteção da Vercel / tornar o link público no domínio final; **revisão jurídica** dos textos; razão social, CNPJ, DPO, e-mail de contato (`NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_ENTITY`); **trocar as chaves antigas** da OpenAI e da Evolution; 2FA nas contas; decidir API oficial do WhatsApp.

**Ordem sugerida pelo mapa:**
1. ~~Painel novo (Visão geral)~~ **refeito como narrativa em 2026-11-07 (enviado; deploy iniciado)**; faltam orçamentos e metas, lançar rápido avançado, tela de primeiros passos mais rica.
2. **Cadastro em 3 passos e login por e-mail e senha** (precisa de provedor de e-mail e Turnstile).
3. **Pagamento** (Mercado Pago), regras de plano, boas-vindas completas no WhatsApp, avisos por e-mail.
4. **Configurações da conta** (trocar senha, ajustar dados, mudar de plano, excluir conta).
5. **Plano Família** (grupo, convites, visão compartilhada, permissões).
6. **Orçamentos e metas** (tabelas novas).
7. **Operação, jurídico e beta fechado** (monitoramento do n8n e do chip, backups, suporte, `limpar_dados_antigos` agendado, checklist final de lançamento).

**Pendências técnicas pequenas:** ~~novo aceite quando a versão dos termos mudar~~ e ~~limite por IP em `login-iniciar`~~ (feitos em 2026-11-12, falta aplicar); limite de requisições no webhook de cadastro; configurar `SITE_ORIGIN` (Supabase Edge Functions) e `allowedOrigins` do webhook de cadastro (n8n) com o domínio final; ajustar `checkout_url`, `politica_url`, `termos_url`, `cadastro_url` no nó Config para o domínio final; comando "painel" no bot com link; alertas de orçamento (só em resposta).

**Antes de divulgar a landing:** revisar textos legais; confirmar que as promessas ("sem fidelidade", "preço final à vista") se cumprem; nada de prova inventada.

---

## 17. Armadilhas conhecidas e dicas de ferramenta

- **Ambiente Windows:** a ferramenta Bash às vezes falha com "unexpected EOF" em heredocs com certas aspas: use a ferramenta de escrita de arquivos ou scripts Python em chamadas separadas. Avisos "LF will be replaced by CRLF" do git são inofensivos.
- **Ids da Vercel:** o id da equipe é `team_H6QUeLtHcdZVJt4ZQsdqT5uY` (já errei para `HQU…`). Se der 403, rode `list_teams`.
- **Supabase `execute_sql`:** o teste SQL termina com erro proposital (isso é sucesso se vier `FALHAS: 0`). Para ler definições de função, filtre `prokind = 'f'` (agregadas quebram `pg_get_functiondef`).
- **Next 16:** `.next/types` velho dá erros de tipo: `rm -rf .next && npx next typegen`.
- **Hidratação nos testes** (seção 8.2) e **maiúsculas em `innerText`**.
- **Navegador:** o navegador embutido do app (`mcp__Claude_Browser__*`) é o padrão; o **Claude in Chrome** (`mcp__claude-in-chrome__*`) age na sessão real do dono e só deve ser usado quando ele pedir. Abrir aba própria, **não alterar nada** no app de terceiros, fechar a aba depois. Não digitar senhas nem credenciais.
- **Cópia de concorrentes:** pegar **padrões** (estrutura, ideias), nunca imagens, textos ou mascote.
- **Arquivos temporários de captura** (`e2e/_tmp-*.spec.ts`) devem ser apagados antes de commitar.
- **Commits:** terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (instrução do ambiente). Mensagens em português sem acento (padrão do histórico).
- **Repositório:** confirmar se o repositório do GitHub é **público** antes de colocar qualquer dado sensível em arquivos versionados (este arquivo **não deve** ter segredos).
