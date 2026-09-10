import { buildShopOpeningIcs, SHOP_OPENING_ICS_FILENAME } from "@/lib/calendar/shop-opening-ics";
import { CLUB } from "@/lib/config";

/**
 * Rappel d'ouverture de la boutique, au format iCalendar. Évènement unique,
 * sans récurrence — contrairement au rappel hebdomadaire des inscriptions
 * (app/club/[slug]/planning/rappel-inscriptions.ics/route.ts), dont ce fichier
 * reprend les choix, y compris les en-têtes.
 *
 * ROUTE STATIQUE, ET PAS SEULEMENT « CACHÉE ». `generateStaticParams` +
 * `dynamicParams = false` fixent l'unique valeur de slug possible, et le
 * handler ne reçoit ni ne lit `request` : le fichier est produit au build et
 * servi par le CDN. Aucune requête n'atteint de code serveur, donc aucune
 * donnée de visiteur n'est observable. Ne pas introduire ici de lecture
 * d'horloge ni de paramètre de requête.
 *
 * Le contenu dérive de SHOP_OPENING_TO : changer la date d'ouverture dans
 * lib/config.ts et redéployer suffit à régénérer ce fichier.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: CLUB.slug }];
}

export function GET() {
  return new Response(buildShopOpeningIcs(), {
    headers: {
      /**
       * `text/calendar` EST le header qui décide de tout sur iPhone : c'est lui
       * que Safari regarde pour proposer la reprise par Calendrier. Servi en
       * `application/octet-stream`, le même fichier devient inouvrable sur iOS.
       */
      "Content-Type": "text/calendar; charset=utf-8",
      /**
       * `inline` plutôt qu'`attachment`, et sans promesse d'ouverture
       * immédiate : sur iOS récent, Safari télécharge le .ics quel que soit ce
       * header, et c'est en touchant la flèche de téléchargements puis le
       * fichier que Calendrier prend la main.
       */
      "Content-Disposition": `inline; filename="${SHOP_OPENING_ICS_FILENAME}"`,
    },
  });
}
