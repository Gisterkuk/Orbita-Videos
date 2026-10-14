// node --test herramientas/test/grabador-resolucion.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { dimensionesJpeg, verificarResolucion } from '../lib/grabador.mjs'

const jpeg = fs.readFileSync(new URL('./fixtures/16x8.jpg', import.meta.url))

test('lee ancho y alto de un JPEG sin decodificarlo', () => {
  assert.deepEqual(dimensionesJpeg(jpeg), { w: 16, h: 8 })
})

test('corta con un error claro si la captura salió en baja resolución', () => {
  assert.throws(() => verificarResolucion(jpeg, 2880, 1800), /Captura en baja resolución: 16×8/)
})

test('acepta una captura con la resolución esperada', () => {
  assert.deepEqual(verificarResolucion(jpeg, 16, 8), { w: 16, h: 8 })
})
