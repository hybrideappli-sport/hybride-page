import { buildReminderIcs, REMINDER_ICS_FILENAME } from "@/lib/calendar/reminder-ics";
import { CLUB } from "@/lib/config";

/**
 * Rappel hebdomadaire d'ouverture des inscriptions, au format iCalendar.
 *
 * ROUTE STATIQUE, ET PAS SEULEMENT « CACHÉE ». `generateStaticParams` +
 * `dynamicParams = false` fixent l'unique valeur de slug possible, et le
 * handler ne reçoit ni ne lit `request` : le fichier est produit au build et
 * servi par le CDN. Aucune requête n'atteint de code serveur, donc aucune
 * donnée de visiteur — adresse IP, en-têtes, agenda visé — n'est observable.
 * Ne pas introduire ici de lecture d'horloge ni de paramètre de requête : ce
 * serait suffisant pour repasser la route en rendu à la demande.
 *
 * `dynamic = "force-static"` reste valide tant que Cache Components n'est pas
 * activé dans next.config.ts (Next 16 le retire dans ce mode — voir
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md).
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: CLUB.slug }];
}

/**
 * Aucun paramètre : ni `request`, ni `params`. Le slug n'a pas à être revalidé
 * ici — `dynamicParams = false` fait déjà répondre 404 à toute valeur absente
 * de `generateStaticParams`, et le contenu du fichier ne dépend pas de l'URL.
 */
export function GET() {
  return new Response(buildReminderIcs(), {
    headers: {
      /**
       * `text/calendar` EST le header qui décide de tout sur iPhone : c'est lui
       * que Safari regarde pour proposer la reprise par Calendrier. Servi en
       * `application/octet-stream` — ce que font les serveurs qui devinent le
       * type — le même fichier devient inouvrable sur iOS. Ne pas y toucher.
       */
      "Content-Type": "text/calendar; charset=utf-8",
      /**
       * `inline` plutôt qu'`attachment` : rien de décisif, mais `attachment`
       * ne pourrait qu'appuyer dans le sens du rangement silencieux, et le
       * `filename` donne au fichier un nom propre là où il atterrit.
       *
       * À ne pas confondre avec une promesse d'ouverture immédiate : sur iOS
       * récent, Safari télécharge le .ics quel que soit ce header, et c'est en
       * touchant la flèche de téléchargements puis le fichier que Calendrier
       * prend la main. Deux gestes, pas un — c'est le comportement du système,
       * aucun header ne le raccourcit.
       */
      "Content-Disposition": `inline; filename="${REMINDER_ICS_FILENAME}"`,
    },
  });
}
