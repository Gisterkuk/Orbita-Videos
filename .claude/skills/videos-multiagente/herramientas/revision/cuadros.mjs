// Lo que mira el supervisor, paso por paso: una hoja de cuadros del tramo (2 por segundo), el
// cuadro exacto de cada palabra clave de la voz (para la regla "lo que se dice, se ve") y el
// texto de la voz que suena en ese tramo.
//   node herramientas/revision/cuadros.mjs <borrador.mp4> <carpeta-hf> <salida-dir>
// Lee <carpeta-hf>/video.json (tl, tiempos, voz). Escribe <salida-dir>/tramos.json + imágenes.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ffmpegPath } from '../lib/deps.mjs'

const [video, hf, salida] = process.argv.slice(2)
if (!video || !hf || !salida) { console.error('Uso: node herramientas/revision/cuadros.mjs <borrador.mp4> <carpeta-hf> <salida-dir>'); process.exit(1) }
const V = JSON.parse(fs.readFileSync(path.join(hf, 'video.json'), 'utf8'))
const SRC = path.isAbsolute(V.src) || V.src.startsWith('.') ? path.resolve(hf, V.src) : path.join(os.homedir(), 'orbita-videos', V.src)
const TL = JSON.parse(fs.readFileSync(path.join(SRC, V.tl), 'utf8'))
const TIEMPOS = JSON.parse(fs.readFileSync(path.join(SRC, V.tiempos), 'utf8'))
const VOZ = JSON.parse(fs.readFileSync(path.join(hf, V.voz), 'utf8'))
fs.mkdirSync(salida, { recursive: true })

// palabras de la voz con su segundo en el video
const palabras = TIEMPOS.flatMap(t => (VOZ.frases.find(f => f.id === t.id)?.palabrasGuion ?? []).map(p => ({ w: p.w, t: +(t.t + (p.a + p.z) / 2).toFixed(2) })))
const CONECTORES = new Set(['porque', 'cuando', 'desde', 'hasta', 'donde', 'entre', 'sobre', 'también', 'además', 'todos', 'todas', 'cada', 'tenés', 'podés'])
const clave = w => { const b = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); return b.length >= 5 && !CONECTORES.has(b) }
const cuadro = (t, archivo, ancho = 1280) => execFileSync(ffmpegPath, ['-v', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', `scale=${ancho}:-1`, '-q:v', '3', path.join(salida, archivo)])

const tramos = TL.caps.map((c, i) => {
  const dur = Math.max(.5, c.o1 - c.o0), n = Math.max(2, Math.round(dur * 2)), cols = Math.min(4, n), filas = Math.ceil(n / cols)
  const hoja = `paso-${String(i + 1).padStart(2, '0')}-hoja.jpg`
  execFileSync(ffmpegPath, ['-v', 'error', '-y', '-ss', String(c.o0), '-t', String(dur), '-i', video, '-vf', `fps=2,scale=640:-1,tile=${cols}x${filas}:padding=4:color=white`, '-frames:v', '1', '-q:v', '3', path.join(salida, hoja)])
  const enTramo = palabras.filter(p => p.t >= c.o0 && p.t < c.o1)
  const kws = enTramo.filter(p => clave(p.w)).map((p, j) => {
    const archivo = `paso-${String(i + 1).padStart(2, '0')}-palabra-${j + 1}.jpg`
    cuadro(p.t, archivo)
    return { w: p.w, t: p.t, cuadro: archivo }
  })
  return { paso: c.txt, sub: c.sub ?? null, o0: c.o0, o1: c.o1, voz: enTramo.map(p => p.w).join(' '), hoja, palabras: kws }
})
fs.writeFileSync(path.join(salida, 'tramos.json'), JSON.stringify(tramos, null, 1))
console.log(`${tramos.length} tramos · ${tramos.reduce((s, t) => s + t.palabras.length, 0)} cuadros de palabras clave → ${salida}`)
