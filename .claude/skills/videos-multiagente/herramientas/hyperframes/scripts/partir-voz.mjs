// Parte una narración generada de UNA toma en una pista por frase del guion.
// Los cortes salen de alinear el texto del guion con la transcripción palabra por palabra
// (npx hyperframes transcribe … → transcript.json): cortar solo por silencios falla, porque
// algunas pausas internas ("Listo: ya está…") duran tanto como las pausas entre frases.
//   node scripts/partir-voz.mjs <narracion.mp3> <guion.json> <transcript.json> <salida-dir> [voz.json]
// Escribe <salida-dir>/<id>.wav (mono 48 kHz) y voz.json con { frases: [...guion, dur, tramos, palabras] }.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import os from 'node:os'

const [entrada, guionArch, transArch, salida, vozArch = 'voz.json'] = process.argv.slice(2)
const req = createRequire(path.join(os.homedir(), 'orbita-videos', 'kit', 'package.json'))
const ffmpeg = req('ffmpeg-static')
const SR = 48000
const raw = execFileSync(ffmpeg, ['-loglevel', 'error', '-i', entrada, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 30 })
const n = raw.length / 2
const GUION = JSON.parse(fs.readFileSync(guionArch, 'utf8')), frases = GUION.frases
const tr = JSON.parse(fs.readFileSync(transArch, 'utf8'))
const T = (Array.isArray(tr) ? tr : tr.words ?? tr.segments?.flatMap(s => s.words) ?? []).map(w => ({ w: w.text ?? w.word, a: w.start, z: w.end }))

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
const G = frases.flatMap((f, k) => f.texto.split(/\s+/).map(w => ({ w: norm(w), k }))).filter(x => x.w)
const TN = T.map(t => norm(t.w))
const igual = (p, q) => p === q || (p.length >= 4 && q.length >= 4 && (p.startsWith(q.slice(0, 4)) || q.startsWith(p.slice(0, 4))))
// alineación global (Needleman-Wunsch): guion G contra transcripción T
const A = G.length, B = TN.length, D = Array.from({ length: A + 1 }, () => new Float32Array(B + 1)), P = Array.from({ length: A + 1 }, () => new Uint8Array(B + 1))
for (let i = 0; i <= A; i++) { D[i][0] = i; P[i][0] = 1 }
for (let j = 0; j <= B; j++) { D[0][j] = j; P[0][j] = 2 }
for (let i = 1; i <= A; i++) for (let j = 1; j <= B; j++) {
  const m = D[i - 1][j - 1] + (igual(G[i - 1].w, TN[j - 1]) ? 0 : 1), d = D[i - 1][j] + 1, ins = D[i][j - 1] + 1
  if (m <= d && m <= ins) { D[i][j] = m; P[i][j] = 0 } else if (d <= ins) { D[i][j] = d; P[i][j] = 1 } else { D[i][j] = ins; P[i][j] = 2 }
}
const par = new Array(A).fill(-1)
for (let i = A, j = B; i > 0 || j > 0;) { const p = P[i][j]; if (p === 0) { par[i - 1] = j - 1; i--; j-- } else if (p === 1) i--; else j-- }
// primera y última palabra de la transcripción de cada frase
const rango = frases.map((_, k) => { const js = G.map((g, i) => g.k === k ? par[i] : -1).filter(j => j >= 0); return { j0: Math.min(...js), j1: Math.max(...js) } })
const cortes = []   // segundo de corte entre la frase k y la k+1: en medio del silencio entre ambas
for (let k = 0; k < frases.length - 1; k++) cortes.push((T[rango[k].j1].z + T[rango[k + 1].j0].a) / 2)
const ini = Math.max(0, T[rango[0].j0].a - .08), fin = Math.min(n / SR, T[rango.at(-1).j1].z + .25)
const bordes = [ini, ...cortes, fin]

fs.mkdirSync(salida, { recursive: true })
const wav = pcm => { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]) }
const out = []
frases.forEach((f, k) => {
  // la frase va desde un poco antes de su primera palabra hasta un poco después de la última
  const a = Math.max(bordes[k], T[rango[k].j0].a - .08), z = Math.min(bordes[k + 1], T[rango[k].j1].z + .18)
  const pcm = Buffer.from(raw.subarray(Math.round(a * SR) * 2, Math.round(z * SR) * 2))
  const fade = Math.round(SR * .008), m = pcm.length / 2
  for (let t = 0; t < fade; t++) { pcm.writeInt16LE(Math.round(pcm.readInt16LE(t * 2) * t / fade), t * 2); pcm.writeInt16LE(Math.round(pcm.readInt16LE((m - 1 - t) * 2) * t / fade), (m - 1 - t) * 2) }
  fs.writeFileSync(path.join(salida, f.id + '.wav'), wav(pcm))
  const palabras = T.slice(rango[k].j0, rango[k].j1 + 1).map(w => ({ w: w.w, a: +(w.a - a).toFixed(3), z: +(w.z - a).toFixed(3) }))
  // tramos con voz (pausas ≥ 0,22 s entre palabras)
  const tramos = []
  for (const w of palabras) { const u = tramos.at(-1); if (u && w.a - u[1] < .22) u[1] = w.z; else tramos.push([w.a, w.z]) }
  // palabras del GUION (bien escritas, con tildes) con el tiempo de la palabra transcripta
  // que les corresponde; las no alineadas se interpolan entre sus vecinas
  const idx = G.map((g, i) => g.k === k ? i : -1).filter(i => i >= 0)
  const crudas = f.texto.split(/\s+/).filter(w => norm(w))
  const tiempos = idx.map(i => par[i] >= 0 ? [T[par[i]].a - a, T[par[i]].z - a] : null)
  for (let q = 0; q < tiempos.length; q++) if (!tiempos[q]) {
    let p = q - 1; while (p >= 0 && !tiempos[p]) p--
    let s = q + 1; while (s < tiempos.length && !tiempos[s]) s++
    const t0 = p >= 0 ? tiempos[p][1] : 0, t1 = s < tiempos.length ? tiempos[s][0] : m / SR
    tiempos[q] = [t0 + (t1 - t0) * .1, t0 + (t1 - t0) * .9]
  }
  const palabrasGuion = crudas.map((w, q) => ({ w, a: +Math.max(0, tiempos[q][0]).toFixed(3), z: +tiempos[q][1].toFixed(3) }))
  out.push({ ...f, dur: +(m / SR).toFixed(3), tramos, palabras, palabrasGuion, enNarracion: +a.toFixed(3) })
})
const ratios = out.map(f => f.dur / f.texto.length), med = [...ratios].sort((p, q) => p - q)[Math.floor(ratios.length / 2)]
for (const f of out) { const r = f.dur / f.texto.length / med; console.log(`${f.id.padEnd(16)} ${f.dur.toFixed(2)} s ${r < .7 || r > 1.45 ? ' ⚠ revisar' : ''}  ${f.palabras[0].w} … ${f.palabras.at(-1).w}`) }
fs.writeFileSync(vozArch, JSON.stringify({ voz: GUION.voz ?? null, modelo: GUION.modelo ?? 'eleven_v4', frases: out }, null, 1))
console.log(`→ ${out.length} frases · ${vozArch} · total voz ${out.reduce((s, f) => s + f.dur, 0).toFixed(1)} s · distancia de alineación ${D[A][B]}`)
