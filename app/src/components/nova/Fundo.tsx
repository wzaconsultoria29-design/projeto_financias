"use client";

import { useEffect, useRef } from "react";

const PASSO = 34;

/**
 * Fundo vivo: uma malha de pontos que ondula devagar e acende perto do ponteiro.
 * Fica parado (um desenho só) quando o aparelho pede menos movimento e pausa com a aba escondida.
 */
export function Fundo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tela = ref.current;
    const ctx = tela?.getContext("2d");
    if (!tela || !ctx) return;

    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let largura = 0;
    let altura = 0;
    let px = -9999;
    let py = -9999;
    let quadro = 0;

    const ajustar = () => {
      largura = window.innerWidth;
      altura = window.innerHeight;
      tela.width = Math.round(largura * dpr);
      tela.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const desenhar = (agora: number) => {
      const t = agora / 1000;
      ctx.clearRect(0, 0, largura, altura);
      for (let y = PASSO / 2; y < altura; y += PASSO) {
        for (let x = PASSO / 2; x < largura; x += PASSO) {
          const onda = (Math.sin(x * 0.011 + t * 0.7) * Math.cos(y * 0.013 - t * 0.5) + 1) / 2;
          const dx = x - px;
          const dy = y - py;
          const perto = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 220);
          const alfa = 0.05 + onda * 0.1 + perto * 0.75;
          const raio = 1 + perto * 1.6;
          ctx.fillStyle = perto > 0.02 ? `rgba(200,246,93,${alfa})` : `rgba(150,230,190,${alfa})`;
          ctx.beginPath();
          ctx.arc(x, y, raio, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const ciclo = (agora: number) => {
      desenhar(agora);
      quadro = requestAnimationFrame(ciclo);
    };
    const aoMover = (ev: PointerEvent) => {
      if (ev.pointerType === "touch") return;
      px = ev.clientX;
      py = ev.clientY;
    };
    const aoAjustar = () => {
      ajustar();
      if (parado) desenhar(0);
    };
    const aoVisibilidade = () => {
      if (parado) return;
      cancelAnimationFrame(quadro);
      if (!document.hidden) quadro = requestAnimationFrame(ciclo);
    };

    ajustar();
    if (parado) desenhar(0);
    else quadro = requestAnimationFrame(ciclo);

    window.addEventListener("resize", aoAjustar);
    window.addEventListener("pointermove", aoMover, { passive: true });
    document.addEventListener("visibilitychange", aoVisibilidade);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", aoAjustar);
      window.removeEventListener("pointermove", aoMover);
      document.removeEventListener("visibilitychange", aoVisibilidade);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
