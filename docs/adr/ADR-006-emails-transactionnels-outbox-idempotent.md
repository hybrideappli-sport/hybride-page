# ADR-006 — E-mails transactionnels : outbox idempotent en base

- **Statut** : Accepté — §1 amendé le 2026-08-17 (voir ADR-009) ; **dormant depuis le 2026-08-19**, voir **ADR-010**
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — intégration
- **Dépend de** : ADR-003, ADR-005
- **Feature déclenchante** : US-03, US-04 (AC2, AC6), US-05, US-06 (AC4)

> **Amendement 2026-08-17** : le prestataire choisi en §1 (Brevo) a été remplacé par **Resend** pour les e-mails du club — voir **ADR-009** pour le contexte et les conséquences (deux sous-traitants distincts club/app, hébergement des données Resend). §1 ci-dessous est conservé tel quel comme trace de la décision initiale ; le reste du document (§2 à §6, mécanique de l'outbox) reste exact et n'a pas changé — seul le nom du prestataire dans les schémas/exemples a été mis à jour pour refléter l'état réel.

> **Amendement 2026-08-18** : le compte Vercel du projet est en plan **Hobby**, qui limite les cron jobs déclarés (`vercel.json`) à **une exécution par jour** — le cron de reprise de §3/§6, documenté à 5 minutes, tourne en réalité une fois par jour (`0 4 * * *`, `vercel.json`) tant que le projet reste en Hobby. Conséquence concrète et surveillance requise détaillées en §6 et en Conséquences. **Le passage en plan Pro (~20$/mois) est un prérequis à l'ouverture des inscriptions aux mineurs, pas une optimisation optionnelle** — voir §6.

> **Amendement 2026-08-19** : l'inscription aux sorties passe par Luma cette saison (ADR-010) — l'amendement du 2026-08-18 ci-dessus devient sans objet, pas faux : aucun e-mail n'est jamais enfilé dans `club.email_log` sans inscription maison, donc la cadence du cron de reprise (5 min visés, quotidien en réalité) ne se pose plus. L'outbox entier — pas seulement sa cadence — est dormant. Réactivable sans révision si la voie maison reprend (critères de réouverture, ADR-010).

---

## Contexte

Le produit n'est pas fonctionnel sans e-mail : une inscription sans confirmation n'est pas une inscription, une demande d'autorisation parentale qui n'arrive pas annule silencieusement la participation d'un mineur, et une promotion depuis la liste d'attente qui n'est pas notifiée laisse une place attribuée à quelqu'un qui l'ignore.

Deux exigences, de natures différentes :

- **Ne jamais perdre un envoi.** Un e-mail perdu se traduit par une place occupée par quelqu'un qui ne viendra pas.
- **Ne jamais dupliquer un envoi.** Le brief cible nommément la promotion depuis la liste d'attente : recevoir deux fois « une place s'est libérée pour toi » est au mieux déroutant, au pire interprété comme deux places.

Ces deux exigences sont contradictoires sous un envoi naïf : l'ajout d'un retry (pour ne rien perdre) crée le risque de doublon, et l'absence de retry crée le risque de perte.

Contrainte supplémentaire d'ADR-003 : **aucune I/O réseau ne peut avoir lieu pendant qu'une transaction détient le verrou d'un événement.** L'envoi ne peut donc pas être synchrone du geste métier.

## Décision

### 1. Brevo, comme l'app *(décision initiale — remplacée le 2026-08-17, voir ADR-009)*

Le prestataire d'e-mail transactionnel est **Brevo**, déjà utilisé par l'app (ADR-011 §5 du repo de l'app). Raisons, dans l'ordre :

1. Un seul domaine d'envoi à authentifier (SPF, DKIM, DMARC) pour les deux produits — la réputation d'envoi est un actif lent à construire et facile à casser en la fragmentant.
2. Un seul contrat, un seul jeu de clés, une compétence déjà acquise côté équipe.
3. Aucune propriété technique de Resend ou Postmark ne justifierait d'introduire un second fournisseur trois semaines avant le lancement.

**Sous-domaine d'expédition distinct par entité** : les e-mails du club partent d'une adresse de l'association, ceux de l'app d'une adresse de l'entité commerciale. La séparation des responsables de traitement (ADR-002) doit être visible dans la boîte de réception, pas seulement en base. Détail d'exploitation à cadrer par `devops`.

L'intégration se limite à un appel `POST /v3/smtp/email` derrière une interface `EmailProvider` de trois méthodes : le remplacement du prestataire reste un module, pas une refonte.

### 2. Les e-mails de compte ne passent pas par ce chemin

| E-mail (numérotation du brief) | Émetteur |
|---|---|
| 6. Création de compte (confirmation d'adresse) | **Supabase Auth**, gabarits Auth, SMTP Brevo |
| 7. Mot de passe oublié | **Supabase Auth**, idem |
| 1 à 5 (inscription, promotion, demande et confirmation parentales, annulation) | **le site**, via l'outbox ci-dessous |

Supabase Auth possède son propre cycle d'envoi, ses propres jetons et sa propre idempotence. Le réimplémenter ferait perdre les garanties de sécurité de l'authentification pour un gain nul. Le SMTP personnalisé de Brevo est configuré dans le projet Supabase — ce qui suffit à unifier le domaine d'expédition. **Ce réglage est partagé avec l'app** : il ne doit pas être modifié sans coordination (ADR-001).

Conséquence : `club.email_log` ne journalise pas ces deux e-mails, et c'est correct — leur trace vit dans Supabase Auth.

### 3. `club.email_log` est un outbox transactionnel, pas un journal *a posteriori*

L'enfilement de l'e-mail se fait **dans la transaction qui produit le fait métier**, par `club.enqueue_email(...)` appelée depuis les fonctions verrouillées d'ADR-003 :

```
transaction : verrou événement → écriture inscription → INSERT club.email_log (status='pending')
                                                              │
                                 commit ──────────────────────┘
                                        │
                      after() : dispatch immédiat ──→ Resend ──→ status='sent'
                                        │ (échec)
                      cron de reprise : 'pending'/'failed' avec back-off
                      (5 min visé — quotidien en réalité tant que Vercel Hobby, voir §6)
```

Trois propriétés en découlent :

- **Pas d'e-mail sans fait.** Si la transaction échoue, la ligne d'outbox disparaît avec elle. Aucune confirmation d'inscription pour une inscription qui n'existe pas.
- **Pas de fait sans e-mail.** Si l'envoi échoue, la ligne reste `pending` et sera reprise. Le succès de l'inscription ne dépend pas de la disponibilité de Resend.
- **Pas d'I/O sous verrou.** L'appel réseau a lieu après le commit, hors de toute transaction.

### 4. L'idempotence est une contrainte de base, pas une précaution du code

```sql
create unique index club_email_log_idempotency
  on club.email_log (email_type, related_type, related_id);
```

Le triplet identifie l'envoi métier de façon stable, et `club.enqueue_email` insère en `on conflict do nothing`. Une double promotion, un rejeu de cron, un double clic : au plus une ligne, donc au plus un envoi.

Le choix de `related_id` par type est ce qui rend la contrainte juste :

| Type d'e-mail | `related_type` / `related_id` | Pourquoi ce rattachement |
|---|---|---|
| `registration_confirmed`, `waitlist_registered`, `waitlist_promoted` | `registration` | une inscription ne peut être promue qu'une fois : `cancelled` est terminal, une réinscription crée une **nouvelle** ligne |
| `registration_cancelled_*`, `event_cancelled` | `registration` | une annulation est terminale |
| `parental_authorization_requested`, `parental_authorization_confirmed` | `parental_authorization` | une réévaluation après report d'événement (US-05 AC9) crée une **nouvelle** autorisation, donc un nouvel envoi légitime |

C'est le second point qui mérite l'attention : rattacher la demande parentale à l'inscription aurait rendu impossible la seconde demande exigée par l'AC9. L'objet d'idempotence est l'autorisation, pas l'inscription.

### 5. Le contenu n'est pas stocké, il est reconstruit

`club.email_log` porte le type, le destinataire, l'état, les tentatives et l'erreur — pas le corps du message. Le dispatcher reconstruit le contenu depuis les lignes liées au moment de l'envoi.

Motivation : ne pas créer un second entrepôt de données personnelles, soumis à sa propre politique de purge, pour une information déjà présente en base. Effet de bord assumé : un e-mail relayé après une modification de l'événement reflète l'état au moment de l'envoi, pas au moment du geste. Sur une fenêtre de quelques minutes, c'est le comportement souhaitable.

`recipient` est la seule donnée personnelle conservée : elle est nécessaire pour prouver *à qui* l'envoi a été fait, et pour traiter un échec de livraison.

### 6. Échecs et abandon

`attempts`, `last_error`, back-off exponentiel, abandon après 5 tentatives avec `status = 'failed'` définitif et une ligne visible en supervision. Une demande d'autorisation parentale abandonnée est le cas le plus grave (le mineur perd sa place sans que personne n'ait pu répondre) : elle doit être alertée, pas seulement journalisée. À câbler par `devops`.

**Cadence réelle du cron de reprise, en Vercel Hobby (amendement 2026-08-18).** Le chemin nominal reste l'envoi immédiat via `after()` sur les 4 actions (inscription, annulation, décision parentale, annulation d'événement) : le cron n'intervient qu'en rattrapage d'un échec du chemin immédiat, qui reste l'exception, pas la règle. Mais Vercel Hobby limite les cron jobs déclarés à une exécution par jour — `*/5 * * * *` y est refusé à la validation du déploiement, le cron tourne donc à `0 4 * * *` (§3), une fois par jour.

Conséquence honnête, par type d'e-mail :

- **Confirmation d'inscription, promotion, annulation** : un échec de l'envoi immédiat peut rester non corrigé jusqu'à 24h. Sans conséquence fonctionnelle — la place est déjà occupée ou libérée en base dès l'écriture de la transaction (§3), indépendamment de l'e-mail. Le retard est un inconfort, pas un bug métier.
- **Demande d'autorisation parentale** : seul cas où le retard a une conséquence réelle. La fenêtre de 48h démarre à l'écriture de la ligne (US-05), pas à la réception de l'e-mail par le parent. Si l'envoi immédiat échoue peu après l'écriture, le parent peut ne recevoir la demande que jusqu'à ~24h plus tard — sur une fenêtre de 48h, c'est une part significative du délai de réponse dont le parent dispose réellement, et dans le pire cas (échec juste après le passage du cron), le mineur reste bloqué en attente sans qu'aucune notification ne parte avant le prochain passage.

**Décision, en attendant le passage en Pro** : aucun contournement mis en œuvre côté code (§ »options envisagées, non retenues« ci-dessous pour mémoire). **Le passage au plan Vercel Pro (~20$/mois, cron 5 min restauré) est un prérequis au lancement pour les mineurs, pas une optimisation optionnelle** — à faire avant l'ouverture réelle des inscriptions, pas après. Tant que le projet reste en Hobby, ne pas ouvrir les inscriptions à un public mineur en conditions réelles.

*Options envisagées pour réduire la fenêtre sans passer en Pro, non retenues pour l'instant (aucune implémentée) :*

- **Cron externe gratuit** (GitHub Actions `schedule:`, ou un service tiers de type cron-job.org) appelant `/api/cron/dispatch-emails` toutes les 5 minutes, en dehors de Vercel — la route ne sait pas qui l'appelle au-delà du `CRON_SECRET` déjà en place, donc rien à changer côté code. Restaure la cadence voulue à coût nul, mais ajoute une dépendance externe (fiabilité, supervision) hors du périmètre Vercel déjà budgété par `devops`.
- **Rattrapage opportuniste sur consultation admin** : faire déclencher `dispatchPendingEmails()` (ou un lot limité) depuis `after()` d'une page admin fréquemment visitée (`/admin/sorties`). Réduit la fenêtre uniquement quand un admin est actif — pas de garantie pour une demande parentale reçue hors des heures où l'admin consulte le site.
- **Rattrapage élargi sur chaque `after()` existant** : en plus d'enfiler son propre e-mail, chaque action (`registerForEvent`, etc.) pourrait aussi déclencher un passage limité de `dispatchPendingEmails()` sur les lignes `pending`/`failed` en attente, pas seulement la sienne — répartit le rattrapage sur tout le trafic du site plutôt que sur un seul point d'entrée admin, sans cron du tout. Fonctionne tant que le site a du trafic régulier ; silencieux si le site est inactif (calme plat un jour donné = aucun rattrapage ce jour-là, contrairement à un vrai cron).

Aucune de ces options n'est un remplacement complet d'un cron à cadence fixe — chacune dégrade différemment plutôt que de résoudre le problème. Le passage en Pro reste la solution qui ne dégrade rien.

## Conséquences

**Positives**

- La double notification de promotion — le risque nommé par le brief — est impossible, garantie par un index unique et non par la prudence du code appelant.
- Une panne de Resend dégrade la latence des e-mails, jamais l'intégrité des inscriptions.
- La réponse HTTP de l'inscription ne dépend pas d'un tiers : le budget de 45 secondes de l'US-04 est tenu quoi qu'il arrive.
- Le journal des envois constitue une preuve opérationnelle (qui a été notifié, quand) utile en cas de litige sur une autorisation parentale.

**Négatives / à surveiller**

- Un e-mail peut arriver en retard en cas d'échec du premier envoi — quelques minutes visées (cron 5 min, Vercel Pro), jusqu'à 24h en réalité tant que le projet reste en Vercel Hobby (amendement 2026-08-18, détail §6). Acceptable pour tous les types sauf la demande parentale, dont l'horloge de 48 h démarre à l'écriture, pas à la réception — c'est le cas qui rend le passage en Pro non optionnel avant le lancement.
- `email_log` grossit indéfiniment. Purge à prévoir dans la politique de conservation (même mécanique que la purge des inscriptions, ADR-005 §3).
- Le contenu reconstruit interdit de rejouer à l'identique un e-mail dont les données sous-jacentes ont changé.
- `after()` de Next.js ne garantit pas l'exécution en cas d'arrêt brutal de l'instance — c'est précisément pourquoi le cron de reprise existe et n'est pas optionnel.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Envoi synchrone dans la Server Action, sans outbox | I/O réseau sous verrou (interdit par ADR-003), latence utilisateur soumise au tiers, et un échec d'envoi qui ferait échouer une inscription pourtant valide. |
| Journalisation *après* envoi (log a posteriori) | La fenêtre entre l'envoi et l'écriture du journal est exactement celle où le doublon se produit. Le journal doit précéder l'envoi pour en être le garde-fou. |
| Idempotence par clé applicative calculée en TypeScript | Fonctionne tant que tous les appelants la calculent pareil. `pg_cron` n'appelle pas de TypeScript : la clé doit vivre là où l'écriture a lieu. |
| Webhooks Resend pour l'état de livraison (bounce, spam) | Utile, non nécessaire au P0 : `provider_message_id` est déjà stocké, le webhook pourra être branché en P1 sans changement de schéma. |

> La ligne « Resend, écarté au profit d'un domaine d'envoi unique » a été retirée le 2026-08-17 : ce n'est plus une alternative écartée mais le prestataire retenu — voir ADR-009.
