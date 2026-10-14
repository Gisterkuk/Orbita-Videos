// node --test herramientas/test/sembrar.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ffmpegPath } from '../lib/deps.mjs'
import { escanear } from '../revision/escaneos.mjs'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sembrar-')), base = path.join(tmp, 'base.mp4')
const sembrar = fileURLToPath(new URL('../revision/sembrar.mjs', import.meta.url))
execFileSync(ffmpegPath, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=10', '-f', 'lavfi', '-i', 'sine=f=440:d=10:sample_rate=48000',
  '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', base])

test('un silencio sembrado en el s 4 lo encuentra el escaneo', async () => {
  const out = path.join(tmp, 'silencio.mp4')
  execFileSync('node', [sembrar, base, out, '--defecto', 'silencio', '--en', '4'])
  const r = await escanear(out)
  assert.ok(r.silencios.some(s => Math.abs(s.t0 - 4) < 1), JSON.stringify(r.silencios))
})

test('un congelamiento sembrado en el s 5 lo encuentra el escaneo y el video sigue durando lo mismo', async () => {
  const out = path.join(tmp, 'congelado.mp4')
  execFileSync('node', [sembrar, base, out, '--defecto', 'congelado', '--en', '5'])
  const r = await escanear(out)
  assert.ok(r.congelados.some(c => Math.abs(c.t0 - 5) < 1), JSON.stringify(r.congelados))
  assert.ok(Math.abs(r.duracion - 10) < .3, `duración ${r.duracion}`)
})

test('un panel que queda abierto pega 4 s de otro momento encima', () => {
  const out = path.join(tmp, 'panel.mp4')
  execFileSync('node', [sembrar, base, out, '--defecto', 'panel-abierto', '--en', '6', '--desde', '1'])
  assert.ok(fs.statSync(out).size > 10000)
})
