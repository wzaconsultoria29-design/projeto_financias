# App (site + painel)

Next.js 16 (App Router), React 19, Tailwind v4. Raiz do projeto na Vercel.

- Documentação geral, banco, bot e comandos: [`../README.md`](../README.md).
- Trocar o nome da marca: [`../docs/RENOMEAR-MARCA.md`](../docs/RENOMEAR-MARCA.md).
- Segurança e LGPD: [`../docs/SEGURANCA-E-LGPD.md`](../docs/SEGURANCA-E-LGPD.md).

```bash
cp .env.example .env.local   # preencha só valores públicos
npm install
npm run dev                  # http://localhost:3000
npm test                     # unitários (Vitest)
npm run test:e2e             # navegador real (Playwright, servidor de teste na porta 3100, serviços simulados)
npm run build && npm run verificar:segredos
```
