const TIMEZONE = "Europe/Paris";

export function formatEventDateLong(iso: string): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TIMEZONE }).format(
    new Date(iso),
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE }).format(new Date(iso));
}

/**
 * Date d'ouverture en toutes lettres, pour une phrase — « 15 septembre à 18h ».
 *
 * Existe pour qu'une date ne soit JAMAIS écrite deux fois : la constante de
 * configuration (SHOP_OPENING_TO) est la seule source, la phrase en découle. La
 * première version du décompte de la boutique écrivait « 15 septembre à 18h »
 * en dur à côté de la constante — un test avec une échéance décalée a montré la
 * phrase continuer d'annoncer l'ancienne date pendant que le compteur, lui,
 * visait la nouvelle.
 *
 * Déterministe : aucune lecture d'horloge, seulement l'instant reçu rendu dans
 * le fuseau du club. On peut donc l'appeler au rendu serveur sans risquer ni
 * décalage d'hydratation ni valeur figée par le cache.
 *
 * L'heure est écrite « 18h » à l'heure pile et « 18h30 » sinon : c'est ainsi
 * qu'on l'annonce, pas « 18:00 ».
 */
export function formatOpeningLabel(iso: string): string {
  const date = new Date(iso);
  const jour = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: TIMEZONE }).format(date);
  const parts = new Intl.DateTimeFormat("fr-FR", { hour: "numeric", minute: "2-digit", hour12: false, timeZone: TIMEZONE }).formatToParts(date);
  const heure = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  /*
   * Espaces INSÉCABLES (U+00A0) entre le quantième et son mois, et après le
   * « à » : à 375px la phrase se coupait entre « 15 » et « septembre ». Même
   * règle que la somme « 6,50 € » de lib/club/partners.ts — un nombre ne se
   * sépare pas de ce qu'il qualifie.
   */
  const jourInsecable = jour.replace(/ /g, "\u00A0");
  return `${jourInsecable} à\u00A0${Number(heure)}h${minute === "00" ? "" : minute}`;
}
