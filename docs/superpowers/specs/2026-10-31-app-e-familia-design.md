# App Gastômetro (site + painel + plano Família) — desenho

Status: **proposta, aguardando aprovação**. Nada disso foi construído ainda. Itens marcados *(minha escolha)* são palpites meus, não decisões do Wesley.

## 1. Por que existe
O cliente registra gastos falando, fotografando ou digitando no WhatsApp (já funciona). Falta o lugar onde ele **enxerga** o dinheiro: um site bonito, que convença a assinar, e um painel (app) para acompanhar por dia, semana, mês e categoria, administrar a família e cuidar da própria conta. O painel é o que faz o cliente continuar pagando.

## 2. Metas, não-metas e anti-metas
**Metas**
- Landing que explica o valor em segundos e leva ao cadastro.
- Painel profissional (dia/semana/mês/ano/personalizado, categorias, comparativos, projeção do mês).
- Plano Família: todos os membros veem **todos os valores do grupo**.
- Entrar no painel sem senha, usando o próprio WhatsApp.
- Começar pequeno (sem CNPJ, banco na região atual), mas **sem travar o crescimento**.

**Não-metas (por enquanto)**: app nativo nas lojas, múltiplas moedas, importar extrato bancário, Open Finance.

**Anti-metas (seria um fracasso mesmo funcionando)**: dar dica genérica de investimento ou indicar produtos; qualquer cliente ver dado de quem não é do seu grupo; mensagem ativa em massa (risco de bloqueio do número).

## 3. Páginas do app
1. **Visão geral:** gasto, receita e saldo do período; comparação com o período anterior; projeção de fechamento do mês; gráfico por dia; por categoria; tendência de 6 meses; seletor de período; alternância **Eu | Família | por membro**.
2. **Lançamentos:** busca e filtros, editar, excluir, adicionar manual, exportar CSV; coluna "quem lançou" no plano Família.
3. **Orçamentos:** limite por categoria com barra de progresso e aviso no WhatsApp ao chegar em 80% e 100% (dentro da conversa, sem mensagem ativa).
4. **Insights:** frases geradas **a partir dos dados do próprio cliente** (categoria que subiu, assinaturas recorrentes detectadas, dia da semana que mais gasta, ritmo do mês). Cálculo no banco; sem conselho genérico.
5. **Família:** criar grupo, convidar números (até 4), ver membros, remover, sair; quanto cada um gastou no período.
6. **Conta e plano:** dados, plano, uso de mensagens, cobrança.
7. **Privacidade:** baixar meus dados, excluir meus dados, consentimentos (marketing separado).

## 4. Plano Família: regras
- O dono assina o Family e cria o grupo. Cada pessoa continua com o **próprio número e os próprios lançamentos**; o grupo só define quem **enxerga** o quê.
- Todo membro ativo vê todos os lançamentos de todos os membros, no painel e no bot ("quanto a família gastou este mês?").
- **Entrar exige consentimento da própria pessoa.** O dono cadastra o número no painel; quando essa pessoa fala com o bot, ele avisa quem convidou, diz que os lançamentos ficam visíveis ao grupo e pede `ACEITAR CONVITE` (ou `RECUSAR`). Nenhuma mensagem é enviada ao convidado por nós *(evita spam e bloqueio)*; o painel também mostra um link `wa.me` para o dono compartilhar.
- Qualquer membro pode sair (`SAIR DO GRUPO` ou pelo painel): a visibilidade acaba na hora; os lançamentos continuam sendo dele.
- Um número participa de **um grupo** por vez. Limite de membros vem do plano.
- A cota de mensagens do plano é **compartilhada** pelo grupo.
- *(minha escolha)* Sem opção de "gasto privado" na primeira versão; fica como evolução se pedirem.

## 5. Como fica no banco
Novas tabelas:
- `grupos` (id, nome, dono, assinatura que paga, datas).
- `grupo_membros` (grupo, usuário ou telefone convidado, papel `dono|membro`, status `convidado|ativo|removido`, código do convite, datas, **data do aceite de compartilhamento**).
- `orcamentos` (usuário ou grupo, categoria, limite mensal, ativo).
- `planos` ganha `membros_max`, `dias_validade`.
- Consentimentos ganham o tipo `familia`.

Regras:
- **Quem enxerga o quê:** uma função privada devolve "eu + membros ativos do meu grupo". As políticas de leitura de `lancamentos` usam essa função; todo o resto continua só do próprio usuário. Dados de contato dos outros membros **não** ficam expostos: o painel os lê por uma visão que mostra só nome e telefone mascarado.
- **Assinatura efetiva:** se a pessoa é membro ativo, vale a assinatura do dono do grupo (plano e cota); senão, a própria.
- **Cálculos do painel** em funções do banco (resumos, série diária, por categoria, por membro, comparativo, projeção, insights), respeitando as mesmas políticas de acesso. O navegador nunca recebe lista bruta para somar.
- Todas as operações de administração (criar grupo, convidar, remover, sair) são funções com verificação de dono; nada é escrito direto nas tabelas.

## 6. Impacto nos nós do n8n
- `verificar_acesso` passa a devolver o grupo e a assinatura efetiva, e se há **convite pendente** para o telefone.
- `Rotear Mensagem` ganha 3 saídas: `ACEITAR CONVITE / RECUSAR`, `SAIR DO GRUPO` e `PAINEL <código>` (login).
- O agente ganha a opção de escopo "eu | família" na ferramenta de resumo (só vale se a pessoa estiver em um grupo; o banco confere).
- Ao registrar um gasto, o banco devolve também o aviso de orçamento (80%/100%) e o agente o inclui na resposta.
- Nada muda no resto do fluxo (consentimento, escopo, datas, exclusão).

## 7. Entrar sem senha (WhatsApp)
1. Na página de entrada, a pessoa digita o número. O site mostra um código curto e um botão que abre o WhatsApp do bot com `PAINEL 483920` pronto.
2. Ela envia a mensagem. O bot confirma que o número bate com o do código (prova de posse; **sem mensagem ativa**).
3. O site percebe a confirmação e abre a sessão.
- A sessão é uma sessão normal do Supabase Auth, então as políticas de acesso do banco valem (inclusive a visão da família). Uma função de borda cria a sessão depois da confirmação. Códigos expiram em poucos minutos e são de uso único.

## 8. Planos (proposta *(minha escolha)*, editável)
| | Trial | Essencial | Family |
|---|---|---|---|
| Preço | grátis, 7 dias | R$ 19/mês | R$ 39/mês |
| Mensagens | 50 | 300/mês | 800/mês compartilhadas |
| Números | 1 | 1 | até 4 |
| Painel completo, orçamentos, insights | sim | sim | sim |
| Visão do grupo | — | — | sim |

Mudanças em relação ao rascunho do Lovable: "lançamentos ilimitados" vira **uso justo** (controla o custo da IA) e "dicas financeiras de IA" vira **insights dos seus próprios dados** (respeita a regra de não dar conselho genérico). Os valores de cota são os que eu consideraria seguros para o custo atual.

## 9. Diferenciais
1. Registrar em 5 segundos **sem abrir app**: texto, áudio ou foto do cupom.
2. Entrar no painel sem senha, só com o WhatsApp.
3. Família com visão compartilhada e aceite individual (transparente e dentro da LGPD).
4. Orçamentos que avisam **dentro da conversa**.
5. Insights calculados nos dados do cliente, sem inventar nada.
6. Privacidade como argumento de venda: baixar e apagar tudo com uma mensagem.
7. Preço fixo e claro.

## 10. Visual *(direção minha, a validar com mockups)*
Site e painel sofisticados e calmos, transmitindo confiança e cuidado com o dinheiro: papel quente, verde profundo e dourado discreto (próximo do que o Wesley já tem, mas com tipografia editorial e mais respiro), com **tema escuro** no painel. Gráficos limpos, números grandes, microanimações discretas. Mobile primeiro (a maioria vai abrir pelo celular, vindo do WhatsApp). A direção final sai de dois mockups lado a lado.

## 11. Tecnologia *(minha escolha)*
Next.js + TypeScript + Tailwind + gráficos Recharts, hospedado na Vercel, código no GitHub, falando direto com o Supabase (login, leitura com políticas de acesso e funções do banco). Instalável no celular (PWA). Sem servidor próprio.

## 12. Preparado para crescer (sem fazer agora)
- **Banco em São Paulo:** o app só conhece a URL e a chave do Supabase em variáveis de ambiente; mudar de região = criar o projeto novo, aplicar as migrações, restaurar os dados e trocar as variáveis.
- **CNPJ:** o controlador dos dados aparece só nos textos legais e no gateway de pagamento; trocar não exige mudança de código.
- **API oficial do WhatsApp:** mudam apenas os nós de extrair, enviar e baixar mídia.
- **Mais volume:** n8n em modo fila com workers; o banco já tem deduplicação e índices.

## 13. Fases de entrega
1. Site (landing + cadastro com aceite) + entrar com WhatsApp + painel pessoal (visão geral e lançamentos).
2. Família (banco, bot e telas).
3. Orçamentos, insights e avisos no WhatsApp.
4. Pagamento (Mercado Pago) com ativação automática e renovação.
5. Extras (categorias personalizadas, metas de economia, PWA).

## 14. A decidir pelo Wesley
1. Aprova a proposta de planos e cotas (seção 8) ou quer outros valores?
2. Nome do produto/marca (hoje provisório).
3. Aprova a direção visual (seção 10) ou quer ver os dois mockups antes?
4. Começar pela fase 1 já com o plano Família na vitrine, mas ativando a família só na fase 2?
