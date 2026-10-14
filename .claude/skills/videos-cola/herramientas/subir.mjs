// Sube el mp4 a la dirección firmada que devolvió `videos_pedir_subida` (un PUT directo al almacenamiento de Órbita).
//   node subir.mjs <video.mp4> <uploadUrl>
// La dirección es una credencial temporal (vale 10 minutos para empezar): no se imprime ni se guarda.
// Imprime en JSON { bytes, status }. Después hay que llamar a `videos_registrar` con el videoId.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { MAX_BYTES } from './ffmpeg.mjs'

export async function subir(archivo, url, { fetchFn = fetch } = {}) {
  if (!fs.existsSync(archivo)) throw new Error(`No existe el archivo: ${archivo}`)
  let destino
  try {
    destino = new URL(url)
  } catch {
    throw new Error('La dirección de subida no es válida')
  }
  if (destino.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(destino.hostname)) throw new Error('La dirección de subida tiene que ser https')
  const datos = fs.readFileSync(archivo)
  if (datos.length === 0) throw new Error('El archivo está vacío')
  if (datos.length > MAX_BYTES) throw new Error(`El video pesa más de ${MAX_BYTES / 1024 / 1024} MB: pasalo por preparar.mjs`)
  // Content-Type exacto: es parte de la firma y, si cambia, el almacenamiento rechaza la subida.
  const res = await fetchFn(destino, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: datos, signal: AbortSignal.timeout(10 * 60_000) })
  if (!res.ok) throw new Error(`El almacenamiento rechazó la subida (HTTP ${res.status}). Si pasaron más de 10 minutos, pedí una dirección nueva con videos_pedir_subida`)
  return { bytes: datos.length, status: res.status }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [archivo, url] = process.argv.slice(2)
  if (!archivo || !url) {
    console.error('Uso: node subir.mjs <video.mp4> <uploadUrl>')
    process.exit(2)
  }
  subir(archivo, url).then(
    (r) => console.log(JSON.stringify(r)),
    (e) => { console.error(e.message); process.exit(1) },
  )
}
