import type { CSSProperties, ReactNode } from "react";

/** Moldura de celular feita em CSS. A tela recebe o que o produto realmente mostra. */
export function Celular({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`celular ${className}`} style={style}>
      <div className="celular-tela">{children}</div>
    </div>
  );
}
