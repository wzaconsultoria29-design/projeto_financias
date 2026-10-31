// Falha se o resultado do build contiver uma chave secreta do Supabase.
// A palavra "service_role" sozinha aparece dentro do supabase-js (é uma trava contra uso no navegador),
// por isso procuramos a chave de verdade: o formato novo (sb_secret_...) e um JWT com role service_role.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PASTA = ".next";
const PADROES = [
  { nome: "chave sb_secret_", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { nome: "JWT com role service_role", re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*(cm9sZSI6InNlcnZpY2Vfcm9sZS|InJvbGUiOiJzZXJ2aWNlX3JvbGUi)/ },
];

function* arquivos(dir) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    const s = statSync(caminho);
    if (s.isDirectory()) yield* arquivos(caminho);
    else if (s.size < 20_000_000) yield caminho;
  }
}

let achados = 0;
for (const arquivo of arquivos(PASTA)) {
  const texto = readFileSync(arquivo, "latin1");
  for (const { nome, re } of PADROES) {
    if (re.test(texto)) {
      console.error(`SEGREDO: ${nome} em ${arquivo}`);
      achados++;
    }
  }
}
if (achados > 0) process.exit(1);
console.log("Nenhuma chave secreta no build.");
