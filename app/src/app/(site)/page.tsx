import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { ComoFunciona } from "@/components/site/ComoFunciona";
import { Recursos } from "@/components/site/Recursos";
import { Privacidade } from "@/components/site/Privacidade";
import { Planos } from "@/components/site/Planos";
import { Faq } from "@/components/site/Faq";
import { CtaFinal } from "@/components/site/CtaFinal";
import { Rodape } from "@/components/site/Rodape";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ComoFunciona />
        <Recursos />
        <Privacidade />
        <Planos />
        <Faq />
        <CtaFinal />
      </main>
      <Rodape />
    </>
  );
}
