import type { MetadataRoute } from "next";

import { CLUB } from "@/lib/config";

/**
 * Manifeste d'installation — servi sur `/manifest.webmanifest` et référencé
 * automatiquement dans le `<head>` par Next (convention `app/manifest.ts`).
 *
 * POURQUOI LES ICÔNES SONT DANS `public/pwa/` ET NON `app/icon.png` :
 * la convention `app/icon.png` sert le fichier à `/icon?<empreinte>`, une URL
 * qui change à chaque modification de l'image. Un manifeste a besoin de chemins
 * stables — les navigateurs mettent l'icône installée en cache pour la durée de
 * vie du raccourci. `public/pwa/icon-{192,512}.png` sont donc des copies du même
 * dessin, à des URLs figées. CHANGER LE LOGO = remplacer les trois fichiers
 * (`app/icon.png`, `app/apple-icon.png`, et les deux de `public/pwa/`), sinon
 * l'onglet et l'écran d'accueil finissent par montrer deux logos différents.
 *
 * Chaque taille est déclarée DEUX FOIS, en `any` puis en `maskable`, avec le
 * même fichier. La spécification autorise `purpose: "any maskable"` sur une
 * seule entrée, mais le type `MetadataRoute.Manifest` de Next n'accepte qu'une
 * valeur — d'où le dédoublement, qui produit le même résultat.
 *
 * Le même dessin peut servir aux deux usages parce qu'Android rogne les icônes
 * maskables sur un cercle de 80% et que le « H » du logo tient dans les 46%
 * centraux : seul du violet plein est coupé. Ne pas reconduire `maskable` sans
 * revérifier si le dessin change — un logo qui touche les bords serait amputé.
 *
 * `start_url` pointe sur le club, pas sur `/` : c'est le site de l'association
 * qu'on installe. `scope` reste `/` malgré tout, sinon le lien « Hybride » de la
 * barre de navigation (qui pointe vers la racine) sortirait du périmètre de
 * l'application installée et rouvrirait un navigateur.
 *
 * Les couleurs reprennent `--hy-bg` (#000) de globals.css, pour les deux champs.
 * `theme_color` ne colore pas que l'écran de démarrage : sur Android il teinte
 * aussi la barre système de l'application installée. Y mettre le violet de
 * l'icône (#6d28d9) poserait un bandeau violet au-dessus d'un site noir — la
 * couleur de thème suit le fond du site, pas le logo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: CLUB.name,
    short_name: "Hybride",
    description: "Le club de sport Hybride à Toulon : planning des sorties, rituels de la semaine et adhésion.",
    lang: "fr",
    start_url: `/club/${CLUB.slug}`,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
