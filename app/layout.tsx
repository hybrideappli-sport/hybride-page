import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SITE_URL } from "@/lib/seo";
import { bricolageGrotesque, instrumentSans, geistMono, instrumentSerif } from "./fonts";
import "./globals.css";

/**
 * Repli uniquement : chaque page pose ses propres `title`, `description` et
 * balises Open Graph (lib/seo.ts). Ce bloc ne sert vraiment qu'à `metadataBase`,
 * sans quoi les URLs d'images d'aperçu resteraient relatives et aucun aperçu de
 * lien ne se chargerait — WhatsApp, iMessage et Messenger exigent une URL absolue.
 *
 * Rien ici ne doit parler que de l'app : ce repli s'appliquerait sinon aux pages
 * de l'association. C'était le cas jusqu'au 2026-08-30 — les neuf pages du site
 * annonçaient « L'app Hybride et ses points club », y compris celles du club.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Hybride",
  description: "Le club de sport Hybride à Toulon, et l'application d'entraînement.",
  /*
   * Installation sur l'écran d'accueil iOS (app/manifest.ts fait le reste ailleurs).
   * Safari ne lit `display: standalone` du manifeste que depuis iOS 15.4 ; ce bloc
   * couvre les versions antérieures, sans quoi le raccourci rouvrirait simplement
   * un onglet Safari avec sa barre d'adresse.
   *
   * `statusBarStyle` vaut `black` et NON `black-translucent` : le translucide fait
   * passer la page sous l'encoche, exactement ce que le site refuse en n'activant
   * pas `viewport-fit=cover` (voir StickyJoinCta.module.css, où la même décision est
   * expliquée). Avec `black`, la barre d'état est noire — la couleur du site — et le
   * contenu commence sous elle.
   *
   * `title` est le nom SOUS l'icône : « Hybride » seul, parce que c'est tout ce
   * qu'iOS affiche avant de tronquer (une douzaine de caractères). Le nom complet
   * reste dans le manifeste.
   */
  appleWebApp: {
    capable: true,
    title: "Hybride",
    statusBarStyle: "black",
  },
};

/**
 * Couleur de la barre du navigateur sur mobile. Même valeur que `theme_color` du
 * manifeste, et pour la même raison : elle doit suivre le fond du site (noir),
 * pas le violet du logo.
 */
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${bricolageGrotesque.variable} ${instrumentSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
