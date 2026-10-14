// Dónde está el código de Órbita (apps/web, apps/api): este repo de videos vive aparte.
// Orden: variable ORBITA_REPO → orbita.config.json (codigoOrbita) en la raíz del repo → la raíz misma.
import fs from 'node:fs'
import path from 'node:path'

export function rutaCodigoOrbita({ raiz, env = process.env }) {
  if (env.ORBITA_REPO) return env.ORBITA_REPO
  const archivo = path.join(raiz, 'orbita.config.json')
  if (fs.existsSync(archivo)) {
    const { codigoOrbita } = JSON.parse(fs.readFileSync(archivo, 'utf8'))
    if (codigoOrbita) return codigoOrbita
  }
  return raiz
}
