import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { rolDe, acciones, agentes, estadoDeVideo, modeloDeVideo, SEGUIDOS_TRABADO } from '../lib/modelo.mjs'
import { extraerCambios } from '../lib/eventos.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const ts = m => new Date(Date.UTC(2026, 9, 17, 12, m)).toISOString()
const AHORA = Date.UTC(2026, 9, 17, 14, 0)

test('el rol sale del tipo de agente y de la descripción', () => {
  assert.equal(rolDe('juez-guion', ['Juez adversarial r2']), 'juez-exigente')
  assert.equal(rolDe('juez-guion', ['Juez claridad #6 ronda 2']), 'juez-claridad')
  assert.equal(rolDe('juez-guion', [null, 'Sos el juez en modo claridad. No sos el adversarial.']), 'juez-claridad')
  assert.equal(rolDe('supervisor-video', ['Supervisor de fidelidad v1']), 'supervisor-fidelidad')
  assert.equal(rolDe('editor-video'), 'editor')
  assert.equal(rolDe('claude', ['Director del tutorial 3']), 'director')
  assert.equal(rolDe('claude', ['Buscar algo']), 'ayudante')
  assert.equal(rolDe('a1715778a81d207f4'), null)
  assert.equal(rolDe(''), null)
})

test('las devoluciones se atribuyen por id y el ruido sin nombre se descarta', () => {
  const acs = acciones([
    { ts: ts(0), tipo: 'lanzado', agente: 'juez-guion', agenteId: 'abc123def456', descripcion: 'Juez adversarial r1', texto: 'revisá' },
    { ts: ts(5), tipo: 'devolucion', agente: '', agenteId: 'abc123def456', texto: '# Veredicto: RECHAZADO\n## Bloqueantes\n- [J1] **Severidad A** — 0:12 a 0:15 — El paso 3 promete algo que no se ve.', veredicto: 'RECHAZADO' },
    { ts: ts(6), tipo: 'devolucion', agente: '', agenteId: 'otro999999999', texto: 'commitealo todo' },
  ])
  assert.equal(acs.length, 2)
  assert.deepEqual([acs[0].de, acs[0].a, acs[0].tipo], ['director', 'juez-exigente', 'encargo'])
  assert.deepEqual([acs[1].de, acs[1].veredicto], ['juez-exigente', 'RECHAZADO'])
  assert.deepEqual(acs[1].motivos, ['El paso 3 promete algo que no se ve.'])
})

test('un rechazo no se cuenta dos veces: pesan los documentos de veredicto', () => {
  const acs = acciones([
    { ts: ts(0), tipo: 'lanzado', agente: 'juez-guion', agenteId: 'abc123def456', descripcion: 'Juez claridad', texto: '' },
    { ts: ts(4), tipo: 'archivo', agente: 'juez-guion (claridad)', archivo: 'veredicto-claridad.md', texto: 'RECHAZADO', veredicto: 'RECHAZADO', cambios: ['Falta el cartel'] },
    { ts: ts(5), tipo: 'devolucion', agenteId: 'abc123def456', agente: 'juez-guion', texto: 'Veredicto: RECHAZADO', veredicto: 'RECHAZADO' },
  ])
  const j = agentes(acs, AHORA).find(a => a.id === 'juez-claridad')
  assert.equal(j.rechazos, 1)
  assert.equal(j.ultimoMotivo, 'Falta el cartel')
  assert.equal(j.trabajando, false)
})

test('un agente lanzado y sin devolver está trabajando; pasadas 6 horas ya no', () => {
  const acs = acciones([{ ts: ts(50), tipo: 'lanzado', agente: 'editor-video', agenteId: 'e1e1e1e1e1e1', descripcion: 'Editor', texto: 'armá el borrador' }])
  assert.equal(agentes(acs, AHORA).find(a => a.id === 'editor').trabajando, true)
  assert.equal(agentes(acs, AHORA + 7 * 3600e3).find(a => a.id === 'editor').trabajando, false)
})

test('el estado del video: trabado con rechazos seguidos, listo con informe, pausa sin actividad', () => {
  const evs = []
  for (let r = 0; r < SEGUIDOS_TRABADO; r++) evs.push({ ts: ts(r), tipo: 'archivo', agente: 'juez-guion (adversarial)', archivo: `veredicto-adversarial-r${r + 1}.md`, texto: '', veredicto: 'RECHAZADO', cambios: [`motivo ${r + 1}`] })
  const etapa = { indice: 2, total: 8 }
  const m = modeloDeVideo('v', evs, etapa, AHORA)
  assert.equal(m.estado, 'trabado')
  assert.deepEqual([m.motivo.agente, m.motivo.veces, m.motivo.motivo], ['juez-exigente', SEGUIDOS_TRABADO, `motivo ${SEGUIDOS_TRABADO}`])
  assert.equal(modeloDeVideo('v', evs.slice(0, 1), etapa, AHORA).estado, 'cambios')
  assert.equal(estadoDeVideo({ indice: 7, total: 8 }, [], [], AHORA).estado, 'listo')
  assert.equal(estadoDeVideo(etapa, [], [], AHORA).estado, 'pausa')
})

test('los bloqueantes con severidad y tramo de tiempo muestran el problema, no la etiqueta', () => {
  const t = '## Bloqueantes\n- [B1] **Severidad A** — 0:14,4 a 0:42 (cuadro t-15.jpg) — La línea de ayuda queda en cuadro. Cuadros: x.jpg\n- **[B2] CERRADO.** La frase 6 ahora dice bien'
  assert.deepEqual(extraerCambios(t), ['La línea de ayuda queda en cuadro. Cuadros: x.jpg', 'CERRADO. La frase 6 ahora dice bien'])
})

test('el servidor entrega la página 3D, el resumen de todos los videos y el modelo de uno', async () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'monitor-modelo-'))
  const prod = path.join(raiz, 'mi-video', 'produccion'); fs.mkdirSync(prod, { recursive: true })
  fs.writeFileSync(path.join(prod, 'guion.md'), '# Guion')
  fs.writeFileSync(path.join(prod, 'veredicto-claridad.md'), '# Veredicto: RECHAZADO\n## Bloqueantes\n- [J1] Falta el cartel')
  const puerto = 4300 + Math.floor(Math.random() * 500)
  const srv = spawn(process.execPath, [path.join(AQUI, '..', 'servidor.mjs'), '--puerto', String(puerto)], { env: { ...process.env, ORBITA_VIDEOS: raiz } })
  try {
    await new Promise((ok, mal) => { srv.stdout.once('data', ok); srv.once('exit', mal) })
    const base = `http://127.0.0.1:${puerto}`
    assert.match(await (await fetch(base + '/')).text(), /Sala de control/)
    assert.match(await (await fetch(base + '/clasica')).text(), /Así va tu video/)
    assert.equal((await fetch(base + '/sala/app.js')).status, 200)
    assert.equal((await fetch(base + '/sala/..%2Fservidor.mjs')).status, 404)
    assert.equal((await fetch(base + '/vendor/three.module.min.js')).status, 200)
    const r = await (await fetch(base + '/api/resumen')).json()
    assert.equal(r.videos.length, 1)
    assert.deepEqual([r.videos[0].slug, r.videos[0].estado, r.videos[0].motivo.motivo], ['mi-video', 'cambios', 'Falta el cartel'])
    const v = await (await fetch(base + '/api/video?slug=mi-video')).json()
    assert.ok(v.equipo.some(m => m.id === 'director'))
    assert.equal(v.agentes.find(a => a.id === 'juez-claridad').rechazos, 1)
  } finally { srv.kill() }
})
