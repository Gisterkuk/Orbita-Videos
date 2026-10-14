// node --test herramientas/test/config.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { rutaCodigoOrbita } from '../lib/config.mjs'

const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'))

test('sin config ni variable, el código de Órbita es la raíz del repo (como antes)', () => {
  assert.equal(rutaCodigoOrbita({ raiz, env: {} }), raiz)
})

test('orbita.config.json → codigoOrbita manda sobre la raíz', () => {
  fs.writeFileSync(path.join(raiz, 'orbita.config.json'), JSON.stringify({ codigoOrbita: 'C:/dev/GitHub/Orbita-Frontend' }))
  assert.equal(rutaCodigoOrbita({ raiz, env: {} }), 'C:/dev/GitHub/Orbita-Frontend')
})

test('la variable ORBITA_REPO manda sobre el archivo', () => {
  assert.equal(rutaCodigoOrbita({ raiz, env: { ORBITA_REPO: 'D:/otro' } }), 'D:/otro')
})
