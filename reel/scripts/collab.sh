#!/usr/bin/env bash
# Renders a collaboration reel in 4K and writes a 1080p and a 4K HEVC file.
#   bash scripts/collab.sh padel "The-Padel-Lounge-x-Refract"     |     bash scripts/collab.sh eagle-collab "Eagle-Strength-x-Refract"
#   bash scripts/collab.sh launch "Refract-Website-Launch" launch.html   (a page of its own)
set -euo pipefail
cd "$(dirname "$0")/.."
EP=$1; NAME=$2; PAGE=${3:-series.html?ep=$EP}; D=out/v3/$EP
rm -rf "$D/samples"
node scripts/render.js --page "$PAGE" --out "$D" --scale 2 --quality 96 | tail -1
python3 "${MUSIC:-scripts/collab_music.py}" "$D"
ffmpeg -y -loglevel error -i "$D/music.wav" -af "loudnorm=I=-14:TP=-3:LRA=9,alimiter=limit=0.7:level=false" -ar 48000 "$D/master.wav"
VF="tmix=frames=3,select='not(mod(n+1\,3))',setpts=N/30/TB"
ffmpeg -y -loglevel error -framerate 90 -i "$D/samples/s%05d.jpg" -i "$D/master.wav" -vf "$VF,scale=1080:1920:flags=lanczos,format=yuv420p" -r 30 -c:v libx264 -profile:v high -preset slow -crf 18 -tag:v avc1 -c:a aac -b:a 192k -shortest -movflags +faststart "$D/$NAME-1080p.mp4"
ffmpeg -y -loglevel error -framerate 90 -i "$D/samples/s%05d.jpg" -i "$D/master.wav" -vf "$VF,format=yuv420p" -r 30 -c:v libx265 -preset medium -crf 24 -tag:v hvc1 -x265-params log-level=error -c:a aac -b:a 192k -shortest -movflags +faststart "$D/$NAME-4K.mp4"
ls -la "$D"/*.mp4
