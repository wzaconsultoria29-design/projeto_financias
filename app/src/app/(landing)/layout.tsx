import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingRodape } from "@/components/landing/LandingRodape";
import { RevealObserver } from "@/components/landing/RevealObserver";
import "./landing.css";

export default function LandingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="lp flex min-h-full flex-1 flex-col">
      <LandingHeader />
      {children}
      <LandingRodape />
      <RevealObserver />
    </div>
  );
}
