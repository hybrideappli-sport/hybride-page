import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Aucun `disallow`, y compris sur les pages en `noindex` : interdire
 * l'exploration empêcherait le moteur de LIRE la directive noindex, et l'URL
 * pourrait rester indexée si un lien externe y mène. Même raisonnement que
 * app/mentions-legales/page.tsx — la balise retire des résultats, le robots.txt
 * ne fait qu'empêcher de regarder.
 *
 * Servi sur le domaine canonique comme sur hybride-page.vercel.app, mais là-bas
 * la 301 de next.config.ts renvoie d'abord ici : le `Sitemap` déclaré reste
 * toujours celui du domaine qui fait autorité.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
