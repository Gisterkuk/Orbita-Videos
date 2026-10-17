// Cerraduras entre videos en paralelo (lib/candado.mjs). Usa una carpeta temporal: ORBITA_VIDEOS se lee al importar.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

process.env.ORBITA_VIDEOS = fs.mkdtempSync(path.join(os.tmpdir(), 'candado-'))
const { tomarCandado, soltarCandado, leerCandado } = await import('../lib/candado.mjs')

test('toma, informa el dueño y suelta', async () => {
  const soltar = await tomarCandado('demo', { quien: 'video-a', pid: 0 })
  assert.equal(leerCandado('demo').quien, 'video-a')
  soltar()
  assert.equal(leerCandado('demo'), null)
})

test('un segundo video espera y falla por tiempo si el dueño no suelta', async () => {
  const soltar = await tomarCandado('demo', { quien: 'video-a', pid: 0 })
  await assert.rejects(tomarCandado('demo', { quien: 'video-b', esperaMin: 0.02, pid: 0 }), /ocupado por video-a/)
  soltar()
})

test('solo su dueño la suelta, salvo force', async () => {
  const soltar = await tomarCandado('demo', { quien: 'video-a', pid: 0 })
  assert.match(soltarCandado('demo', 'video-b'), /no es tuyo/)
  assert.equal(leerCandado('demo').quien, 'video-a')
  assert.equal(soltarCandado('demo', 'video-b', true), 'liberado')
  soltar() // ya liberada: no falla
})

test('la cerradura del perfil de un proceso que ya no existe se considera huérfana', async () => {
  const soltarVieja = await tomarCandado('perfil', { quien: 'proceso-muerto', pid: 999_999_999 })
  const soltar = await tomarCandado('perfil', { quien: 'proceso-vivo', esperaMin: 0.05 })
  assert.equal(leerCandado('perfil').quien, 'proceso-vivo')
  soltar()
  soltarVieja()
})

test('"demo" y "render" las puede volver a tomar el mismo video, "perfil" no', async () => {
  const s1 = await tomarCandado('render', { quien: 'video-a', pid: 0 })
  const s2 = await tomarCandado('render', { quien: 'video-a', esperaMin: 0.02, pid: 0 }) // mismo video: entra
  assert.equal(leerCandado('render').quien, 'video-a')
  await assert.rejects(tomarCandado('render', { quien: 'video-b', esperaMin: 0.02, pid: 0 }), /ocupado por video-a/)
  s2(); assert.equal(leerCandado('render'), null); s1()
  const p1 = await tomarCandado('perfil', { quien: 'carpeta:script' })
  await assert.rejects(tomarCandado('perfil', { quien: 'carpeta:script', esperaMin: 0.02 }), /ocupado/)
  p1()
})
