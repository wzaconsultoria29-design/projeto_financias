"use client";

import { useEffect, useRef, useState } from "react";

/** Largura real do contêiner em pixels, para o gráfico se desenhar no tamanho exato (texto sem esticar). */
export function useLargura(padrao = 560) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(padrao);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entrada]) => {
      if (entrada) setLargura(Math.max(240, Math.floor(entrada.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largura] as const;
}
