#!/usr/bin/env bash
# Blends each frame's 3 sub-frame samples (motion blur), adds the soundtrack, encodes for Reels.
set -euo pipefail
cd "$(dirname "$0")/.."
S=${SAMPLES:-3}
ffmpeg -y -loglevel error -framerate $((30 * S)) -i out/samples/s%05d.jpg -i out/music.wav \
  -vf "tmix=frames=${S},select='not(mod(n+1\,${S}))',setpts=N/30/TB,format=yuv420p" -r 30 \
  -c:v libx264 -profile:v high -preset slow -crf 16 -c:a aac -b:a 192k -ar 48000 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -shortest -movflags +faststart out/Refract-Tech-reel-v4.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size -of compact out/Refract-Tech-reel-v4.mp4
