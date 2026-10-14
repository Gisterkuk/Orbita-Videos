// Genera index.html (lo que renderiza HyperFrames) desde fuente/plantilla.html para una versión del gancho.
//
//   node construir.mjs A   -> gancho "Así se carga un producto… y así se carga en Órbita."
//   node construir.mjs D   -> gancho "Si cargar un producto te lleva más que venderlo… mirá esto."
//
// Inyecta las marcas de la voz (audio/marcas-<V>.json, de audio/voz.py), el audio
// (assets/audio/mezcla-<V>.wav si existe; si no, la voz sola) y la duración.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const V = (process.argv[2] || 'A').toUpperCase();
if (!['A', 'D'].includes(V)) throw new Error('Versión: A o D');
const marcas = JSON.parse(readFileSync(`audio/marcas-${V}.json`, 'utf8'));
const duracion = Math.round((marcas.duracion + 0.7) * 100) / 100;
const audio = existsSync(`assets/audio/mezcla-${V}.wav`) ? `assets/audio/mezcla-${V}.wav` : `assets/audio/voz-${V}.wav`;

const html = readFileSync('fuente/plantilla.html', 'utf8')
  .replace('<!--VERSION-->', `<script>window.VERSION = ${JSON.stringify(V)}; window.MARCAS = ${JSON.stringify(marcas)};</script>`)
  .replaceAll('__DURACION__', String(duracion))
  .replace('__AUDIO__', audio)
  .replace('/*ESCENAS*/', () => readFileSync('escenas.js', 'utf8'));
writeFileSync('index.html', html);
console.log(`index.html · versión ${V} · ${duracion} s · audio ${audio}`);
