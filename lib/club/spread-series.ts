/**
 * Répartition d'une liste EN CERCLE : deux éléments de la même série ne sont
 * jamais voisins — y compris le dernier et le premier, puisque le carrousel du
 * shop boucle et les met bout à bout.
 *
 * L'ORDRE D'ENTRÉE EST UNE PRÉFÉRENCE, PAS UN BROUILLON. À chaque place, on
 * prend le premier élément restant dont la série n'est pas celle du voisin. Un
 * ordre déjà correct ressort donc tel quel, et un ordre mélangé garde autant de
 * hasard que la contrainte le permet. La fonction elle-même ne tire rien au
 * sort : même entrée, même sortie. C'est ce qui permet de l'appliquer au rendu
 * serveur sans désaccord d'hydratation (voir ShopCarousel).
 *
 * UNE RÉPARTITION N'EXISTE QUE SI AUCUNE SÉRIE NE DÉPASSE LA MOITIÉ de la liste
 * (arrondie à l'entier inférieur). Au-delà, deux éléments de la plus grosse
 * série se touchent forcément quelque part sur le cercle. Dans ce cas, la
 * fonction ne plante pas : elle limite les voisins identiques au mieux, et
 * `canSpread` permet d'avertir en amont.
 *
 * MÉTHODE. Placement de gauche à droite avec retour arrière, élagué par un
 * test de capacité : après chaque placement, on vérifie que chaque série peut
 * encore tenir dans les places restantes sans se toucher. Ce test écarte
 * d'emblée les impasses, si bien qu'en pratique le retour arrière ne sert
 * presque jamais. Il reste là pour que le résultat soit garanti, pas seulement
 * probable.
 */

/** Au-delà, on renonce au retour arrière et on passe au placement au mieux. */
const MAX_STEPS = 10_000;

/** Vrai si une répartition sans voisins de la même série existe, boucle comprise. */
export function canSpread<T>(items: readonly T[], seriesOf: (item: T) => string): boolean {
  if (items.length < 2) return true;
  return largestSeries(items, seriesOf) <= Math.floor(items.length / 2);
}

/** Réordonne `items` pour qu'aucune série ne se touche, en suivant au plus près l'ordre d'entrée. */
export function spreadBySeries<T>(items: readonly T[], seriesOf: (item: T) => string): T[] {
  const n = items.length;
  // À deux, chaque élément est le voisin de l'autre des deux côtés : il n'y a
  // rien à réordonner, quelles que soient les séries.
  if (n < 3) return [...items];
  if (!canSpread(items, seriesOf)) return spreadBestEffort(items, seriesOf);

  const series = items.map(seriesOf);
  const remaining = new Map<string, number>();
  for (const s of series) remaining.set(s, (remaining.get(s) ?? 0) + 1);

  const used = new Array<boolean>(n).fill(false);
  const result: T[] = [];
  let steps = 0;

  const place = (previous: string | undefined, first: string | undefined): boolean => {
    if (result.length === n) return true;
    const slotsAfter = n - result.length - 1;
    // Deux éléments d'une même série sont interchangeables pour la faisabilité :
    // seul le premier restant de chaque série mérite d'être essayé.
    const tried = new Set<string>();
    for (let i = 0; i < n; i++) {
      const s = series[i];
      if (used[i] || s === previous || tried.has(s)) continue;
      tried.add(s);
      const head = first ?? s;
      // La dernière place touche la première : la boucle du carrousel.
      if (slotsAfter === 0 && s === head && result.length > 0) continue;
      if (++steps > MAX_STEPS) return false;

      used[i] = true;
      remaining.set(s, remaining.get(s)! - 1);
      result.push(items[i]);
      if (fits(remaining, slotsAfter, s, head) && place(s, head)) return true;
      result.pop();
      remaining.set(s, remaining.get(s)! + 1);
      used[i] = false;
    }
    return false;
  };

  return place(undefined, undefined) ? result : spreadBestEffort(items, seriesOf);
}

/**
 * Chaque série restante tient-elle dans les `slots` places qui suivent ? La
 * première de ces places touche `previous`, la dernière touche `first` : une
 * série ne peut pas occuper une place voisine d'elle-même.
 */
function fits(remaining: Map<string, number>, slots: number, previous: string, first: string): boolean {
  for (const [s, count] of remaining) {
    if (count > capacity(slots, s === previous, s === first)) return false;
  }
  return true;
}

/**
 * Nombre maximal d'éléments d'une même série sur une ligne de `slots` places
 * sans qu'ils se touchent, quand la première et/ou la dernière place leur est
 * interdite : une place sur deux parmi celles qui restent, arrondi au-dessus.
 */
function capacity(slots: number, blockedStart: boolean, blockedEnd: boolean): number {
  const usable = slots - (blockedStart ? 1 : 0) - (blockedEnd ? 1 : 0);
  return usable <= 0 ? 0 : Math.ceil(usable / 2);
}

function largestSeries<T>(items: readonly T[], seriesOf: (item: T) => string): number {
  const counts = new Map<string, number>();
  let largest = 0;
  for (const item of items) {
    const s = seriesOf(item);
    const c = (counts.get(s) ?? 0) + 1;
    counts.set(s, c);
    largest = Math.max(largest, c);
  }
  return largest;
}

/**
 * Placement au mieux, quand aucune répartition parfaite n'existe : on évite le
 * voisin immédiat tant que c'est possible, dans l'ordre d'entrée, sans jamais
 * perdre ni dupliquer un élément.
 */
function spreadBestEffort<T>(items: readonly T[], seriesOf: (item: T) => string): T[] {
  const rest = [...items];
  const result: T[] = [];
  while (rest.length > 0) {
    const previous = result.length > 0 ? seriesOf(result[result.length - 1]) : undefined;
    const first = result.length > 0 ? seriesOf(result[0]) : undefined;
    const isLast = rest.length === 1;
    let pick = rest.findIndex((item) => {
      const s = seriesOf(item);
      return s !== previous && !(isLast && s === first);
    });
    if (pick < 0) pick = rest.findIndex((item) => seriesOf(item) !== previous);
    if (pick < 0) pick = 0;
    result.push(rest.splice(pick, 1)[0]);
  }
  return result;
}
