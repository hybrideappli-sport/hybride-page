import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { BackToClub } from "@/components/club/BackToClub";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CLUB, HELLOASSO_SHOP_URL } from "@/lib/config";
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

export default async function ClubShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const hasProducts = PRODUCTS.length > 0;

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <BackToClub clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Boutique</p>
        <h1 className={styles.title}>Le merch du club</h1>
        <p className={styles.lead}>
          {hasProducts
            ? "Prix indicatifs, tailles et références sujettes à disponibilité. La commande et le paiement se font entièrement sur la boutique HelloAsso de l’association — rien n’est collecté ni encaissé sur ce site."
            : "Les premières pièces sont en préparation. Rien n’est encore en vente."}
        </p>
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
         * Composition graphique, PAS un vrai décompte : aucune date ferme côté
         * club, et un décompte qui expire sans livraison abîme la confiance plus
         * qu'il ne fait patienter. Les chiffres sont des glyphes de remplissage
         * floutés — le bloc entier est aria-hidden pour qu'un lecteur d'écran
         * n'annonce pas un décompte inexistant, et c'est le texte à côté qui
         * porte le sens. Le jour où une date existe, ce bloc se remplace par un
         * vrai décompte sans toucher au reste de la page.
         *
         * La section « Où sera annoncée la sortie » (WhatsApp + Instagram) qui
         * suivait a été retirée le 2026-08-27 : le teasing dit déjà qu'il se
         * passe quelque chose, énumérer les canaux d'annonce diluait le message.
         * Instagram reste atteignable depuis le pied de page, présent ici comme
         * sur toutes les pages du club.
         */
        <section className={styles.teaser}>
          <div className={styles.teaserGlow} aria-hidden="true" />

          <div className={styles.countdown} aria-hidden="true">
            {/* Chiffres arbitraires et volontairement différents : trois "00"
                identiques donnaient trois taches jumelles, sans silhouette de
                décompte. Aucune signification — ils ne sont ni lus ni lisibles. */}
            {["07", "18", "42"].map((digits, i) => (
              <span key={i} className={styles.countBlock}>
                <span className={styles.countDigits}>{digits}</span>
              </span>
            ))}
          </div>

          <p className={styles.teaserLabel}>Bientôt dévoilé</p>
        </section>
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
