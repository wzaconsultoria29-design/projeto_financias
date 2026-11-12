# Checklist de lançamento

Atualizado em 2026-11-12. Marque cada item só depois de conferido de verdade. O estado detalhado do projeto fica no `CLAUDE.md`.

Legenda: `[x]` feito e conferido · `[~]` feito no código, falta aplicar ou conferir no ar · `[ ]` falta fazer

## 1. O que já funciona (conferido)

- [x] Cadastro pelo site e ativação pelo WhatsApp (`ATIVAR <código>`), com aceite dos termos.
- [x] Bot fechado: só responde quem tem cadastro e conectou o número.
- [x] Login no painel por código enviado do próprio WhatsApp.
- [x] Painel: Visão geral, Lançamentos e Configurações, no visual Verde-lima, claro e escuro.
- [x] Renda do perfil alimenta o painel quando não há receita lançada.
- [x] Grupo Family: convite por link de uso único, aceite ao entrar, remover e sair.
- [x] Exportar dados (CSV e `MEUS DADOS`) e excluir dados (`EXCLUIR MEUS DADOS`).
- [x] Cabeçalhos de segurança (CSP) e verificação de que nenhuma chave secreta vai para o navegador.
- [x] Testes automáticos: unitários e de ponta a ponta verdes (números no `CLAUDE.md`).

## 2. Feito no código em 2026-11-12, falta aplicar e conferir no ar

- [~] **Pagamento pelo Mercado Pago** (pagamento mensal avulso, Checkout Pro): migração 020, funções `pagamento-criar` e `pagamento-webhook`, botão Assinar e Renovar. **Só com chaves de teste.**
- [~] **Novo aceite dos termos** quando a versão muda (migração 019 e aviso no painel).
- [~] **Limite de códigos de login por IP** (migração 019 e função `login-iniciar`).
- [~] **Limpeza diária de dados antigos** agendada (migração 019, `pg_cron`).

Em 2026-11-12 as migrações 019 e 020 foram aplicadas e as funções de borda publicadas. Falta: enviar o site e fazer um teste real de cada item.

## 3. Antes de cobrar de verdade (pagamento)

- [ ] Fazer um pagamento de teste completo (cartão de teste aprovado, recusado e Pix pendente) e conferir: plano ativado, histórico, bot reconhecendo o plano.
- [ ] Trocar o token de teste pelo **token de produção** do Mercado Pago (linha `mp_access_token` em `segredos_app`). O token de teste apareceu em uma conversa: gere outro no painel do Mercado Pago antes de usar qualquer coisa parecida em produção.
- [ ] Definir a regra de **reembolso e cancelamento** (hoje o reembolso só é registrado; o plano não é cortado sozinho).
- [ ] Decidir o que acontece quando o mês pago vence (hoje: o bot para de responder 1 dia depois do vencimento e o painel oferece Renovar a partir de 7 dias antes).
- [ ] Aviso de vencimento pelo WhatsApp (hoje o aviso é só no painel; o bot nunca escreve primeiro).
- [ ] Nota fiscal ou recibo, conforme a orientação do contador.
- [ ] Conferir os textos da landing e dos termos sobre preço, cobrança e cancelamento.

## 4. Depende do dono (fora do código)

- [ ] Nome definitivo e **domínio**. Depois: ajustar `SITE_ORIGIN` e `SITE_URL` nas funções de borda, `allowedOrigins` do webhook de cadastro no n8n e os links do nó Config do bot.
- [ ] Razão social, CNPJ, encarregado de dados (DPO) e e-mail de contato (`NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_ENTITY`).
- [ ] **Revisão jurídica** dos Termos e da Política de privacidade.
- [ ] **Trocar as chaves antigas** da OpenAI e da Evolution.
- [ ] 2FA nas contas: Supabase, Vercel, n8n, GitHub, Mercado Pago.
- [ ] Decidir sobre a **API oficial do WhatsApp** (a Evolution não é oficial; há risco de bloqueio do chip).
- [ ] Provedor de e-mail (Resend ou Brevo) e Cloudflare Turnstile, se o cadastro em 3 passos e o login por e-mail e senha entrarem.

## 5. Operação

- [ ] Monitoramento do n8n e do chip (alerta quando o bot para de responder).
- [ ] Backups do banco conferidos (o plano do Supabase faz backup diário? por quantos dias?).
- [ ] Canal de suporte e quem responde.
- [ ] Rotina para olhar a tabela `cobrancas` com status `divergente` ou `reembolsada`.
- [ ] Proteção contra abuso no webhook de cadastro (limite de requisições no n8n).

## 6. Pode ficar para depois do beta

- [ ] Visão compartilhada dos valores e cota de mensagens dividida no grupo Family.
- [ ] Uso do custo de vida no painel.
- [ ] Orçamentos e metas.
- [ ] Comando "painel" no bot, com o link.
- [ ] Reforma da landing no visual novo.
- [ ] Assinatura recorrente no cartão (hoje o pagamento é mensal avulso, por decisão de 2026-11-12).

## 7. No dia de abrir

- [ ] Rodar os testes (`npm run test`, `npx playwright test`) e a verificação de segredos.
- [ ] Um cadastro novo de ponta a ponta em produção, com um número real.
- [ ] Um pagamento real de valor baixo e o reembolso dele.
- [ ] Conferir os avisos de segurança do Supabase.
- [ ] Deixar anotado como voltar atrás: o deploy anterior na Vercel (rollback) e o plano manual por SQL (seção 5.6 do `CLAUDE.md`).
