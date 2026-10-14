// Deja el mp4 listo para la cola de Órbita: H.264 + AAC con el índice al principio (se reproduce sin bajarlo entero).
// NO hay tope de peso: si el video ya es un mp4 se reordena sin recomprimir; si no, se recodifica con buena calidad.
// Solo si se pide un tope con --max-mb (por ejemplo, para mandarlo por chat), se baja el bitrate hasta que entre.
//   node preparar.mjs <entrada.mp4> <salida.mp4> [--max-mb 45]
// Imprime en JSON: { archivo, bytes, duracionSeg, ancho, alto, recomprimido }
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { correr, sondear } from './ffmpeg.mjs'

const AUDIO_BPS = 128_000
const MIN_VIDEO_BPS = 800_000
const MAX_VIDEO_BPS = 10_000_000

/** Bitrate de video que entra en `maxBytes` para una duración dada (descontando el audio y un 3 % de contenedor). */
export function bitrateObjetivo(maxBytes, duracionSeg) {
  if (!(duracionSeg > 0)) throw new Error('No se pudo leer la duración del video')
  const total = (maxBytes * 8 * 0.97) / duracionSeg
  return Math.round(Math.min(MAX_VIDEO_BPS, Math.max(MIN_VIDEO_BPS, total - AUDIO_BPS)))
}

const COLOR = ['-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']

export function preparar(entrada, salida, { maxBytes = null } = {}) {
  if (maxBytes !== null && !(maxBytes > 0)) throw new Error('El tope tiene que ser un número mayor que cero')
  const origen = sondear(entrada)
  if (!origen.tieneVideo) throw new Error('El archivo no tiene video')
  if (!origen.duracionSeg) throw new Error('No se pudo leer la duración del video')

  let recomprimido = false
  const esMp4 = /\.mp4$/i.test(entrada)
  if (esMp4 && (maxBytes === null || origen.bytes <= maxBytes)) {
    const r = correr(['-y', '-i', entrada, '-c', 'copy', '-movflags', '+faststart', salida])
    if (r.codigo !== 0) throw new Error(`ffmpeg falló: ${r.salida.slice(-300)}`)
  } else if (maxBytes === null) {
    recomprimido = true // sin tope: calidad constante, el peso sale el que sea
    const r = correr(['-y', '-i', entrada, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', ...COLOR, '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', salida])
    if (r.codigo !== 0) throw new Error(`ffmpeg falló: ${r.salida.slice(-300)}`)
  } else {
    recomprimido = true
    let bps = bitrateObjetivo(maxBytes, origen.duracionSeg)
    for (let intento = 0; intento < 4; intento++) {
      const r = correr([
        '-y', '-i', entrada,
        '-c:v', 'libx264', '-preset', 'medium', '-b:v', `${bps}`, '-maxrate', `${Math.round(bps * 1.25)}`, '-bufsize', `${bps * 2}`,
        ...COLOR, '-c:a', 'aac', '-b:a', `${AUDIO_BPS}`, '-ar', '44100', '-movflags', '+faststart', salida,
      ])
      if (r.codigo !== 0) throw new Error(`ffmpeg falló: ${r.salida.slice(-300)}`)
      if (fs.statSync(salida).size <= maxBytes) break
      bps = Math.round(bps * 0.8) // se pasó: se baja un 20 % y se repite
      if (bps < MIN_VIDEO_BPS / 2) throw new Error('No hay forma de que entre en el tope: el video es demasiado largo')
    }
  }
  const final = sondear(salida)
  if (maxBytes !== null && final.bytes > maxBytes) throw new Error(`El video pesa ${(final.bytes / 1024 / 1024).toFixed(1)} MB y el tope pedido es ${(maxBytes / 1024 / 1024).toFixed(0)} MB`)
  return { archivo: salida, bytes: final.bytes, duracionSeg: final.duracionSeg, ancho: final.ancho, alto: final.alto, recomprimido }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2)
  const i = args.indexOf('--max-mb')
  const maxMb = i >= 0 ? Number(args.splice(i, 2)[1]) : null
  const [entrada, salida] = args
  if (!entrada || !salida || (maxMb !== null && !(maxMb > 0))) {
    console.error('Uso: node preparar.mjs <entrada.mp4> <salida.mp4> [--max-mb 45]')
    process.exit(2)
  }
  try {
    console.log(JSON.stringify(preparar(entrada, salida, { maxBytes: maxMb === null ? null : maxMb * 1024 * 1024 })))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
