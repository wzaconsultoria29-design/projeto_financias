import { test, expect } from "@playwright/test";

test("páginas saem com CSP e demais cabeçalhos de segurança", async ({ request }) => {
  for (const rota of ["/", "/cadastro", "/entrar", "/termos"]) {
    const r = await request.get(rota);
    const h = r.headers();
    expect(h["content-security-policy"], rota).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"], rota).toContain("https://supabase.exemplo.test");
    expect(h["x-content-type-options"], rota).toBe("nosniff");
    expect(h["referrer-policy"], rota).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"], rota).toBeUndefined();
  }
});

test("nenhuma violação de CSP ao abrir a landing e o cadastro", async ({ page }) => {
  const violacoes: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violacoes.push(m.text());
  });
  for (const rota of ["/", "/cadastro", "/entrar", "/privacidade"]) {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
  }
  expect(violacoes).toEqual([]);
});
