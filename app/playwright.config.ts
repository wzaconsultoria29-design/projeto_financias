import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", browserName: "chromium" },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    env: {
      NEXT_PUBLIC_CADASTRO_URL: "https://cadastro.exemplo.test/webhook",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.exemplo.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-publica-de-teste",
    },
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 } } },
  ],
});
