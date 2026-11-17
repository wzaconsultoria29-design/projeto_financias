import { redirect } from "next/navigation";

/** A landing nova virou a oficial em "/". O endereço antigo só encaminha. */
export default function NovaAntigo() {
  redirect("/");
}
