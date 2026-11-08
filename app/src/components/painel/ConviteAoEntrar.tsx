"use client";

import { useEffect, useRef, useState } from "react";
import { aceitarConvite } from "@/lib/api";

const CHAVE = "convite-pendente";

/** Quem abriu um link de convite e depois entrou (ou criou a conta): aceita o convite guardado e avisa o resultado. */
export function ConviteAoEntrar() {
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const iniciou = useRef(false); // o modo de desenvolvimento roda o efeito duas vezes: o convite é tentado uma vez só

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    let codigo: string | null = null;
    try {
      codigo = window.localStorage.getItem(CHAVE);
      if (codigo) window.localStorage.removeItem(CHAVE); // o convite é tentado uma vez só
    } catch {
      return;
    }
    if (!codigo) return;
    aceitarConvite(codigo)
      .then((r) => setAviso({ tipo: "ok", texto: `Você entrou no grupo de ${r.titular_nome ?? "outra pessoa"}.` }))
      .catch((e: unknown) => setAviso({ tipo: "erro", texto: e instanceof Error ? e.message : "Não deu para aceitar o convite. Peça um novo link." }));
  }, []);

  if (!aviso) return null;
  return (
    <div
      role={aviso.tipo === "ok" ? "status" : "alert"}
      className={`mb-5 flex items-start justify-between gap-4 rounded-[14px] px-4 py-3 text-sm ${aviso.tipo === "ok" ? "bg-bom-bg text-bom-ink" : "bg-ruim-bg text-ruim-ink"}`}
    >
      <p>{aviso.texto}</p>
      <button type="button" onClick={() => setAviso(null)} className="font-semibold underline underline-offset-2">Fechar</button>
    </div>
  );
}
