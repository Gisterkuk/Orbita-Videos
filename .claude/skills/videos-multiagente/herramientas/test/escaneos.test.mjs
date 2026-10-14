// node --test herramientas/test/escaneos.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ffmpegPath } from '../lib/deps.mjs'
import { escanear } from '../revision/escaneos.mjs'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'esc-')), video = path.join(tmp, 's.mp4')
// imagen: 0–2 s movimiento, 2–3 s negro, 3–6 s congelado, 6–8 s movimiento
// audio:  0–4 s tono, 4–8 s silencio
execFileSync(ffmpegPath, ['-v', 'error', '-y',
  '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=2',
  '-f', 'lavfi', '-i', 'color=black:s=640x360:r=30:d=1',
  '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=0.04,loop=loop=89:size=1:start=0',
  '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=2',
  '-f', 'lavfi', '-i', 'sine=f=440:d=4:sample_rate=48000', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono:d=4',
  '-filter_complex', '[0][1][2][3]concat=n=4:v=1:a=0,format=yuv420p[v];[4][5]concat=n=2:v=0:a=1[a]',
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', video])

test('detecta el tramo negro, el congelado y el silencio con su segundo', async () => {
  const r = await escanear(video)
  assert.ok(r.negros.some(n => n.t0 > 1.8 && n.t1 < 3.3), JSON.stringify(r.negros))
  assert.ok(r.congelados.some(c => c.t0 > 2.8 && c.t0 < 3.5), JSON.stringify(r.congelados))
  assert.ok(r.silencios.some(s => s.t0 > 3.8 && s.t0 < 4.4), JSON.stringify(r.silencios))
  assert.equal(typeof r.lufs, 'number')
  assert.ok(Math.abs(r.duracion - 8) < .2, `duración ${r.duracion}`)
})

test('un video sin defectos no reporta negros ni congelados', async () => {
  const limpio = path.join(tmp, 'limpio.mp4')
  execFileSync(ffmpegPath, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=3', '-f', 'lavfi', '-i', 'sine=f=440:d=3:sample_rate=48000', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', limpio])
  const r = await escanear(limpio)
  assert.deepEqual([r.negros.length, r.congelados.length], [0, 0])
})
