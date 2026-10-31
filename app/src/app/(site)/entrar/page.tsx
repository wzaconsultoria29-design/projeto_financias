import type { Metadata } from "next";
import Link from "next/link";
import { EntrarWhatsApp } from "@/components/site/EntrarWhatsApp";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-12 px-4 py-16 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-tinta md:text-5xl">
          Entrar no painel
        </h1>
        <ol className="mt-8 flex max-w-[44ch] list-decimal flex-col gap-4 pl-5 leading-relaxed text-suave">
          <li>Gere um código aqui.</li>
          <li>Envie o código pelo WhatsApp.</li>
          <li>Pronto: o painel abre sozinho.</li>
        </ol>
        <p className="mt-8 text-sm text-suave">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-tinta underline underline-offset-4">
            Comece grátis
          </Link>
        </p>
      </div>
      <EntrarWhatsApp />
    </main>
  );
}
