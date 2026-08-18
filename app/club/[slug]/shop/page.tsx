import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { HELLOASSO_SHOP_URL } from "@/lib/config";
import { getPublishedClub } from "@/lib/queries/club";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

/**
 * Catalogue en lecture seule, contenu statique (pas de table `club.shop_items`
 * au P0 — pas de raison d'en avoir une : aucune commande ne se fait ici).
 * Aucune donnée d'acheteur n'est collectée par ce site : chaque article renvoie
 * vers la boutique HelloAsso de l'association, seule à encaisser. Le Stripe de
 * l'entité commerciale n'a AUCUN rôle ici — l'association ne peut pas encaisser
 * dessus (deux responsables de traitement distincts, ADR-002).
 */
const PRODUCTS = [
  { name: "T-shirt technique club", sizes: "XS à XL", price: "28 €", photoCaption: "photo — t-shirt technique" },
  { name: "Coupe-vent Hybride Club Toulon", sizes: "S à XXL", price: "55 €", photoCaption: "photo — coupe-vent" },
  { name: "Casquette running", sizes: "Taille unique", price: "18 €", photoCaption: "photo — casquette" },
  { name: "Bidon vélo 750 ml", sizes: "Taille unique", price: "9 €", photoCaption: "photo — bidon" },
];

export default async function ClubShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const club = await getPublishedClub(supabase, slug);
  if (!club) notFound();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={club.slug} helloAssoUrl={club.hello_asso_url} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Boutique</p>
        <h1 className={styles.title}>Le merch du club</h1>
        <p className={styles.lead}>
          Prix indicatifs, tailles et références sujettes à disponibilité. La commande et le paiement se font entièrement sur la boutique
          HelloAsso de l&rsquo;association — rien n&rsquo;est collecté ni encaissé sur ce site.
        </p>
      </div>

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

      <ClubFooter clubSlug={club.slug} clubName={club.name} city={club.city} contactEmail={club.contact_email ?? null} />
    </div>
  );
}
