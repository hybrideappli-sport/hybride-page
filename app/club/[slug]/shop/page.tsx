import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { BackToClub } from "@/components/club/BackToClub";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { ShopCountdown } from "@/components/club/ShopCountdown";
import { CLUB, HELLOASSO_SHOP_URL, SHOP_OPENING_TO } from "@/lib/config";
import { deadlinePassed } from "@/lib/countdown";
import { formatOpeningLabel } from "@/lib/format";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

/**
 * Catalogue en lecture seule, contenu statique (pas de table `club.shop_items`
 * au P0 — pas de raison d'en avoir une : aucune commande ne se fait ici).
 * Aucune donnée d'acheteur n'est collectée par ce site : chaque article renvoie
 * vers la boutique HelloAsso de l'association, seule à encaisser. Le Stripe de
 * l'entité commerciale n'a AUCUN rôle ici — l'association ne peut pas encaisser
 * dessus (deux responsables de traitement distincts, ADR-002).
 */
interface ShopProduct {
  name: string;
  sizes: string;
  price: string;
  photoCaption: string;
}

/**
 * Vide depuis le 2026-08-25 : les articles qui figuraient ici étaient des
 * exemples de mise en page (t-shirts fictifs, prix inventés), retirés parce
 * qu'ils se lisaient comme un vrai catalogue. Les vraies pièces ne sont pas
 * prêtes.
 *
 * La grille produits reste branchée juste en dessous plutôt que commentée :
 * remettre des entrées dans ce tableau suffit à la rallumer, et d'ici là le
 * code continue d'être compilé et vérifié par le lint — un bloc mis en
 * commentaire, lui, pourrit sans que rien ne le signale.
 */
const PRODUCTS: ShopProduct[] = [];

export const metadata = clubMetadata({
  title: "Le merch du club — Hybride Club Toulon",
  // Mise à jour le 2026-09-10 avec l'arrivée d'une date ferme : la description
  // précédente (« les premières pièces sont en préparation ») serait devenue
  // fausse dans les résultats de recherche le soir de l'ouverture.
  description: "La boutique du club ouvre le 15 septembre 2026 à 18h. Commande et paiement sur la boutique HelloAsso de l'association.",
  path: "/club/toulon/shop",
});

export default async function ClubShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const hasProducts = PRODUCTS.length > 0;

  /*
   * Horloge SERVEUR : valeur de départ du décompte, rien de plus. Elle évite au
   * visiteur de voir un décompte s'afficher une fraction de seconde alors que
   * l'échéance est passée. Elle peut être périmée (page en cache), et c'est
   * précisément pour cela que ShopCountdown la recalcule au montage.
   */
  const openingHasPassed = deadlinePassed(SHOP_OPENING_TO);

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <BackToClub clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Boutique</p>
        <h1 className={styles.title}>Le merch du club</h1>
        {/* Plus de chapô d'attente quand le décompte est là : « Les premières
            pièces sont en préparation. Rien n'est encore en vente. » et « La
            boutique ouvre le 15 septembre à 18h » se contrediraient à trois
            lignes d'intervalle. Le panneau porte seul le message (2026-09-10). */}
        {hasProducts ? (
          <p className={styles.lead}>
            Prix indicatifs, tailles et références sujettes à disponibilité. La commande et le paiement se font entièrement sur la
            boutique HelloAsso de l’association — rien n’est collecté ni encaissé sur ce site.
          </p>
        ) : null}
      </div>

      {hasProducts ? (
        <>
          <div className={styles.grid}>
            {PRODUCTS.map((product) => (
              <Card key={product.name} className={styles.product}>
                <PhotoSlot ratio="1/1" radius="none" caption={product.photoCaption} />
                <div className={styles.body}>
                  <h2 className={styles.productName}>{product.name}</h2>
                  <p className={styles.meta}>
                    {product.sizes} · {product.price}
                  </p>
                  <Button href={HELLOASSO_SHOP_URL} variant="line" size="mini" target="_blank" rel="noopener noreferrer">
                    Voir sur la boutique HelloAsso ↗
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <p className={styles.outboundNote}>↗ Les liens « boutique » ouvrent HelloAsso.com dans un nouvel onglet, en dehors de ce site.</p>
        </>
      ) : (
        /*
         * Vrai compte à rebours depuis le 2026-09-10. Il remplace la
         * composition graphique qui tenait cette place — trois blocs de
         * chiffres floutés et `aria-hidden`, posés faute de date ferme, avec
         * une note qui prévoyait exactement ce remplacement.
         *
         * `initiallyOpen` est le verdict de l'horloge SERVEUR, et seulement une
         * valeur de départ : le composant recalcule au montage sur l'horloge du
         * visiteur. C'est ce qui rattrape une page servie depuis le cache — le
         * décompte lui-même n'est jamais calculé ici, sinon il serait figé à
         * l'heure de génération de la page.
         *
         * La section « Où sera annoncée la sortie » (WhatsApp + Instagram) qui
         * suivait a été retirée le 2026-08-27 : le teasing dit déjà qu'il se
         * passe quelque chose, énumérer les canaux d'annonce diluait le
         * message. Instagram reste atteignable depuis le pied de page.
         */
        <ShopCountdown
          targetIso={SHOP_OPENING_TO}
          openingLabel={formatOpeningLabel(SHOP_OPENING_TO)}
          reminderHref={`/club/${CLUB.slug}/shop/ouverture.ics`}
          initiallyOpen={openingHasPassed}
        />
      )}

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
