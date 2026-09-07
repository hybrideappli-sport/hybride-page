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

  /**
   * Le domaine Vercel de production sert exactement le même contenu que le
   * domaine canonique, en 200 et sans `X-Robots-Tag` : Google l'a indexé en
   * double, malgré la canonique absolue posée par lib/seo.ts. Une canonique
   * est un signal agrégé parmi d'autres, pas une directive — une 301 ne laisse
   * pas ce choix au moteur. La canonique reste en place, les deux se renforcent.
   *
   * Le `has` sur `host` est compilé en `^…$` par Next (matchHas, dans
   * shared/lib/router/utils/prepare-destination) : la comparaison est ancrée et
   * porte sur le hostname seul, port retiré. Les URLs de PREVIEW —
   * `hybride-page-git-<branche>-<scope>.vercel.app` et
   * `hybride-page-<hash>-<scope>.vercel.app` — ne peuvent donc pas matcher.
   * Les points sont échappés pour qu'ils ne restent pas des jokers.
   *
   * Destination sur `www`, jamais l'apex : `hybride-club.fr` renvoie lui-même
   * un 308 vers `www` (au niveau Vercel), viser l'apex ferait deux sauts.
   * Doit rester d'accord avec SITE_URL (lib/seo.ts) — les alias de chemin du
   * tsconfig ne sont pas résolus dans ce fichier, d'où la valeur écrite ici.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "hybride-page\\.vercel\\.app" }],
        // 301 explicite plutôt que `permanent: true`, qui produirait un 308 :
        // Next préfère 307/308 pour préserver la méthode HTTP, mais c'est bien
        // un 301 qui est attendu ici, et que tout outil de SEO sait lire.
        statusCode: 301,
        destination: "https://www.hybride-club.fr/:path*",
      },
    ];
  },
};

export default nextConfig;
