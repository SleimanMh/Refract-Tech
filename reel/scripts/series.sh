#!/usr/bin/env bash
# Renders the "Meet Refract Tech" reels: the teaser and one episode per stage.
#   bash scripts/series.sh                 → all seven
#   bash scripts/series.sh discover build  → just those
set -euo pipefail
cd "$(dirname "$0")/.."
EPS=${*:-teaser discover design build connect launch evolve}
n=0
for ep in $EPS; do
  case $ep in teaser) num=0 ;; discover) num=1 ;; design) num=2 ;; build) num=3 ;; connect) num=4 ;; launch) num=5 ;; evolve) num=6 ;; esac
  dir=out/series/$ep
  rm -rf "$dir/samples"
  node scripts/render.js --page "series.html?ep=$ep" --out "$dir" | tail -1
  if [ "$ep" = teaser ]; then python3 scripts/teaser_music.py "$dir"; else python3 scripts/series_music.py "$dir"; fi
  bash scripts/encode.sh "$dir" "Refract-Tech-$num-$ep.mp4"
  n=$((n + 1))
done
echo "rendered $n reels"
