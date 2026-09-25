"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Share, SquarePlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import styles from "./PwaInstallBanner.module.css";

/**
 * Invitation à poser le site sur l'écran d'accueil (2026-09-25).
 *
 * DEUX PLATEFORMES, DEUX DISPOSITIFS DIFFÉRENTS — c'est la contrainte
 * structurante de ce composant :
 *
 * - Android / Chromium émet `beforeinstallprompt` quand il juge le site
 *   installable (manifeste valide, icônes, https). On intercepte l'événement,
 *   on le garde, et le bouton « Installer » le rejoue : c'est une VRAIE
 *   installation en un geste.
 * - iOS / Safari n'a AUCUNE API d'installation, et n'en aura pas : Apple
 *   réserve le geste au menu Partager. La bannière ne peut donc qu'expliquer
 *   où appuyer — d'où les deux pictogrammes du système repris dans le texte.
 *   Aucun bouton : un bouton qui ne fait rien est pire que pas de bouton.
 *
 * TOUT LE RESTE NE VOIT RIEN. Pas de troisième cas « explique le geste au
 * hasard » : sur Firefox Android, sur Chrome iOS ou sur un navigateur inconnu,
 * le chemin d'installation diffère ou n'existe pas, et décrire le mauvais geste
 * coûte plus cher que se taire. Concrètement : si `beforeinstallprompt` n'arrive
 * pas et qu'on n'est pas dans Safari iOS, il n'y a pas de bannière.
 *
 * QUATRE CONDITIONS DE SILENCE, toutes vérifiées avant le premier rendu visible :
 *
 * 1. Déjà installé — `display-mode: standalone`, plus `navigator.standalone`
 *    pour les iOS antérieurs à 15.4 qui ne connaissent pas le media query.
 * 2. Refus mémorisé — localStorage. Une bannière refermée ne revient jamais,
 *    y compris après un refus du dialogue natif d'Android : insister après un
 *    « non » explicite est le seul usage qui rende ce genre de bandeau détesté.
 * 3. Pas sur desktop — `(max-width: 860px) and (pointer: coarse)`, évalué en JS
 *    et pas seulement en CSS : une fenêtre Chrome étroite sur un portable reçoit
 *    elle aussi `beforeinstallprompt`, et un site à installer au doigt n'a pas de
 *    sens à la souris. Le seuil de 860px est celui du reste du site.
 * 4. Pages d'action — voir PATHS_WITH_STICKY_BAR ci-dessous.
 *
 * ELLE NE POUSSE PAS LA PAGE ET NE MASQUE RIEN DURABLEMENT : `position: fixed`
 * (donc zéro reflow, zéro décalage de mise en page à l'hydratation — réserver de
 * la place en bas de chaque page pénaliserait aussi les visiteurs qui ne la
 * verront jamais), et elle s'escamote dès que le pied de page entre dans le
 * champ, exactement comme StickyJoinCta s'efface devant le vrai bouton. Sans
 * cela elle recouvrirait les liens de mentions légales, qui sont précisément
 * la dernière chose de chaque page.
 */

/**
 * Pages qui portent DÉJÀ une barre fixe en bas d'écran (StickyJoinCta sur
 * l'adhésion, StickyRegisterCta sur une sortie). Deux barres empilées au-dessus
 * de la barre d'outils de Safari ne laisseraient plus de page à lire — et ces
 * deux pages-là sont justement celles où l'on est en train de faire quelque
 * chose. Un raccourci vers l'écran d'accueil peut attendre la fin.
 */
const PATHS_WITH_STICKY_BAR = [/^\/club\/[^/]+\/adherer$/, /^\/club\/[^/]+\/sorties\//];

/** Clé du refus. Changer cette chaîne re-proposerait la bannière à tout le monde. */
const DISMISSED_KEY = "hybride:pwa-invite-refusee";

/** Cf. `beforeinstallprompt` — hors standard, donc absent des typages du DOM. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Où le script du layout dépose l'événement s'il est arrivé avant l'hydratation
 * (voir app/club/[slug]/layout.tsx, qui explique pourquoi). Les deux fichiers
 * doivent rester d'accord sur ce nom.
 */
declare global {
  interface Window {
    __hybrideInstallPrompt?: InstallPromptEvent;
  }
}

function isDismissed() {
  // Safari en navigation privée peut lever à la lecture : une bannière de trop
  // vaut mieux qu'une page blanche.
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function isInstalled() {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Safari sur iOS/iPadOS, à l'exclusion des autres navigateurs iOS (qui affichent
 * le même moteur mais un menu différent). L'iPad se présente comme un Mac depuis
 * iPadOS 13, d'où le second test : un Mac n'a pas d'écran tactile multipoint.
 */
function isIosSafari() {
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
}

export function PwaInstallBanner() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [scrolledEnough, setScrolledEnough] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const [closed, setClosed] = useState(false);

  const onSuppressedPage = PATHS_WITH_STICKY_BAR.some((pattern) => pattern.test(pathname));

  /*
   * Éligibilité — un seul effet, exécuté après le montage. Rien de tout ceci ne
   * peut être décidé au rendu serveur : le HTML des pages du club est mis en
   * cache et servi tel quel à tout le monde.
   */
  useEffect(() => {
    if (onSuppressedPage) return;
    if (isInstalled() || isDismissed()) return;
    if (!window.matchMedia("(max-width: 860px) and (pointer: coarse)").matches) return;

    // setState depuis un écouteur d'événement du navigateur = notification d'un
    // système externe, pas un rendu en cascade (react-hooks/set-state-in-effect).
    const onBeforeInstallPrompt = (event: Event) => {
      // Sans ce preventDefault, Chrome pose sa propre mini-infobar et notre
      // bannière ferait doublon avec elle.
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setClosed(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // L'événement a pu être émis avant que React ne monte : le script du layout
    // l'a alors mis de côté. Relevé dans une minuterie, comme le reste, pour ne
    // pas changer d'état pendant le rendu.
    const caught = setTimeout(() => {
      if (window.__hybrideInstallPrompt) setInstallEvent(window.__hybrideInstallPrompt);
    }, 0);

    // Safari ne dira jamais rien de lui-même : on décide pour lui, hors du flux
    // de rendu pour la même raison que ci-dessus.
    const timeout = setTimeout(() => setIosHint(isIosSafari()), 0);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(caught);
      clearTimeout(timeout);
    };
  }, [onSuppressedPage]);

  /*
   * Elle attend le premier défilement au-delà d'un écran. Proposer un raccourci
   * à quelqu'un qui vient d'arriver, c'est demander avant d'avoir montré quoi que
   * ce soit ; passé le premier écran, la personne lit vraiment la page.
   *
   * Cette condition n'est PAS réarmée en changeant de page (l'effet n'a pas
   * `pathname` en dépendance, contrairement à celui du pied de page juste en
   * dessous) : une fois l'invitation méritée, elle l'est pour la visite. La
   * réarmer ferait disparaître puis réapparaître la bannière à chaque lien
   * suivi — un clignotement, pour rien.
   */
  useEffect(() => {
    const check = () => setScrolledEnough(window.scrollY > window.innerHeight * 0.75);
    const timeout = setTimeout(check, 0);
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", check);
    };
  }, []);

  /*
   * Escamotage devant le pied de page — même dispositif que StickyJoinCta, à une
   * différence près qui est tout le sujet de cet effet : StickyJoinCta est monté
   * par sa page et repart donc de zéro à chaque navigation, alors que cette
   * bannière vit dans le layout et SURVIT aux passages d'une page du club à une
   * autre. Le `<footer>` observé, lui, est bien remplacé par React à chaque fois.
   *
   * Sans `pathname` en dépendance, l'observateur restait donc accroché au pied de
   * page de la toute première page visitée — un nœud détaché du document, qui ne
   * croise plus jamais rien : l'escamotage cessait silencieusement dès la
   * deuxième page, et la bannière recouvrait les liens légaux. Constaté à
   * l'écran, pas déduit.
   *
   * Réinitialiser `atFooter` à la main n'est pas nécessaire : `observe()`
   * notifie l'état courant dès le premier passage.
   */
  useEffect(() => {
    const footer = document.getElementById("club-footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting));
    observer.observe(footer);
    return () => observer.disconnect();
  }, [pathname]);

  const close = useCallback(() => {
    setClosed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Stockage refusé (navigation privée) : la bannière disparaît pour cette
      // page, elle reviendra à la suivante. Rien de mieux à faire sans stockage.
    }
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    // Quel que soit le choix, on ne redemande pas : accepté, la bannière n'a
    // plus lieu d'être ; refusé, c'est un « non » qu'on respecte.
    await installEvent.userChoice;
    close();
  }, [installEvent, close]);

  const mode = installEvent ? "android" : iosHint ? "ios" : null;
  /*
   * `onSuppressedPage` est retesté ICI, et pas seulement à l'entrée de l'effet
   * d'éligibilité. La bannière vit dans le layout : en arrivant sur la page
   * d'adhésion par un lien interne, l'effet se contente de ne rien réarmer, mais
   * l'événement d'installation déjà reçu reste en mémoire — et la bannière
   * restait donc affichée par-dessus la barre d'adhésion. Constaté à l'écran.
   */
  if (onSuppressedPage || !mode || closed || !scrolledEnough) return null;

  return (
    <aside className={`${styles.banner} ${atFooter ? styles.retracted : ""}`} aria-label="Installer le site sur l'écran d'accueil">
      <div className={styles.card}>
        {/*
          * L'icône exacte qui apparaîtra sur l'écran d'accueil — c'est l'argument,
          * davantage que la phrase : on montre le résultat, on ne le décrit pas.
          * `alt` vide et `aria-hidden` parce que le titre juste à côté dit déjà
          * tout ; `unoptimized` parce que c'est un PNG de 8 Ko affiché à 44px,
          * déjà servi tel quel au manifeste — le faire transiter par l'optimiseur
          * ajouterait un appel de fonction sans rien gagner (même raisonnement que
          * PartnerList.tsx, pour une raison différente).
          */}
        <Image src="/pwa/icon-192.png" alt="" aria-hidden="true" width={44} height={44} className={styles.icon} unoptimized />

        <div className={styles.body}>
          <p className={styles.title}>Hybride sur ton écran d&rsquo;accueil</p>

          {mode === "android" ? (
            <p className={styles.line}>Le planning à portée de pouce.</p>
          ) : (
            /* Les deux pictogrammes sont ceux d'iOS, dans l'ordre où on les
               rencontre : d'abord Partager dans la barre du bas, puis « Sur
               l'écran d'accueil » dans la liste. Ils sont décoratifs — la phrase
               se lit entièrement sans eux, pour un lecteur d'écran comme pour
               quelqu'un qui n'aurait pas chargé les icônes. */
            <p className={styles.line}>
              Appuie sur <Share size={15} strokeWidth={2} aria-hidden="true" className={styles.inlineIcon} /> puis sur{" "}
              <span className={styles.nowrap}>
                <SquarePlus size={15} strokeWidth={2} aria-hidden="true" className={styles.inlineIcon} /> «&nbsp;Sur l&rsquo;écran d&rsquo;accueil&nbsp;».
              </span>
            </p>
          )}
        </div>

        <button type="button" onClick={close} className={styles.close} aria-label="Ne plus proposer d'installer le site">
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Enfant DIRECT de la grille, et non du bloc de texte : c'est ce qui lui
            permet d'occuper les trois colonnes en seconde rangée. */}
        {mode === "android" ? (
          <Button size="mini" onClick={install} className={styles.install}>
            Installer
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
