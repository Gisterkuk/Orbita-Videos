// Escaneos automáticos de un borrador, antes de que lo mire el supervisor (mirando 1–2 cuadros
// por segundo se escapan): cuadros negros, congelamientos, saltos bruscos de brillo (flashes),
// silencios, saturación, volumen integrado (LUFS) y nitidez por tramo.
//   node herramientas/revision/escaneos.mjs <video.mp4> [--voz out/voz-tiempos.json] [--nitidez] > produccion/revision-auto.json
// Con --voz, cada congelamiento y silencio dice si cae mientras habla la voz (sin voz = problema).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { ffmpegPath } from '../lib/deps.mjs'
import { nitidezDeArchivo } from '../lib/nitidez.mjs'

const correr = args => spawnSync(ffmpegPath, ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr ?? ''
const num = (s, re) => { const m = s.match(re); return m ? Number(m[1]) : null }

function pares(texto, reIni, reFin) {
  const out = [], ini = [...texto.matchAll(reIni)].map(m => Number(m[1])), fin = [...texto.matchAll(reFin)].map(m => Number(m[1]))
  ini.forEach((t0, i) => out.push({ t0: +t0.toFixed(2), t1: fin[i] != null ? +fin[i].toFixed(2) : null }))
  return out
}

export async function escanear(video, { voz = null, nitidez = false, recorte = { x: 420, y: 160, w: 1080, h: 600 } } = {}) {
  const sv = correr(['-i', video, '-an', '-vf', 'blackdetect=d=0.2:pix_th=0.10,freezedetect=n=-60dB:d=1.5,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'])
  const negros = [...sv.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m => ({ t0: +Number(m[1]).toFixed(2), t1: +Number(m[2]).toFixed(2) }))
  const congelados = pares(sv, /freeze_start: ([\d.]+)/g, /freeze_end: ([\d.]+)/g)
  // flashes: salto de brillo medio > 60 (de 255) entre cuadros consecutivos
  const ys = [...sv.matchAll(/pts_time:([\d.]+)[\s\S]*?lavfi\.signalstats\.YAVG=([\d.]+)/g)].map(m => ({ t: Number(m[1]), y: Number(m[2]) }))
  const flashes = ys.slice(1).filter((p, i) => Math.abs(p.y - ys[i].y) > 60).map(p => ({ t: +p.t.toFixed(2) }))

  const sa = correr(['-i', video, '-vn', '-af', 'silencedetect=n=-40dB:d=1.0,volumedetect,ebur128', '-f', 'null', '-'])
  const silencios = pares(sa, /silence_start: ([\d.]+)/g, /silence_end: ([\d.]+)/g)
  const pico = num(sa, /max_volume: (-?[\d.]+) dB/)
  const lufsTodos = [...sa.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].map(m => Number(m[1]))
  const lufs = lufsTodos.length ? lufsTodos.at(-1) : null
  const md = sv.match(/Duration: (\d+):(\d+):([\d.]+)/), duracion = md ? +(+md[1] * 3600 + +md[2] * 60 + +md[3]).toFixed(2) : null

  // con la voz: ¿el congelamiento o el silencio cae mientras habla?
  if (voz) {
    const habla = (t0, t1) => voz.some(v => v.t < (t1 ?? t0 + .1) && v.t + v.dur > t0)
    for (const c of [...congelados, ...silencios]) c.conVoz = habla(c.t0, c.t1)
  }
  const res = { video, duracion, negros, congelados, flashes, silencios, saturacion: pico != null && pico >= -0.1 ? [{ pico }] : [], pico, lufs }
  if (nitidez && duracion) {
    res.nitidez = []
    for (let t = 1; t < duracion - .5; t += 2) res.nitidez.push({ t, valor: Math.round(await nitidezDeArchivo(video, recorte, { t })) })
  }
  return res
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('escaneos.mjs')) {
  const args = process.argv.slice(2), video = args[0]
  if (!video) { console.error('Uso: node herramientas/revision/escaneos.mjs <video.mp4> [--voz voz-tiempos.json] [--nitidez]'); process.exit(1) }
  const iv = args.indexOf('--voz')
  const voz = iv >= 0 ? JSON.parse(fs.readFileSync(args[iv + 1], 'utf8')) : null
  console.log(JSON.stringify(await escanear(video, { voz, nitidez: args.includes('--nitidez') }), null, 1))
}
