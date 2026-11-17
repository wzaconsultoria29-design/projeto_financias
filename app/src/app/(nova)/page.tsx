import { Topo } from "@/components/nova/Topo";
import { Fita } from "@/components/nova/Fita";
import { Entende } from "@/components/nova/Entende";
import { PainelVivo } from "@/components/nova/PainelVivo";
import { Recursos } from "@/components/nova/Recursos";
import { Seguranca } from "@/components/nova/Seguranca";
import { PlanosNova } from "@/components/nova/PlanosNova";
import { Final, Perguntas } from "@/components/nova/Final";
import { BarraFixa } from "@/components/nova/BarraFixa";

/** Landing oficial em "/", em visual de fintech escura. A versão anterior continua em /antiga. */
export default function Nova() {
  return (
    <main className="relative flex-1">
      <Topo />
      <Fita />
      <Entende />
      <PainelVivo />
      <Recursos />
      <Seguranca />
      <PlanosNova />
      <Perguntas />
      <Final />
      <BarraFixa />
    </main>
  );
}
