import { VERSAO_LEGAL, type SecaoLegal } from "@/config/legal";

export function PaginaLegal({ titulo, secoes }: { titulo: string; secoes: SecaoLegal[] }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 md:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-tinta md:text-5xl">{titulo}</h1>
      <p className="mt-4 text-sm text-suave">Versão {VERSAO_LEGAL}</p>
      <p className="mt-6 rounded-[12px] bg-folha px-4 py-3 text-sm text-tinta">
        Rascunho em revisão jurídica. O texto final será publicado antes da abertura ao público.
      </p>
      <div className="mt-10 flex flex-col gap-9">
        {secoes.map((s) => (
          <section key={s.titulo}>
            <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">{s.titulo}</h2>
            {s.paragrafos.map((p) => (
              <p key={p} className="mt-3 max-w-[65ch] leading-relaxed text-suave">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
