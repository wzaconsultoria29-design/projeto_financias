# Gastômetro v3

Versão nova do Gastômetro, rodando em paralelo com a Fase 1 e a Fase 2 (que **não foram alteradas**).

## Peças

| Peça | Onde | Estado |
|---|---|---|
| Banco | Supabase `bfgmjovveboyidvhggpq` (conta nova) | Pronto: 5 migrações em `supabase/migrations` |
| Cadastro da landing | n8n, pasta **Gastômetro v3**: `GASTOMETRO v3 - Cadastro Landing` (`a8ZDOhiKcSWYJZwp`) | Criado, **inativo** |
| Agente WhatsApp | n8n, pasta **Gastômetro v3**: `GASTOMETRO v3 - Agente WhatsApp` (`By3B5EEDaRqXD2s5`) | Criado, **inativo** |
| Landing page | (a fazer) | — |
| Pagamento | (a fazer, Mercado Pago) | — |

## Webhooks de produção (depois de ativar)

- Cadastro: `POST https://webhook.servidorwza.shop/webhook/gastometro-v3-cadastro`
  - Corpo: `{ "nome": "...", "email": "...", "telefone": "(11) 99999-8888", "plano": "solo", "website": "" }`
  - `website` é um campo escondido (isca para robôs): deve ir sempre vazio.
  - Resposta: `{ "ok": true, "whatsapp_url": "https://wa.me/...?text=ATIVAR%20XXXXXX", "codigo_ativacao": "XXXXXX" }`
- WhatsApp: `POST https://webhook.servidorwza.shop/webhook/gastometro-v3-whatsapp-<SEGREDO>`
  - O painel da Evolution 2.3.7 não permite header customizado, então a proteção é um **caminho secreto** (o segredo está só no workflow e na instância; trate como senha).
  - Instância configurada: `Projeto_financias`; número do bot: `5582991130317`.

## Configuração antes de ativar

1. **Credenciais no n8n** (Credentials → New). Copie os valores direto das telas dos serviços; não cole chaves no chat.
   - `Supabase Gastometro v3` (tipo *Supabase API*): Host `https://bfgmjovveboyidvhggpq.supabase.co` e a chave **service_role** (Supabase → Project Settings → API Keys).
   - `Evolution API Key (header apikey)` (tipo *Header Auth*): Name `apikey`, Value = a chave **nova** da instância.
   - (Não é mais necessária a credencial do webhook: a proteção agora é o caminho secreto.)
2. Abra os dois workflows e escolha essas credenciais nos nós marcados em vermelho. O OpenAI já usa a credencial `OpenAi account 2`.
3. Agente: nó **Config** → `evolution_url`, `instancia` (instância do número novo) e `checkout_url`.
4. Cadastro: nó **Normalizar Dados e Config** → `numero_bot` (WhatsApp do bot, só dígitos com 55).
5. No provedor do WhatsApp, configure o webhook para a URL do agente, evento `messages.upsert`, com o mesmo header de autenticação.
6. Ative os dois workflows.

## Roteiro de teste (WhatsApp)

1. Mandar `Oi` → boas-vindas (uma vez só) e resposta do agente.
2. `Gastei 50 no mercado` → confirmação com `DEL#XXXXXX`.
3. `Quanto gastei hoje?` → resumo vindo do banco.
4. `DEL#XXXXXX` → lançamento apagado; repetir → "código não encontrado".
5. Áudio e foto de cupom.
6. Reenviar o mesmo webhook → não pode duplicar (deduplicação por `message_id`).

## Decisões de projeto

- Identidade do usuário = telefone do WhatsApp. Mensagem recebida do número comprova a posse da linha.
- O cadastro **não manda mensagem ativa**: devolve um link `wa.me` para a pessoa começar a conversa. Evita spam e banimento.
- O modelo nunca recebe o id do usuário como parâmetro: ele é fixado nos nós, então um prompt malicioso não acessa dados de outra pessoa.
- Somas e resumos são calculados no banco (`resumo_periodo`), nunca pelo modelo.
- Mensagens recebidas contam na cota (texto, áudio e imagem); `DEL#` e `ATIVAR` não contam.

## Pendências conhecidas

- Pagamento: o workflow antigo `Gastômetro - Pagamento Mercado Pago` usa o banco antigo e tem token de exemplo; falta uma versão v3 (ativar assinatura, renovar período, inadimplência).
- Link de checkout com identificação do usuário (hoje é um link genérico).
- Turnstile (captcha) no formulário da landing e limite de requisições no cadastro.
- Reset da cota na renovação (vem junto com o pagamento).
- Agendar `limpar_dados_antigos()` (pg_cron).
- Não testado de ponta a ponta: faltam as credenciais para rodar o agente de verdade.
