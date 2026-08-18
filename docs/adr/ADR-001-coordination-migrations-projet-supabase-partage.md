# ADR-001 — Coordination des migrations sur un projet Supabase partagé par deux repos

- **Statut** : Accepté
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — base de données / livraison
- **Dépend de** : —
- **Est requis par** : ADR-002 (schéma `club`), toutes les US P0
- **Déclencheur** : le brief prévoit des migrations club numérotées « en continuité » de celles de l'app (`0015`, `0016`…) mais hébergées dans un **autre repo** que celui qui a produit `0001`…`0014`.

---

## Contexte

Deux repos distincts alimentent **un seul projet Supabase cloud** (`hybrideclub`, eu-west-1) :

| Repo | Rôle | Migrations |
|---|---|---|
| `hybrideappli` | app commerciale (coach IA) | `0001_…` → `0014_…`, séquentielles, sans trou |
| `hybride-page` (ce repo) | site Hybride (vitrine + points club) | à créer, schéma `club` |

Supabase ne suit pas les migrations « par repo » : il maintient **une seule table d'historique par base**, `supabase_migrations.schema_migrations`, dont la clé est la **version** — c'est-à-dire le préfixe numérique du nom de fichier, sans aucune notion d'origine. Trois propriétés de la CLI en découlent, et elles sont toutes structurantes ici :

1. **La version est la seule identité d'une migration.** Deux fichiers nommés `0015_...sql` dans deux repos différents sont, pour la CLI, *la même migration*.
2. **`supabase db push` calcule les migrations en attente en comparant les fichiers locaux à l'historique distant.** Si l'historique distant contient une version présente en local, elle est considérée comme **déjà appliquée** et le fichier local est **ignoré, silencieusement**.
3. **La CLI exige que l'historique distant soit un préfixe des fichiers locaux.** Une version présente à distance mais absente du répertoire local fait échouer `db push` (« remote migration versions not found in local migrations directory », remède : `supabase migration repair`). Une version locale antérieure à la dernière version distante déclenche l'erreur d'insertion hors ordre (remède : `--include-all`).

### Le scénario catastrophe, qui n'est pas hypothétique

Le brief prévoit d'écrire `0015_club_schema.sql` dans ce repo, après avoir vérifié que l'app est à `0014`. Si l'app crée son propre `0015_…` entre cette vérification et le déploiement du site :

- l'app pousse `0015` (le sien) → l'historique distant contient désormais la version `0015` ;
- le site pousse ensuite : la CLI voit la version `0015` déjà appliquée, **n'exécute pas** le fichier du site, et ne signale rien ;
- le schéma `club` n'existe pas en production, mais l'historique affirme le contraire.

L'échec est **silencieux**, il se manifeste plus tard sous forme d'erreurs `relation "club.events" does not exist` en production, et la correction demande de réparer l'historique à la main. Le protocole du brief (« relister les migrations avant d'écrire ») réduit la probabilité de la collision, mais il ne peut pas l'éliminer : c'est une vérification à un instant t sur une ressource qui bouge, exécutée depuis un repo qui n'a aucun moyen d'en verrouiller un autre.

Conséquence : **la numérotation séquentielle partagée entre deux repos est écartée, quelle que soit la discipline appliquée.** Ce n'est pas un choix de style, c'est la suppression d'un mode de défaillance silencieux.

### La contrainte moins visible

La propriété (3) a une conséquence que le brief n'anticipait pas : **un repo ne peut pousser vers un projet que s'il contient l'intégralité de l'historique appliqué à ce projet.** Ce repo, qui ne contiendra jamais les migrations `0001`…`0014` de l'app, ne peut donc structurellement pas exécuter `supabase db push --linked` sur le projet partagé. Et symétriquement, dès qu'une migration club est appliquée au projet, **le repo de l'app ne peut plus pousser** tant qu'il ne possède pas ce fichier.

Autrement dit : le projet cloud impose l'existence d'un **répertoire unique contenant l'union des migrations**. La seule question ouverte est de savoir *lequel* des deux répertoires joue ce rôle.

## Décision

### 1. Versionnement par horodatage UTC, jamais par compteur

Toute migration produite par ce repo est nommée selon le format par défaut de la CLI :

```
supabase/migrations/<YYYYMMDDHHMMSS>_<slug>.sql
```

généré par `supabase migration new <slug>`. Aucun compteur séquentiel, jamais.

Deux propriétés en découlent :

- **La collision est impossible sans coordination.** Une version horodatée à la seconde est auto-attribuée ; deux sessions ne peuvent pas choisir la même sans agir dans la même seconde. Le mode de défaillance silencieux décrit ci-dessus disparaît.
- **L'ordre global est chronologique.** `'0014' < '20260812093000'` en comparaison lexicographique : toute migration club se place, dans l'ordre d'application, après l'ensemble des migrations séquentielles existantes de l'app. Le schéma `club` étant additif (ADR-002), cet ordre est le bon.

Corollaire adressé à l'app, à titre de recommandation : **numéroter également ses futures migrations par horodatage** à partir de la prochaine. Tant que l'app continue en `0015`, `0016`…, chaque nouvelle migration de l'app créée *après* une migration club déjà appliquée se trouvera « hors ordre » et exigera `supabase db push --include-all`. Ce n'est pas dangereux (les schémas sont disjoints), mais c'est une friction récurrente qui disparaît dès que les deux côtés partagent la même convention. Point de coordination, pas une dépendance bloquante.

### 2. Le repo de l'app est le **répertoire d'application** ; ce repo est le **répertoire d'auteur**

| | Répertoire d'auteur | Répertoire d'application |
|---|---|---|
| **Où** | `hybride-page/supabase/migrations/` | `hybrideappli/supabase/migrations/` |
| **Contient** | les migrations `club` uniquement | l'union : app + copies conformes des migrations club |
| **Sert à** | écrire, relire en PR, `supabase start` / `db reset` en local | `supabase db push --linked` vers le projet cloud partagé |

Le répertoire d'application est celui de l'app parce qu'il contient **déjà** l'historique complet : c'est le seul choix qui ne demande de recopier aucun fichier existant, et qui laisse la commande de déploiement de l'app fonctionner sans changement.

**Procédure de livraison d'une migration club** (à exécuter par `devops`, jamais par `developer` en cours de feature) :

1. Écrire et valider la migration dans ce repo, sur la branche de la feature (`supabase db reset` en local, tests verts).
2. `supabase migration list --linked` depuis le repo de l'app, pour observer l'historique distant réel.
3. Copier le fichier **à l'octet près, sans renommage**, vers `hybrideappli/supabase/migrations/`.
4. `supabase db push --linked --dry-run` depuis le repo de l'app, vérifier que seule la migration attendue est en attente, puis pousser.
5. Commiter le fichier copié dans le repo de l'app, en référençant la PR d'origine côté site.

**Immuabilité.** Une migration copiée dans le répertoire d'application n'est plus jamais modifiée, des deux côtés. Toute correction est une nouvelle migration. C'est la règle qui rend la duplication du fichier sans danger : deux copies d'un fichier figé ne peuvent pas diverger.

**Garde-fou local** (les deux repos vivent sur la même machine, sous `~/Hybride/`) : un script `scripts/check-migrations-mirror.sh` compare les sommes de contrôle des migrations club présentes des deux côtés et signale toute divergence ou tout fichier non encore livré. Exécuté à la main avant un déploiement, il rend l'état visible en une commande. Ce n'est pas une CI — l'autre repo n'est pas accessible depuis le runner — c'est un outil de poste de travail, et c'est suffisant à cette échelle.

**Interdiction explicite dans ce repo** : aucun `project_id` de production n'est commité dans `supabase/config.toml`, et le `package.json` n'expose **aucun** script `db:push`. La seule commande base de données disponible ici est locale (`supabase db reset`). L'impossibilité technique décrite en §Contexte devient ainsi une interdiction lisible plutôt qu'une erreur découverte en la déclenchant.

### 3. Le développement local de ce repo n'a pas besoin du schéma de l'app

Les migrations `club` ne référencent que `auth.users` (fournie par `supabase start`) et aucun objet du schéma `public` de l'app. Un `supabase db reset` dans ce repo produit donc une base **complète pour tout le périmètre club** : c'est ce qui rend le découplage des deux répertoires viable au quotidien.

Une seule écriture du site touche une table de l'app : `public.profiles` à la création de compte (US-03 AC1). Pour la rendre exécutable en local, un dump **généré, non autoritatif** du schéma `public` de l'app est chargé au `db reset` :

```toml
# supabase/config.toml
[db.seed]
enabled = true
sql_paths = ["./local-baseline/app_public_schema.sql", "./seed.sql"]
```

`local-baseline/app_public_schema.sql` est produit par `supabase db dump --schema public` depuis le repo de l'app, porte un en-tête `-- GENERATED — ne pas éditer à la main`, n'est **jamais** une migration et n'est **jamais** poussé. Il est régénéré quand le schéma de l'app évolue de façon qui concerne le site.

### 4. Les changements sur les tables de l'app sont écrits par l'app

Ce repo ne produit **aucune** migration touchant un objet du schéma `public`. Le point de coordination concret et déjà identifié :

```sql
-- À écrire dans hybrideappli/supabase/migrations/, PAS ici.
alter table public.profiles
  add column app_enrolled boolean not null default true;

comment on column public.profiles.app_enrolled is
  'false = compte créé depuis le parcours club, non enrôlé dans les automatismes de l''app.
   Tout job applicatif ciblant l''ensemble des profils doit filtrer app_enrolled = true.';
```

Trois éléments accompagnent cette migration, tous du ressort du repo de l'app :

1. le backfill est implicite (`default true`) — les comptes existants restent enrôlés ;
2. `enqueueWeeklyReviews` (et tout job futur balayant `public.profiles`) ajoute `.eq("app_enrolled", true)` — c'est le correctif de la fuite de finalité identifiée dans le brief, qui existe indépendamment du site ;
3. `app_enrolled` est exclu de tout `grant insert (...)` / `grant update (...)` accordé à `authenticated` — sans quoi un compte pourrait s'auto-enrôler. Corollaire côté site : la création de la ligne `public.profiles` du parcours club se fait **côté serveur avec `service_role`**, pas depuis le navigateur.

**Cette migration est un prérequis de mise en production du site** : sans elle, toute personne créant un compte pour une sortie du club entre dans les automatismes commerciaux de l'app. Elle est donc portée au jalon de lancement comme une dépendance dure, au même titre que les textes juridiques.

Point à vérifier avant d'écrire le code de création de compte : l'app crée aujourd'hui `public.profiles` **depuis le client** (policy `profiles_insert_own`), sans trigger sur `auth.users`. Si l'app introduit un jour un trigger `handle_new_user`, l'insertion du site entrera en conflit ; le cas doit alors être traité par un `on conflict (id) do update` côté site, et l'information remonte depuis le repo de l'app.

> **Mise à jour du 2026-08-12 — l'hypothèse ci-dessus était fausse, pas seulement un risque futur.**
> Le trigger `handle_new_user` existe déjà (`0002_identity_consents.sql`, `on_auth_user_created after insert on auth.users`) et crée systématiquement la ligne `profiles` — il n'y a jamais eu de fenêtre où le site aurait pu insérer le premier. Livré côté app le jour même (migrations `0015`, `0016`, `0017`, branche `feature/design-system-hybride`) :
>
> - `0015` : colonne `app_enrolled` telle que définie ci-dessus (SQL inchangé).
> - `0016` : durcissement `search_path` de `handle_new_user` et de 6 autres fonctions `security definer` du repo app contre un vecteur de détournement par table temporaire (`pg_temp`), trouvé pendant l'audit de sécurité déclenché par ce point — voir `docs/architecture.md` §6 pour le renvoi, détail dans les migrations elles-mêmes.
> - `0017` : **corrige le mécanisme d'écriture.** Ce n'est PAS le site qui insère `app_enrolled = false` via `service_role` (§4.3 ci-dessus, devenu obsolète) — c'est `handle_new_user()` qui le dérive de `raw_user_meta_data.origin`, passé par le site à son propre `signUp()` (`{ data: { origin: 'club' } }`). Aucune écriture directe du site sur `public.profiles`, dans aucun sens. Le corollaire du point 3 (« création côté serveur avec `service_role` ») ne s'applique donc plus : `signUp()` est un appel client standard, anon suffit.
>
> Au passage, le garde `pg_has_role(current_user, ...)` d'`erase_account()` que ce document citait comme piège potentiel (§ce document ne le citait pas explicitement, mais le même schéma de bug) était déjà corrigé côté app depuis le 2026-08-09 — la documentation (`docs/db-schema.md`) était simplement périmée au moment de la rédaction de cet ADR. Ne pas se fier à cette doc pour l'état de sécurité de l'app ; se fier aux migrations, nommées par fichier ci-dessus.

## Conséquences

**Positives**

- Le mode de défaillance le plus grave — une migration silencieusement non appliquée alors que l'historique la déclare appliquée — devient impossible par construction, sans dépendre d'un protocole humain.
- Chaque repo reste maître de son schéma : les migrations club sont relues dans la PR de la feature qui les motive, avec le code qui les consomme.
- Le développement local du site est autonome (`supabase db reset` suffit), sans dépendre du repo de l'app au quotidien.
- L'app conserve sa commande de déploiement inchangée et son historique complet.

**Négatives / à surveiller**

- **Une copie manuelle subsiste** entre les deux repos au moment du déploiement. C'est le prix de la contrainte CLI (§Contexte, propriété 3), pas un choix : *quel que soit le schéma retenu*, un répertoire doit contenir l'union. L'immuabilité des migrations et le script de contrôle bornent le risque.
- Le déploiement du site n'est pas atomique : la migration part depuis un repo, le code depuis l'autre. Les migrations doivent donc être **rétro-compatibles avec le code déjà en ligne** (ajouts seulement, jamais de suppression de colonne dans la même livraison).
- Le baseline local `public` peut dériver du schéma réel de l'app. Il n'est utilisé que pour le développement local ; le risque se matérialiserait en une erreur au premier `db push`, pas en production silencieuse.
- Si le rythme des migrations club devient soutenu après le lancement, la copie manuelle deviendra la friction dominante. Le remède préparé est un dépôt `hybride-db` dédié, référencé en sous-module git par les deux repos — surcoût injustifié avant septembre, à réévaluer si plus de deux migrations club par mois sont livrées.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Numérotation séquentielle partagée + protocole « relister avant d'écrire » (proposition du brief) | Ne supprime pas la fenêtre de course entre la vérification et le push. Le résultat d'une collision est un **échec silencieux** en production, pas une erreur. Un mode de défaillance muet ne se traite pas par de la discipline. |
| Plage de numéros réservée au club (`9001`, `9002`…) | Supprime la collision inter-repos, mais pas la collision intra-repo (deux sessions choisissent `9003`), et impose de connaître le dernier numéro utilisé à chaque écriture. L'horodatage offre la même garantie sans consultation préalable, et c'est le défaut de l'outil. |
| Miroir inverse : ce repo détient l'union et devient le point de push | Donnerait au repo du site le pouvoir d'appliquer des changements de schéma de l'app, et imposerait de recopier `0001`…`0014` puis chaque nouvelle migration de l'app avant tout déploiement du site. Coût de synchronisation plus élevé, responsabilité inversée. |
| Appliquer les migrations club en `psql` direct + insertion manuelle dans `supabase_migrations.schema_migrations` | Casse le prochain `db push` de l'app (version distante absente en local) : le fichier devrait *quand même* être copié dans le repo de l'app. Aucun gain, une étape manuelle de plus, et une réimplémentation de la CLI. |
| Appliquer les migrations club en `psql` **sans** les enregistrer dans l'historique | L'état réel de la base cesse d'être décrit par l'historique. Rend `db pull` / `db diff` trompeurs pour les deux repos. Inacceptable sur une base portant des données de mineurs. |
| Un projet Supabase distinct pour le club | Contredit la décision structurelle 3 du brief (`auth.users` commune, compte unique). Non réouvrable. |
| Supabase Branching pour isoler les deux flux | Les branches se rejoignent sur la même base de production : la contrainte d'union subsiste au merge. Ajoute un outillage à maîtriser à trois semaines du lancement. |
