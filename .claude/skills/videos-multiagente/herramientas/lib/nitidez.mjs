// Nitidez = varianza del laplaciano (4 vecinos) sobre una imagen en gris: más alto, más nítido.
// Sirve para comparar métodos de captura y para el control objetivo del supervisor (texto
// borroso por un zoom que agranda de más).
import { execFileSync } from 'node:child_process'

export function varianzaLaplaciano(g, w, h) {
  let n = 0, s = 0, s2 = 0
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w]
    s += l; s2 += l * l; n++
  }
  if (!n) return 0
  const m = s / n
  return s2 / n - m * m
}

// Nitidez de un recorte (px de la imagen, no CSS) de una imagen o del primer cuadro de un video.
// El recorte es obligatorio: ffmpeg-static no trae ffprobe para averiguar el ancho.
export async function nitidezDeArchivo(ruta, recorte, { t } = {}) {
  if (!recorte) throw new Error('nitidezDeArchivo: pasá un recorte { x, y, w, h }')
  const { ffmpegPath } = await import('./deps.mjs')
  const args = ['-v', 'error', ...(t != null ? ['-ss', String(t)] : []), '-i', ruta,
    '-vf', `crop=${recorte.w}:${recorte.h}:${recorte.x}:${recorte.y},format=gray`, '-frames:v', '1', '-f', 'rawvideo', '-']
  const g = execFileSync(ffmpegPath, args, { maxBuffer: 1 << 28 })
  return varianzaLaplaciano(g, recorte.w, recorte.h)
}
