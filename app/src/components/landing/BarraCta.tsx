"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { planos } from "@/config/planos";

/**
 * Barra fixa de chamada: aparece depois do topo e some quando uma seção que já chama para o cadastro
 * (as marcadas com data-barra-oculta: topo, planos, chamada final) está na tela, para nunca repetir o botão ao lado dele.
 */
export function BarraCta() {
  const [visivel, setVisivel] = useState(false);
  const pago = planos.find((p) => p.destaque);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const dentro = new Set<Element>();
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) dentro.add(e.target);
        else dentro.delete(e.target);
      }
      setVisivel(dentro.size === 0);
    });
    document.querySelectorAll("[data-barra-oculta]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      data-barra-cta
      data-visivel={visivel}
      aria-hidden={!visivel}
      inert={!visivel}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-linha bg-superficie pb-[env(safe-area-inset-bottom)] transition-transform duration-300 motion-reduce:transition-none ${visivel ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <p className="text-[15px] leading-snug text-tinta">
          <span className="font-semibold">7 dias grátis, sem cartão.</span>
          {pago && <span className="hidden text-suave sm:inline">{` Depois ${pago.preco} ${pago.periodo}.`}</span>}
        </p>
        <Link href="/cadastro" className="botao shrink-0">
          Começar grátis
        </Link>
      </div>
    </div>
  );
}
