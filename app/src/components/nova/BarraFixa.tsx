"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Chamada fixa no rodapé da tela. Some enquanto o topo, os planos ou a chamada final estão à vista. */
export function BarraFixa() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const zonas = document.querySelectorAll("[data-barra-oculta]");
    const aVista = new Set<Element>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) aVista.add(e.target);
          else aVista.delete(e.target);
        }
        setVisivel(aVista.size === 0);
      },
      { threshold: 0.05 },
    );
    zonas.forEach((z) => observador.observe(z));
    return () => observador.disconnect();
  }, []);

  return (
    <div
      data-barra-fixa
      data-visivel={visivel}
      inert={!visivel}
      className="nv-barra-fixa fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[560px] items-center justify-between gap-3 rounded-full bg-[rgba(12,26,19,0.86)] py-2 pl-5 pr-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8),inset_0_0_0_1px_var(--nv-linha-forte)] backdrop-blur-xl"
    >
      <p className="min-w-0 truncate text-[15px] font-medium text-[var(--nv-texto)]">7 dias grátis, sem cartão</p>
      <Link href="/cadastro" className="nv-botao !min-h-[44px] flex-none !px-5 !py-2 !text-[15px]">
        Começar grátis
      </Link>
    </div>
  );
}
