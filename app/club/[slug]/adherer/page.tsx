import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { StickyJoinCta } from "@/components/club/StickyJoinCta";
import { CLUB } from "@/lib/config";
import styles from "./page.module.css";

/** Cible observée par la barre fixe mobile, qui s'efface quand ce bouton entre dans le champ. */
const REAL_CTA_ID = "adherer-cta";

/**
 * Adhésion obligatoire après la séance découverte (2026-08-27) : le site
 * affirmait jusqu'ici que toutes les sorties étaient gratuites sans exception,
 * ce qui est devenu faux.
 *
 * Cette page existe pour être lue AVANT HelloAsso, pas après : le bouton
 * « Adhérer » de la navigation pointe ici et non plus directement vers la
 * plateforme. Sans cette étape, on arrivait sur un écran de paiement où une
 * contribution à HelloAsso est pré-cochée, sans avoir jamais lu ni le montant
 * réel, ni la raison de l'adhésion.
 *
 * Aucune mention de déduction ni de reçu fiscal : le rescrit mécénat n'est pas
 * obtenu (même règle que le don sur /le-club).
 */
export default async function ClubMembershipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Adhérer</p>
        <h1 className={styles.title}>Une séance pour voir, puis 1 € pour l&rsquo;année</h1>
        <p className={styles.lead}>
          La première fois, tu viens en découverte : rien à payer, rien à signer. Si tu reviens, l&rsquo;adhésion devient obligatoire —
          1 € pour toute l&rsquo;année.
        </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pourquoi un euro</h2>
        <div className={styles.prose}>
          <p>
            Ce n&rsquo;est pas un prix, c&rsquo;est une formalité. Ce qu&rsquo;on te demande, ce n&rsquo;est pas de payer la séance :
            les sorties restent gratuites une fois adhérent, et l&rsquo;adhésion n&rsquo;est pas un droit d&rsquo;entrée qu&rsquo;on
            repaie à chaque fois.
          </p>
          <p>
            Ce que l&rsquo;adhésion ouvre, c&rsquo;est le statut de membre, et l&rsquo;assurance du club qui va avec. C&rsquo;est cette
            couverture qui la rend obligatoire, pas un besoin de financement. Un euro suffit à l&rsquo;établir.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ce que ça change</h2>
        <ul className={styles.list}>
          <li>Tu es couvert par l&rsquo;assurance du club sur les sorties.</li>
          <li>Tu es membre pour l&rsquo;année, pas pour une séance.</li>
          <li>Les sorties restent gratuites, autant que tu veux.</li>
        </ul>
      </section>

      {/*
       * Contribution HelloAsso : vérifiée à la source, elle est proposée
       * pré-remplie au moment de payer et s'ajoute au montant versé à
       * l'association. Quelqu'un qui lit « 1 € » ici puis voit un total plus
       * élevé là-bas se croirait trompé — d'où cette explication, factuelle et
       * sans dénigrer la plateforme.
       */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Au moment de payer</h2>
        <div className={styles.prose}>
          <p>
            Le paiement se fait sur HelloAsso, qui ne prend aucune commission aux associations et se finance par les contributions de
            ceux qui l&rsquo;utilisent. Au moment de valider, la plateforme propose donc d&rsquo;ajouter une contribution pour son
            propre fonctionnement, avec un montant déjà pré-rempli. Il s&rsquo;ajoute à ton euro.
          </p>
          <p className={styles.callout}>
            Cette contribution est libre. Pour l&rsquo;annuler, clique sur <strong>« Modifier »</strong> au moment du paiement et ramène
            le curseur à zéro : tu ne paies alors que l&rsquo;adhésion. Le club reçoit 1 € dans les deux cas.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Donner plus, si tu veux</h2>
        <div className={styles.prose}>
          <p>
            L&rsquo;euro suffit. Si tu veux soutenir le club au-delà, tu peux ajouter un don libre sur la même page — c&rsquo;est
            entièrement facultatif, et ça ne change rien à ton statut de membre.
          </p>
        </div>
      </section>

      {CLUB.helloAssoUrl ? (
        <div className={styles.cta}>
          <Button id={REAL_CTA_ID} href={CLUB.helloAssoUrl} target="_blank" rel="noopener noreferrer">
            Adhérer sur HelloAsso ↗
          </Button>
          <p className={styles.outboundNote}>↗ Ce lien ouvre HelloAsso.com dans un nouvel onglet, en dehors de ce site.</p>
        </div>
      ) : null}

      {CLUB.helloAssoUrl ? (
        <StickyJoinCta href={CLUB.helloAssoUrl} label="Adhérer sur HelloAsso ↗" watchId={REAL_CTA_ID} />
      ) : null}

      <ClubFooter
        clubSlug={CLUB.slug}
        clubName={CLUB.name}
        legalCity={CLUB.legalCity}
        contactEmail={CLUB.contactEmail}
        stravaUrl={CLUB.stravaUrl}
        instagramUrl={CLUB.instagramUrl}
      />
    </div>
  );
}
