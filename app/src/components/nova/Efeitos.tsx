"use client";

import { useEffect } from "react";

/**
 * Efeitos da página inteira, sem estado do React:
 * entrada das seções ao rolar, luz que segue o ponteiro nos cartões e a barra de leitura do topo.
 */
export function Efeitos() {
  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>(".nv");
    if (!raiz) return;

    const alvos = raiz.querySelectorAll<HTMLElement>("[data-revela]");
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.visto = "";
            observador.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    alvos.forEach((a) => observador.observe(a));

    const aoMover = (ev: PointerEvent) => {
      const cartao = (ev.target as Element | null)?.closest?.<HTMLElement>(".nv-foco");
      if (!cartao) return;
      const caixa = cartao.getBoundingClientRect();
      cartao.style.setProperty("--mx", `${ev.clientX - caixa.left}px`);
      cartao.style.setProperty("--my", `${ev.clientY - caixa.top}px`);
    };

    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      raiz.style.setProperty("--nv-prog", total > 0 ? String(Math.min(1, window.scrollY / total)) : "0");
      if (window.scrollY > 24) raiz.dataset.rolou = "";
      else delete raiz.dataset.rolou;
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    medir();

    raiz.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      observador.disconnect();
      raiz.removeEventListener("pointermove", aoMover);
      window.removeEventListener("scroll", aoRolar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, []);

  return null;
}
