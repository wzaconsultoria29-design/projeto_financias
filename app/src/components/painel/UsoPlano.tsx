import type { Conta } from "@/lib/api";

/** Barra de uso de mensagens; sem limite (plano ilimitado ou sem plano) mostra só a contagem. */
export function UsoPlano({ uso }: { uso: Conta["uso"] }) {
  const limite = uso.limite;
  if (limite === null || limite <= 0) {
    return <p className="text-tinta">{uso.mensagens} mensagens usadas neste período</p>;
  }
  const percentual = Math.min(100, Math.round((uso.mensagens / limite) * 100));
  return (
    <div>
      <p className="text-tinta">
        <span className="font-medium tabular-nums">{uso.mensagens} de {limite} mensagens</span> neste período
      </p>
      <div
        role="progressbar"
        aria-label="Mensagens usadas"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-folha"
      >
        <div className="h-full rounded-full bg-floresta" style={{ width: `${percentual}%` }} />
      </div>
      {uso.restantes !== null && <p className="mt-2 text-sm text-suave">{uso.restantes} restantes</p>}
    </div>
  );
}
