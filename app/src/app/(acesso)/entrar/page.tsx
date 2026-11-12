import type { Metadata } from "next";
import { Suspense } from "react";
import { TelaEntrar } from "@/components/acesso/TelaEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <Suspense>
      <TelaEntrar />
    </Suspense>
  );
}
