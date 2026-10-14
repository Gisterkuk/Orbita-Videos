// node --test herramientas/test/cuadros.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ffmpegPath } from '../lib/deps.mjs'

const hf = fileURLToPath(new URL('./fixtures/hf/', import.meta.url))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cuadros-')), video = path.join(tmp, 'b.mp4'), salida = path.join(tmp, 'rev')
execFileSync(ffmpegPath, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=1920x1080:r=30:d=10', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', video])

test('arma un tramo por paso con su hoja de cuadros, la voz del tramo y el cuadro de cada palabra clave', () => {
  execFileSync('node', [fileURLToPath(new URL('../revision/cuadros.mjs', import.meta.url)), video, hf, salida])
  const tramos = JSON.parse(fs.readFileSync(path.join(salida, 'tramos.json'), 'utf8'))
  assert.equal(tramos.length, 2)
  assert.equal(tramos[0].paso, 'Uno')
  assert.match(tramos[0].voz, /Hola mundo\./)
  assert.ok(fs.existsSync(path.join(salida, tramos[0].hoja)))
  assert.ok(tramos[0].palabras.some(p => p.w === 'mundo.' && fs.existsSync(path.join(salida, p.cuadro))))
})
