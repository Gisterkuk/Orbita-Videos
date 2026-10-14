// node --test herramientas/test/nitidez.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { varianzaLaplaciano } from '../lib/nitidez.mjs'

test('una imagen con bordes nítidos mide más que la misma borrosa', () => {
  const w = 64, h = 64, nitida = new Uint8Array(w * h), borrosa = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    nitida[y * w + x] = (Math.floor(x / 4) % 2) ? 255 : 0                       // rayas de 4 px
    borrosa[y * w + x] = Math.round(127.5 + 127.5 * Math.sin((x / 8) * Math.PI)) // degradé suave
  }
  assert.ok(varianzaLaplaciano(nitida, w, h) > 10 * varianzaLaplaciano(borrosa, w, h))
})

test('una imagen plana mide 0', () => {
  assert.equal(varianzaLaplaciano(new Uint8Array(16 * 16).fill(128), 16, 16), 0)
})
