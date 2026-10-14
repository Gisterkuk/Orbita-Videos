#!/bin/bash
# Rinde la "placa" de pantalla en 3 tramos (con reintentos) y los une sin recodificar:
# si un proceso de ffmpeg se corta, se reintenta solo ese tramo y no se pierde todo.
#   bash herramientas/placa-tramos.sh compose/tl-plate.json out/placa.mp4   (cwd = carpeta del video)
TLP=${1:-compose/tl-plate.json}; SAL=${2:-out/placa.mp4}; B=${SAL%.mp4}
D=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$TLP','utf8')).duration)")
T1=$(node -e "console.log((Math.round($D/3*60)/60).toFixed(3))"); T2=$(node -e "console.log((Math.round($D*2/3*60)/60).toFixed(3))")
CORTES=(0 $T1 $T2 $D)
for i in 0 1 2; do
  out=$B-t$i.mp4
  [ -f "$out" ] && continue
  for intento in 1 2 3; do
    PAGE=compose/plate.html TL=$TLP node herramientas/render-placa.mjs $B-t$i.tmp.mp4 ${CORTES[$i]} ${CORTES[$((i+1))]} > $B-t$i.log 2>&1 && mv $B-t$i.tmp.mp4 "$out" && break
    echo "tramo $i: falló el intento $intento"
  done
  [ -f "$out" ] || { echo "tramo $i: no salió"; exit 1; }
  echo "tramo $i listo"
done
FF=$(node -e "import('./herramientas/lib/deps.mjs').then(m=>console.log(m.ffmpegPath))")
printf "file '%s'\nfile '%s'\nfile '%s'\n" "$(basename $B)-t0.mp4" "$(basename $B)-t1.mp4" "$(basename $B)-t2.mp4" > $B-lista.txt
"$FF" -loglevel error -y -f concat -safe 0 -i $B-lista.txt -c copy -movflags +faststart "$SAL" && rm -f $B-t?.mp4 $B-t?.log $B-lista.txt && echo "placa lista: $SAL"
