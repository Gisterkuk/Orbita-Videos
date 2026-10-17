import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// El logo de los videos es el REAL de Órbita (design-system/components/OrbitaLogo.tsx): el planeta con su anillo
// COMPLETO y el satélite dando la vuelta. El arco abierto es el del loader (una animación de carga), no el logo.
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const H = path.join(AQUI, '..')
const PLANTILLAS = ['compositor/index.html', 'compositor/promo.html', 'hyperframes/scripts/armar.mjs']
const leer = f => fs.readFileSync(path.join(H, f), 'utf8')

for (const f of PLANTILLAS) {
  test(`${f}: el logo no tiene el arco abierto del loader`, () => {
    const s = leer(f)
    assert.ok(!/stroke-dasharray="151 50"/.test(s) && !/'151 50'/.test(s), 'quedó el arco abierto (151 50)')
    assert.ok(!/strokeDasharray: '151 50'/.test(s), 'la animación termina en un arco abierto')
  })
  test(`${f}: el anillo del logo se cierra completo`, () => {
    const s = leer(f)
    // circunferencia del anillo r=36: 226,2. La animación y el dibujo final tienen que terminar en "226.2 0" (sin hueco).
    assert.match(s, /226\.2 0/, 'el anillo no termina completo')
  })
}

test('armar.mjs: el planeta y el satélite del logo tienen los colores de la marca', () => {
  const s = leer('hyperframes/scripts/armar.mjs')
  assert.match(s, /fill="#3B82F6"/)   // planeta
  assert.match(s, /fill="#93C5FD"/)   // satélite
})
