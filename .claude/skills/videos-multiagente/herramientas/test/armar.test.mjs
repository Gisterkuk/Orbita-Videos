// node --test herramientas/test/armar.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('./fixtures/hf/', import.meta.url))
const armar = fileURLToPath(new URL('../hyperframes/scripts/armar.mjs', import.meta.url))
execFileSync('node', [armar], { cwd: dir })
const leer = n => fs.readFileSync(dir + 'compositions/' + n + '.html', 'utf8')

test('los pasos son llamadas chicas junto al elemento y una barra de progreso fina', () => {
  const pasos = leer('pasos')
  assert.match(pasos, /class="llamada[ "]/)
  assert.match(pasos, /id="progreso-barra"/)
  assert.doesNotMatch(pasos, /class="paso"/, 'ya no hay tarjeta grande a la izquierda')
  assert.doesNotMatch(pasos, /id="progreso"[ >]/, 'ya no hay lista grande a la derecha')
})

test('los resaltados son un foco que oscurece el resto, sin recuadro azul', () => {
  const v = leer('ventana')
  assert.match(v, /id="foco"/)
  assert.doesNotMatch(v, /class="hl"/)
})

test('las recreaciones van marcadas con su etiqueta', () => {
  assert.match(leer('ventana'), /class="recreacion"[\s\S]*Así lo ve un Empleado/)
})

test('la placa y los efectos salen de video.json', () => {
  const idx = fs.readFileSync(dir + 'index.html', 'utf8')
  assert.match(idx, /src="assets\/sfx\.wav"/)
  assert.match(leer('ventana'), /src="assets\/placa\.mp4"/)
})

test('los subtítulos son de 30 px', () => {
  assert.match(leer('subtitulos'), /font: 650 30px/)
})
