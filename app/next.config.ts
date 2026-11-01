import type { NextConfig } from "next";
import { cabecalhosDeSeguranca } from "./src/lib/seguranca";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // O selo "N" do modo de desenvolvimento cobre o canto da tela nos prints e nos testes visuais.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: cabecalhosDeSeguranca({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          cadastroUrl: process.env.NEXT_PUBLIC_CADASTRO_URL,
          dev: process.env.NODE_ENV !== "production",
        }),
      },
    ];
  },
};

export default nextConfig;
