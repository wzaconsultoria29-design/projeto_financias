"use client";

import { useEffect, useRef } from "react";
import { brl } from "@/lib/format";

/**
 * Valor em reais que corre do número anterior até o novo.
 * O texto final já vem escrito do servidor; a animação só troca o texto no navegador, sem estado do React.
 */
export function Numero({ valor, className, ...resto }: { valor: number; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef(valor);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const de = anterior.current;
    anterior.current = valor;
    if (de === valor || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = brl(valor);
      return;
    }
    const inicio = performance.now();
    const duracao = 900;
    let quadro = 0;
    const passo = (agora: number) => {
      const p = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - p, 4);
      el.textContent = brl(de + (valor - de) * suave);
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(quadro);
      el.textContent = brl(valor);
    };
  }, [valor]);

  return (
    <span ref={ref} className={className} {...resto}>
      {brl(valor)}
    </span>
  );
}
