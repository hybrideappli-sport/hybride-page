-- Données de développement local uniquement — jamais poussées (db.seed n'est pas
-- exécuté par `db push`, seulement par `db reset`). club.clubs et club.disciplines
-- sont déjà seedées dans les migrations elles-mêmes (données de référence, pas des
-- fixtures) ; ce fichier ne contient que des événements de test pour vérifier
-- l'agenda de /club/toulon en local, dont un événement à deux disciplines pour
-- exercer le modèle many-to-many (et son dédoublonnage dans le filtre).

with e1 as (
  insert into club.events (club_id, title, starts_at, location, level, capacity)
  select c.id, 'Sortie route — Le Castellet', date_trunc('day', now() + interval '5 days') + time '08:30', 'Départ Olliouries', 'Tous niveaux', 25
  from club.clubs c where c.slug = 'toulon'
  returning id
), e2 as (
  insert into club.events (club_id, title, starts_at, location, level, capacity)
  select c.id, 'Fractionné piste', date_trunc('day', now() + interval '8 days') + time '18:45', 'Stade Léo Lagrange', 'Tous niveaux', 20
  from club.clubs c where c.slug = 'toulon'
  returning id
), e3 as (
  insert into club.events (club_id, title, starts_at, location, level, capacity)
  select c.id, 'Nage à la plage des Sablettes', date_trunc('day', now() + interval '2 days') + time '19:00', 'Plage des Sablettes', 'Tous niveaux', 15
  from club.clubs c where c.slug = 'toulon'
  returning id
), e4 as (
  insert into club.events (club_id, title, starts_at, location, level, capacity)
  select c.id, 'Swim and run — pointe des Sablettes', date_trunc('day', now() + interval '11 days') + time '09:00', 'Plage des Sablettes', 'Tous niveaux', 18
  from club.clubs c where c.slug = 'toulon'
  returning id
)
insert into club.event_disciplines (event_id, discipline_code)
select id, 'velo' from e1
union all
select id, 'course' from e2
union all
select id, 'eau' from e3
union all
select id, 'eau' from e4
union all
select id, 'course' from e4;
