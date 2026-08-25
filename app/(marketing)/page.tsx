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
          <span>Deux façons</span>
          <span className={styles.heroAccent}>de s&rsquo;entraîner.</span>
        </h1>
      </div>

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
          description="Des sorties chaque semaine à Toulon et ses alentours. Toutes les allures, tout le monde."
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
          description="Un coach IA qui construit ton plan d’entraînement et de nutrition, tous sports confondus, et l’ajuste à ce que tu vis vraiment."
          goLabel="Bientôt disponible"
          photoCaption="visuel plein cadre — écrans de l'app · portrait 4:5"
          photoSrc="/photos/porte-app.png"
          photoAlt="Plusieurs écrans de l'application Hybride disposés en diagonale sur fond violet"
        />
      </div>

      <section className={styles.disciplines}>
        <p className={styles.eyebrow}>Les disciplines du club</p>
        <p className={styles.disciplinesLead}>Chacun arrive avec son sport et repart avec trois autres.</p>
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
        <strong>Un club Hybride ailleurs qu&rsquo;à Toulon ?</strong>
        <span>
          Si tu veux en monter un, <a href="mailto:contact@hybride-club.fr">écris-nous</a>.
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
