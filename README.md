# Gastômetro v3

Assistente financeiro por WhatsApp: a pessoa manda um gasto (texto, áudio ou foto de cupom) e vê tudo em um painel. O nome "Gastômetro" é provisório: veja [`docs/RENOMEAR-MARCA.md`](docs/RENOMEAR-MARCA.md).

A v3 roda em paralelo com a Fase 1, a Fase 2, o "Fluxo 3 - Cadastro Landing Page" e o "Pagamento Mercado Pago" antigos, que **não foram alterados**.

## Peças

| Peça | Onde | Estado |
|---|---|---|
| Banco | Supabase `bfgmjovveboyidvhggpq` (conta nova, us-east-1), migrações em `supabase/migrations` (001 a 014) | Pronto |
| Funções públicas de login | Supabase Edge Functions `login-iniciar` e `login-status` (`supabase/functions`) | Publicadas |
| Cadastro | n8n, pasta **Gastômetro v3**: `GASTOMETRO v3 - Cadastro Landing` (`a8ZDOhiKcSWYJZwp`) | Ativo |
| Agente WhatsApp | n8n, mesma pasta: `GASTOMETRO v3 - Agente WhatsApp` (`By3B5EEDaRqXD2s5`) | Ativo (Evolution API, instância `Projeto_financias`) |
| Site e painel | `app/` (Next.js 16) | Pronto para publicar; falta GitHub e Vercel |
| Pagamento | (a fazer, Mercado Pago v3) | Pendente |

## Planos (no banco, tabela `planos`)

| Plano | Preço | Mensagens por mês | Números |
|---|---|---|---|
| Teste grátis | R$ 0, 7 dias | 50 | 1 |
| Essencial | R$ 19 | 300 | 1 |
| Family | R$ 39 | 800 | até 4 (aparece no site como "em breve"; o compartilhamento entre membros é a Fase 2 do app) |

## Como o cliente usa

1. Cadastro em `/cadastro` (nome, e-mail, WhatsApp e aceite dos termos). O site devolve um link `wa.me` com `ATIVAR <código>`.
2. Ao enviar a mensagem, o bot confirma que o número é da pessoa e abre o período de teste.
3. Dia a dia pelo WhatsApp: "gastei 32 no almoço", áudio, foto de cupom, "quanto gastei esta semana?".
4. Painel em `/entrar`: o site mostra um código de 6 dígitos; a pessoa o envia ao bot (`PAINEL <código>`) e o painel abre sozinho. Sem senha.
5. Painel: Visão geral (totais, comparação com o período anterior, dia a dia, categorias, maiores gastos, previsão do mês), Lançamentos (busca, filtros, criar, editar, excluir, exportar CSV) e Conta (plano, uso, dados, baixar ou apagar os dados).

## Endereços de produção

- Cadastro: `POST https://webhook.servidorwza.shop/webhook/gastometro-v3-cadastro`
  - Corpo: `{ nome, email, telefone, plano, aceite, aceite_marketing, website }`. `website` é uma isca para robôs e deve ir vazio.
  - Resposta: `{ ok, whatsapp_url, codigo_ativacao, ja_cadastrado }`.
- WhatsApp: `POST https://webhook.servidorwza.shop/webhook/gastometro-v3-whatsapp-<SEGREDO>`. A Evolution 2.3.7 não aceita header customizado, então a proteção é o **caminho secreto**, que fica só no workflow e na instância (trate como senha).
- Bot: número `5582991130317`.

## Rodar e testar o site localmente

```bash
cd app
cp .env.example .env.local     # só valores públicos; a chave anon/publishable do Supabase fica em Project Settings → API Keys
npm install
npm run dev                    # http://localhost:3000
npm test                       # unitários
npm run test:e2e               # navegador real, com serviços simulados (porta 3100)
npm run build && npm run verificar:segredos
```

Testes do banco (SQL, terminam com erro proposital para desfazer tudo; sucesso = saída com `FALHAS: 0`): `supabase/tests/*.test.sql`.

## Publicar (o que falta e depende de você)

1. **GitHub**: criar o repositório e enviar o código (`git remote add origin ... && git push -u origin main`). O repositório inclui a pasta `app/` e `supabase/`.
2. **Vercel**: importar o repositório, **Root Directory = `app`**, e cadastrar as variáveis de `app/.env.example` (todas públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CADASTRO_URL`, `NEXT_PUBLIC_BOT_NUMBER`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_ENTITY`).
3. Com o endereço final em mãos:
   - Supabase → Edge Functions → Secrets → `SITE_ORIGIN` = endereço do site (hoje as funções aceitam qualquer origem).
   - n8n → Cadastro Landing → webhook → `allowedOrigins`: trocar `*` pelo endereço do site.
   - n8n → Agente WhatsApp → nó **Config**: `checkout_url`, `politica_url` (`/privacidade`) e `termos_url` (`/termos`) com o endereço do site.
4. Preencher `NEXT_PUBLIC_SUPPORT_EMAIL` e `NEXT_PUBLIC_LEGAL_ENTITY`, e revisar os textos de `app/src/config/legal.ts` com um advogado antes de abrir ao público (hoje as páginas mostram "Rascunho em revisão jurídica").

## Quem o bot atende (desde 2026-11-04)

O contato começa sempre no cliente, vindo da landing. O bot nunca escreve primeiro e nunca cria conta.

- **Número sem cadastro:** recebe o link de cadastro (`cadastro_url` no nó **Config**), no máximo uma vez por hora. O registro da mensagem é apagado na hora (função `descartar_mensagem`); só fica um carimbo com hash do número por 24 horas.
- **Cadastro pendente** (número ainda não conectado): só `ATIVAR <código>` conecta. Outras mensagens recebem "falta conectar". `NÃO FUI EU` cancela e apaga o cadastro pendente.
- **Número conectado:** atendimento normal.
- O teste de 7 dias começa quando o WhatsApp é conectado, não no cadastro.
- O cadastro exige nome, e-mail válido (único), celular com DDD e aceite; o banco recusa o resto.

O desenho completo (login por e-mail, link de recuperação pelo WhatsApp, troca de plano) está em [`docs/superpowers/specs/2026-11-02-cadastro-login-planos-design.md`](docs/superpowers/specs/2026-11-02-cadastro-login-planos-design.md). Feitos até aqui: bot fechado, cadastro exigente e conexão pelo `ATIVAR`. Falta: código por e-mail, link de recuperação, sessões, troca de plano.

## Comandos do bot

| Mensagem do cliente | O que acontece |
|---|---|
| `ACEITO` | registra o aceite dos termos (para quem chega sem passar pelo site) |
| `ATIVAR <código>` | confirma o número do cadastro feito no site |
| `PAINEL <código>` | confirma o login no painel (código mostrado no site) |
| `DEL#XXXXXX` | apaga (marca como excluído) um lançamento do próprio cliente |
| `MEUS DADOS` | resumo + arquivo CSV com todos os lançamentos |
| `EXCLUIR MEUS DADOS` → `CONFIRMAR EXCLUSAO` | elimina os dados e anonimiza o cadastro |
| qualquer outra coisa | classificador de escopo → agente (ou resposta fixa fora do escopo) |

Variáveis do nó `Config` do agente: `evolution_url`, `instancia`, `checkout_url`, `termos_versao`, `politica_url`, `termos_url` e `nome_produto`.

## Decisões de projeto

- Identidade do usuário = telefone do WhatsApp. Mensagem recebida do número comprova a posse da linha.
- O cadastro **não manda mensagem ativa**: devolve um link `wa.me`. Evita spam e banimento.
- O modelo nunca recebe o id do usuário como parâmetro: ele é fixado nos nós, então um prompt malicioso não acessa dados de outra pessoa.
- Somas, resumos e todo o painel são calculados no banco (funções `app_*` e `resumo_periodo`); o navegador nunca recebe lista bruta para somar.
- O navegador só usa a chave pública. Cada tabela tem RLS; o painel só executa as funções `app_*`; as demais funções são exclusivas do `service_role` (n8n).
- Login sem senha: código de 6 dígitos, vale 5 minutos, uso único, bloqueio após 5 erros em 10 minutos; a sessão é aberta com `verifyOtp` do Supabase Auth.
- "Apagar" é lógico (`deleted_at`); "excluir meus dados" apaga lançamentos e conversas e anonimiza o cadastro (decisão do dono do produto: nada de apagar definitivo por enquanto).
- Segurança do site: CSP (conexões só para o próprio site, Supabase e webhook de cadastro), `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`. Detalhes de LGPD em [`docs/SEGURANCA-E-LGPD.md`](docs/SEGURANCA-E-LGPD.md).
- Mensagens recebidas contam na cota (texto, áudio e imagem); `DEL#` e `ATIVAR` não contam.

## Pendências conhecidas

- **Pagamento**: falta o workflow v3 do Mercado Pago (ativar assinatura, renovar período, inadimplência, reset da cota) e o link de checkout com identificação do cliente.
- **Aceite novo quando os termos mudam**: o bot guarda a versão aceita, mas ainda não pede novo aceite quando `termos_versao` muda.
- **Limite por IP em `login-iniciar`**: hoje o limite é por sessão/código; falta limitar a criação de códigos por origem (Cloudflare/WAF ou tabela de contagem).
- Turnstile (captcha) no cadastro e limite de requisições no webhook de cadastro.
- Agendar `limpar_dados_antigos()` (pg_cron).
- Fase 2 do app: plano Family com visão compartilhada, orçamentos com aviso no WhatsApp, insights, tendência de 6 meses.
- Revisão jurídica dos termos e da política; definir encarregado (DPO) e responsável pelo tratamento.
- Rotacionar as chaves da OpenAI e da Evolution que apareciam no JSON dos workflows antigos.
