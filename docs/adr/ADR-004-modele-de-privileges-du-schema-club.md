# ADR-004 — Modèle de privilèges du schéma `club` : RLS pour la lecture, fonctions pour l'écriture

- **Statut** : Accepté
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — sécurité
- **Dépend de** : ADR-002, ADR-003
- **Hérite de** : ADR-012 du repo de l'app (« RLS pour les lignes, GRANTs colonne pour les champs »)

---

## Contexte

Le schéma `club` porte des données de mineurs, des preuves de consentement et des autorisations parentales. Il est exposé à PostgREST, donc directement atteignable depuis un navigateur avec la clé publique `anon`.

Le repo de l'app a déjà payé le prix d'un modèle de privilèges insuffisant : sa revue de sécurité (ADR-012) a mis au jour trois classes de failles, toutes issues de la même erreur de lecture — **une policy RLS a été prise pour une autorisation métier alors qu'elle n'exprime qu'un prédicat de ligne**. Trois enseignements en sont tirés, directement transposables ici :

1. RLS ne dit rien de la **provenance** d'une valeur : un utilisateur pouvait s'auto-délivrer une preuve de consentement.
2. RLS ne sait pas restreindre les **colonnes** : une policy `UPDATE` destinée à un acquittement autorisait la réécriture de tout l'enregistrement.
3. Postgres accorde `EXECUTE` à `PUBLIC` sur toute fonction créée : une fonction `security definer` future serait appelable par `authenticated` dès sa création.

Le schéma `club` a en outre une contrainte propre (ADR-003) : la capacité d'un événement n'est garantie que si **aucune** écriture directe sur `club.registrations` n'est possible.

## Décision

### 1. La lecture est gouvernée par RLS, l'écriture par des fonctions

| | Mécanisme | Objets concernés |
|---|---|---|
| **Lecture** | policies RLS, table par table | toutes les tables `club` |
| **Écriture métier** | fonctions `security definer` qui vérifient l'autorisation à partir de `auth.uid()` | `registrations`, `parental_authorizations`, `consents`, `email_log`, statut des `events` |
| **Écriture déclarative** | policy `INSERT` RLS, quand la règle est intégralement exprimable par un prédicat de ligne | `member_profiles` (son propre profil), `events` (création par un `club_admin` de son club) |

La ligne de partage : **si la règle porte sur autre chose que la ligne écrite — un cardinal, une transition d'état, une preuve à horodater — elle n'est pas exprimable en RLS et passe par une fonction.** Écrire une policy pour ces cas donnerait l'illusion d'un contrôle qui n'existe pas.

Conséquence directe : `club.registrations`, `club.parental_authorizations`, `club.consents`, `club.email_log` et `club.export_log` n'ont **aucune** policy d'écriture. Toute tentative d'`insert` depuis un client échoue, y compris avec un jeton valide.

### 2. `UPDATE` n'est jamais accordé par défaut

Reprise littérale d'ADR-012 §3, pour la même raison (RLS ne restreint pas les colonnes) et pour la propriété d'**échec bruyant** : une table oubliée renvoie `permission denied` en développement, au lieu d'être sur-autorisée en silence.

```sql
alter default privileges in schema club
  grant select, insert, delete on tables to authenticated;   -- pas d'UPDATE
alter default privileges in schema club
  grant select on tables to anon;
alter default privileges in schema club
  grant select, insert, update, delete on tables to service_role;
```

Une seule table reçoit un `GRANT UPDATE`, au niveau colonne :

| Table | `UPDATE` accordé à `authenticated` | Motif de l'exclusion |
|---|---|---|
| `club.member_profiles` | `(first_name, last_name, phone)` | `birth_date` détermine la minorité à la date de l'événement, donc le régime légal de toutes les inscriptions en cours. Sa correction est un acte serveur qui **recalcule** les inscriptions actives, pas une écriture libre. |
| toutes les autres | aucun | écriture par fonction, ou table en lecture seule |

### 3. `EXECUTE` n'est pas accordé à `PUBLIC`, et chaque fonction déclare son audience

```sql
alter default privileges in schema club revoke execute on functions from public;
alter default privileges in schema club grant execute on functions to service_role;
```

puis, explicitement, fonction par fonction :

| Fonction | Audience | Pourquoi |
|---|---|---|
| `club.list_upcoming_events`, `club.get_event_public`, `club.get_club_public` | `anon`, `authenticated` | agenda et détail d'une sortie, consultables sans compte (US-02, US-04 AC1) |
| `club.get_parental_authorization`, `club.decide_parental_authorization` | `anon`, `authenticated` | le parent n'a pas de compte (US-05 AC4) ; l'authentification est portée par le jeton |
| `club.register_for_event`, `club.cancel_registration`, `club.create_event`, `club.cancel_event`, `club.event_roster`, `club.my_registrations` | `authenticated` | autorisation vérifiée dans le corps de la fonction |
| `club.expire_parental_holds`, `club.purge_expired_member_data`, `club._promote_from_waitlist`, `club._cancel_registration`, `club.enqueue_email`, `club.member_email` | `service_role` (et `postgres` pour les tâches planifiées) | traitements sans utilisateur, ou primitives internes sans contrôle d'autorisation |

Toute fonction `security definer` porte en outre, sur sa propre ligne, un `revoke all ... from public, anon, authenticated` explicite quand elle est interne — redondant avec le défaut, lisible au point d'usage.

### 4. Deux fonctions exposées à `anon`, et pourquoi c'est acceptable

`club.get_parental_authorization(p_token)` et `club.decide_parental_authorization(p_token, ...)` sont appelables sans authentification : c'est l'exigence produit (US-05 AC4, « aucune création de compte n'est requise »). Le jeton **est** le facteur d'authentification. Il est donc :

- **imprévisible** : 244 bits d'aléa cryptographique (deux `gen_random_uuid()` concaténés), soit très au-delà de ce qu'un balayage réseau peut couvrir ;
- **à durée de vie courte** : 48 h, adossée à `hold_expires_at` — le même horodatage qui gouverne l'expiration métier, donc jamais désynchronisé ;
- **à usage unique** : consommé par la première décision, `used_at` horodaté ; toute réutilisation renvoie l'état « déjà traité » sans effet ;
- **de portée minimale** : il n'ouvre aucune session, ne donne accès qu'à une inscription précise, et l'écran ne révèle que le prénom de l'enfant et les informations de la sortie.

Le jeton est stocké **en clair**. C'est une concession assumée : l'e-mail étant construit de façon asynchrone par le dispatcher (ADR-006), un jeton haché ne pourrait plus être reconstitué pour bâtir l'URL. Le risque résiduel — une lecture de la base donnant accès à des jetons valides moins de 48 h, pour une action réversible et tracée — est jugé inférieur au coût d'un envoi synchrone, qui ferait une I/O réseau sous verrou (interdit par ADR-003).

Une limitation de débit par IP sur ces deux fonctions est portée au P1 : elle n'ajoute rien face à 244 bits d'entropie, mais protège des balayages coûteux.

### 5. Les e-mails ne sortent jamais des tables, ils sortent des fonctions

`auth.users.email` n'est lisible par aucun rôle client. Les deux besoins légitimes sont servis par des fonctions `security definer` qui vérifient d'abord le rôle `club_admin` du club concerné :

- `club.event_roster(p_event_id)` — la liste des inscrits de l'écran F3 et de l'export CSV, nom, prénom, e-mail, statut ;
- `club.enqueue_email(...)` / `club.member_email(...)` — internes, `service_role` uniquement.

Aucune adresse e-mail n'est dupliquée dans le schéma `club`, à l'exception de `parent_email` — qui n'appartient à aucun compte et n'a pas d'autre source.

### 6. Ces garanties sont testées, pas seulement écrites

Les invariants de cette ADR ne se voient pas à la relecture d'une policy. Ils sont couverts par des tests d'intégration sur base réelle (liste dans `docs/architecture.md` §Tests) : `insert` direct dans `registrations` par `authenticated` ⇒ refusé ; `update` de `member_profiles.birth_date` par son titulaire ⇒ `permission denied for column` ; `select` de `club.event_roster` par un admin d'un autre club ⇒ refusé ; appel de `club.expire_parental_holds` par `authenticated` ⇒ refusé ; et un **inventaire** vérifiant qu'aucune colonne hors liste blanche n'accorde `UPDATE` à `authenticated` dans le schéma `club`.

### 7. Deux policies qui se référencent mutuellement provoquent une récursion — trouvé en exécution, pas en relecture

`events_read_own_registration` (sur `club.events`) interroge `club.registrations` ; `registrations_select_admin` (sur `club.registrations`) interrogeait `club.events`. Chacune, prise séparément, semble correcte à la lecture — la relecture de policy ne fait pas apparaître le cycle, seule l'exécution le révèle (`ERROR: infinite recursion detected in policy for relation "events"`).

Le principe déjà appliqué à `is_club_admin`/`is_super_admin` (une fonction `security definer` bypass la RLS de la table qu'elle interroge, parce qu'elle s'exécute comme le propriétaire de la fonction) se généralise : dès qu'une policy sur la table A doit lire la table B, et qu'une policy sur B lit A, l'une des deux lectures croisées doit passer par une fonction `security definer` plutôt qu'une sous-requête brute. Concrètement, `club.event_club_id(p_event_id)` et `club.has_own_registration(p_event_id)` (toutes deux `20260812093200_club_events_registrations.sql`) portent chacune une des deux lectures croisées, cassant le cycle.

**Pourquoi ce n'est apparu qu'à l'usage du dashboard admin (US-06)**, alors que le schéma existait déjà : tous les chemins d'écriture/lecture testés jusque-là (`register_for_event`, `cancel_registration`, `list_upcoming_events`…) passent par des fonctions `security definer`, qui bypassent la RLS des deux tables — le cycle n'était donc jamais évalué. Le dashboard admin est le premier endroit du produit qui lit `events` et `registrations` **directement** (`.from("events").select(...)`, pas via une fonction), exactement le chemin qui déclenche la récursion. Leçon générale pour la suite : un test de lecture directe (pas seulement via RPC) sur chaque paire de tables dont les policies se citent mutuellement, avant `developer`.

## Conséquences

**Positives**

- La garantie de capacité d'ADR-003 devient inviolable : il n'existe aucun chemin d'écriture qui contourne le verrou.
- Les erreurs de sécurité constatées dans l'app ne peuvent pas se reproduire ici : les mêmes défauts sont fermés dès la première migration, avant tout code.
- Le périmètre d'audit est borné : sept fonctions et une quinzaine de policies décrivent l'intégralité de ce qui est faisable sur le schéma.
- Une fonction `security definer` créée plus tard n'est appelable par personne tant que son audience n'est pas déclarée.

**Négatives / à surveiller**

- Le contrat client n'est plus « une table = un endpoint » : le `developer` doit passer par `rpc()` pour toute mutation, ce qui est moins immédiat que `.insert()`.
- Ajouter une colonne modifiable à `member_profiles` demande d'étendre le `GRANT`, sans quoi l'écriture échoue en développement. C'est le prix du modèle, et l'échec est bruyant.
- La correction d'une `birth_date` erronée exige une action serveur dédiée (recalcul des inscriptions actives). Non couverte au P0 : à traiter en Studio, en appelant `club.recompute_event_minor_flags` sur les événements concernés.
- `search_path` doit être figé sur chaque fonction `security definer` (`set search_path = club, pg_catalog`) : un oubli est une élévation de privilèges classique. À vérifier en revue.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Policies `INSERT`/`UPDATE` RLS sur `registrations` | Ne peuvent pas exprimer « au plus N confirmés » ni une transition d'état valide. Donneraient l'apparence d'un contrôle inexistant. |
| Toutes les mutations via des Server Actions utilisant `service_role` | Déplace l'autorisation entière dans le TypeScript : une route oubliée n'a plus aucun filet côté base, et la clé `service_role` circule dans davantage de chemins de code. |
| Jeton parental haché en base | Incompatible avec l'envoi asynchrone (le dispatcher ne peut pas reconstruire l'URL). Le gain est faible pour un secret à 48 h à usage unique. |
| Exposer `club.registrations` en lecture à `anon` pour afficher les places restantes | Divulguerait la liste des participants. Les places restantes sont calculées et renvoyées par `club.list_upcoming_events`, qui n'expose que des agrégats. |
