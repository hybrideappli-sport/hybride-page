# ADR-009 — Changement de prestataire d'e-mail transactionnel du club : Resend

- **Statut** : Accepté
- **Date** : 2026-08-17
- **Décideur** : produit (Esteban), exécuté en session par l'agent `claude`
- **Portée** : Projet — intégration, conformité RGPD
- **Dépend de** : ADR-006 (§1 amendé par cette ADR)
- **Feature déclenchante** : US-04, US-05, US-06 (AC4) — mêmes déclencheurs qu'ADR-006, aucun changement de périmètre fonctionnel

---

## Contexte

ADR-006 §1 avait retenu Brevo pour unifier la réputation d'envoi entre le site (association) et l'app (entité commerciale), sur un seul domaine authentifié. Ce choix supposait un compte Brevo opérationnel et configuré pour le club avant le lancement de rentrée.

Le compte, le domaine d'expédition et les clés Resend ont été mis en place côté club indépendamment de ce calendrier. Le prestataire change ; l'architecture d'outbox idempotent d'ADR-006 (§3 à §6) ne change pas — elle est indépendante du prestataire par construction (`EmailProvider`, ADR-006 §1 in fine : « le remplacement du prestataire reste un module, pas une refonte »).

## Décision

### 1. Resend pour le club, Brevo conservé pour l'app

Le club envoie désormais ses e-mails transactionnels (`club.email_log`, ADR-006 §2 à §6) via **Resend**. L'app (`hybrideappli`) **reste sur Brevo** — ce dépôt ne touche à rien côté app.

Conséquence directe, que la raison n°1 d'ADR-006 §1 (« un seul domaine d'envoi à authentifier ») avait justement cherché à éviter : **le club et l'app ont maintenant deux prestataires d'e-mail transactionnel distincts.** Assumé : les deux entités sont déjà des responsables de traitement séparés (ADR-002), avec des domaines d'expédition distincts (ADR-006 §1, sous-domaine par entité) — le second prestataire ajoute une ligne de configuration, pas une nouvelle surface de séparation à construire.

### 2. Deux sous-traitants distincts, deux mentions de politique de confidentialité distinctes

Resend et Brevo sont chacun un **sous-traitant (art. 28 RGPD)** au sens de la politique de confidentialité de **leur** entité respective :

| Entité | Prestataire | Politique de confidentialité à mettre à jour |
|---|---|---|
| Association (club) | Resend | `app/club/[slug]/politique-de-confidentialite/page.tsx` (ce repo) |
| Entité commerciale (app) | Brevo | politique de confidentialité du repo `hybrideappli` — hors périmètre de ce changement, déjà à jour |

Ne pas mutualiser cette mention : documenter Resend dans la politique de l'app ou Brevo dans celle du club décrirait un sous-traitant qui ne traite pas les données de l'entité en question.

### 3. Hébergement des données Resend : à documenter explicitement

Le domaine d'expédition Resend de ce projet est configuré en **Irlande** (région d'envoi, cohérente avec le projet Supabase `hybrideclub`, eu-west-1). **Les données de compte et les journaux d'envoi Resend (contenu des e-mails envoyés, métadonnées de livraison, logs) sont en revanche hébergés aux États-Unis**, indépendamment de la région d'envoi choisie — Resend n'offre pas, à la date de cette décision, d'hébergement européen pour cette partie de l'infrastructure.

C'est un transfert de données hors UE (art. 44 et s. RGPD) distinct de la question de la région d'envoi, et il doit être visible dans la politique de confidentialité du club : sous-traitant, finalité (envoi des e-mails transactionnels de l'association), et le fait du transfert US pour les données de compte/logs. Traité en tâche associée à cette ADR (voir politique de confidentialité, section sous-traitants).

### 4. Aucun changement à la mécanique de l'outbox

ADR-006 §3 à §6 (transaction → `enqueue`, idempotence par index unique, contenu reconstruit au moment de l'envoi, back-off exponentiel, abandon à 5 tentatives) s'appliquent à l'identique. Seule la classe qui implémente `EmailProvider` change (`lib/email/provider-resend.ts`, remplace `provider-brevo.ts`) ainsi que les deux variables d'environnement (`RESEND_API_KEY`, `RESEND_FROM` remplacent `BREVO_API_KEY`, `BREVO_SENDER_CLUB`).

`RESEND_FROM` porte nom affiché et adresse dans une seule valeur (`"Hybride Club Toulon <sorties@hybride-club.fr>"`), au lieu de deux variables séparées côté Brevo — différence d'API du prestataire, sans effet sur le schéma ou le dispatcher.

### 5. Forme des erreurs, sans impact sur le back-off

Le SDK officiel `resend` renvoie `{ data, error }` avec `error.name` (code stable, ex. `validation_error`, `rate_limit_exceeded`) et `error.message`, une forme différente du JSON `{message, code}` renvoyé par l'API brute de Brevo. `ResendEmailProvider.send()` traduit cette erreur en `EmailSendError("Resend {name}: {message}")`, au même titre que Brevo produisait `EmailSendError("Brevo {status}: {body}")`.

Le dispatcher (`dispatch.ts`, `dispatchOne`) ne distinguait déjà pas les types d'échec pour décider de réessayer : toute erreur incrémente `attempts`, applique le back-off, abandonne à 5 tentatives (ADR-006 §6). Ce comportement n'a jamais été spécifique à Brevo et reste correct avec Resend — y compris pour un échec permanent (ex. domaine non vérifié) qui épuisera les 5 tentatives sans succès, comme c'était déjà le cas pour une clé Brevo invalide. Aucune adaptation nécessaire.

## Conséquences

**Positives**

- Migration confinée à un seul fichier (`provider-resend.ts`) et deux variables d'environnement, exactement comme anticipé par ADR-006 §1.
- Le club n'est plus bloqué par le calendrier de configuration Brevo côté app.

**Négatives / à surveiller**

- Deux prestataires à opérer au lieu d'un : deux tableaux de bord, deux clés à faire tourner, deux réputations d'envoi à surveiller.
- Transfert de données hors UE à documenter (§3) et à surveiller si la réglementation ou l'offre Resend évolue.
- La raison n°1 d'ADR-006 §1 (domaine d'envoi unique) ne s'applique plus : les deux entités ont chacune leur propre domaine et prestataire, ce qui est en réalité plus conforme à la séparation des responsables de traitement d'ADR-002 que le choix initial.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Attendre la configuration Brevo côté club pour rester sur un seul prestataire | Aurait fait dépendre le calendrier du club de celui, distinct, de l'app — sans bénéfice technique, la séparation des domaines d'expédition existant déjà. |
| `fetch()` brut vers l'API Resend, comme pour Brevo | Le SDK officiel `resend` renvoie une erreur typée (`{name, message}`) qui évite de deviner la forme du JSON d'erreur, pour un coût de dépendance minime et cohérent avec l'usage déjà fait de `@supabase/supabase-js` comme SDK de fournisseur. |
