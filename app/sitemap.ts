import type { MetadataRoute } from "next";

import { getAgendaEvents } from "@/lib/agenda/source";
import { CLUB, COMMERCIAL_LEGAL_PAGES_PUBLISHED } from "@/lib/config";
import { getAllRituals } from "@/lib/rituals/content";
import { SITE_URL } from "@/lib/seo";

/**
 * Toutes les URLs sont construites sur SITE_URL, donc identiques aux canoniques
 * posées par lib/seo.ts. C'est la raison d'être de ce fichier : déclarer à la
 * Search Console la seule forme d'adresse qui fait autorité, pendant que la 301
 * de next.config.ts retire hybride-page.vercel.app de la circulation.
 *
 * Ni `lastModified`, ni `changeFrequency`, ni `priority` : Google ignore
 * ouvertement les deux derniers, et aucune de nos sources ne porte de date de
 * modification (le tableur n'en expose pas, les rituels sont des fichiers
 * Markdown dont la mtime change à chaque déploiement). Un `new Date()` posé à
 * la génération annoncerait « tout a changé » à chaque build — un signal faux,
 * que le moteur apprend justement à ignorer. Mieux vaut ne rien affirmer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const club = `${SITE_URL}/club/${CLUB.slug}`;

  const paths = [
    SITE_URL,
    club,
    `${club}/le-club`,
    `${club}/planning`,
    `${club}/adherer`,
    `${club}/shop`,
    `${club}/mentions-legales`,
    `${club}/politique-de-confidentialite`,

    // Les deux pages légales de l'entité commerciale (/mentions-legales,
    // /politique-de-confidentialite à la racine) sont volontairement absentes :
    // elles répondent 404 tant que ce drapeau est faux, et portent `noindex`.
    // À rétablir en même temps qu'elles, pas avant.
    ...(COMMERCIAL_LEGAL_PAGES_PUBLISHED
      ? [`${SITE_URL}/mentions-legales`, `${SITE_URL}/politique-de-confidentialite`]
      : []),

    ...getAllRituals().map((r) => `${club}/rituels/${r.frontmatter.slug}`),

    /*
     * Les sorties viennent du tableur (ADR-010) : si sa lecture échoue,
     * getAgendaEvents retombe sur son repli, au pire vide. Le sitemap perd
     * alors ses sorties mais garde toutes les pages fixes — dégradation
     * partielle, jamais une génération en échec.
     *
     * Y compris les sorties passées, tant que leur ligne reste publiée : leur
     * page continue de répondre, et leurs adresses circulent dans des
     * conversations bien après la date (voir AgendaEvent.slug).
     */
    ...(await getAgendaEvents()).map((e) => `${club}/sorties/${e.slug}`),
  ];

  return paths.map((url) => ({ url }));
}
