import "server-only";

import { Resend } from "resend";

import { EmailSendError, type EmailProvider, type OutboundEmail } from "./types";

/**
 * ADR-006 §1 (amendée par ADR-009) : Resend est propre à l'association, distinct
 * du Brevo de l'app. Les 2 e-mails de compte (création, mot de passe oublié) ne
 * passent pas par ce chemin : ils partent du SMTP Brevo configuré côté Supabase
 * Auth (ADR-006 §2), réglage partagé avec l'app — à ne pas dupliquer ici.
 */
export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: OutboundEmail): Promise<{ providerMessageId: string }> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new EmailSendError(`Resend ${error.name}: ${error.message}`);
    }
    if (!data?.id) {
      throw new EmailSendError("Resend: réponse sans id");
    }

    return { providerMessageId: data.id };
  }
}

let cachedProvider: EmailProvider | null = null;

/** Un seul point de construction — remplacer le prestataire reste un module (ADR-006 §1). */
export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    throw new EmailSendError("RESEND_API_KEY / RESEND_FROM non configurés (lot L7, devops).");
  }

  cachedProvider = new ResendEmailProvider(apiKey, from);
  return cachedProvider;
}
