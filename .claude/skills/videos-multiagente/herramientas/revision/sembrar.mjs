// Siembra un defecto conocido en un video para calibrar a los críticos (referencia/calibracion/):
// si el supervisor no lo encuentra, el supervisor está roto.
//   node herramientas/revision/sembrar.mjs <video> <salida> --defecto silencio --en <s>          (3 s sin audio)
//   node herramientas/revision/sembrar.mjs <video> <salida> --defecto congelado --en <s>         (3 s de imagen quieta; misma duración)
//   node herramientas/revision/sembrar.mjs <video> <salida> --defecto panel-abierto --en <s> --desde <s2>
//       (4 s con un recorte del cuadro del segundo s2 pegado encima: un panel que "quedó abierto")
import { execFileSync } from 'node:child_process'
import { ffmpegPath } from '../lib/deps.mjs'

const args = process.argv.slice(2)
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined }
const [entrada, salida] = args
const defecto = opt('defecto'), en = Number(opt('en'))
if (!entrada || !salida || !defecto || !Number.isFinite(en)) { console.error('Uso: sembrar.mjs <video> <salida> --defecto silencio|congelado|panel-abierto --en <s> [--desde <s>]'); process.exit(1) }
const ff = a => execFileSync(ffmpegPath, ['-v', 'error', '-y', ...a], { stdio: 'inherit' })
const VIDEO = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p']

if (defecto === 'silencio') {
  ff(['-i', entrada, '-af', `volume=enable='between(t,${en},${en + 3})':volume=0`, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', salida])
} else if (defecto === 'congelado') {
  // corta el video en el s en, repite ese cuadro 3 s y sigue desde en+3: la duración no cambia
  ff(['-i', entrada, '-filter_complex',
    `[0:v]split=3[x][y][z];[x]trim=0:${en},setpts=PTS-STARTPTS[a];` +
    `[y]trim=start=${en}:duration=0.05,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=3,trim=duration=3[b];` +
    `[z]trim=start=${en + 3},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]`,
    '-map', '[v]', '-map', '0:a?', ...VIDEO, '-c:a', 'copy', salida])
} else if (defecto === 'panel-abierto') {
  const desde = Number(opt('desde') ?? 1)
  ff(['-i', entrada, '-filter_complex',
    `[0:v]split[m][s];[s]trim=start=${desde}:duration=0.05,setpts=PTS-STARTPTS+${en}/TB,crop=iw/3:ih/2:iw*0.6:ih*0.2,tpad=stop_mode=clone:stop_duration=4[p];` +
    `[m][p]overlay=x=W*0.6:y=H*0.2:enable='between(t,${en},${en + 4})'[v]`,
    '-map', '[v]', '-map', '0:a?', ...VIDEO, '-c:a', 'copy', salida])
} else {
  console.error('Defecto desconocido:', defecto); process.exit(1)
}
console.log(`Sembrado "${defecto}" en ${en} s → ${salida}`)
