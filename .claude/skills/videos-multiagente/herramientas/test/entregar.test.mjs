// node --test herramientas/test/entregar.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ffmpegPath } from '../lib/deps.mjs'
import { dimensionesJpeg } from '../lib/grabador.mjs'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'entregar-'))
const final = path.join(dir, 'final-4k.mp4'), destino = path.join(dir, 'videos')
// 2 s de un 4K con un tono fuerte (para que la normalización tenga algo que bajar)
execFileSync(ffmpegPath, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=3840x2160:r=60:d=2', '-f', 'lavfi', '-i', 'sine=f=440:d=2:sample_rate=48000',
  '-af', 'volume=6dB', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', final])

test('entrega 1440p a -14 LUFS y una liviana de 30 fps con el nombre de la convención', { timeout: 180000 }, () => {
  execFileSync('node', ['herramientas/hyperframes/scripts/entregar.mjs', final, '--slug', 'prueba', '--fecha', '2026-10-12', '--destino', destino])
  const alta = path.join(destino, '2026-10-12_prueba_16x9.mp4'), liviana = path.join(destino, '2026-10-12_prueba_16x9-liviano.mp4')
  assert.ok(fs.existsSync(alta) && fs.existsSync(liviana))
  execFileSync(ffmpegPath, ['-v', 'error', '-y', '-ss', '1', '-i', alta, '-frames:v', '1', '-q:v', '2', path.join(dir, 'a.jpg')])
  assert.deepEqual(dimensionesJpeg(fs.readFileSync(path.join(dir, 'a.jpg'))), { w: 2560, h: 1440 })
  const stderr = args => spawnSync(ffmpegPath, ['-hide_banner', ...args], { encoding: 'utf8' }).stderr
  const lufs = Number(stderr(['-i', alta, '-af', 'ebur128', '-f', 'null', '-']).match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0])
  assert.ok(lufs > -15 && lufs < -13, `LUFS ${lufs}`)
  assert.match(stderr(['-i', liviana]), /, 30 fps,/)
})
