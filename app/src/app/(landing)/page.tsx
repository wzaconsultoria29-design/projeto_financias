import { Hero } from "@/components/landing/Hero";
import { Faixa } from "@/components/landing/Faixa";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { BarraCta } from "@/components/landing/BarraCta";
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
      <Recursos />
      <Privacidade />
      <Planos />
      <Faq />
      <CtaFinal />
      <BarraCta />
    </main>
  );
}
