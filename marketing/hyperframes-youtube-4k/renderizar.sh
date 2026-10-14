#!/usr/bin/env bash
# Renderiza las versiones pedidas en 4K 60 fps y les pone el máster de audio en AAC 320 kbps (−14 LUFS).
#   ./renderizar.sh A D
set -e
cd "$(dirname "$0")"
mkdir -p audio/.tmp
for V in "$@"; do
  node construir.mjs "$V"
  npx --yes hyperframes@0.8.143 render . --resolution 4k --fps 60 --quality delivery -o "renders/una-foto-$V-4k.mp4" > "renders/render-$V.log" 2>&1
  # HyperFrames baja el audio para no pasar −1 dBTP y lo codifica a ~190 kbps: lo reemplazamos por el máster
  ffmpeg -v error -y -i "assets/audio/mezcla-$V.wav" -af "alimiter=limit=0.79:level=false:attack=1:release=60" -c:a pcm_s24le "audio/.tmp/master-$V-lim.wav"
  ffmpeg -v error -y -i "renders/una-foto-$V-4k.mp4" -i "audio/.tmp/master-$V-lim.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest "renders/una-foto-$V-4k-final.mp4"
  echo "listo $V"
done
