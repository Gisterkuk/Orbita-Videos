// node --test herramientas/test/edicion.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { crearEdicion } from '../lib/edicion.mjs'

const dir = fileURLToPath(new URL('./fixtures/', import.meta.url))
// toma sintética: frase A en 0–1 s, 12 s de movimiento sin voz con una marca 'leer' en el s 5,
// y la frase B en 13–14 s
const voz = { frases: [
  { id: 'a', desde: 'a0', hasta: 'a1', dur: 1 },
  { id: 'b', desde: 'b0', hasta: 'b1', dur: 1 },
] }
const vel = g => (g.s1 - g.s0) / (g.o1 - g.o0)

test('un tramo protegido no se acelera aunque caiga en medio de un segmento largo', () => {
  const ag = { hueco: .6, max: 3, proteger: [] }
  const E = crearEdicion({ tomas: [{ nombre: 'toma-sintetica' }], voz, agil: ag, dir })
  ag.proteger.push([E.M('leer'), E.M('leer') + 2])
  E.clip(E.M('inicio'), E.M('b1')); E.armar()
  const dentro = E.segs.find(g => !g.hold && g.s0 >= E.M('leer') - 1e-6 && g.s1 <= E.M('leer') + 2 + 1e-6)
  assert.ok(dentro, 'hay un segmento exactamente sobre el tramo protegido')
  assert.ok(Math.abs(vel(dentro) - 1.2) < .01, `va a velocidad base (1,2×), no ${vel(dentro).toFixed(2)}`)
  const fuera = E.segs.find(g => !g.hold && g.s0 >= E.M('leer') + 2 - 1e-6 && g.s1 > g.s0)
  assert.ok(vel(fuera) > 1.3, `lo de afuera sí se acelera (${vel(fuera).toFixed(2)})`)
})

test('un zoom por encima del tope se recorta a 1,6', () => {
  const E = crearEdicion({ tomas: [{ nombre: 'toma-sintetica' }], dir })
  E.clip(E.M('inicio'), E.M('b1')); E.armar()
  E.camara(E.M('a0') + .5, 1, 700, 400, 1.9)
  const tl = E.escribir({ nombre: 'test', soloDatos: true })
  assert.equal(tl.cam.at(-1).z, 1.6)
})

test('acelerar(a, b, f) hace ese tramo de fuente f veces más rápido que la base', () => {
  const E = crearEdicion({ tomas: [{ nombre: 'toma-sintetica' }], voz, dir })
  E.acelerar(E.M('leer'), E.M('leer') + 2, 3)
  E.clip(E.M('inicio'), E.M('b1')); E.armar()
  const g = E.segs.find(s => !s.hold && s.s0 >= E.M('leer') - 1e-6 && s.s1 <= E.M('leer') + 2 + 1e-6 && s.s1 > s.s0)
  assert.ok(g, 'hay un segmento sobre el tramo acelerado')
  assert.ok(Math.abs(vel(g) - 1.2 * 3) < .05, `va a 3,6× (base 1,2 × 3), no ${vel(g).toFixed(2)}`)
})
