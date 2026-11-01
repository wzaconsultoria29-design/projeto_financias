"use client";

import { useEffect } from "react";

/** Marca com `in` os elementos `.rise` quando entram na tela (a animação em si está em landing.css). */
export function RevealObserver() {
  useEffect(() => {
    const alvos = document.querySelectorAll<HTMLElement>(".rise");
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    alvos.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
