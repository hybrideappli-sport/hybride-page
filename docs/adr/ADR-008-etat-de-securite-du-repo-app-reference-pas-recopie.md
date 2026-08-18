# ADR-008 — L'état de sécurité du repo app se lit dans ses migrations, jamais recopié ici

- **Statut** : Accepté
- **Date** : 2026-08-12
- **Décideur** : orchestrateur (session site), sur instruction explicite de l'utilisateur
- **Portée** : Projet — documentation, coordination inter-repos
- **Dépend de** : ADR-001 (coordination des migrations)
- **Déclencheur** : une fausse alerte de sécurité, produite en une seule session, par la lecture d'une documentation périmée plutôt que du code source de vérité

---

## Contexte

Pendant la rédaction du plan technique de ce repo, `architect` a documenté (`docs/architecture.md` §6, version initiale) que `public.erase_account()`, côté app, contenait une faille : un garde `pg_has_role(current_user, 'service_role', 'member')` inopérant sous `security definer` (`current_user` y vaut toujours le propriétaire de la fonction, le test est donc vrai pour n'importe quel appelant). Le diagnostic technique était juste. La conclusion — qu'il s'agissait d'une faille **présente** — était fausse : la fonction avait déjà été corrigée côté app le **2026-08-09**, trois jours avant cette session, en exactement le sens recommandé (vérification de la revendication `role` du JWT plutôt que de `current_user`).

La source de l'erreur : `architect` avait lu `hybrideappli/docs/db-schema.md`, qui montrait encore l'ancien code. Le fichier de migration réel (`hybrideappli/supabase/migrations/0002_identity_consents.sql`), qui contenait le correctif ainsi que son propre journal de révision daté, n'avait pas été consulté à cette étape.

Ce repo a depuis produit sa propre documentation touchant à la sécurité de l'app (ce document, et des renvois dans `docs/architecture.md`, `00-brief-site-hybride.md`, ADR-001, ADR-005). Sans règle explicite, cette documentation devient à son tour une photo — exacte au 2026-08-12, potentiellement fausse dès la prochaine migration côté app.

## Décision

**Toute affirmation sur l'état de sécurité du repo app, dans ce repo, référence une migration par son nom de fichier plutôt que de décrire ce qu'elle contient.**

Ce qui est vérifié et référencé à ce jour (2026-08-12, branche `feature/design-system-hybride` du repo app) :

| Sujet | Référence | Ce qui a été vérifié, pas juste lu |
|---|---|---|
| Garde `erase_account()` | `hybrideappli/supabase/migrations/0002_identity_consents.sql` (corps de fonction + journal de révision daté 2026-08-09) | Lecture du DDL réel, pas de la doc |
| Privilège `EXECUTE` par défaut fermé à `PUBLIC` | `hybrideappli/supabase/migrations/0001_extensions_enums_helpers.sql` | `alter default privileges` global + `in schema public`, les deux formes présentes |
| `CREATE` sur `public` jamais rendu à `PUBLIC`/`anon`/`authenticated` | grep sur l'ensemble de `hybrideappli/supabase/migrations/*.sql` | Absence confirmée, pas déduite du défaut Postgres 15+ seul |
| Vecteur `pg_temp` sur les 7 fonctions `security definer` du repo app | `hybrideappli/supabase/migrations/0016_security_definer_search_path_hardening.sql` | Audit par grep du corps de chacune ; 2 vecteurs réels trouvés (`has_active_consent`, `is_staff`) et corrigés, 5 non exploitables (EXECUTE `service_role` seul) corrigés par cohérence |
| Écriture de `profiles.app_enrolled` | `hybrideappli/supabase/migrations/0015_club_app_enrolled.sql`, `0017_app_enrolled_from_signup_metadata.sql` | Lecture du trigger `handle_new_user()` réel : c'est lui qui crée la ligne, pas un appelant côté site |
| Garde `pg_cron` ≠ garde JWT | ADR-005 §1, `hybrideappli` fonctions `club.*` n'existent pas côté app — sans objet ici, la note dans ADR-005 documente le repo **site** | — |
| Vecteur `pg_temp`, 18 fonctions `security definer` **de ce repo** (site) | `supabase/migrations/20260812093500_club_transactional_functions.sql`, `…093100_club_core_tables.sql`, `…093600_club_scheduled_jobs.sql` | grep : zéro référence non qualifiée, toutes préfixées `club.` — vecteur sans prise, `pg_temp` absent de `search_path` sans conséquence pratique |

**Règle d'écriture, pour toute future note touchant l'app dans ce repo :**

1. Citer le fichier de migration (et, si pertinent, le commit) — jamais `docs/db-schema.md` seul comme preuve d'un état de sécurité.
2. Ne pas paraphraser un corps de fonction en prose durable : soit une citation directe (bloc de code), soit un renvoi au fichier.
3. Dater l'affirmation. Une note non datée sur l'état d'un repo qu'on ne pilote pas est un mode de défaillance en soi.
4. En cas de doute entre la doc et la migration, **la migration gagne toujours** — c'est elle qui s'exécute.

## Conséquences

**Positives**

- Une régression future côté app (garde réintroduit par erreur, `grant` élargi) n'entraîne pas une correction silencieusement obsolète ici : ce document ne prétend rien retenir de l'état de l'app au-delà de la référence.
- Le lecteur de ce repo sait où vérifier lui-même plutôt que de faire confiance à une paraphrase.

**Négatives / à surveiller**

- Coût de lecture plus élevé pour qui veut l'état de sécurité de l'app sans ouvrir l'autre repo — assumé : la source de vérité vit là où le code vit.
- Ce document lui-même a une date de péremption implicite : si le repo app renomme ou fusionne les migrations citées, les renvois du tableau ci-dessus cessent d'être exacts. Aucune automatisation prévue pour le détecter au P0 — relecture manuelle avant chaque jalon de lancement.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Recopier l'état de sécurité vérifié (corps de fonction, grants) dans `docs/architecture.md` | C'est exactement le mécanisme qui a produit la fausse alerte initiale — une doc devient une photo, une migration ultérieure la rend fausse sans le signaler. |
| Ne rien documenter, se fier à la mémoire de session | Perd l'information pour la prochaine session ; le renvoi par nom de fichier coûte une ligne et ne pourrit pas. |
| Faire de ce document une doc vivante mise à jour à chaque migration app | Demande une discipline de synchronisation entre deux repos que rien n'impose ; le renvoi par fichier n'a pas ce besoin, il reste correct par construction. |

---

## Historique

- 2026-08-12 — Création, suite à la fausse alerte sur `erase_account()` et à la demande explicite de ne pas reproduire ce mode de défaillance.
