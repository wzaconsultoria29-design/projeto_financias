# Como trocar o nome da marca

"Gastômetro" é um nome provisório. O nome está escrito em **um lugar no site** e em **um lugar no bot**; o resto são endereços e cadastros externos que acompanham a troca.

Faça na ordem. Depois de tudo, rode `npm test` e `npm run test:e2e` dentro de `app/`.

## 1. Site (pasta `app`)

| O quê | Onde | Observação |
|---|---|---|
| Nome e frase da marca | `app/src/config/brand.ts` (`name`, `tagline`) | É a única fonte: cabeçalho, rodapé, títulos, textos legais e o painel leem daqui. |
| Endereço do site | variável `NEXT_PUBLIC_SITE_URL` (Vercel → Settings → Environment Variables) | Domínio novo, com `https://`. |
| E-mail de contato | `NEXT_PUBLIC_SUPPORT_EMAIL` | Aparece no rodapé e nos textos legais. |
| Responsável pelo tratamento (razão social ou nome) | `NEXT_PUBLIC_LEGAL_ENTITY` | Aparece na Política de privacidade. Enquanto estiver vazio o texto mostra "a definir". |
| Número do WhatsApp do bot | `NEXT_PUBLIC_BOT_NUMBER` | Só dígitos, com 55. Gera todos os links `wa.me`. |
| Logotipo e ícone | `app/src/app/favicon.ico` e `app/src/components/site/Header.tsx` (hoje só texto) | Quando houver logotipo, é nesses dois lugares. |

Redeploy na Vercel depois de mudar as variáveis (variáveis `NEXT_PUBLIC_*` são gravadas no build).

## 2. Textos legais

- `app/src/config/legal.ts`: o nome vem de `brand.ts`, então muda sozinho.
- **Versão dos termos**: `VERSAO_LEGAL` em `legal.ts` e a variável `termos_versao` do nó **Config** do agente no n8n precisam ser **iguais**. A versão é gravada junto com o aceite de cada cliente (prova do que ele aceitou). Troca de nome sozinha, sem mudança de regra, não exige versão nova. Se o conteúdo dos termos ou da política mudar de verdade, aumente a versão nos dois lugares; atenção: hoje o bot **não** pede um novo aceite automaticamente a quem já aceitou uma versão anterior (pendência registrada no README).

## 3. Bot e cadastro (n8n, pasta "Gastômetro v3")

1. Workflow **Agente WhatsApp** → nó **Config** → `nome_produto`. É usado nas mensagens e no prompt do agente.
2. No mesmo nó, confira `checkout_url`, `politica_url` e `termos_url`: devem apontar para o domínio novo.
3. Workflow **Cadastro Landing**: confira se alguma mensagem de resposta cita o nome (hoje só devolve o link do WhatsApp).
4. Publique os dois workflows depois de editar.

## 4. Domínio e origens permitidas

Quando o domínio mudar, atualize **todos** estes lugares (se um ficar para trás, o navegador bloqueia a chamada):

- Vercel: domínio do projeto.
- Supabase → Edge Functions → Secrets → `SITE_ORIGIN` (vale para `login-iniciar` e `login-status`): o domínio do site com `https://` e sem barra no final; para mais de um (por exemplo com e sem `www`), separe por vírgula. Enquanto a variável estiver vazia, as funções aceitam qualquer origem.
- n8n → Cadastro Landing → nó do webhook → `allowedOrigins` (deve ser o domínio do site, não `*`).
- Cabeçalho CSP: montado automaticamente a partir de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_CADASTRO_URL` (`app/src/lib/seguranca.ts`); não precisa editar.

## 5. Fora do código

- **Perfil do WhatsApp do bot**: nome, foto e recado (no aparelho/aplicativo do chip, ou no gerenciador da Evolution se for o caso).
- **Gateway de pagamento** (Mercado Pago, quando for ligado): nome da loja, descrição que aparece na fatura e e-mails de recibo.
- **Repositório no GitHub** e **projeto na Vercel**: renomear é opcional (os endereços antigos redirecionam).
- **Supabase**: o nome do projeto é interno, pode ficar como está.

## 6. Conferência final

```bash
cd app
npm test && npm run test:e2e
npm run build && npm run verificar:segredos
```

Depois abra o site, `/termos` e `/privacidade`, faça um cadastro de teste e mande `Oi` ao bot: o nome novo tem que aparecer em todos os lugares e nenhum "Gastômetro" antigo deve sobrar. Para procurar sobras: `grep -ri "gastômetro" app/src docs README.md`.
