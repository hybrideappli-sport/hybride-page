import type { Metadata } from "next";

import { CLUB } from "@/lib/config";

/**
 * Domaine canonique du site — celui vers lequel `hybride-club.fr` redirige
 * déjà. Il sert à deux choses :
 *
 * 1. `metadataBase` : sans lui, les URLs d'images Open Graph restent relatives
 *    et AUCUN aperçu de lien ne se charge (WhatsApp, iMessage et Messenger
 *    exigent une URL absolue).
 * 2. La balise canonique : Vercel expose aussi le site sur
 *    `hybride-page.vercel.app`, qui répond 200 et sert exactement le même
 *    contenu — vérifié le 2026-08-29, sans `X-Robots-Tag` pour le neutraliser.
 *    Deux domaines pour un même contenu, c'est Google qui choisit lequel
 *    indexer. La canonique absolue règle le problème même sur la copie : la
 *    page servie par vercel.app désigne elle-même l'original.
 */
export const SITE_URL = "https://www.hybride-club.fr";

/**
 * Image d'aperçu de lien, 1200×630 (le ratio 1,91:1 attendu par WhatsApp et
 * Facebook). Recadrée depuis `public/photos/mercredi-hero.jpg`. Pour la
 * changer, il suffit de remplacer le fichier par une autre image aux mêmes
 * dimensions — aucun code à toucher.
 */
const OG_IMAGE = {
  url: "/og/hybride-club-toulon.jpg",
  width: 1200,
  height: 630,
  alt: "Le groupe du club Hybride Toulon court avec le drapeau du club le long du bord de mer, au coucher du soleil",
};

/**
 * Métadonnées d'une page de l'ASSOCIATION (/club/[slug]/...).
 *
 * `siteName` vaut « Hybride Club Toulon », jamais « Hybride » tout court, et la
 * description parle du club, jamais de l'app. Avant le 2026-08-30, les neuf
 * pages du site héritaient toutes de la même description — « L'app Hybride et
 * ses points club » — y compris les pages de l'association. C'est ce que
 * voyaient Google et WhatsApp : une page du club qui vendait l'entité
 * commerciale. Même séparation que dans ClubFooter.tsx (deux responsables de
 * traitement distincts, décision du brief).
 */
export function clubMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: CLUB.name,
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

/** Métadonnées d'une page de l'entité commerciale (racine du site). */
export function rootMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Hybride",
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
