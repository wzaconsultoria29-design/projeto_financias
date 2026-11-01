"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Cabeçalho fixo que sai de cena ao descer a página e volta ao subir, para nunca cobrir os títulos. */
export function OcultaAoRolar({ children }: { children: ReactNode }) {
  const [oculto, setOculto] = useState(false);
  const [topo, setTopo] = useState(true);
  const ultimo = useRef(0);

  useEffect(() => {
    const aoRolar = () => {
      const y = window.scrollY;
      setTopo(y < 24);
      if (Math.abs(y - ultimo.current) < 8) return;
      setOculto(y > ultimo.current && y > 96);
      ultimo.current = y;
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <div data-topo={topo} className={`cabecalho sticky top-0 z-40 bg-papel transition-[transform,background-color] duration-300 motion-reduce:transition-none ${oculto ? "-translate-y-full" : ""}`}>
      {children}
    </div>
  );
}
