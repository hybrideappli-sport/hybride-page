"use client";

import { CalendarReminderLink } from "@/components/club/CalendarReminderLink";
import { unitsRemaining } from "@/lib/countdown";
import { useCountdown } from "@/lib/use-countdown";
import styles from "./ShopCountdown.module.css";

interface ShopCountdownProps {
  /**
   * Instant d'ouverture, ISO 8601 avec décalage explicite (voir
   * SHOP_OPENING_TO). Sert au décompte ET, tel quel, à l'attribut `datetime`
   * du <time> — c'est déjà un datetime valide, il n'y a pas de seconde
   * écriture de la date à maintenir.
   */
  targetIso: string;
  /**
   * La même date en toutes lettres (« 15 septembre à 18h »), calculée par le
   * serveur avec `formatOpeningLabel`. Passée en prop plutôt que formatée ici :
   * une seule évaluation, donc aucune chance que le SSR et le client tombent
   * sur deux libellés différents.
   */
  openingLabel: string;
  /**
   * Lien vers le fichier .ics d'ouverture. Passé en prop plutôt que construit
   * ici : ce composant est client, et le slug du club n'a pas à y remonter.
   */
  reminderHref: string;
  /**
   * Verdict de l'horloge SERVEUR, valeur de DÉPART uniquement — évite un
   * clignotement du décompte si l'échéance est déjà passée. Le montage
   * recalcule et corrige si la page sortait d'un cache.
   */
  initiallyOpen: boolean;
}

/**
 * Compte à rebours jusqu'à l'ouverture de la boutique, puis bascule.
 *
 * Remplace la composition graphique qui tenait cette place depuis le
 * 2026-08-25 : trois blocs de chiffres floutés, `aria-hidden`, posés là faute
 * de date ferme. La note qui les accompagnait prévoyait ce remplacement — la
 * date existe désormais (SHOP_OPENING_TO).
 *
 * L'écrin du panneau factice — cadre, halo violet, blocs bordés autour des
 * chiffres — a été retiré le 2026-09-10 : il avait été hérité tel quel, et il
 * faisait générique. Il se justifiait tant que le bloc devait AVOIR L'AIR d'un
 * décompte avec trois glyphes flous ; de vrais chiffres n'ont pas besoin de cet
 * emballage.
 *
 * Le traitement suit désormais celui des autres données du site — heures de la
 * grille du planning, jour d'un rituel, faits d'une fiche sortie : Geist Mono,
 * posé à nu sur le noir, sans cadre ni fond. Seule l'échelle change, parce que
 * le site aime les très grands caractères sur du vide (ses h1 montent à 104px).
 *
 * LE VIOLET NE RESTE QUE SUR LA DATE. C'est la seule donnée qui porte une
 * décision — les chiffres, eux, changent tout seuls et n'ont pas besoin qu'on
 * les désigne. Ne pas le remettre sur le compteur.
 *
 * ACCESSIBILITÉ — deux traitements opposés, délibérément :
 *
 * - LE DÉCOMPTE N'EST PAS ANNONCÉ. `role="timer"` porte un `aria-live="off"`
 *   implicite ; sans lui, un lecteur d'écran égrènerait chaque seconde et la
 *   page deviendrait inutilisable. Les chiffres restent lisibles à la demande,
 *   et le sens ne repose pas sur eux : la phrase « La boutique ouvre le 15
 *   septembre à 18h » le porte en toutes lettres, dans un <time> daté.
 *
 * - LA BASCULE, ELLE, EST ANNONCÉE. C'est un évènement unique et non une
 *   boucle : `aria-live="polite"` est justifié là, et seulement là.
 */
export function ShopCountdown({ targetIso, openingLabel, reminderHref, initiallyOpen }: ShopCountdownProps) {
  const { remaining, open, reducedMotion } = useCountdown(targetIso, initiallyOpen);

  if (open) {
    return (
      <section className={styles.panel}>
        {/* Bascule explicite : le décompte disparaît, il ne se fige pas sur
            00:00:00. Pas de lien ni de catalogue ici — ni les produits ni
            l'URL HelloAsso n'existaient au moment d'écrire ceci (2026-09-10),
            et annoncer une boutique qui n'ouvre sur rien coûterait plus de
            confiance que le décompte n'en aura gagné. */}
        <p className={styles.openTitle} aria-live="polite">
          La boutique est ouverte.
        </p>
        <p className={styles.lead}>Le premier drop du club.</p>
      </section>
    );
  }

  // `null` tant que le montage n'a pas eu lieu : le serveur et le premier rendu
  // client affichent les mêmes tirets, donc aucun désaccord d'hydratation.
  const units = remaining === null ? null : unitsRemaining(remaining, { withSeconds: !reducedMotion });

  return (
    <section className={styles.panel}>
      <p className={styles.openTitle}>
        La boutique ouvre le <time dateTime={targetIso}>{openingLabel}</time>.
      </p>

      <div className={styles.units} role="timer">
        {(units ?? [
          { value: "--", label: "heures", short: "H" },
          { value: "--", label: "minutes", short: "MIN" },
        ]).map((unit) => (
          <span key={unit.label} className={styles.unit}>
            <span className={styles.value}>{unit.value}</span>
            {/* L'œil lit « MIN », le lecteur d'écran entend « minutes » : une
                abréviation épelée lettre à lettre ne veut rien dire à l'oreille.
                D'où le mot entier, retiré de l'affichage mais laissé dans le
                DOM — jamais `display: none`, qui l'ôterait aussi de la lecture. */}
            <span className={styles.short} aria-hidden="true">
              {unit.short}
            </span>
            <span className={styles.srOnly}>{unit.label}</span>
          </span>
        ))}
      </div>

      <p className={styles.lead}>Le premier drop du club.</p>

      {/* DANS CETTE BRANCHE SEULEMENT, donc effacé à la bascule en même temps
          que le décompte : passé l'ouverture, proposer de poser un rappel pour
          un évènement déjà survenu n'aurait aucun sens. C'est le `if (open)`
          plus haut qui s'en charge — il n'y a pas de condition à maintenir ici,
          et c'est voulu : une condition séparée finirait par diverger. */}
      <p className={styles.reminderLine}>
        <CalendarReminderLink href={reminderHref}>Me rappeler cinq minutes avant</CalendarReminderLink>
      </p>
    </section>
  );
}
