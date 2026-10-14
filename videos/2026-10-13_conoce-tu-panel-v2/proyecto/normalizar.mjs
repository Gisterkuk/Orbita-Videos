// Normaliza el audio de un render a −14 LUFS integrados, pico verdadero ≤ −1,5 dBTP (loudnorm en dos
// pasadas, lineal). El video se copia sin recodificar.
//   node scripts/normalizar.mjs renders/borrador.mp4 renders/borrador-v2.mp4
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const [ent, sal] = process.argv.slice(2)
const ffmpeg = createRequire(path.join(os.homedir(), 'orbita-videos', 'kit', 'package.json'))('ffmpeg-static')
const OBJ = 'I=-14:TP=-1.5:LRA=11'
const p1 = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', ent, '-vn', '-af', `loudnorm=${OBJ}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 })
const m = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf('{')))
console.log(`medido: ${m.input_i} LUFS · pico ${m.input_tp} dBTP · LRA ${m.input_lra}`)
const af = `loudnorm=${OBJ}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`
const p2 = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-y', '-i', ent, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', sal], { encoding: 'utf8', maxBuffer: 1 << 26 })
if (p2.status !== 0) { console.error(p2.stderr.slice(-2000)); process.exit(1) }
const r = JSON.parse(p2.stderr.match(/{[^{}]*"output_i"[^{}]*}/)[0])
console.log(`salida: ${r.output_i} LUFS · pico ${r.output_tp} dBTP · ${r.normalization_type} → ${sal}`)
