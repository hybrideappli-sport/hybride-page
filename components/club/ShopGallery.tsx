import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { ShopCarousel } from "@/components/club/ShopCarousel";
import { galleryPhotos, heroPhoto } from "@/lib/club/shop-gallery";
import { canSpread } from "@/lib/club/spread-series";
import styles from "./ShopGallery.module.css";

/**
 * Présentation du merch : une photo d'ouverture, puis un carrousel horizontal.
 * Pas un catalogue — aucun prix, aucune référence, aucun panier. La commande se
 * fait entièrement sur HelloAsso, seule l'association encaisse (ADR-002).
 *
 * Composant SERVEUR, et rendu SANS CONDITION par la page : c'est ce qui garantit
 * que le contenu soit là à 18h00 même sur une page fabriquée avant. Voir le
 * commentaire de app/club/[slug]/shop/page.tsx — ne pas l'envelopper dans un
 * test d'horloge côté serveur, le cache figerait le résultat.
 *
 * Le carrousel, lui, est un composant client (ShopCarousel) : ordre tiré au
 * montage, défilement automatique, boucle. Le reste — photo d'ouverture et
 * barre d'action — n'a besoin d'aucun JavaScript et reste rendu par le serveur.
 */
export function ShopGallery({ helloAssoUrl }: { helloAssoUrl: string }) {
  const hero = heroPhoto();
  const photos = galleryPhotos();

  // Une série plus grosse que la moitié du carrousel ne peut pas être répartie :
  // deux de ses photos se toucheront. Signalé à qui ajoute des photos, en
  // développement seulement — en ligne, le carrousel s'affiche au mieux.
  if (process.env.NODE_ENV !== "production" && !canSpread(photos, (p) => p.series)) {
    console.warn(
      "[shop] Une série dépasse la moitié du carrousel : deux de ses photos seront voisines. Voir ShopSeries dans lib/club/shop-gallery.ts.",
    );
  }

  return (
    <section className={styles.wrap}>
      {/* Énoncé comme un fait, au même titre que l'avantage partenaire de
          lib/club/partners.ts : c'est ce à quoi un adhérent a droit, pas une
          raison d'adhérer — l'argument de l'adhésion reste l'assurance. */}
      {/* Le trait d'union de « tee-shirts » est INSÉCABLE (U+2011) : avec un
          trait ordinaire, le navigateur a le droit de couper le mot à cet
          endroit, et c'est précisément là que la ligne tombait à 375px. */}
      <p className={styles.price}>
        <span className={styles.priceAmount}>30 €</span>
        les deux tee‑shirts, pour les adhérents.*
      </p>
      <p className={styles.priceNote}>* Offre valable sur le tee‑shirt coton + polyester uniquement.</p>

      <div className={styles.hero}>
        <Image
          src={hero.src}
          alt={hero.alt}
          width={1200}
          height={2133}
          sizes="(max-width: 860px) 100vw, 720px"
          priority
          className={styles.heroImage}
        />
      </div>

      {photos.length > 0 ? <ShopCarousel photos={photos} /> : null}

      {/* Barre d'action reprise de /adherer : filet de séparation, bouton plein,
          note de lien sortant. Même geste, même place en bas de page. */}
      <div className={styles.cta}>
        <Button href={helloAssoUrl} target="_blank" rel="noopener noreferrer">
          Voir la boutique sur HelloAsso ↗
        </Button>
        <p className={styles.outboundNote}>↗ Ce lien ouvre HelloAsso.com dans un nouvel onglet, en dehors de ce site.</p>
      </div>
    </section>
  );
}
