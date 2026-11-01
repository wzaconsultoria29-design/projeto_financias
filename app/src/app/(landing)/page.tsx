import { Hero } from "@/components/landing/Hero";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
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
      <ComoFunciona />
      <Showcase />
      <Recursos />
      <Privacidade />
      <Planos />
      <Faq />
      <CtaFinal />
    </main>
  );
}
