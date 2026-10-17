// Base común de las herramientas de la cola: dónde está ffmpeg y cómo leer lo que cuenta de un video.
// Solo ffmpeg (no hace falta ffprobe): la duración, el tamaño de imagen y el audio salen de lo que imprime.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// FFMPEG (variable) > el ffmpeg-static del kit de videos (~/orbita-videos/kit) > el ffmpeg del sistema.
export function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG
  const kit = path.join(process.env.ORBITA_VIDEOS ?? path.join(os.homedir(), 'orbita-videos'), 'kit', 'package.json')
  if (fs.existsSync(kit)) {
    try { return createRequire(kit)('ffmpeg-static') } catch { /* sin kit instalado: se usa el del sistema */ }
  }
  return 'ffmpeg'
}

/** Corre ffmpeg y devuelve lo que imprimió por stderr (ahí está toda la información). */
export function correr(args, { maxBuffer = 64 * 1024 * 1024 } = {}) {
  const r = spawnSync(ffmpegPath(), ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8', maxBuffer })
  if (r.error) throw new Error(`No se pudo ejecutar ffmpeg (${r.error.message}). Instalalo o definí FFMPEG con su ruta.`)
  return { codigo: r.status ?? 1, salida: `${r.stderr ?? ''}` }
}

const aSegundos = (hh, mm, ss) => Number(hh) * 3600 + Number(mm) * 60 + Number(ss)

/** Lee la salida de `ffmpeg -i archivo`: duración, imagen y si tiene audio. */
export function parsearSonda(texto) {
  const dur = texto.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  const video = texto.match(/Stream #\d+:\d+[^\n]*: Video:[^\n]*?(\d{2,5})x(\d{2,5})/)
  return {
    duracionSeg: dur ? aSegundos(dur[1], dur[2], dur[3]) : null,
    ancho: video ? Number(video[1]) : null,
    alto: video ? Number(video[2]) : null,
    tieneVideo: /Stream #\d+:\d+[^\n]*: Video:/.test(texto),
    tieneAudio: /Stream #\d+:\d+[^\n]*: Audio:/.test(texto),
  }
}

export function sondear(archivo) {
  if (!fs.existsSync(archivo)) throw new Error(`No existe el archivo: ${archivo}`)
  const { salida } = correr(['-i', archivo])
  return { bytes: fs.statSync(archivo).size, ...parsearSonda(salida) }
}
