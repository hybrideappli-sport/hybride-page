import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * lib/rituals/content.ts lit content/rituels/*.md via un chemin construit
   * dynamiquement (le slug) — le traçage de fichiers de Next ne peut pas le
   * résoudre statiquement et laisserait ces fichiers hors du bundle serverless
   * en production (marche en local car tout le repo est sur disque, casse
   * silencieusement sur Vercel sinon). Inclusion explicite pour les deux
   * routes qui en dépendent.
   */
  outputFileTracingIncludes: {
    "/club/*": ["content/rituels/**/*"],
    "/club/*/rituels/*": ["content/rituels/**/*"],
  },
};

export default nextConfig;
