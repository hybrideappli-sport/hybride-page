export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * ADR-006 §1 : "une interface EmailProvider de trois méthodes" — l'ADR ne fixe
 * pas lesquelles au-delà de l'envoi. Une seule est réellement nécessaire au P0
 * (aucun besoin de vérifier la config ou l'état de livraison sans webhook, cf.
 * ADR-006 "Alternatives écartées"). Gardé minimal et correct plutôt que complété
 * par deux méthodes sans usage réel — à étoffer si un besoin concret apparaît
 * (webhook de statut, healthcheck devops).
 */
export interface EmailProvider {
  send(message: OutboundEmail): Promise<{ providerMessageId: string }>;
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}
