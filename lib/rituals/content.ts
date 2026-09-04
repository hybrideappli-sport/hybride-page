import "server-only";

import { readFileSync, readdirSync } from "fs";
import path from "path";

import { type Activity } from "@/components/ui/Tag";

/**
 * Contenu des pages rituels, éditable sans toucher au code (US mobile,
 * 2026-08-21) : un fichier Markdown par rituel, une seule fois par mois
 * environ — pas assez de volume pour justifier un CMS externe (Notion
 * envisagé puis écarté : quatrième sous-traitant, URLs d'images qui
 * expirent, pour deux pages). Éditable depuis l'éditeur web de GitHub
 * (glisser-déposer, pas de terminal) — voir content/rituels/README.md,
 * écrit pour la personne qui édite, pas pour un développeur.
 *
 * Format volontairement restreint (pas de gras/liens/listes) : un
 * analyseur maison plutôt qu'une dépendance Markdown, même logique que
 * lib/agenda/source.ts (CSV fait main) — le vocabulaire de contenu réel
 * (titre, paragraphes, photos) ne justifie pas d'importer un moteur
 * Markdown complet pour le couvrir.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "rituels");

export interface RitualFrontmatter {
  slug: string;
  title: string;
  activity: Activity;
  day: string;
  time: string;
  level: string;
  /** Ex. "15 personnes maximum" — absent pour les rituels sans plafond fixe. */
  capacity: string | null;
  meetingPoint: string;
  mapsUrl: string | null;
  coach: string | null;
  /** Nom de fichier sous public/photos/ (pas de sous-dossier — même convention à plat que le
      reste du site, préfixée par rituel : piste-hero.jpg, run-chill-hero.jpg…). Vignette de
      liste ET photo d'en-tête de page. */
  photo: string | null;
  photoAlt: string;
  /**
   * Phrase affichée dans Google et dans les aperçus de lien (WhatsApp). Facultative :
   * sans elle, elle est fabriquée à partir du jour, de l'horaire, du niveau et du point
   * de rendez-vous — ce qui suffit pour un rituel à heure et lieu fixes. À renseigner
   * quand ce gabarit sonne faux, par exemple si plusieurs champs valent « variable ».
   */
  metaDescription: string | null;
}

/** Segment de paragraphe : texte brut, ou lien `[texte](url)`. */
export type RitualInline = string | { text: string; href: string };

export type RitualBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; parts: RitualInline[] }
  | { type: "image"; src: string; alt: string };

export interface RitualContent {
  frontmatter: RitualFrontmatter;
  blocks: RitualBlock[];
}

const REQUIRED_FIELDS = ["title", "activity", "day", "time", "level", "meetingPoint"] as const;

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error("Fichier rituel sans en-tête --- ... --- : voir content/rituels/README.md pour le format attendu.");
  const [, frontmatterBlock, body] = match;
  const data: Record<string, string> = {};
  for (const line of frontmatterBlock.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body };
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Coupe un paragraphe en segments texte / lien à chaque occurrence de `[texte](url)`. */
function parseInline(text: string): RitualInline[] {
  const parts: RitualInline[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push({ text: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/** Paragraphes séparés par une ligne vide — une ligne "## Titre" devient un sous-titre, une ligne "![alt](fichier.jpg)" devient une photo, "[texte](url)" dans un paragraphe devient un lien. */
function parseBody(body: string): RitualBlock[] {
  const blocks: RitualBlock[] = [];
  for (const rawBlock of body.trim().split(/\r?\n\s*\r?\n/)) {
    const line = rawBlock.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", text: line.slice(3).trim() });
      continue;
    }
    const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
    if (imageMatch) {
      blocks.push({ type: "image", alt: imageMatch[1], src: imageMatch[2] });
      continue;
    }
    blocks.push({ type: "paragraph", parts: parseInline(line) });
  }
  return blocks;
}

function loadRitual(slug: string): RitualContent {
  const raw = readFileSync(path.join(CONTENT_DIR, `${slug}.md`), "utf-8");
  const { data, body } = parseFrontmatter(raw);
  const missing = REQUIRED_FIELDS.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`content/rituels/${slug}.md : champ(s) obligatoire(s) manquant(s) dans l'en-tête : ${missing.join(", ")}.`);
  }
  const frontmatter: RitualFrontmatter = {
    slug,
    title: data.title,
    activity: data.activity as Activity,
    day: data.day,
    time: data.time,
    level: data.level,
    capacity: data.capacity || null,
    meetingPoint: data.meetingPoint,
    mapsUrl: data.mapsUrl || null,
    coach: data.coach || null,
    photo: data.photo || null,
    photoAlt: data.photoAlt || "",
    metaDescription: data.metaDescription || null,
  };
  return { frontmatter, blocks: parseBody(body) };
}

export function getAllRituals(): RitualContent[] {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md")
    .map((file) => loadRitual(file.replace(/\.md$/, "")));
}

export function getRitualBySlug(slug: string): RitualContent | null {
  try {
    return loadRitual(slug);
  } catch {
    return null;
  }
}

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/**
 * Le rituel dont une sortie du tableur est une occurrence — ou null.
 *
 * C'est ce qui donne une description à une sortie récurrente SANS RIEN SAISIR :
 * la séance de piste du lundi 7 septembre affiche les infos pratiques du tableur
 * et renvoie vers « La piste du lundi », écrite une fois pour toutes (décision du
 * 2026-09-04 — la colonne Détails du tableur est restée vide un mois entier,
 * taper de la prose sur un téléphone ne se fait pas).
 *
 * Correspondance sur l'activité ET le jour de la semaine, jamais sur l'activité
 * seule : une séance de piste un jeudi n'est pas « la piste du lundi », et mieux
 * vaut ne rien afficher qu'un lien faux. Le jour vient du champ `day:` du rituel,
 * du texte libre — quand il ne nomme pas un jour de la semaine (« Dernier
 * week-end du mois », pour les soirées), l'activité suffit à trancher, ce rituel
 * n'ayant de toute façon pas de jour fixe.
 */
export function findRitualForEvent(event: { activity: Activity; startsAtIso: string }): RitualContent | null {
  // Jour calculé en heure de Paris : une sortie à 23h ne doit pas basculer sur le
  // jour suivant, ce qui la ferait rater « son » rituel.
  const parisWeekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" })
    .format(new Date(event.startsAtIso))
    .toLowerCase();

  for (const ritual of getAllRituals()) {
    if (ritual.frontmatter.activity !== event.activity) continue;
    const ritualDay = ritual.frontmatter.day.toLowerCase();
    const namedDay = WEEKDAYS.find((d) => ritualDay.includes(d));
    if (!namedDay || namedDay === parisWeekday) return ritual;
  }
  return null;
}
