# ADR-005 — Traitements planifiés : `pg_cron` en base, Vercel Cron pour le seul relais e-mail

- **Statut** : Accepté
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — exploitation
- **Dépend de** : ADR-003, ADR-006
- **Feature déclenchante** : US-05 (AC7, expiration du hold parental à 48 h)
- **Diverge de** : ADR-011 du repo de l'app (Vercel Cron + file de jobs) — voir §Comparaison

---

## Contexte

Deux traitements ne sont déclenchés par aucune action utilisateur :

| Traitement | Fréquence exigée | Nature |
|---|---|---|
| Expiration des holds parentaux à 48 h (US-05 AC7) | ≤ 15 min de latence | pur SQL : expirer, annuler, promouvoir, enfiler des e-mails |
| Relais des e-mails en attente ou en échec (ADR-006) | quelques minutes | HTTP sortant vers le prestataire |
| *(P1, sous réserve juridique)* purge des données d'inscription à 3 ans | quotidienne | pur SQL |

Le premier a une exigence de **ponctualité** : une place bloquée par un hold expiré n'est pas rendue à la liste d'attente tant que le traitement n'a pas tourné. Un retard se paie en places perdues sur une sortie qui a lieu la semaine même.

Le brief a tranché (`pg_cron`, toutes les 15 minutes). Cette ADR formalise ce choix, en explicite la ligne de partage avec le relais e-mail, et documente pourquoi le site diverge de l'ADR-011 de l'app.

## Décision

**Un traitement dont le corps est intégralement SQL est planifié par `pg_cron`. Un traitement qui nécessite une I/O sortante est planifié par Vercel Cron.**

### 1. `pg_cron` pour l'expiration des holds

```sql
select cron.schedule(
  'club-expire-parental-holds',
  '*/15 * * * *',
  $$select club.expire_parental_holds()$$
);
```

`club.expire_parental_holds()` emprunte exactement les mêmes fonctions verrouillées que les chemins interactifs (ADR-003) : elle expire l'autorisation, annule l'inscription, déclenche la promotion de la liste d'attente et enfile les e-mails. Aucune logique métier n'est réécrite pour le cas automatique — c'est la propriété qui compte le plus, davantage que le choix de l'ordonnanceur.

Trois raisons, par ordre d'importance :

1. **Aucune surface réseau.** Le traitement s'exécute dans la transaction qui détient déjà le verrou. Il n'y a ni jeton d'appel à protéger, ni endpoint public à durcir, ni requête qui puisse partir deux fois.
2. **Aucune dépendance de plan.** `pg_cron` est disponible sur tous les plans Supabase. Le site n'hérite d'aucune contrainte de facturation Vercel pour tenir son exigence de 15 minutes.
3. **La donnée et le traitement sont au même endroit.** Un hold expiré est un fait dérivable d'une colonne `hold_expires_at` : le calculer ailleurs qu'en base est un aller-retour sans valeur ajoutée.

Contraintes d'exploitation à connaître : `pg_cron` ne s'exécute que sur la base `postgres`, ses tâches tournent sous le rôle qui les a planifiées (`postgres`), l'extension doit être activée sur le projet (dashboard Supabase, ou `create extension pg_cron`), et la table `cron.job_run_details` est la source de vérité pour la supervision. **L'activation de l'extension et la planification portent sur le projet Supabase partagé avec l'app** : à annoncer côté app comme tout changement d'infrastructure commune (ADR-001).

**Exception explicite au motif de garde du repo de l'app — ne pas « harmoniser ».** `erase_account()` (app, `0002_identity_consents.sql`) vérifie la revendication `role` du JWT de l'appelant (`current_setting('request.jwt.claims', true)::jsonb ->> 'role'`) plutôt que `current_user`, parce que sous `security definer`, `current_user` vaut toujours le propriétaire de la fonction — un contrôle qui ne vérifie rien. `club.expire_parental_holds()` et `club.purge_expired_member_data()` **ne reproduisent pas ce motif**, délibérément : `pg_cron` exécute ses tâches par une connexion directe à la base, hors de tout cycle de requête PostgREST — `request.jwt.claims` y est vide. Un contrôle sur cette revendication échouerait **à chaque exécution planifiée**, silencieusement (la fonction lèverait une exception, `cron.job_run_details` la journalise mais n'alerte personne par défaut — voir §Conséquences). La seule garde retenue ici est le privilège : `revoke all ... from public, anon, authenticated; grant execute ... to service_role, postgres;`. C'est suffisant et strictement nécessaire — ni plus (le motif JWT n'apporte rien dans ce contexte d'exécution), ni moins (sans le `revoke`, `EXECUTE` resterait accordé à `PUBLIC` par défaut, comme documenté côté app).

### 2. Vercel Cron pour le seul relais e-mail — et en filet, pas en chemin principal

L'envoi effectif d'un e-mail est un appel HTTP : il ne peut pas se produire sous le verrou d'ADR-003, ni dans une fonction SQL. Le chemin nominal est donc l'envoi **immédiat après commit**, depuis la Server Action, via `after()` de Next.js — l'utilisateur a déjà sa réponse, l'envoi se poursuit hors du cycle de rendu.

Le cron n'intervient que pour ce que ce chemin ne couvre pas : les échecs de livraison, et les lignes enfilées par `pg_cron` (une expiration de hold n'a pas de Server Action derrière elle).

```
POST /api/cron/dispatch-emails     — toutes les 5 minutes, protégé par CRON_SECRET
```

L'idempotence est garantie en amont par `club.email_log` (ADR-006), pas par la ponctualité du cron : un déclenchement en double ne peut pas produire un envoi en double.

### 3. La purge de conservation existe mais n'est pas planifiée

`club.purge_expired_member_data()` est écrite dès la première migration, avec sa règle (3 ans après la dernière participation confirmée) et sa réserve : le registre de preuve de consentement suit sa propre politique et **n'est pas purgé** par cette fonction. Sa planification `cron.schedule` est livrée **commentée**, et n'est activée qu'après la validation juridique de la durée, encore ouverte au PRD §8.

Écrire la fonction sans l'activer est délibéré : la conservation illimitée par défaut est le mode de défaillance normal des projets qui remettent la purge à plus tard. Ici, il ne restera qu'une ligne à décommenter.

## Comparaison avec l'ADR-011 de l'app

L'app a retenu Vercel Cron + une file de jobs en base, avec une justification qui ne s'applique pas ici :

| | App (ADR-011) | Site (cette ADR) |
|---|---|---|
| Corps du traitement | moteur à règles TypeScript + appels LLM, 2 à 10 s par utilisateur | quelques `UPDATE` et `INSERT` |
| Contrainte dominante | ne pas dépasser la durée d'une fonction serverless | rendre une place dans les 15 min |
| Réutilisation de code | `@hybride/rules-engine`, impossible à exécuter en SQL | aucune : la logique est déjà en SQL (ADR-003) |
| Conséquence | Cron déclenche, la file exécute | la base fait tout |

La divergence est donc cohérente, pas accidentelle : dans les deux cas, **le traitement s'exécute là où vit sa logique**. L'app ne pouvait pas descendre son moteur en base ; le site n'a aucune raison de faire remonter le sien.

## Conséquences

**Positives**

- L'exigence des 15 minutes est tenue sans dépendre du plan Vercel du site.
- Le chemin automatique et le chemin manuel partagent le même code : une correction de la règle de promotion vaut pour les deux.
- Aucun endpoint public supplémentaire pour un traitement qui manipule des données de mineurs.
- La purge RGPD est prête à activer, pas à écrire.

**Négatives / à surveiller**

- **Supervision à mettre en place** (`devops`) : `cron.job_run_details` n'alerte pas tout seul. Un job qui échoue silencieusement bloque des places sans que personne ne le voie. Une requête d'état hebdomadaire est le minimum ; une alerte sur `status = 'failed'` est la cible.
- L'activation de `pg_cron` modifie l'infrastructure partagée avec l'app — coordination requise.
- La logique planifiée est invisible depuis le code du site : un `developer` qui lit le repo ne voit pas qu'un traitement tourne toutes les 15 minutes. Compensé par une section dédiée de `docs/architecture.md` et par le nommage explicite du job (`club-expire-parental-holds`).
- La fenêtre d'expiration réelle est de 48 h à 48 h 15. Cohérent avec le message produit (« sous 48h ») à condition que l'écran ne promette pas une expiration à la seconde.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Vercel Cron appelant une route qui exécute le SQL | Ajoute un endpoint public, un secret à gérer et une dépendance de plan, pour exécuter du SQL que la base peut déclencher elle-même. |
| Expiration paresseuse, évaluée à la lecture | Une place expirée ne serait rendue que si quelqu'un consulte la page. La promotion depuis la liste d'attente n'aurait aucun déclencheur, et l'e-mail de promotion non plus. |
| `pg_cron` + `pg_net` pour envoyer aussi les e-mails depuis la base | Rend la base responsable d'appels HTTP sortants, avec une gestion d'erreur et de retry à réécrire en SQL, et sans accès aux gabarits d'e-mail écrits en TypeScript. |
| Réutiliser la file `job_queue` de l'app | Table du schéma `public`, propriété de l'entité commerciale : contredit ADR-002 et créerait un couplage de déploiement entre les deux produits. |
| Fenêtre d'expiration vérifiée toutes les minutes | Aucun gain produit (le parent a 48 h), 15 fois plus d'exécutions sur une base partagée. |
