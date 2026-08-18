import { Bricolage_Grotesque, Instrument_Sans, Geist_Mono, Instrument_Serif } from "next/font/google";

/**
 * Auto-hébergées via next/font (téléchargées au build, servies depuis ce domaine —
 * aucune requête vers Google Fonts au runtime, pas de <link> externe). Poids
 * identiques à docs/design/direction-visuelle-sombre.html.
 */

export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-bricolage-grotesque",
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Serif d'accent — absente de docs/design/direction-visuelle-sombre.html, ajoutée sur
 * demande explicite pour le mélange sans-serif gras / serif italique repéré sur
 * panamerun.com (inspiration validée le 2026-08-16). Choix : Instrument Serif,
 * compagne officielle du même dessinateur qu'Instrument Sans déjà en place — pas
 * une police tierce sans lien avec le reste du système.
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
