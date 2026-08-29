import type { Metadata } from "next";
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
