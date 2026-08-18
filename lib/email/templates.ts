import { formatEventDateLong, formatEventTime } from "@/lib/format";
import type { Database } from "@/lib/types/database";
import type { OutboundEmail } from "./types";

type EmailType = Database["club"]["Enums"]["email_type"];

export interface EventInfo {
  title: string | null;
  activityLabel: string;
  startsAt: string;
  location: string;
  clubName: string;
}

export interface RegistrationEmailContext {
  kind: "registration";
  memberFirstName: string;
  event: EventInfo;
}

export interface ParentalEmailContext {
  kind: "parental";
  childFirstName: string;
  event: EventInfo;
  /** Requis uniquement pour `parental_authorization_requested` (lien vers l'écran de décision). */
  token?: string;
}

export type EmailContext = RegistrationEmailContext | ParentalEmailContext;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function eventLine(event: EventInfo): string {
  return `${event.title ?? event.activityLabel} — ${formatEventDateLong(event.startsAt)} à ${formatEventTime(event.startsAt)} · ${event.location}`;
}

function wrap(bodyHtml: string, bodyText: string): { html: string; text: string } {
  const html = `<!doctype html><html lang="fr"><body style="font-family:sans-serif;background:#000;color:#F5F2ED;padding:24px;">${bodyHtml}<p style="color:#6D7478;font-size:12px;margin-top:32px;">Hybride Club Toulon — association loi 1901.</p></body></html>`;
  return { html, text: bodyText };
}

/**
 * Un gabarit par valeur de `club.email_type` (10, hors création de compte et
 * mot de passe oublié — ADR-006 §2, portées par Supabase Auth). `to` n'est pas
 * fourni ici : il vient de `club.email_log.recipient`, déjà résolu à l'écriture.
 */
export function buildEmailContent(emailType: EmailType, ctx: EmailContext): Omit<OutboundEmail, "to"> {
  switch (emailType) {
    case "registration_confirmed": {
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Ton inscription est confirmée :</p><p><strong>${eventLine(c.event)}</strong></p><p>Tu peux annuler à tout moment depuis « Mes inscriptions » sur le site.</p>`,
        `Salut ${c.memberFirstName},\n\nTon inscription est confirmée : ${eventLine(c.event)}\n\nTu peux annuler à tout moment depuis "Mes inscriptions" sur le site.`,
      );
      return { subject: `Inscription confirmée — ${c.event.activityLabel}`, html, text };
    }

    case "waitlist_registered": {
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Cette sortie est complète, tu es en liste d'attente :</p><p><strong>${eventLine(c.event)}</strong></p><p>Si une place se libère, tu seras confirmé automatiquement et prévenu par e-mail.</p>`,
        `Salut ${c.memberFirstName},\n\nCette sortie est complète, tu es en liste d'attente : ${eventLine(c.event)}\n\nSi une place se libère, tu seras confirmé automatiquement et prévenu par e-mail.`,
      );
      return { subject: `Liste d'attente — ${c.event.activityLabel}`, html, text };
    }

    case "waitlist_promoted": {
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Une place s'est libérée : ta participation est désormais <strong>confirmée</strong>.</p><p><strong>${eventLine(c.event)}</strong></p>`,
        `Salut ${c.memberFirstName},\n\nUne place s'est libérée : ta participation est désormais confirmée.\n\n${eventLine(c.event)}`,
      );
      return { subject: `Ta place est confirmée — ${c.event.activityLabel}`, html, text };
    }

    case "parental_authorization_requested": {
      const c = ctx as ParentalEmailContext;
      const link = `${SITE_URL}/autorisation-parentale/${c.token}`;
      const { html, text } = wrap(
        `<p>Bonjour,</p><p>${c.childFirstName} souhaite participer à une sortie du Hybride Club Toulon :</p><p><strong>${eventLine(c.event)}</strong></p><p>Une autorisation de votre part est nécessaire, sous 48h : <a href="${link}">${link}</a></p><p>Passé ce délai, la place sera automatiquement libérée.</p>`,
        `Bonjour,\n\n${c.childFirstName} souhaite participer à une sortie du Hybride Club Toulon : ${eventLine(c.event)}\n\nUne autorisation de votre part est nécessaire, sous 48h : ${link}\n\nPassé ce délai, la place sera automatiquement libérée.`,
      );
      return { subject: `Autorisation parentale demandée — ${c.childFirstName}`, html, text };
    }

    case "parental_authorization_confirmed": {
      const c = ctx as ParentalEmailContext;
      const { html, text } = wrap(
        `<p>Bonne nouvelle ${c.childFirstName},</p><p>Ton parent a autorisé ta participation :</p><p><strong>${eventLine(c.event)}</strong></p>`,
        `Bonne nouvelle ${c.childFirstName},\n\nTon parent a autorisé ta participation : ${eventLine(c.event)}`,
      );
      return { subject: `Autorisation reçue — ${c.event.activityLabel}`, html, text };
    }

    case "registration_cancelled_by_member": {
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Ton inscription est annulée :</p><p><strong>${eventLine(c.event)}</strong></p>`,
        `Salut ${c.memberFirstName},\n\nTon inscription est annulée : ${eventLine(c.event)}`,
      );
      return { subject: `Inscription annulée — ${c.event.activityLabel}`, html, text };
    }

    case "registration_cancelled_by_admin": {
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Ton inscription à cette sortie a été retirée par l'organisateur :</p><p><strong>${eventLine(c.event)}</strong></p>`,
        `Salut ${c.memberFirstName},\n\nTon inscription à cette sortie a été retirée par l'organisateur : ${eventLine(c.event)}`,
      );
      return { subject: `Inscription retirée — ${c.event.activityLabel}`, html, text };
    }

    case "registration_cancelled_parental_denied": {
      // Message factuel neutre — décision actée lors du zoning US-05 (denied ≠ expired).
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Ton parent n'a pas autorisé cette sortie :</p><p><strong>${eventLine(c.event)}</strong></p>`,
        `Salut ${c.memberFirstName},\n\nTon parent n'a pas autorisé cette sortie : ${eventLine(c.event)}`,
      );
      return { subject: `Sortie non autorisée — ${c.event.activityLabel}`, html, text };
    }

    case "registration_cancelled_parental_expired": {
      // Message actionnable — distinct du refus (US-05 AC7).
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Nous n'avons pas eu de réponse de ton parent sous 48h, ta place a été libérée :</p><p><strong>${eventLine(c.event)}</strong></p><p>Tu peux réessayer de t'inscrire, ou demander à ton parent de vérifier ses e-mails la prochaine fois.</p>`,
        `Salut ${c.memberFirstName},\n\nNous n'avons pas eu de réponse de ton parent sous 48h, ta place a été libérée : ${eventLine(c.event)}\n\nTu peux réessayer de t'inscrire, ou demander à ton parent de vérifier ses e-mails la prochaine fois.`,
      );
      return { subject: `Pas de réponse sous 48h — ${c.event.activityLabel}`, html, text };
    }

    case "event_cancelled": {
      const c = ctx as RegistrationEmailContext;
      const { html, text } = wrap(
        `<p>Salut ${c.memberFirstName},</p><p>Cette sortie est annulée par le club :</p><p><strong>${eventLine(c.event)}</strong></p>`,
        `Salut ${c.memberFirstName},\n\nCette sortie est annulée par le club : ${eventLine(c.event)}`,
      );
      return { subject: `Sortie annulée — ${c.event.activityLabel}`, html, text };
    }

    default: {
      const exhaustive: never = emailType;
      throw new Error(`Type d'e-mail non géré : ${exhaustive}`);
    }
  }
}
