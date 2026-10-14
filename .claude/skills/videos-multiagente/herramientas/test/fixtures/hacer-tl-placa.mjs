// Fixture para el test de la placa: un cuadro de 2880×1800 con detalle fino y una línea de
// tiempo de 1 s que lo muestra fijo.   node hacer-tl-placa.mjs <dir>
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { ffmpegPath } from '../../lib/deps.mjs'
const dir = path.resolve(process.argv[2])
fs.mkdirSync(dir, { recursive: true })
execFileSync(ffmpegPath, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=2880x1800', '-frames:v', '1', path.join(dir, 'frame.png')])
fs.writeFileSync(path.join(dir, 'tl.json'), JSON.stringify({
  W: 2880, H: 1800, duration: 1,
  segs: [{ o0: 0, o1: 1, s0: 0, s1: 0, hold: true }],
  frames: [{ s: 0, f: pathToFileURL(path.join(dir, 'frame.png')).href }], scrolls: [],
}))
