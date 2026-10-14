// Deja el mp4 listo para la cola de Órbita: H.264 + AAC con el índice al principio (se reproduce sin bajarlo entero)
// y que pese menos que el tope (50 MB, el de Instagram). Si el video ya cumple, solo se reordena sin recomprimir.
//   node preparar.mjs <entrada.mp4> <salida.mp4> [--max-mb 45] [--tutorial]
// --tutorial: es un video interno (no va a Instagram): el tope sube a 250 MB y por defecto se usan hasta 240.
// Imprime en JSON: { archivo, bytes, duracionSeg, ancho, alto, recomprimido }
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { correr, MAX_BYTES, MAX_BYTES_TUTORIAL, sondear } from './ffmpeg.mjs'

const AUDIO_BPS = 128_000
const MIN_VIDEO_BPS = 800_000
const MAX_VIDEO_BPS = 10_000_000

/** Bitrate de video que entra en `maxBytes` para una duración dada (descontando el audio y un 3 % de contenedor). */
export function bitrateObjetivo(maxBytes, duracionSeg) {
  if (!(duracionSeg > 0)) throw new Error('No se pudo leer la duración del video')
  const total = (maxBytes * 8 * 0.97) / duracionSeg
  return Math.round(Math.min(MAX_VIDEO_BPS, Math.max(MIN_VIDEO_BPS, total - AUDIO_BPS)))
}

export function preparar(entrada, salida, { maxBytes = 45 * 1024 * 1024, tutorial = false } = {}) {
  const tope = tutorial ? MAX_BYTES_TUTORIAL : MAX_BYTES
  if (maxBytes > tope) throw new Error(`El tope no puede superar los ${tope / 1024 / 1024} MB de la cola`)
  const origen = sondear(entrada)
  if (!origen.tieneVideo) throw new Error('El archivo no tiene video')
  if (!origen.duracionSeg) throw new Error('No se pudo leer la duración del video')

  const reordenar = ['-y', '-i', entrada, '-c', 'copy', '-movflags', '+faststart', salida]
  let recomprimido = false
  const esMp4 = /\.mp4$/i.test(entrada)
  if (esMp4 && origen.bytes <= maxBytes) {
    const r = correr(reordenar)
    if (r.codigo !== 0) throw new Error(`ffmpeg falló: ${r.salida.slice(-300)}`)
  } else {
    recomprimido = true
    let bps = bitrateObjetivo(maxBytes, origen.duracionSeg)
    for (let intento = 0; intento < 4; intento++) {
      const r = correr([
        '-y', '-i', entrada,
        '-c:v', 'libx264', '-preset', 'medium', '-b:v', `${bps}`, '-maxrate', `${Math.round(bps * 1.25)}`, '-bufsize', `${bps * 2}`,
        '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
        '-c:a', 'aac', '-b:a', `${AUDIO_BPS}`, '-ar', '44100', '-movflags', '+faststart', salida,
      ])
      if (r.codigo !== 0) throw new Error(`ffmpeg falló: ${r.salida.slice(-300)}`)
      if (fs.statSync(salida).size <= maxBytes) break
      bps = Math.round(bps * 0.8) // se pasó: se baja un 20 % y se repite
      if (bps < MIN_VIDEO_BPS / 2) throw new Error('No hay forma de que entre en el tope: el video es demasiado largo')
    }
  }
  const final = sondear(salida)
  if (final.bytes > maxBytes) throw new Error(`El video pesa ${(final.bytes / 1024 / 1024).toFixed(1)} MB y el tope es ${(maxBytes / 1024 / 1024).toFixed(0)} MB`)
  return { archivo: salida, bytes: final.bytes, duracionSeg: final.duracionSeg, ancho: final.ancho, alto: final.alto, recomprimido }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2)
  const i = args.indexOf('--max-mb')
  const t = args.indexOf('--tutorial')
  const tutorial = t >= 0 ? (args.splice(t, 1), true) : false
  const maxMb = i >= 0 ? Number(args.splice(args.indexOf('--max-mb'), 2)[1]) : tutorial ? 240 : 45
  const [entrada, salida] = args
  if (!entrada || !salida || !(maxMb > 0)) {
    console.error('Uso: node preparar.mjs <entrada.mp4> <salida.mp4> [--max-mb 45] [--tutorial]')
    process.exit(2)
  }
  try {
    console.log(JSON.stringify(preparar(entrada, salida, { maxBytes: maxMb * 1024 * 1024, tutorial })))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
