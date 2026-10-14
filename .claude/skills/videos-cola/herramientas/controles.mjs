// Controles de calidad de un mp4 terminado, en el formato que espera `videos_registrar` de la cola de Órbita:
// [{ nombre, ok, detalle }]. Mide lo que se puede medir sin escuchar ni mirar: formato, duración, peso, volumen del
// audio, tramos en negro, imagen congelada y silencios largos. NO reemplaza mirar el video: los controles de
// contenido (el guion, no nombrar competidores, no prometer lo que no existe) los hace el juez del guion.
//   node controles.mjs <video.mp4> [--formato REEL_9_16|CUADRADO|HORIZONTAL_16_9] [--sin-voz] [--tutorial]
// --tutorial: formato horizontal por defecto, entre 20 s y una hora, y hasta 250 MB.
// Imprime el arreglo en JSON. Código de salida 0 aunque algo falle (el resultado va en los datos).
import { pathToFileURL } from 'node:url'
import { correr, MAX_BYTES, MAX_BYTES_TUTORIAL, sondear } from './ffmpeg.mjs'

export const FORMATOS = {
  REEL_9_16: { ancho: 1080, alto: 1920, minSeg: 10, maxSeg: 60 },
  CUADRADO: { ancho: 1080, alto: 1080, minSeg: 10, maxSeg: 60 },
  HORIZONTAL_16_9: { ancho: 1920, alto: 1080, minSeg: 15, maxSeg: 180 },
}
// Un tutorial es interno: más largo y más pesado que un reel.
export const TUTORIAL = { minSeg: 20, maxSeg: 3600, maxBytes: MAX_BYTES_TUTORIAL }
// Umbrales (los mismos de referencia/calidad.md del repo): voz entre -17,5 y -12,5 LUFS y pico real ≤ -1 dBFS.
export const LUFS_MIN = -17.5
export const LUFS_MAX = -12.5
export const PICO_MAX = -1
export const NEGRO_MAX_SEG = 1
export const CONGELADO_MAX_SEG = 4
export const SILENCIO_MAX_SEG = 3

const f1 = (n) => String(Math.round(n * 10) / 10).replace('.', ',')

/** `Integrated loudness: I: -15.2 LUFS … True peak: Peak: -1.3 dBFS` de ebur128 (el último resumen del archivo). */
export function parsearLoudness(texto) {
  const resumen = texto.slice(texto.lastIndexOf('Summary:') >= 0 ? texto.lastIndexOf('Summary:') : 0)
  const I = resumen.match(/\bI:\s+(-?\d+(?:\.\d+)?|-inf)\s+LUFS/)
  const P = resumen.match(/Peak:\s+(-?\d+(?:\.\d+)?|-inf)\s+dBFS/)
  const num = (m) => (m && m[1] !== '-inf' ? Number(m[1]) : null)
  return { lufs: num(I), pico: num(P) }
}

/** Duración de cada tramo que detectó blackdetect / freezedetect / silencedetect. */
export function parsearTramos(texto, tipo) {
  const re = {
    negro: /black_start:(\d+(?:\.\d+)?)\s+black_end:(\d+(?:\.\d+)?)\s+black_duration:(\d+(?:\.\d+)?)/g,
    congelado: /freeze_duration:\s*(\d+(?:\.\d+)?)/g,
    silencio: /silence_duration:\s*(\d+(?:\.\d+)?)/g,
  }[tipo]
  const tramos = []
  for (const m of texto.matchAll(re)) tramos.push(tipo === 'negro' ? Number(m[3]) : Number(m[1]))
  return tramos
}

const control = (nombre, ok, detalle) => ({ nombre, ok, detalle })

export function medir(archivo, { formato, sinVoz = false, tutorial = false } = {}) {
  formato = formato ?? (tutorial ? 'HORIZONTAL_16_9' : 'REEL_9_16')
  const base = FORMATOS[formato]
  if (!base) throw new Error(`Formato desconocido: ${formato}`)
  const regla = tutorial ? { ...base, minSeg: TUTORIAL.minSeg, maxSeg: TUTORIAL.maxSeg } : base
  const tope = tutorial ? TUTORIAL.maxBytes : MAX_BYTES
  const s = sondear(archivo)
  const controles = []

  // Formato: la proporción tiene que ser la del formato (±1 %) y el lado corto de 720 px o más.
  if (!s.ancho || !s.alto) {
    controles.push(control('formato', false, 'No se pudo leer el tamaño de la imagen'))
  } else {
    const esperada = regla.ancho / regla.alto, real = s.ancho / s.alto
    const proporcionOk = Math.abs(real - esperada) / esperada < 0.01
    const ladoCorto = Math.min(s.ancho, s.alto)
    controles.push(control('formato', proporcionOk && ladoCorto >= 720, `${s.ancho}x${s.alto}${proporcionOk ? '' : `, se esperaba ${regla.ancho}x${regla.alto}`}${ladoCorto < 720 ? ', demasiado chico' : ''}`))
  }

  const d = s.duracionSeg
  controles.push(control('duración', d !== null && d >= regla.minSeg && d <= regla.maxSeg, d === null ? 'No se pudo leer' : `${f1(d)} s (entre ${regla.minSeg} y ${regla.maxSeg})`))
  controles.push(control('peso', s.bytes > 0 && s.bytes <= tope, `${f1(s.bytes / 1024 / 1024)} MB (máximo ${tope / 1024 / 1024})`))

  if (!s.tieneAudio) {
    controles.push(control('audio', sinVoz, sinVoz ? 'Sin audio (es lo esperado)' : 'El video no tiene audio'))
  } else {
    const a = correr(['-i', archivo, '-map', '0:a:0', '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-']).salida
    const { lufs, pico } = parsearLoudness(a)
    if (lufs === null || pico === null) controles.push(control('audio', false, 'No se pudo medir el volumen (¿silencio total?)'))
    else if (sinVoz) controles.push(control('audio', pico <= PICO_MAX, `pico ${f1(pico)} dBFS (máximo ${PICO_MAX})`))
    else controles.push(control('audio', lufs >= LUFS_MIN && lufs <= LUFS_MAX && pico <= PICO_MAX, `${f1(lufs)} LUFS (entre ${f1(LUFS_MIN)} y ${f1(LUFS_MAX)}), pico ${f1(pico)} dBFS`))

    const sil = parsearTramos(correr(['-i', archivo, '-map', '0:a:0', '-af', `silencedetect=n=-50dB:d=${SILENCIO_MAX_SEG}`, '-f', 'null', '-']).salida, 'silencio')
    if (!sinVoz) controles.push(control('silencios', sil.length === 0, sil.length ? `${sil.length} silencio(s) de más de ${SILENCIO_MAX_SEG} s (el más largo, ${f1(Math.max(...sil))} s)` : `Ninguno de más de ${SILENCIO_MAX_SEG} s`))
  }

  if (s.tieneVideo) {
    const neg = parsearTramos(correr(['-i', archivo, '-an', '-vf', `blackdetect=d=${NEGRO_MAX_SEG}:pix_th=0.10`, '-f', 'null', '-']).salida, 'negro')
    controles.push(control('sin negro', neg.length === 0, neg.length ? `${neg.length} tramo(s) en negro de más de ${NEGRO_MAX_SEG} s` : `Ningún tramo en negro de más de ${NEGRO_MAX_SEG} s`))
    const cong = parsearTramos(correr(['-i', archivo, '-an', '-vf', `freezedetect=n=-60dB:d=${CONGELADO_MAX_SEG}`, '-f', 'null', '-']).salida, 'congelado')
    controles.push(control('sin imagen congelada', cong.length === 0, cong.length ? `${cong.length} tramo(s) quietos de más de ${CONGELADO_MAX_SEG} s` : `Nada quieto más de ${CONGELADO_MAX_SEG} s`))
  }
  return controles
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2)
  const i = args.indexOf('--formato')
  const formato = i >= 0 ? args.splice(i, 2)[1] : undefined
  const t = args.indexOf('--tutorial')
  const tutorial = t >= 0 ? (args.splice(t, 1), true) : false
  const j = args.indexOf('--sin-voz')
  const sinVoz = j >= 0 ? (args.splice(j, 1), true) : false
  const [archivo] = args
  if (!archivo) {
    console.error('Uso: node controles.mjs <video.mp4> [--formato REEL_9_16|CUADRADO|HORIZONTAL_16_9] [--sin-voz]')
    process.exit(2)
  }
  try {
    console.log(JSON.stringify(medir(archivo, { formato, sinVoz, tutorial })))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
