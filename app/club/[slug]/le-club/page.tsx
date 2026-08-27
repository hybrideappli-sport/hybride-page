import { Bike, Mountain, SportShoe, Sun, Waves } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Tag } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CLUB } from "@/lib/config";
import styles from "./page.module.css";

/**
 * Présentation du club + "Nous rejoindre" (US-XX, 2026-08-21) : sur sa propre
 * page plutôt que sur /club/[slug], qui reste le hub (hero, rituels, photos,
 * CTA) atteint depuis la porte "Le club" de la page marketing. La nav "Le
 * club" pointe ici, pas vers le hub — voir ClubNav.tsx.
 *
 * Icônes d'en-tête purement décoratives (aria-hidden) : une par discipline,
 * lucide-react (déjà en dépendance, pas de nouveau paquet — vérifié que
 * SportShoe/Bike/Sun/Waves/Mountain existent avant de les utiliser). Animées
 * en CSS pur (page.module.css), désactivées par la règle globale
 * prefers-reduced-motion de globals.css — rien à dupliquer ici.
 */
export default async function ClubAboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <div className={styles.heroIcons} aria-hidden="true">
          <SportShoe className={`${styles.icon} ${styles.iconFloat}`} strokeWidth={1.5} />
          <Bike className={`${styles.icon} ${styles.iconRock}`} strokeWidth={1.5} />
          <Sun className={`${styles.icon} ${styles.iconSpin}`} strokeWidth={1.5} />
          <Waves className={`${styles.icon} ${styles.iconSway}`} strokeWidth={1.5} />
          <Mountain className={`${styles.icon} ${styles.iconFloatSlow}`} strokeWidth={1.5} />
        </div>
        <p className={styles.eyebrow}>Le club</p>
        <h1 className={styles.title}>Un club multisport, à Toulon.</h1>
      </div>

      <div className={styles.about}>
        <div className={styles.activities}>
          <Tag variant="course">Course à pied</Tag>
          <Tag variant="course">Trail</Tag>
          <Tag variant="montagne">Rando</Tag>
          <Tag variant="velo">Sorties vélo</Tag>
          <Tag variant="montagne">Bivouac</Tag>
          <Tag variant="collectif">Tournois de volley</Tag>
        </div>
        <p>On ne s&rsquo;enferme pas dans une discipline : on fait ce dont on a envie, quand on en a envie.</p>
        <p>
          Les rituels sont fixes — la piste du lundi, le run du mercredi. Le club programme aussi des sorties à l&rsquo;avance : trails,
          bivouacs, sorties vélo, tournois, à retrouver sur le{" "}
          <Link href={`/club/${CLUB.slug}/planning`}>planning</Link>, qui fait foi pour les dates. Et le reste part des membres :
          quelqu&rsquo;un propose une sortie, deux ou trois disent oui, et c&rsquo;est parti — souvent le jour même. Il se passe quelque
          chose presque tous les jours, autant par le programme que par le groupe.
        </p>
        <p>Ce qu&rsquo;on cherche ici, c&rsquo;est simple : bien s&rsquo;entourer.</p>
        <p>
          La première fois, tu viens en découverte : rien à payer, rien à signer. Ensuite, l&rsquo;adhésion devient obligatoire — 1 €
          pour l&rsquo;année, le temps d&rsquo;être couvert par l&rsquo;assurance du club. Les sorties, elles, restent gratuites.{" "}
          <Link href={`/club/${CLUB.slug}/adherer`}>Comment adhérer</Link>.
        </p>
      </div>

      <section className={styles.join}>
        <h2 className={styles.joinTitle}>Nous rejoindre</h2>

        <div className={styles.joinList}>
          <div className={styles.joinItem}>
            <p className={`${styles.joinLabel} ${styles.whatsappLabel}`}>WhatsApp</p>
            <p className={styles.joinText}>
              Le lien du groupe arrive à l&rsquo;inscription à une sortie sur Luma. C&rsquo;est là que s&rsquo;organisent les afters et
              tout ce qui ne rentre pas dans le programme.
            </p>
          </div>

          {CLUB.stravaUrl ? (
            <div className={styles.joinItem}>
              <p className={styles.joinLabel}>Strava</p>
              <p className={styles.joinText}>
                <a href={CLUB.stravaUrl} target="_blank" rel="noopener noreferrer" className={`${styles.outLink} ${styles.strava}`}>
                  Le club sur Strava ↗
                </a>
              </p>
            </div>
          ) : null}

          {CLUB.instagramUrl ? (
            <div className={styles.joinItem}>
              <p className={styles.joinLabel}>Instagram</p>
              <p className={styles.joinText}>
                <a
                  href={CLUB.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.outLink} ${styles.instagram}`}
                >
                  Le club sur Instagram ↗
                </a>
              </p>
            </div>
          ) : null}

          {CLUB.helloAssoUrl ? (
            <div className={styles.joinItem}>
              <p className={styles.joinLabel}>Soutenir le club</p>
              <p className={styles.joinText}>
                <a
                  href={CLUB.helloAssoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.outLink} ${styles.helloasso}`}
                >
                  Faire un don sur HelloAsso ↗
                </a>
              </p>
            </div>
          ) : null}

          <div className={styles.joinItem}>
            <p className={styles.joinLabel}>Merch</p>
            <p className={styles.joinText}>
              Les premières pièces sont en préparation, rien n&rsquo;est encore en vente.{" "}
              <Link href={`/club/${CLUB.slug}/shop`} className={styles.merchLink}>
                Voir la boutique
              </Link>
              .
            </p>
          </div>
        </div>

        <p className={styles.outboundNote}>↗ Les liens Strava, Instagram et HelloAsso ouvrent un autre site, dans un nouvel onglet.</p>
      </section>

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
