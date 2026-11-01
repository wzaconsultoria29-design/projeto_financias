const ITENS: [string, string, string][] = [
  ["Almoço", "R$ 32,00", "Alimentação"],
  ["Uber", "R$ 18,50", "Transporte"],
  ["Mercado", "R$ 120,00", "Alimentação"],
  ["Conta de luz", "R$ 128,40", "Despesas Fixas"],
  ["Netflix", "R$ 55,90", "Assinaturas"],
  ["Farmácia", "R$ 87,00", "Saúde"],
  ["Aluguel", "R$ 1.150,00", "Moradia"],
  ["Cinema", "R$ 62,00", "Lazer"],
];

function Chip({ item }: { item: [string, string, string] }) {
  return (
    <li className="flex shrink-0 items-center gap-3 rounded-full bg-superficie px-5 py-3 text-[16px] shadow-[0_14px_30px_-18px_rgba(4,38,29,0.45)]">
      <span className="font-semibold text-tinta">{item[0]}</span>
      <span className="tabular-nums text-tinta">{item[1]}</span>
      <span className="rounded-full bg-folha px-3 py-1 text-[14px] text-tinta">{item[2]}</span>
    </li>
  );
}

/** Faixa que rola sozinha com exemplos do que o assistente entende. A segunda cópia é só visual. */
export function Faixa() {
  return (
    <section aria-label="Exemplos do que o assistente entende" className="overflow-hidden pb-6 pt-2">
      <p className="mx-auto mb-6 max-w-7xl px-4 text-center text-[17px] text-suave md:px-8">Ele entende frases do dia a dia e já coloca cada gasto na categoria certa.</p>
      <div className="faixa flex w-max gap-3">
        <ul className="flex gap-3">
          {ITENS.map((i) => (
            <Chip key={i[0]} item={i} />
          ))}
        </ul>
        <ul aria-hidden className="flex gap-3">
          {ITENS.map((i) => (
            <Chip key={i[0]} item={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
