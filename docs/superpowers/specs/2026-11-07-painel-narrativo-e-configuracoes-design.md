# Painel narrativo e Configurações: desenho

Data: 2026-11-07. Estado: **em construção por etapas** (o dono mandou seguir: "então vamos ajustar"). Itens marcados *(minha escolha)* são decisões minhas, não do dono; ele pode mudá-las.

## Por que existe

O dono abriu o painel com os próprios dados e achou **pouco didático, sem leitura clara e fraco de cor**. O painel mostra muita coisa, mas não **conta o que aconteceu**. A referência estudada (Dinzo, em 2026-11-07) abre com **uma resposta em uma frase** em um cartão de cor forte, e tem uma área de **Configurações completa**: conta, aparência, notificações, acesso compartilhado e plano.

## Metas, não metas e anti-metas

- **Metas:** a pessoa entende em 10 segundos o que aconteceu com o dinheiro dela, por quê e o que fazer; textos simples, sem jargão; cada gráfico com uma frase que diz a conclusão; cores vivas e estáveis; Configurações com as áreas que o produto precisa para ser vendido (conta, aparência, plano e pagamentos, acesso compartilhado).
- **Não metas (agora):** conectar banco; pagamento real (Mercado Pago ainda depende da conta do dono); visão compartilhada dos valores entre membros do grupo (é uma etapa à parte, mexe em segurança dos dados); landing (o dono pediu para rever depois).
- **Anti-metas:** número que a IA estima; conselho de investimento; texto que acusa ou dá bronca; cor que mente (despesa subindo não vira "alegria"); qualquer promessa que o produto não cumpre.

## Parte 1: a Visão geral como uma narrativa

A tela passa a ser lida de cima para baixo, como uma história com começo, meio e próximo passo. Todos os números continuam vindo do banco (`app_painel`); as frases são montadas no site com regras puras e testadas (`src/lib/narrativa.ts`).

| Parte | Pergunta que responde | Como aparece |
|---|---|---|
| **Cartão de abertura** (verde-escuro cheio, texto branco, detalhes em lima) | Como estou? | Uma **manchete** ("Sobraram R$ 1.600,00: você poupou 45,7% da renda."), o saldo grande, receitas e despesas como etiquetas coloridas, medidor da taxa de poupança com a referência, e "pode gastar por dia" quando existe |
| **O que mudou** | Em relação ao período anterior, o que mudou? | Linhas com o antes e o depois: despesas, receitas, a categoria que mais subiu e a que mais caiu. **Cor diz bom ou ruim**, não subiu ou desceu |
| **Para onde foi** | Onde o dinheiro foi parar? | Barras ordenadas, **uma cor fixa por categoria**, com a manchete ("Moradia levou mais da metade do que você gastou") |
| **Como está dividido** | O gasto é necessário, desejo ou futuro? Quanto é fixo? | Barra dividida (necessário, desejo, futuro) e fixos x variáveis, com a referência 50/30/20 explicada em palavras |
| **O ritmo do mês** | Como o mês termina? | Gasto acumulado contra o período anterior, previsão, média por dia, dia da semana mais caro |
| **Nos últimos meses** | Estou melhorando ou piorando? | Colunas de 6 meses e uma manchete ("Suas despesas subiram nos últimos 3 meses") |
| **O que fazer agora** | E agora? | Até 3 próximos passos **que dependem dos dados** (registrar a renda, olhar a categoria que subiu, perguntar ao assistente), cada um com um botão |

- **Didático:** cada parte tem um **"Como ler"** (texto curto que explica o gráfico e os termos) que abre e fecha. Termos técnicos viram palavras do dia a dia: "Pareto" vira "as 3 maiores categorias", "50/30/20" vira "necessário, desejo e futuro".
- **Cores** *(minha escolha)*: cartão de abertura em verde-escuro cheio com lima (a identidade da landing); **8 cores de categoria** da paleta validada para daltonismo (azul, laranja, verde-água, amarelo, magenta, verde, violeta, vermelho), **sempre a mesma cor para a mesma categoria**; receitas em verde, despesas em laranja; "Outras/Outros" em cinza. Rótulo direto e tabela acessível em todo gráfico (a paleta tem cores abaixo de 3:1 no claro). Tema claro e escuro.
- **Tom das frases:** neutro e útil. Sem bronca. Sugestão só quando os dados sustentam. Nunca investimento.
- Substitui o quadro "O que o painel notou" e o cartão "Pergunte pelo WhatsApp" (que passam a morar em "O que fazer agora").

## Parte 2: Configurações

Rota nova `/painel/configuracoes` com menu lateral (no celular, lista). A rota antiga `/painel/conta` redireciona. No trilho de ícones, "Conta" vira "Configurações".

| Página | O que tem | Banco |
|---|---|---|
| **Conta** | Nome (editável), e-mail e WhatsApp (somente leitura, mascarado), **renda mensal** e **custo de vida mensal** (alimentam o painel e a leitura), sessão atual e "Sair da conta". Criar senha entra quando o login por e-mail e senha existir | Colunas novas em `usuarios` (proposta, migração 016) |
| **Aparência e segurança** | Tema **claro, escuro ou automático**; "**Ocultar valores ao abrir**" (liga o modo do olho já na entrada) | Só no navegador |
| **Plano e pagamentos** | Plano atual, situação, período e uso das mensagens; **comparar planos e pedir upgrade**; **histórico de pagamentos** | Tabela de pedidos de plano e leitura dos pagamentos (proposta, migração 017) |
| **Acesso compartilhado** | Plano Family: "Convidados n de 4", convidar por link (código), remover, só o titular gerencia. Fora do Family: mostra o que o plano oferece e leva ao upgrade | Grupos, membros e convites (proposta, migração 018) |
| **WhatsApp** | Número vinculado, como conversar, comandos | Leitura |
| **Notificações** | Lista dos avisos que existem hoje e como desligar | Depois (o bot nunca escreve primeiro) |
| **Privacidade e dados** | Exportar (CSV), documentos, "**Zona de risco**" recolhida (excluir dados, com confirmação) | Funções que já existem |

### Decisões minhas nesta parte *(o dono pode mudar)*
1. **Upgrade sem pagamento:** enquanto o Mercado Pago não existe, "pedir upgrade" **registra o pedido** e mostra "Recebemos o seu pedido; o pagamento será liberado em breve". **Não troca o plano sozinho**, para ninguém ganhar plano pago de graça. A troca real vem com o pagamento.
2. **Histórico de pagamentos:** a tela existe e lista o que houver; hoje mostra "Nenhuma cobrança ainda" (teste grátis não cobra).
3. **Convite da Família:** o titular gera um **link com código** e envia por onde quiser (não depende de provedor de e-mail). Quem recebe abre o link e conclui o cadastro; entra no grupo e conta no limite de 4. Cada membro tem cadastro, senha e WhatsApp próprios (decisão do dono de 2026-11-06).
4. **Visão compartilhada dos valores** (todos veem tudo do grupo) **fica para uma etapa própria**, porque muda a regra de quem enxerga o quê no banco.
5. O que **não** copio do Dinzo: Open Finance, XP e níveis, anual e trimestral (nossos planos são mensais).

## Etapas e o que precisa do OK do dono

1. **Painel narrativo** (só o site; sem banco).
2. **Configurações: estrutura, Aparência e Conta** (Conta usa colunas novas: **migração 016**).
3. **Plano, upgrade e pagamentos** (**migração 017**).
4. **Acesso compartilhado** (**migração 018**).
- Cada migração: escrever, **ensaiar** com teste SQL em transação desfeita, **pedir o OK**, aplicar, conferir.
- Commit e envio ao GitHub/Vercel: só com o OK do dono.

## Riscos

- **Frases geradas** podem soar erradas em casos de borda: cobertas por testes com os casos de borda (sem renda, saldo zero, período vazio, uma categoria só).
- **Mais cor** pode piorar o contraste: validar a paleta e olhar as capturas em claro e escuro.
- **Família** mexe em dados de várias pessoas: por isso a visão compartilhada é etapa à parte, com RLS testado.
