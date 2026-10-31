# Segurança e LGPD — Gastômetro v3

> Este documento é um levantamento técnico, **não um parecer jurídico**. Antes de vender, revise os textos e as bases legais com um advogado de proteção de dados.

## 1. Mapa dos dados pessoais

| Dado | Origem | Onde fica | Finalidade |
|---|---|---|---|
| Telefone (identificador do cliente) | WhatsApp / landing | Supabase `usuarios` | Identificar o cliente, controlar cota e plano |
| Nome, e-mail | Formulário da landing | Supabase `usuarios` | Cadastro, contato, avisos de continuidade do serviço |
| Lançamentos (valor, data, categoria, descrição) | Mensagens do cliente | Supabase `lancamentos` | Prestar o serviço |
| Texto, áudio e foto das mensagens | WhatsApp | Passam por Evolution, n8n e OpenAI; só o texto extraído é guardado no banco | Interpretar o lançamento |
| Conversa recente (últimas mensagens) | Bot | Supabase `conversa_mensagens` (a IA só lê as últimas 12 h; limpeza após 7 dias) | Entender "e ontem?", "foi 40" |
| Registro de mensagens (id, telefone, status) | Bot | Supabase `mensagens_entrada` (limpeza após 90 dias) | Evitar duplicidade e depurar |
| Consentimentos | Landing / WhatsApp | Supabase `consentimentos` | Prova do aceite |
| Assinatura e pagamentos | Gateway | Supabase `assinaturas`, `eventos_pagamento` (o gateway guarda os dados do cartão, não nós) | Cobrança e obrigação fiscal |

**Operadores e transferência internacional:** Supabase (banco, hoje em `us-east-1`, EUA), OpenAI (IA, EUA), Meta/WhatsApp (canal), servidor da Evolution e do n8n (`servidorwza.shop`), gateway de pagamento (a definir) e Vercel (landing, quando existir).

## 2. O que já está implementado e foi testado

- **Isolamento entre clientes.** RLS ligado em todas as tabelas. Teste com dois clientes simulados: o cliente A vê só os 2 lançamentos dele, o B só o dele; ninguém altera, apaga ou insere dado do outro.
- **Perímetro.** Com a chave pública só se lê a tabela de planos. As demais tabelas devolvem `permission denied`. Nenhuma função do bot é executável por `anon` ou `authenticated`. Sem Realtime, storage ou views públicas.
- **Chave `service_role`** só existe dentro do n8n.
- **O modelo não escolhe o usuário.** O id do cliente é fixado nos nós das ferramentas do agente, então uma mensagem maliciosa não consegue consultar nem apagar dados de outra pessoa.
- **Exclusão só pelo dono.** `DEL#` e `apagar_lancamento` filtram por usuário.
- **Escopo do bot travado.** Um classificador decide se a mensagem é do app; o que for dicas de economia, investimentos ou indicação de aplicativos recebe resposta fixa e não chega ao agente.
- **Webhook com caminho secreto**, deduplicação de mensagens e cota por plano.
- **Banco pronto para a LGPD:** `registrar_consentimento`, `exportar_dados` (acesso/portabilidade) e `excluir_dados` (eliminação com anonimização). Testados: a exclusão apaga lançamentos e conversas, mantém a prova de consentimento e não afeta outros clientes.
- **Agente não apaga sozinho**, e datas relativas são calculadas no banco.

## 3. Lacunas antes de vender (por prioridade)

**Obrigatórias**
1. **Documentos:** Política de Privacidade, Termos de Uso e aviso de coleta, com razão social/CNPJ do controlador, canal do titular e **encarregado (DPO)**. Registro das operações de tratamento (a tabela da seção 1 é um ponto de partida).
2. **Consentimento no fluxo.** Landing com caixa de aceite **não pré-marcada** (e marketing em caixa separada), gravando a versão do texto. No WhatsApp, quem chega sem passar pela landing precisa responder `ACEITO` antes de qualquer tratamento. *(banco pronto; falta ligar nos fluxos)*
3. **Direitos do titular pelo bot:** `MEUS DADOS` (acesso), `EXCLUIR MEUS DADOS` com confirmação, e correção de lançamentos. *(banco pronto; falta ligar no bot)*
4. **Logs do n8n.** As execuções guardam o texto das mensagens e a chave da instância Evolution. Em produção, configurar para **não salvar execuções bem-sucedidas** e limitar a retenção das com erro.
5. **Chaves expostas da Fase 2** (OpenAI e Evolution): trocar.
6. **Segurança de contas:** autenticação em dois fatores no Supabase, n8n, Evolution, GitHub, Vercel e no gateway.

**Importantes**
7. **Transferência internacional (art. 33).** Banco e IA estão nos EUA. Opções: cláusulas-padrão da ANPD (Resolução CD/ANPD nº 19/2024) nos contratos, e/ou **recriar o banco em São Paulo agora**, enquanto está praticamente vazio. A OpenAI continuaria nos EUA.
8. **Contratos/DPAs** com OpenAI, Supabase e o gateway. Conferir a política de retenção da API da OpenAI (e a opção de retenção zero).
9. **Dados sensíveis (art. 11).** Descrições livres podem revelar saúde (farmácia, plano de saúde), religião (dízimo) etc. Orientar o cliente a não incluir dados sensíveis, e definir a base legal.
10. **Canal.** Evolution/Baileys é não oficial: risco de bloqueio e de questionamento jurídico. Migrar para a API oficial antes de escalar.
11. **Plano de incidente** (quem avisa a ANPD e os titulares) e **backups** (ligar recuperação pontual no Supabase).
12. **Retenção definida** (ex.: dados do cliente enquanto a conta estiver ativa + prazo legal fiscal). Agendar `limpar_dados_antigos()` (pg_cron).
13. **Menores:** exigir 18 anos nos termos.
14. **Anti-abuso no cadastro:** Turnstile e limite de requisições. O cadastro já não envia mensagem ativa.

## 4. Decisões que dependem de você

1. Razão social, CNPJ e e-mail/canal do encarregado de dados.
2. Região do banco: manter `us-east-1` ou recriar em São Paulo.
3. Prazo de guarda dos lançamentos depois do cancelamento.
4. Quem redige as políticas (advogado ou modelo revisado).
5. Quando migrar para a API oficial do WhatsApp.
