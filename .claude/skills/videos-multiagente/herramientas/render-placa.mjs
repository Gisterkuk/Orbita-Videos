// Renderiza la "placa" (la pantalla del panel ya editada, sin ventana ni cámara: eso lo dibuja
// HyperFrames encima) a un MP4 casi sin pérdida. 3 navegadores en paralelo hacen seek(t) +
// captura PNG (sin pérdida) y la pasan por pipe a ffmpeg (H.264 crf 8, BT.709).
//   PAGE=compose/plate.html TL=compose/tl-plate.json node herramientas/render-placa.mjs <salida.mp4> [desde] [hasta]
// Resolución = tl.W × tl.H (2880×1800 para capturas de densidad 2). Sin audio.
// Para videos largos, herramientas/placa-tramos.sh lo corre en tramos con reintentos.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium, chromePath, ffmpegPath } from './lib/deps.mjs'

const [salida = 'out/placa.mp4', desdeA, hastaA] = process.argv.slice(2)
const FPS = 60, WORKERS = 3
const PAGE = process.env.PAGE ?? 'compose/plate.html', TLP = process.env.TL ?? 'compose/tl-plate.json'
const tl = JSON.parse(fs.readFileSync(TLP, 'utf8'))
const W = tl.W ?? 2880, H = tl.H ?? 1800
const desde = Number(desdeA ?? 0), hasta = Math.min(tl.duration, Number(hastaA ?? tl.duration))
const f0 = Math.round(desde * FPS), f1 = Math.round(hasta * FPS), total = f1 - f0
const tmp = path.resolve(path.dirname(salida), `.trozos-${path.basename(salida, '.mp4')}`)
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true })
console.log(`Placa ${W}×${H} · ${desde}s→${hasta}s · ${total} cuadros · ${WORKERS} procesos`)

const browser = await chromium.launch({ executablePath: chromePath(), args: ['--allow-file-access-from-files', '--disable-web-security'] })
const url = pathToFileURL(path.resolve(PAGE)).href
let hechos = 0
const t0 = Date.now()
async function worker(w, a, b) {
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.goto(url)
  await page.evaluate(tl => window.load(tl), tl)
  const archivo = path.join(tmp, `c${String(w).padStart(2, '0')}.mp4`)
  const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '8', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', archivo], { stdio: ['pipe', 'inherit', 'inherit'] })
  const fin = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))))
  for (let f = a; f < b; f++) {
    await page.evaluate(t => window.seek(t), f / FPS)
    const img = await page.screenshot({ type: 'png' })
    if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r))
    if (++hechos % 300 === 0) { const s = (Date.now() - t0) / 1000; console.log(`  ${hechos}/${total} (${(hechos / s).toFixed(1)} c/s, faltan ~${Math.round((total - hechos) / (hechos / s))} s)`) }
  }
  ff.stdin.end(); await fin; await page.close()
  return archivo
}
const por = Math.ceil(total / WORKERS)
const partes = await Promise.all(Array.from({ length: WORKERS }, (_, w) => { const a = f0 + w * por, b = Math.min(f1, a + por); return a < b ? worker(w, a, b) : null }))
await browser.close()
const lista = path.join(tmp, 'lista.txt')
fs.writeFileSync(lista, partes.filter(Boolean).map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'))
await new Promise((res, rej) => spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c:v', 'copy', '-movflags', '+faststart', salida], { stdio: 'inherit' })
  .on('close', c => c === 0 ? res() : rej(new Error('unión ' + c))))
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`Listo: ${salida} (${((Date.now() - t0) / 1000).toFixed(0)} s)`)
