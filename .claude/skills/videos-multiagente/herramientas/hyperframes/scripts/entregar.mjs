// Entrega del video aprobado: el render final en 4K se reescala a 1440p (lanczos: el texto se ve
// más nítido en YouTube que subiendo 1080p), el audio se normaliza a -14 LUFS, y sale además una
// versión liviana para mandar por chat (1080p a 30 fps: se baja la fluidez antes que la nitidez).
//   node scripts/entregar.mjs renders/final-4k.mp4 --slug conoce-tu-panel [--fecha AAAA-MM-DD] [--tipo tutoriales] [--destino <dir>]
// Destino por defecto: marketing/videos/<tipo>/ del repo (ignorado por git).
// Codifica con la RTX (NVENC) y, si no hay, con libx264.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import os from 'node:os'

const args = process.argv.slice(2)
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined }
const entrada = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'))
if (!entrada || !fs.existsSync(entrada)) { console.error('Uso: node scripts/entregar.mjs <final-4k.mp4> --slug <slug> [--fecha] [--tipo] [--destino]'); process.exit(1) }
const slug = opt('slug') ?? path.basename(entrada, '.mp4')
const fecha = opt('fecha') ?? new Date().toISOString().slice(0, 10)
// el repo: video.json "repo" (lo escribe preparar.mjs en la carpeta del video) o, si el script corre
// desde el skill, 6 niveles arriba
const VIDEO = fs.existsSync('video.json') ? JSON.parse(fs.readFileSync('video.json', 'utf8')) : {}
const REPO = VIDEO.repo ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const destino = path.resolve(opt('destino') ?? path.join(REPO, 'marketing', 'videos', opt('tipo') ?? 'tutoriales'))
fs.mkdirSync(destino, { recursive: true })
const ffmpeg = createRequire(path.join(process.env.ORBITA_VIDEOS ?? path.join(os.homedir(), 'orbita-videos'), 'kit', 'package.json'))('ffmpeg-static')

function correr(lista) {
  for (const a of lista) {
    const r = spawnSync(ffmpeg, ['-v', 'error', '-y', ...a], { stdio: ['ignore', 'inherit', 'pipe'], encoding: 'utf8' })
    if (r.status === 0) return
    console.warn('  (falló una variante, pruebo la siguiente)', (r.stderr ?? '').split('\n').slice(-3).join(' '))
  }
  throw new Error('ffmpeg falló en todas las variantes')
}

const alta = path.join(destino, `${fecha}_${slug}_16x9.mp4`), liviana = path.join(destino, `${fecha}_${slug}_16x9-liviano.mp4`)
const audioAlta = ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k']
console.log('1440p →', alta)
correr([
  ['-i', entrada, '-vf', 'scale=2560:1440:flags=lanczos', '-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '18', '-b:v', '16M', '-maxrate', '24M', '-bufsize', '48M', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...audioAlta, '-movflags', '+faststart', alta],
  ['-i', entrada, '-vf', 'scale=2560:1440:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', ...audioAlta, '-movflags', '+faststart', alta],
])
console.log('liviana →', liviana)
correr([
  ['-i', alta, '-vf', 'fps=30,scale=1920:1080:flags=lanczos', '-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-multipass', 'fullres', '-rc', 'vbr', '-b:v', '2500k', '-maxrate', '5000k', '-bufsize', '10000k', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', liviana],
  ['-i', alta, '-vf', 'fps=30,scale=1920:1080:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '2500k', '-maxrate', '5000k', '-bufsize', '10000k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', liviana],
])
const mb = f => (fs.statSync(f).size / 1048576).toFixed(1) + ' MB'
console.log(`Listo: ${path.basename(alta)} (${mb(alta)}) · ${path.basename(liviana)} (${mb(liviana)})`)
