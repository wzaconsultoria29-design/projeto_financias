import { brand } from "@/config/brand";

export function EstadoVazio({ texto = "Nenhum lançamento neste período" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-start gap-2 py-6">
      <p className="font-medium text-tinta">{texto}</p>
      <p className="max-w-[48ch] text-sm leading-relaxed text-suave">
        Mande um gasto pelo WhatsApp, por exemplo &quot;almoço 32 no pix&quot;, e ele aparece aqui.{" "}
        <a href={brand.botWaUrl("")} target="_blank" rel="noopener noreferrer" className="font-medium text-tinta underline underline-offset-4">
          Abrir o WhatsApp
        </a>
      </p>
    </div>
  );
}
