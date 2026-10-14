// node --test herramientas/test/placa.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ffmpegPath } from '../lib/deps.mjs'
import { nitidezDeArchivo } from '../lib/nitidez.mjs'
import { dimensionesJpeg } from '../lib/grabador.mjs'

test('la placa sale a 2880×1800 y conserva la nitidez del cuadro fuente', { timeout: 180000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'placa-test-'))
  execFileSync('node', ['herramientas/test/fixtures/hacer-tl-placa.mjs', dir])
  execFileSync('node', ['herramientas/render-placa.mjs', path.join(dir, 'placa.mp4'), '0', '1'],
    { env: { ...process.env, PAGE: 'herramientas/compositor/plate.html', TL: path.join(dir, 'tl.json') } })
  execFileSync(ffmpegPath, ['-v', 'error', '-y', '-ss', '0.5', '-i', path.join(dir, 'placa.mp4'), '-frames:v', '1', '-q:v', '1', path.join(dir, 'out.jpg')])
  assert.deepEqual(dimensionesJpeg(fs.readFileSync(path.join(dir, 'out.jpg'))), { w: 2880, h: 1800 })
  const r = { x: 300, y: 300, w: 1000, h: 500 }
  const fuente = await nitidezDeArchivo(path.join(dir, 'frame.png'), r), placa = await nitidezDeArchivo(path.join(dir, 'out.jpg'), r)
  assert.ok(placa > 0.85 * fuente, `nitidez placa ${placa.toFixed(0)} vs fuente ${fuente.toFixed(0)}`)
})
