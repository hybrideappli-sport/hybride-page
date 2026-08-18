#!/usr/bin/env bash
# ADR-001 §2 — outil de poste de travail, pas une CI (l'autre repo n'est pas
# accessible depuis un runner). Compare les migrations club présentes dans le
# répertoire d'auteur (ce repo) à leurs copies dans le répertoire
# d'application (hybrideappli), et signale :
#   - toute migration club présente ici mais absente/non copiée là-bas
#     ("à livrer") ;
#   - toute migration copiée là-bas dont le contenu a divergé de l'original
#     ("IMMUABILITÉ VIOLÉE" — ne doit structurellement jamais arriver, cf.
#     ADR-001 §2 "Immuabilité").
#
# N'exécute et ne modifie rien : lecture seule, aucun appel réseau, aucune
# commande supabase. Ne touche jamais au repo hybrideappli en écriture.
#
# Usage :
#   ./scripts/check-migrations-mirror.sh [chemin-vers-hybrideappli]
# Par défaut, cherche hybrideappli en frère de ce repo (~/Hybride/hybrideappli),
# conformément à ADR-001 ("les deux repos vivent sur la même machine, sous
# ~/Hybride/").

set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_MIGRATIONS="$SITE_DIR/supabase/migrations"
APP_DIR="${1:-$SITE_DIR/../hybrideappli}"
APP_MIGRATIONS="$APP_DIR/supabase/migrations"

if [ ! -d "$APP_MIGRATIONS" ]; then
  echo "Répertoire de migrations introuvable : $APP_MIGRATIONS" >&2
  echo "Précise le chemin du repo hybrideappli en argument si besoin." >&2
  exit 2
fi

missing=0
diverged=0
ok=0

echo "Répertoire d'auteur  : $SITE_MIGRATIONS"
echo "Répertoire d'application : $APP_MIGRATIONS"
echo

for f in "$SITE_MIGRATIONS"/*.sql; do
  name="$(basename "$f")"
  target="$APP_MIGRATIONS/$name"

  if [ ! -f "$target" ]; then
    echo "À LIVRER   : $name (absent de hybrideappli/supabase/migrations)"
    missing=$((missing + 1))
    continue
  fi

  src_sum="$(shasum -a 256 "$f" | cut -d' ' -f1)"
  dst_sum="$(shasum -a 256 "$target" | cut -d' ' -f1)"

  if [ "$src_sum" != "$dst_sum" ]; then
    echo "DIVERGENCE : $name — le contenu copié diffère de l'original (immuabilité violée, ADR-001 §2)"
    diverged=$((diverged + 1))
  else
    ok=$((ok + 1))
  fi
done

echo
echo "Résumé : $ok conformes, $missing à livrer, $diverged divergentes."

if [ "$missing" -gt 0 ] || [ "$diverged" -gt 0 ]; then
  exit 1
fi

exit 0
