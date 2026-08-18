# Contrats d'API — Site Hybride

> Contrats des opérations sensibles du lot P0. Écrit par `architect`, lecture seule pour les autres agents.
>
> Version : 1.0 — 2026-08-12
> Références : `docs/architecture.md`, ADR-003 (verrou), ADR-004 (privilèges), ADR-006 (e-mails)

---

## Principes communs

**Server Actions par défaut, Route Handlers par exception.** Une Server Action couvre tout geste déclenché depuis un formulaire de l'interface. Un Route Handler n'est utilisé que lorsqu'il faut contrôler la réponse HTTP elle-même (flux CSV) ou lorsque l'appelant n'est pas le navigateur (cron).

**Les mutations ne touchent jamais une table directement.** Elles appellent une fonction du schéma `club` par `rpc()`, avec le client Supabase **de l'utilisateur** (pas `service_role`) : l'autorisation est vérifiée dans la fonction à partir de `auth.uid()`. Le client `service_role` n'apparaît que dans trois chemins, listés en §7.

**Contrat de retour uniforme.** Aucune Server Action ne lève d'exception vers l'interface : le canal d'erreur est le type de retour.

```ts
export type ActionResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: ErrorCode; message: string; field?: string } };
```

`message` est en français, destiné à l'affichage. `code` est stable et testable. `field` permet de rattacher l'erreur à un champ de formulaire (`aria-describedby`).

**Validation en première instruction.** Chaque action valide son entrée avec le schéma Zod déclaré dans `lib/validation/`. Une entrée invalide renvoie `VALIDATION_FAILED` sans jamais atteindre la base.

**Table des codes d'erreur.** Les codes proviennent soit de la validation, soit de la traduction d'une exception PostgreSQL levée par une fonction `club.*`.

| `code` | Origine | HTTP équivalent | Message type |
|---|---|---|---|
| `VALIDATION_FAILED` | Zod | 422 | selon le champ |
| `UNAUTHENTICATED` | session absente | 401 | « Connecte-toi pour continuer. » |
| `FORBIDDEN` | `forbidden` (42501) | 403 | « Tu n'as pas accès à cette action. » |
| `NOT_FOUND` | `*_not_found` (P0002) | 404 | « Cette sortie n'existe plus. » |
| `EVENT_CANCELLED` | `event_cancelled` (P0001) | 409 | « Cette sortie a été annulée. » |
| `EVENT_PAST` | `event_past` (P0001) | 409 | « Cette sortie a déjà eu lieu. » |
| `PARENT_EMAIL_REQUIRED` | `parent_email_required` | 422 | « L'e-mail d'un parent est nécessaire pour une personne mineure. » |
| `MEMBER_PROFILE_MISSING` | `member_profile_missing` | 409 | « Complète ton profil avant de t'inscrire. » |
| `ALREADY_REGISTERED` | retour `already_registered: true` | 200 | pas une erreur : l'action réussit et renvoie l'état existant |
| `CONSENT_DOCUMENT_MISSING` | `consent_document_missing` | 500 | erreur d'exploitation, à alerter |
| `INTERNAL` | tout le reste | 500 | « Une erreur est survenue, réessaie. » |

**Revalidation.** Toute mutation qui change une occupation appelle `revalidatePath('/club/[slug]')` et `revalidatePath('/club/[slug]/sorties/[eventId]')` : les places restantes affichées ne doivent jamais être en retard sur la base.

**Envoi d'e-mail.** Aucune action n'envoie d'e-mail. Elles enfilent (dans la fonction SQL, sous transaction) puis déclenchent le dispatcher hors du cycle de réponse :

```ts
after(() => dispatchPendingEmails({ limit: 20 }));   // next/server
```

---

## 1. Inscription à une sortie — US-04

### `registerForEvent`

```ts
// lib/actions/registrations.ts
'use server';

export const RegisterForEventInput = z.object({
  eventId:     z.uuid(),
  parentEmail: z.email().optional(),   // requis si mineur à la date de l'événement
});

export type RegisterForEventOutput = {
  registrationId: string;
  status: 'confirmed' | 'waitlist' | 'pending_parental_authorization';
  isMinorAtEvent: boolean;
  isUnder15AtRegistration: boolean;
  holdExpiresAt: string | null;   // ISO 8601, présent si pending_parental_authorization
  placesLeft: number;
  alreadyRegistered: boolean;
};

export async function registerForEvent(
  input: z.infer<typeof RegisterForEventInput>
): Promise<ActionResult<RegisterForEventOutput>>;
```

| | |
|---|---|
| **Appelée depuis** | écran D1 (détail d'une sortie) |
| **Auth** | session requise ; `UNAUTHENTICATED` sinon (le compte est obligatoire, décision 5 du brief) |
| **Mobilise** | `club.register_for_event(p_event_id, p_member_profile_id, p_parent_email)` |
| **Tables écrites** | `club.registrations`, `club.parental_authorizations`, `club.email_log` — **toutes dans la même transaction** |
| **Garanties** | verrou `FOR UPDATE` sur `club.events` (ADR-003) ; index unique partiel contre le doublon actif ; idempotence des e-mails (ADR-006) |
| **Erreurs** | `EVENT_CANCELLED`, `EVENT_PAST`, `NOT_FOUND`, `PARENT_EMAIL_REQUIRED`, `MEMBER_PROFILE_MISSING`, `FORBIDDEN` |

**Notes de contrat**

- `p_member_profile_id` est laissé à `null` : la fonction prend `auth.uid()`. L'action publique ne permet **jamais** d'inscrire quelqu'un d'autre — seule l'action admin (§4) passe un identifiant explicite.
- Le statut n'est **pas** choisi par le client : c'est la fonction qui décide `confirmed` / `waitlist` / `pending_parental_authorization` sous verrou. L'interface se contente d'afficher les trois variantes de D2.
- `alreadyRegistered: true` n'est pas une erreur : un double envoi de formulaire renvoie l'inscription existante, ce qui rend l'action rejouable sans effet de bord.
- `parentEmail` est demandé **avant** l'envoi quand l'interface sait déjà que la personne sera mineure à la date de la sortie (calculable côté serveur depuis `birth_date` et `starts_at`). L'erreur `PARENT_EMAIL_REQUIRED` reste le filet si l'interface a laissé passer le cas.

### `cancelRegistration`

```ts
export const CancelRegistrationInput = z.object({ registrationId: z.uuid() });

export type CancelRegistrationOutput = {
  registrationId: string;
  status: 'cancelled';
  freedSlot: boolean;      // true si la place a été rendue à la liste d'attente
};

export async function cancelRegistration(
  input: z.infer<typeof CancelRegistrationInput>
): Promise<ActionResult<CancelRegistrationOutput>>;
```

| | |
|---|---|
| **Appelée depuis** | écran D3 (« mes inscriptions »), avec confirmation |
| **Auth** | session requise ; la fonction vérifie que l'appelant est le titulaire (ou un `club_admin` du club) |
| **Mobilise** | `club.cancel_registration(p_registration_id)` → `club._cancel_registration(..., 'member', true)` |
| **Effets** | statut `cancelled`, autorisation parentale en cours passée à `expired`, promotion de la liste d'attente si la place était occupée, e-mail d'annulation enfilé |
| **Erreurs** | `NOT_FOUND`, `FORBIDDEN` |

Annuler une inscription déjà annulée renvoie `{ ok: true, data: { ..., freedSlot: false } }` : l'opération est idempotente.

---

## 2. Validation parentale — US-05

Les deux opérations sont accessibles **sans authentification** : le parent n'a pas de compte (US-05 AC4). Le jeton porte l'authentification (ADR-004 §4).

### `GET /autorisation-parentale/[token]` — lecture (Server Component, pas une action)

L'écran E1 est rendu côté serveur en appelant directement la fonction de lecture ; il n'y a pas d'endpoint JSON exposé.

| | |
|---|---|
| **Mobilise** | `club.get_parental_authorization(p_token)` (exécutable par `anon`) |
| **Renvoie** | `{ found, status, expired, holdExpiresAt, childFirstName, requiresRgpdConsent, event, club, sportAuthorizationDocument, rgpdDocument }` |
| **Divulgation** | prénom de l'enfant uniquement — jamais son nom, son e-mail ni sa date de naissance |
| **États d'écran** | `found: false` → « lien invalide » ; `expired: true` ou `status ≠ 'pending'` → « lien expiré ou déjà traité », sans action possible ; `requiresRgpdConsent: true` → volet RGPD **en plus** du volet sportif (US-05 AC2) |
| **En-têtes** | `X-Robots-Tag: noindex, nofollow` et `Cache-Control: no-store` sur la route |

### `submitParentalDecision`

```ts
export const ParentalDecisionInput = z.object({
  token:    z.string().length(64),
  decision: z.enum(['approve', 'deny']),
  // Présent seulement si requiresRgpdConsent : la case doit être cochée pour approuver.
  rgpdConsentGranted: z.boolean().optional(),
});

export type ParentalDecisionOutput = {
  result: 'confirmed' | 'denied' | 'expired' | 'already_decided' | 'invalid_token' | 'event_cancelled';
  registrationStatus?: 'confirmed' | 'waitlist';
};

export async function submitParentalDecision(
  input: z.infer<typeof ParentalDecisionInput>
): Promise<ActionResult<ParentalDecisionOutput>>;
```

| | |
|---|---|
| **Appelée depuis** | écran E1, boutons « Autoriser » / « Refuser » |
| **Auth** | aucune — client `anon` |
| **Mobilise** | `club.decide_parental_authorization(p_token, p_approve, p_ip_hash, p_user_agent)` |
| **Tables écrites** | `club.parental_authorizations`, `club.consents` (si < 15 ans), `club.registrations`, `club.email_log` |
| **Erreurs** | jamais `FORBIDDEN` : un jeton invalide renvoie `result: 'invalid_token'`, ce qui évite d'indiquer à un attaquant qu'un jeton existe mais n'est plus valide |

**Calcul de la preuve côté serveur, jamais côté client (US-05 AC8)**

```ts
const ipHash = sha256(`${clientIp}${process.env.PROOF_IP_SALT}`);   // jamais l'IP en clair
const userAgent = headers().get('user-agent')?.slice(0, 512) ?? null;
```

Ces deux valeurs n'ont de valeur probante que si le client ne les fournit pas : elles ne figurent donc pas dans le schéma Zod d'entrée.

**Cas `approve` avec `requiresRgpdConsent: true` et `rgpdConsentGranted: false`** → refusé par la validation (`VALIDATION_FAILED`, `field: 'rgpdConsentGranted'`). Le double consentement des moins de 15 ans est indivisible : un seul geste, deux preuves, mais pas d'approbation partielle.

**Effet d'un refus et d'une expiration** : identique en base (place libérée, inscription `cancelled`, promotion déclenchée). La différence est portée par `club.email_type` et par l'écran — message factuel neutre pour `denied`, message actionnable pour `expired`.

---

## 3. Compte — US-03

### `signUpFromClub`

```ts
export const SignUpInput = z.object({
  email:     z.email(),
  password:  z.string().min(8),
  firstName: z.string().min(1).max(80),
  lastName:  z.string().min(1).max(80),
  birthDate: z.iso.date(),                    // YYYY-MM-DD
  consentGranted: z.literal(true),            // consentement club, obligatoire
  redirectTo: z.string().startsWith('/').optional(),
});

export type SignUpOutput = { userId: string; redirectTo: string };
```

| | |
|---|---|
| **Mobilise** | `supabase.auth.signUp` → puis, **avec `service_role`** : `insert public.profiles (id, app_enrolled = false)`, `insert club.member_profiles`, `insert club.consents` |
| **Pourquoi `service_role`** | `app_enrolled` doit valoir `false` sans que le client puisse en décider (ADR-001 §4) ; et une preuve de consentement ne peut pas être écrite par son propre sujet (ADR-004 §1) |
| **Ordre** | `auth.signUp` d'abord ; si l'une des insertions suivantes échoue, l'action renvoie `INTERNAL` et le compte reste sans profil club — l'écran de reprise complète le profil manquant plutôt que de laisser un compte orphelin |
| **Prérequis de production** | la colonne `public.profiles.app_enrolled` doit exister (migration portée par le repo de l'app, ADR-001 §4). **Sans elle, l'insertion échoue au démarrage** — c'est volontaire : mieux vaut un échec bruyant qu'une fuite silencieuse vers les automatismes de l'app. |

`redirectTo` est validé comme chemin relatif interne (`startsWith('/')`) : une valeur absolue serait une redirection ouverte.

### `signIn`

Redirection par rôle (US-03 AC6) : après authentification, lecture de `club.admin_roles` (policy `admin_roles_select_own`) → un `club_admin` part vers `/admin/sorties`, tout autre compte vers `redirectTo` ou `/mes-inscriptions`.

### `requestPasswordReset`

`supabase.auth.resetPasswordForEmail`. Réponse **toujours** `{ ok: true }`, quelle que soit l'existence du compte : ne pas transformer l'écran en oracle d'existence d'adresse.

---

## 4. Actions admin — US-06

Toutes exigent une session et un rôle `club_admin` sur le club concerné. La vérification a lieu **dans la base** (policy ou fonction), pas seulement dans le `layout` admin : une action appelée directement doit échouer.

### `createEvent`

```ts
export const CreateEventInput = z.object({
  clubId:           z.uuid(),
  disciplineCodes:  z.array(z.enum(['course', 'velo', 'eau', 'montagne', 'collectif'])).min(1),
  title:            z.string().max(120).optional(),
  startsAt:         z.iso.datetime({ offset: true }),
  location:         z.string().min(1).max(200),
  level:            z.string().max(80).optional(),
  capacity:         z.number().int().min(1).max(500),
});

export type CreateEventOutput = { eventId: string };
```

| | |
|---|---|
| **Mobilise** | RPC `club.create_event()` — un événement porte une ou plusieurs disciplines (`club.event_disciplines`), écriture multi-table qu'une policy RLS seule ne peut plus exprimer (ADR-004 §1, amendé 2026-08-17, migration `20260812093500`) |
| **Pourquoi pas une policy RLS seule** | suffisant pour un `insert` mono-table (raison initiale d'ADR-004 §1) ; ne l'est plus depuis l'ajout de `club.event_disciplines` |
| **Erreurs** | `FORBIDDEN` (rôle absent — remonté comme violation de policy), `VALIDATION_FAILED` |
| **Effet** | l'événement apparaît immédiatement dans l'agenda public (US-06 AC2) ; `revalidatePath('/club/[slug]')` |

L'écran F2 compose date et heure locales en un `timestamptz` **avec offset explicite** : jamais de date naïve envoyée au serveur.

### `cancelEvent`

```ts
export const CancelEventInput = z.object({ eventId: z.uuid() });
export type CancelEventOutput = { eventId: string; notified: number };
```

| | |
|---|---|
| **Mobilise** | `club.cancel_event(p_event_id)` |
| **Effets** | `club.events.status = 'cancelled'` ; **toutes** les inscriptions actives (confirmées, liste d'attente, attente parentale) passent à `cancelled` ; un e-mail `event_cancelled` est enfilé par inscrit ; aucune promotion n'est déclenchée |
| **Erreurs** | `FORBIDDEN`, `NOT_FOUND` |
| **Idempotence** | un événement déjà annulé renvoie `notified: 0` sans erreur |

L'interface exige une confirmation explicite mentionnant le nombre de personnes qui seront notifiées.

### `addParticipant` (inscription manuelle — US-06 AC6)

```ts
export const AddParticipantInput = z.object({
  eventId:         z.uuid(),
  memberProfileId: z.uuid(),
  parentEmail:     z.email().optional(),
});
```

Mobilise **la même fonction** que l'inscription publique — `club.register_for_event(eventId, memberProfileId, parentEmail)` — ce qui garantit que le verrou de capacité et le régime mineur s'appliquent à l'identique. C'est la propriété recherchée : un ajout admin n'est pas un chemin de contournement.

Limite P0 assumée : l'admin ne peut ajouter qu'une personne **ayant déjà un compte et un `club.member_profiles`**. Créer un compte au nom d'un tiers poserait un problème de consentement (aucune preuve recueillie auprès de l'intéressé) et n'est pas au périmètre.

### `removeParticipant` (US-06 AC7)

Mobilise `club.cancel_registration(registrationId)`. La fonction détecte que l'appelant n'est pas le titulaire et enregistre `cancellation_reason = 'admin'`, ce qui sélectionne l'e-mail `registration_cancelled_by_admin`. Promotion automatique déclenchée, identique à une annulation publique.

### `GET /api/admin/events/[eventId]/export.csv` (US-06 AC8)

Route Handler et non Server Action : il faut maîtriser les en-têtes et le corps de la réponse.

| | |
|---|---|
| **Auth** | session requise ; `club.event_roster` refuse un admin d'un autre club |
| **Mobilise** | `club.event_roster(p_event_id)` puis `club.log_export(p_event_id, rowCount)` |
| **Réponse** | `200`, `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="sortie-YYYY-MM-DD-<activite>.csv"`, `Cache-Control: no-store` |
| **Colonnes** | `nom;prénom;email;statut;inscrit_le` — séparateur `;` et BOM UTF-8, pour qu'Excel en configuration française ouvre le fichier correctement du premier coup |
| **Stockage** | aucun : le corps est construit en mémoire et streamé, rien n'est écrit sur disque |
| **Erreurs** | `401` sans session, `403` si le rôle ne couvre pas le club, `404` si l'événement n'existe pas |

La journalisation a lieu **après** la construction du corps (on journalise un export réellement produit) et **avant** l'envoi de la réponse (on ne journalise pas depuis le client).

---

## 5. Lectures publiques — US-02, US-04

Aucune n'est un endpoint : ce sont des appels faits en Server Component.

| Écran | Appel | Cache |
|---|---|---|
| B1 — agenda (`/club/[slug]`) | `club.list_upcoming_events(slug)` | `revalidate = 60`, invalidé par `revalidatePath` à chaque mutation |
| D1 — détail (`/club/[slug]/sorties/[eventId]`) | `club.get_event_public(eventId)` | `revalidate = 30` |
| D3 — mes inscriptions | `select` sur `club.registrations` joint à `club.events`, via RLS | `no-store` (dépend de la session) |
| F1/F3 — admin | `select` sur `club.events` (policy admin) et `club.event_roster(eventId)` | `no-store` |

`list_upcoming_events` renvoie `placesLeft` et `waitlistCount` comme **agrégats** : la liste des inscrits n'est jamais exposée publiquement (ADR-004 §5).

---

## 6. Cron

### `POST /api/cron/dispatch-emails`

| | |
|---|---|
| **Déclencheur** | Vercel Cron, toutes les 5 minutes (`vercel.json`) |
| **Auth** | en-tête `Authorization: Bearer ${CRON_SECRET}` ; `401` sinon. Comparaison à temps constant |
| **Rôle** | filet de reprise uniquement — le chemin nominal est `after()` juste après la mutation (ADR-006 §2) |
| **Traitement** | sélectionne les `club.email_log` en `pending`/`failed` dont `next_attempt_at <= now()`, par lots de 50 ; envoie via Resend ; met à jour `status`, `attempts`, `provider_message_id`, `last_error`, `next_attempt_at` (back-off exponentiel) ; abandonne à 5 tentatives |
| **Réponse** | `{ processed: number, sent: number, failed: number }` |
| **Idempotence** | garantie en amont par l'index unique de `club.email_log` : un déclenchement en double ne peut pas produire un envoi en double |

L'expiration des holds parentaux **n'a pas d'endpoint** : elle est planifiée par `pg_cron` en base (ADR-005).

---

## 7. Où circule `service_role`

Trois chemins, et seulement trois. Toute extension de cette liste est une décision d'architecture, pas un détail d'implémentation.

| Chemin | Pourquoi |
|---|---|
| `signUpFromClub` | écrire `public.profiles.app_enrolled = false` et la preuve de consentement, sans que le client puisse en décider |
| `dispatchPendingEmails` (`after()` et cron) | lire et mettre à jour `club.email_log`, table sans policy |
| tests d'intégration | mise en place et vérification des invariants de privilèges |

La clé n'est lue que dans `lib/supabase/admin.ts`, derrière un garde `if (typeof window !== 'undefined') throw`, et n'est **jamais** préfixée `NEXT_PUBLIC_`.

---

## 8. Points à confirmer avant implémentation

1. **E-mail d'entrée en liste d'attente** (`waitlist_registered`) : ajouté comme variante de l'e-mail n°1 du brief, qui n'en prévoit que sept. Si l'écran D2 est jugé suffisant, retirer le type de l'énumération avant la première migration.
2. **E-mail d'annulation par soi-même** : enfilé comme trace écrite alors que l'écran vient de confirmer le geste. À arbitrer côté produit — le retirer est un `if` d'une ligne dans `club._cancel_registration`.
3. **`is_under_15_at_registration`** : le nom retenu par le brief évalue à la date d'inscription, l'US-05 AC2 évoque « à la date de l'événement ». Le modèle retient la **date d'inscription**, qui est le moment où le consentement est donné, donc où la capacité à consentir s'apprécie. Écart de quelques semaines au plus, à confirmer.
