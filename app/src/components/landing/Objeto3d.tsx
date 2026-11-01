import Image from "next/image";

const ARQUIVOS = { moeda: "/3d/moeda.png", folha: "/3d/folha.png", recibo: "/3d/recibo.png" } as const;

/** Objeto 3D gerado em fundo preto: o modo "screen" apaga o preto e deixa só o brilho sobre o fundo escuro. */
export function Objeto3d({ nome, className = "", atraso = 0, lento = false }: { nome: keyof typeof ARQUIVOS; className?: string; atraso?: number; lento?: boolean }) {
  return (
    <div aria-hidden className={`objeto3d ${lento ? "flutua-lento" : "flutua"} ${className}`} style={{ animationDelay: `${atraso}s` }}>
      <Image src={ARQUIVOS[nome]} alt="" width={1024} height={1024} sizes="(min-width: 768px) 220px, 120px" className="h-full w-full object-contain" />
    </div>
  );
}
