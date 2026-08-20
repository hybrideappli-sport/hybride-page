import Link from "next/link";

import { Door } from "@/components/marketing/Door";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Tag } from "@/components/ui/Tag";
import { CLUB } from "@/lib/config";
import styles from "./page.module.css";

/**
 * US-01 — carrefour à deux portes à égalité stricte (docs/design/direction-
 * visuelle-accueil.html, à lire pour le VISUEL uniquement — jamais pour le
 * contenu : horaires, lieux et noms de séances y sont du remplissage inventé,
 * pas des données réelles). Refonte du 2026-08-17, remplace l'ancienne page
 * texte seul. Porte "app" non cliquable : le téléchargement n'est pas encore
 * disponible (cohérent avec l'ancien bouton désactivé, décision produit — pas
 * une donnée de la référence visuelle, qui montre un lien actif).
 */
export default function MarketingHomePage() {
  return (
    <div className={styles.wrap}>
      <MarketingNav />

      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          <span>Fais</span>
          <span className={styles.heroAccent}>plusieurs sports.</span>
        </h1>
        <p className={styles.lead}>
          Un club multisport dans le Var, et une application d&rsquo;entraînement pour ceux qui ne s&rsquo;en tiennent pas à une seule
          discipline.
        </p>
      </div>

      <p className={styles.doorsIntro}>
        Hybride, c&rsquo;est deux choses distinctes : un club de sport à Toulon, et une application d&rsquo;entraînement. Choisis ton univers
        ci-dessous.
      </p>

      <div className={styles.doors}>
        <Door
          href="/club/toulon"
          kicker="Le club · Toulon"
          title={
            <>
              Le club
              <br />
              de sport
            </>
          }
          description="Des sorties chaque semaine à Toulon et ses alentours. Toutes les allures, places limitées."
          goLabel="Voir le club →"
          photoCaption="photo plein cadre — groupe au départ · portrait 4:5"
          photoSrc="/photos/porte-club.jpg"
          photoAlt="Groupe de coureurs du club Hybride Toulon portant le drapeau du club le long du bord de mer"
        />
        <Door
          kicker="L'application"
          title={
            <>
              L&rsquo;application
              <br />
              d&rsquo;entraînement
            </>
          }
          description="Un plan d'entraînement qui s'adapte à toi et à ton emploi du temps réel, toutes disciplines confondues."
          goLabel="Bientôt disponible"
          photoCaption="logo — centré, fond sombre, pas plein cadre"
          logoSrc="/photos/logo-hybride.png"
          logoAlt="Logo Hybride"
        />
      </div>

      <section className={styles.disciplines}>
        <p className={styles.eyebrow}>Les disciplines du club</p>
        <p className={styles.disciplinesLead}>
          Cinq familles, et une sortie peut en combiner plusieurs — un swim and run compte à la fois pour l&rsquo;eau et la course à pied.
          C&rsquo;est tout le sens du mot hybride.
        </p>
        <div className={styles.tags}>
          <Tag variant="course">Course à pied</Tag>
          <Tag variant="format">running</Tag>
          <Tag variant="format">piste</Tag>
          <Tag variant="format">trail</Tag>
          <Tag variant="velo">Vélo</Tag>
          <Tag variant="eau">Eau</Tag>
          <Tag variant="format">natation</Tag>
          <Tag variant="format">longe-côte</Tag>
          <Tag variant="montagne">Montagne</Tag>
          <Tag variant="format">randonnée</Tag>
          <Tag variant="format">trek</Tag>
          <Tag variant="format">bivouac</Tag>
          <Tag variant="collectif">Collectif</Tag>
          <Tag variant="format">volley</Tag>
        </div>
      </section>

      <div className={styles.soon}>
        <strong>Toulon pour commencer.</strong>
        <span>
          D&rsquo;autres points ouvriront ailleurs en France. Envie d&rsquo;en monter un chez toi ?{" "}
          <a href="mailto:contact@hybride-club.fr">Écris-nous</a>.
        </span>
      </div>

      <footer className={styles.footer}>
        <div className={styles.entities}>
          <div>
            <strong>{CLUB.name}</strong>
            Association loi 1901, {CLUB.legalCity}.
            <br />
            <Link href="/club/toulon/mentions-legales">Mentions légales</Link> ·{" "}
            <Link href="/club/toulon/politique-de-confidentialite">Confidentialité</Link> · Déclaration au JOAFE ·{" "}
            <a href="mailto:contact@hybride-club.fr">contact@hybride-club.fr</a>
          </div>
          <div>
            <strong>Hybride — l&rsquo;application</strong>
            Service d&rsquo;entraînement par abonnement.
            <br />
            <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/politique-de-confidentialite">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
