# ADR-003 — Capacité et liste d'attente garanties par verrou transactionnel

- **Statut** : Accepté — **dormant depuis le 2026-08-19**, voir **ADR-010**
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — intégrité des données
- **Dépend de** : ADR-002
- **Feature déclenchante** : US-04 (AC2, AC3, AC6), US-05 (AC5, AC7), US-06 (AC6, AC7)

> **Amendement 2026-08-19** : l'inscription aux sorties passe par Luma cette saison (ADR-010) — le verrou décrit ici n'est plus exercé, faute d'inscription maison. Le raisonnement reste correct, rien n'est invalidé : réactivable sans révision si la voie maison reprend (critères de réouverture, ADR-010).

---

## Contexte

Une sortie a une capacité `N`. L'invariant produit est : **au plus `N` places occupées à tout instant**, une place étant occupée par une inscription `confirmed` **ou** `pending_parental_authorization` (le hold parental de 48 h bloque une place, décision 6 du brief).

Cet invariant n'est exprimable par aucune contrainte déclarative de Postgres :

- une contrainte `CHECK` porte sur une ligne, pas sur le cardinal d'un ensemble de lignes ;
- une contrainte `UNIQUE` interdit les doublons, pas les dépassements de compte ;
- une contrainte d'exclusion ne sait pas compter davantage.

Une vérification applicative (`select count(*)` puis `insert` si la place est libre) est un contrôle **hors transaction** : deux requêtes concurrentes lisent le même compte, concluent toutes les deux qu'il reste une place, et insèrent. L'événement se retrouve en surcapacité, sans erreur, sans trace. En isolation `READ COMMITTED` — le défaut de Postgres et de Supabase — ce scénario n'est pas rare : c'est le comportement normal dès que deux personnes visent la dernière place, ce qui est exactement la situation où le produit est regardé.

Cinq chemins différents mutent l'occupation d'un même événement, ce qui multiplie les occasions de course :

| Chemin | Origine |
|---|---|
| inscription publique | US-04, action utilisateur |
| annulation par le membre | US-04 AC5 |
| inscription / retrait manuel par un admin | US-06 AC6, AC7 |
| décision parentale (autorisation ou refus) | US-05 AC5, AC6 |
| expiration d'un hold parental | US-05 AC7, `pg_cron`, sans utilisateur |

## Décision

**Toute mutation de l'occupation d'un événement passe par une fonction PL/pgSQL qui verrouille d'abord la ligne `club.events` correspondante.**

```sql
-- Premier acte de chaque fonction, sans exception :
select * into v_event from club.events where id = p_event_id for update;
```

La ligne `club.events` sert de **jeton de sérialisation** : les cinq chemins ci-dessus s'excluent mutuellement sur cet objet unique, pour la durée de la transaction. Le comptage des inscriptions occupantes et l'insertion ou la mise à jour qui en découle se déroulent alors dans le même instantané, sous un verrou qu'aucun autre chemin ne peut contourner — y compris `pg_cron`, qui n'a pas d'utilisateur mais emprunte les mêmes fonctions.

Fonctions concernées (DDL canonique : `supabase/migrations/20260812093500_club_transactional_functions.sql`) :

| Fonction | Rôle |
|---|---|
| `club.register_for_event(...)` | inscription, décide `confirmed` / `waitlist` / `pending_parental_authorization` |
| `club.cancel_registration(...)` | annulation membre ou admin, libère la place |
| `club.decide_parental_authorization(...)` | autorisation ou refus du parent |
| `club.expire_parental_holds()` | balayage `pg_cron`, expiration des holds |
| `club.cancel_event(...)` | annulation d'un événement et de toutes ses inscriptions |
| `club._promote_from_waitlist(...)` | interne, appelée par les précédentes une fois le verrou détenu |

### Conséquences de conception

**1. Aucune écriture directe sur `club.registrations` n'est possible depuis un client.** La table ne porte **aucune** policy `INSERT`/`UPDATE`/`DELETE` : le seul chemin d'écriture est l'appel de fonction. Ce n'est pas une convention, c'est le modèle de privilèges (ADR-004). Une future page qui « oublierait » de passer par la fonction reçoit `permission denied`, pas une surcapacité silencieuse.

**2. Les fonctions sont `security definer` et vérifient elles-mêmes l'autorisation** à partir de `auth.uid()` — le demandeur est-il le titulaire de l'inscription, un `club_admin` du club concerné, ou `service_role` ? Elles sont donc appelables directement par `authenticated` (et par `anon` pour la seule décision parentale, qui s'authentifie par un jeton, US-05 AC4). Le `service_role` n'est requis que pour les traitements sans utilisateur.

**3. L'ordre de la liste d'attente est dérivé, jamais stocké.** `_promote_from_waitlist` sélectionne la plus ancienne inscription `waitlist` par `created_at` (index dédié). Aucune colonne `position` : une position stockée devrait être réécrite à chaque annulation, ce qui recrée exactement la classe de bugs que le verrou élimine.

**4. La promotion est une boucle, pas un pas.** L'annulation d'un événement, la réduction d'occupation par expiration multiple ou un retrait admin peuvent libérer plusieurs places dans la même transaction : la promotion boucle tant qu'une place est libre et qu'une inscription `waitlist` existe.

**5. La promotion d'un mineur ne le confirme pas.** Elle le fait passer en `pending_parental_authorization` et ouvre un nouveau hold de 48 h : la place est occupée pendant l'attente, cohérent avec l'invariant.

**6. Les e-mails sont enfilés dans la même transaction** (`club.email_log`, ADR-006). Une inscription qui échoue ne produit pas d'e-mail ; un e-mail enfilé correspond toujours à une inscription réellement écrite. C'est le motif *transactional outbox*, et c'est ce qui rend le verrou utile jusqu'au bout : il ne sert à rien de sérialiser l'écriture si la notification, elle, fuit.

### Ce que le verrou ne fait pas

Il ne remplace pas l'index unique partiel `(event_id, member_profile_id) WHERE status <> 'cancelled'`, qui interdit la double inscription active d'une même personne. Les deux garanties sont orthogonales : le verrou borne le cardinal, l'index borne l'unicité. L'index est en outre **partiel**, ce qui autorise la réinscription après annulation (US-04 AC7).

## Conséquences

**Positives**

- L'invariant de capacité est une propriété de la base, vérifiable par un test de concurrence, et non une intention du code applicatif.
- Les cinq chemins de mutation partagent une seule implémentation : une règle métier (le hold occupe une place) n'est écrite qu'une fois.
- `pg_cron` et l'interface web empruntent le même code : aucune divergence possible entre l'expiration automatique et l'annulation manuelle.
- L'audit du parcours d'inscription se réduit à la relecture d'un seul fichier SQL.

**Négatives / à surveiller**

- Les inscriptions à un **même** événement sont sérialisées : le débit maximal est d'une inscription à la fois par événement. À l'échelle visée (quelques dizaines de places, quelques sorties par semaine), c'est sans effet ; ce serait une limite pour une billetterie à fort trafic.
- La logique métier vit en PL/pgSQL, moins testable unitairement que du TypeScript et hors du typage de bout en bout. Compensé par des tests d'intégration sur base réelle, qui sont de toute façon les seuls capables de prouver le comportement concurrent.
- Une transaction qui prendrait le verrou puis effectuerait un appel réseau bloquerait les autres inscriptions. **Règle absolue : aucune I/O externe dans ces fonctions** — c'est précisément pourquoi l'envoi d'e-mail est différé par l'outbox.
- Un déploiement de correctif sur ces fonctions passe par une migration (ADR-001), donc par le repo de l'app. À anticiper dans le planning de lancement.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| `select count(*)` en TypeScript puis `insert` | Contrôle hors transaction : deux clients concurrents dépassent la capacité sans erreur. C'est le bug que l'US-04 AC3 interdit nommément. |
| Transactions `SERIALIZABLE` | Fonctionne, mais déplace le problème vers la gestion applicative des `40001 serialization failure` : chaque appelant doit implémenter un rejeu. Un verrou explicite sur une ligne connue est plus simple à écrire, à lire et à tester. |
| Contrainte `CHECK` sur un compteur dénormalisé `events.confirmed_count` | Le compteur doit être maintenu ; sans verrou, son incrément souffre exactement de la même course. Avec verrou, il est redondant — et il dérive silencieusement dès la première écriture manuelle en Studio (que le P0 assume pour la correction d'événements, US-06 AC3). |
| Advisory locks (`pg_advisory_xact_lock(event_id)`) | Même sérialisation, mais le verrou n'est plus attaché à une ligne : un chemin d'écriture qui oublie de le prendre passe sans erreur. `FOR UPDATE` sur la ligne réellement concernée est auto-documenté. |
| File d'attente asynchrone traitant les inscriptions une par une | Rend l'inscription non synchrone : l'utilisateur ne sait plus immédiatement s'il est confirmé ou en liste d'attente, ce qui est le cœur de l'écran D2. |
