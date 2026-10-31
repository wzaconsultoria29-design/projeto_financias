import { Hero } from "@/components/site/Hero";
import { ComoFunciona } from "@/components/site/ComoFunciona";
import { Recursos } from "@/components/site/Recursos";
import { Privacidade } from "@/components/site/Privacidade";
import { Planos } from "@/components/site/Planos";
import { Faq } from "@/components/site/Faq";
import { CtaFinal } from "@/components/site/CtaFinal";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <ComoFunciona />
      <Recursos />
      <Privacidade />
      <Planos />
      <Faq />
      <CtaFinal />
    </main>
  );
}
