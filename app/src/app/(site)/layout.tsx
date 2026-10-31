import { Header } from "@/components/site/Header";
import { Rodape } from "@/components/site/Rodape";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <Rodape />
    </>
  );
}
