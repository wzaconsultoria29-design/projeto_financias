import { Hero } from "@/components/landing/Hero";
import { Faixa } from "@/components/landing/Faixa";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { Conversa } from "@/components/landing/Conversa";
import { BarraCta } from "@/components/landing/BarraCta";
import { PorQuePago } from "@/components/landing/PorQuePago";
import { Showcase } from "@/components/landing/Showcase";
import { Recursos } from "@/components/landing/Recursos";
import { Privacidade } from "@/components/landing/Privacidade";
import { Planos } from "@/components/landing/Planos";
import { Faq } from "@/components/landing/Faq";
import { CtaFinal } from "@/components/landing/CtaFinal";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Faixa />
      <ComoFunciona />
      <Conversa />
      <Showcase />
      <Recursos />
      <Privacidade />
      <Planos />
      <PorQuePago />
      <Faq />
      <CtaFinal />
      <BarraCta />
    </main>
  );
}
