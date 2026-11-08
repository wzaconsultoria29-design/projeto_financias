import { redirect } from "next/navigation";

/** A página Conta mudou para dentro das Configurações. */
export default function ContaAntigaPage() {
  redirect("/painel/configuracoes/conta");
}
