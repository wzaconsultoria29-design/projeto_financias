import { brl } from "@/lib/format";
import { corDe } from "./dados";

const LINHA_1 = [
  ["Almoço", 32, "Alimentação"],
  ["Uber", 18.5, "Transporte"],
  ["Mercado", 86.4, "Alimentação"],
  ["Netflix", 55.9, "Assinaturas"],
  ["Farmácia", 87, "Saúde"],
  ["Conta de luz", 128.4, "Despesas Fixas"],
  ["Cinema", 62, "Lazer"],
  ["Aluguel", 1150, "Moradia"],
] as const;

const LINHA_2 = [
  ["Padaria", 14.9, "Alimentação"],
  ["Gasolina", 120, "Transporte"],
  ["Curso", 89.9, "Educação"],
  ["Internet", 99.9, "Despesas Fixas"],
  ["Dentista", 180, "Saúde"],
  ["Spotify", 21.9, "Assinaturas"],
  ["Pizza", 64, "Alimentação"],
  ["Condomínio", 420, "Moradia"],
] as const;

function Linha({ itens, inverso }: { itens: readonly (readonly [string, number, string])[]; inverso?: boolean }) {
  // A lista aparece duas vezes para a fita emendar sem salto; a segunda cópia fica fora da leitura de tela.
  return (
    <div className="nv-fita" data-inverso={inverso ? "" : undefined}>
      {[0, 1].map((copia) => (
        <ul key={copia} aria-hidden={copia === 1} className="flex gap-3">
          {itens.map(([nome, valor, categoria]) => (
            <li key={nome} className="flex items-center gap-3 whitespace-nowrap rounded-full bg-white/[0.045] py-2.5 pl-4 pr-5 text-[15px] shadow-[inset_0_0_0_1px_var(--nv-linha)]">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: corDe(categoria), boxShadow: `0 0 12px ${corDe(categoria)}` }} />
              <span className="font-medium">{nome}</span>
              <span className="nv-num nv-suave">{brl(valor)}</span>
              <span className="rounded-full px-2.5 py-0.5 text-[13px] font-medium" style={{ color: corDe(categoria), background: `color-mix(in srgb, ${corDe(categoria)} 14%, transparent)` }}>
                {categoria}
              </span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** Duas fitas de lançamentos de exemplo, cada um já com a categoria que o assistente daria. */
export function Fita() {
  return (
    <section aria-label="Exemplos de lançamentos já categorizados" className="nv-fita-caixa nv-mascara-x relative flex flex-col gap-3 overflow-hidden py-6">
      <Linha itens={LINHA_1} />
      <Linha itens={LINHA_2} inverso />
    </section>
  );
}
