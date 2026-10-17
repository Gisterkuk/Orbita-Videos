import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const HOOK = path.join(AQUI, '..', 'registrar-evento.mjs')
const SERVIDOR = path.join(AQUI, '..', 'servidor.mjs')

// Carpeta de videos de mentira: ORBITA_VIDEOS se lee al importar, así que cada test corre el código en un proceso aparte.
function entorno() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'monitor-test-'))
  fs.mkdirSync(path.join(raiz, 'mi-video', 'produccion'), { recursive: true })
  return { raiz, env: { ...process.env, ORBITA_VIDEOS: raiz } }
}
const correrHook = (env, payload) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), env, encoding: 'utf8' })
const leerLog = (raiz, slug = 'mi-video') => {
  const f = path.join(raiz, slug, 'produccion', 'eventos.jsonl')
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : []
}

test('lanzar un agente queda registrado con su proyecto y agente', () => {
  const { raiz, env } = entorno()
  const r = correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'juez-guion', description: 'Juez de claridad', prompt: `Leé ${raiz.replace(/\\/g, '/')}/mi-video/produccion/guion.md` }, tool_response: { content: 'Async agent launched successfully.' } })
  assert.equal(r.status, 0)
  const ev = leerLog(raiz)
  assert.equal(ev.length, 1)
  assert.equal(ev[0].tipo, 'lanzado')
  assert.equal(ev[0].agente, 'juez-guion')
})

test('un proyecto se detecta aunque la ruta tenga barras de Windows', () => {
  const { raiz, env } = entorno()
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'SendMessage', tool_input: { to: 'a1', message: `Mirá ${path.join(raiz, 'mi-video', 'produccion')}\\guion.md` } })
  assert.equal(leerLog(raiz).length, 1)
  assert.equal(leerLog(raiz)[0].tipo, 'mensaje')
})

test('la devolución de un agente detecta el veredicto y los bloqueantes', () => {
  const { raiz, env } = entorno()
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'analista-video', prompt: 'x' }, tool_response: { content: 'Async agent launched' } })
  const rutaVideo = path.join(raiz, 'mi-video', 'produccion', 'analisis.md').split(path.sep).join('/')
  const r = correrHook(env, { hook_event_name: 'SubagentStop', agent_type: 'analista-video', last_assistant_message: `Veredicto: RECHAZADO, con 2 bloqueantes (B1, B2). Análisis en ${rutaVideo}` })
  assert.equal(r.status, 0)
  const dev = leerLog(raiz).find(e => e.tipo === 'devolucion')
  assert.equal(dev.veredicto, 'RECHAZADO')
  assert.deepEqual(dev.bloqueantes.sort(), ['B1', 'B2'])
})

test('las claves se ocultan antes de guardar', () => {
  const { raiz, env } = entorno()
  const rutaVideo = path.join(raiz, 'mi-video', 'produccion', 'guion.md').split(path.sep).join('/')
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'SendMessage', tool_input: { to: 'x', message: `Mirá ${rutaVideo}: usá sk_abcdefghijklmnopqrstuvwxyz1234 y api_key: supersecreto123` } })
  const ev = leerLog(raiz)[0]
  assert.ok(!/sk_abcdef/.test(ev.texto) && !/supersecreto123/.test(ev.texto), ev.texto)
})

test('un payload roto no frena nada (exit 0, sin escribir)', () => {
  const { raiz, env } = entorno()
  const r = spawnSync(process.execPath, [HOOK], { input: 'esto no es json', env, encoding: 'utf8' })
  assert.equal(r.status, 0)
  assert.equal(leerLog(raiz).length, 0)
})

test('el servidor devuelve eventos y archivos, y rechaza nombres peligrosos', async () => {
  const { raiz, env } = entorno()
  fs.writeFileSync(path.join(raiz, 'mi-video', 'produccion', 'veredicto-claridad.md'), '# Veredicto (claridad): RECHAZADO\n- [B1] algo')
  fs.writeFileSync(path.join(raiz, 'secreto.md'), 'no se tiene que leer')
  const puerto = 4300 + Math.floor(Math.random() * 500)
  const { spawn } = await import('node:child_process')
  const p = spawn(process.execPath, [SERVIDOR, '--puerto', String(puerto)], { env, stdio: 'ignore' })
  try {
    let d
    for (let i = 0; i < 30 && !d; i++) { try { d = await (await fetch(`http://127.0.0.1:${puerto}/api/eventos?slug=mi-video`)).json() } catch { await new Promise(r => setTimeout(r, 150)) } }
    assert.ok(d, 'el servidor no arrancó')
    const ev = d.eventos.find(e => e.archivo === 'veredicto-claridad.md')
    assert.equal(ev.veredicto, 'RECHAZADO')
    assert.equal(ev.agente, 'juez-guion (claridad)')
    for (const nombre of ['../../secreto.md', '..%2F..%2Fsecreto.md', 'eventos.exe']) {
      const r = await fetch(`http://127.0.0.1:${puerto}/api/archivo?slug=mi-video&nombre=${nombre}`)
      assert.ok([400, 404].includes(r.status), `${nombre} → ${r.status}`)
    }
    assert.equal((await fetch(`http://127.0.0.1:${puerto}/api/eventos?slug=../x`)).status, 400)
  } finally { p.kill() }
})

test('los pedidos de cambio salen en lenguaje llano, sin ids ni marcas', async () => {
  const { extraerCambios } = await import('../lib/eventos.mjs')
  const t = '# Veredicto: RECHAZADO\n## Bloqueantes\n- [B1] **La voz dice "ponés"** — evidencia: frase 7 — qué cambiar\n- [B2] Falta mostrar el cartel\n## Bloqueantes anteriores\n- [B0] cerrado\n## Mejoras\n- algo'
  assert.deepEqual(extraerCambios(t), ['La voz dice "ponés"', 'Falta mostrar el cartel'])
  assert.deepEqual(extraerCambios('## Bloqueantes\n- Ninguno\n'), [])
  assert.deepEqual(extraerCambios('sin sección'), [])
})

test('la etapa se deduce de lo que ya existe en la carpeta del video', () => {
  const { raiz, env } = entorno()
  const prod = path.join(raiz, 'mi-video', 'produccion')
  const lib = pathToFileURL(path.join(AQUI, '..', 'lib', 'eventos.mjs')).href
  const etapa = () => JSON.parse(spawnSync(process.execPath, ['-e', `import(${JSON.stringify(lib)}).then(m => console.log(JSON.stringify(m.etapaDe('mi-video'))))`], { env, encoding: 'utf8' }).stdout)
  assert.equal(etapa().nombre, 'Preparación')
  fs.writeFileSync(path.join(prod, 'guion.md'), 'x'); assert.equal(etapa().nombre, 'Guion')
  fs.writeFileSync(path.join(prod, 'veredicto-claridad.md'), 'x'); assert.equal(etapa().nombre, 'Revisión del guion')
  fs.writeFileSync(path.join(prod, 'informe.md'), 'x'); assert.equal(etapa().nombre, 'Entrega')
})

// Estas funciones no dependen de la carpeta de videos: se prueban importando la librería directo.
const lib = await import(pathToFileURL(path.join(AQUI, '..', 'lib', 'eventos.mjs')).href)

test('los tokens se suman sin contar dos veces el mismo mensaje', () => {
  const { raiz } = entorno()
  const f = path.join(raiz, 'transcripto.jsonl')
  const u = (i, o, cc, cr) => ({ input_tokens: i, output_tokens: o, cache_creation_input_tokens: cc, cache_read_input_tokens: cr })
  const l = (id, usage) => JSON.stringify({ type: 'assistant', uuid: 'u' + Math.random(), message: { id, role: 'assistant', usage } })
  // el mensaje m1 aparece en dos bloques (la salida crece), m2 en uno
  fs.writeFileSync(f, [l('m1', u(2, 16, 1000, 0)), l('m1', u(2, 300, 1000, 0)), l('m2', u(3, 50, 200, 5000)), JSON.stringify({ type: 'user', message: { role: 'user', content: 'hola' } })].join('\n'))
  const r = lib.tokensDeTranscripto(f)
  assert.equal(r.total, (2 + 300 + 1000) + (3 + 50 + 200))
  assert.equal(r.cacheLectura, 5000)
  assert.equal(r.mensajes, 2)
  assert.equal(lib.tokensDeTranscripto(path.join(raiz, 'no-existe.jsonl')), null)
})

test('un agente se reconoce por su id: nombre y video correctos aunque haya otro video "último"', () => {
  const { raiz, env } = entorno()
  fs.mkdirSync(path.join(raiz, 'otro-video', 'produccion'), { recursive: true })
  const ruta = p => p.split(path.sep).join('/')
  // el último video activo es "otro-video", pero el agente se lanzó para "mi-video"
  fs.mkdirSync(path.join(raiz, '_monitor'), { recursive: true }); fs.writeFileSync(path.join(raiz, '_monitor', 'ultimo-slug.txt'), 'otro-video')
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'guionista-video', description: 'Guion', prompt: `Leé ${ruta(raiz)}/mi-video/produccion/pedido.md` }, tool_response: { content: 'Async agent launched successfully.\nagentId: abc123def4567890 (internal ID)' } })
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'SendMessage', tool_input: { to: 'abc123def4567890', summary: 'Ronda 2', message: 'Rehacé el guion sin citar ninguna ruta.' } })
  const t = path.join(raiz, 'agente.jsonl')
  fs.writeFileSync(t, JSON.stringify({ type: 'assistant', message: { id: 'm', role: 'assistant', usage: { input_tokens: 1, output_tokens: 99, cache_creation_input_tokens: 400, cache_read_input_tokens: 0 } } }))
  correrHook(env, { hook_event_name: 'SubagentStop', agent_id: 'abc123def4567890', agent_type: '', last_assistant_message: 'Listo, sin rutas.', agent_transcript_path: t })
  const ev = leerLog(raiz, 'mi-video')
  assert.equal(ev.length, 3, 'los tres eventos van al video correcto')
  assert.equal(leerLog(raiz, 'otro-video').length, 0)
  assert.equal(ev[1].a, 'guionista-video')
  assert.equal(ev[2].agente, 'guionista-video')
  assert.equal(ev[2].tokens.total, 500)
})

test('los textos se muestran sin rutas largas y con lo esencial', () => {
  const winPath = ['C:', 'dev', 'x', 'pedido.md'].join(String.fromCharCode(92))   // C:\dev\x\pedido.md
  assert.equal(lib.sinRutas('Leé C:/Users/persona/orbita-videos/configurar-cobros/produccion/guion.md y ' + winPath + ' ahora'), 'Leé guion.md y pedido.md ahora')
  assert.equal(lib.resumenDe('# Pedido\n\n**Objetivo:** que el comerciante entienda **cómo cobrar**.\n\nOtra cosa'), 'Objetivo: que el comerciante entienda cómo cobrar.')
  assert.equal(lib.resumenDe('# T\n\nPrimera línea importante.\nSegunda línea.'), 'Primera línea importante. Segunda línea.')
})

test('un cierre repetido se descarta y cada corrida muestra solo lo que gastó', () => {
  const ev = (ts, agenteId, texto, total) => ({ ts, tipo: 'devolucion', agenteId, texto, tokens: { total, salida: 1, cacheLectura: 0, mensajes: 1 } })
  const r = lib.normalizarEventos([
    ev('2026-10-14T10:00:00.000Z', 'ag1', 'Primera entrega', 40000),
    ev('2026-10-14T10:00:02.000Z', 'ag1', 'Primera entrega', 41000),   // mismo cierre disparado dos veces
    ev('2026-10-14T10:30:00.000Z', 'ag1', 'Segunda entrega', 60000),   // el agente retomó: el uso es acumulado
    ev('2026-10-14T10:31:00.000Z', 'ag2', 'Otro agente', 25000),
  ])
  assert.equal(r.length, 3)
  assert.deepEqual(r.map(e => e.tokens.corrida), [41000, 19000, 25000])
})

test('un agente lanzado sin citar ningún video no se le asigna a otro video', () => {
  const { raiz, env } = entorno()
  fs.mkdirSync(path.join(raiz, '_monitor'), { recursive: true }); fs.writeFileSync(path.join(raiz, '_monitor', 'ultimo-slug.txt'), 'mi-video')
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose', prompt: 'Hacé algo suelto' }, tool_response: { content: 'Async agent launched\nagentId: ffff0000aaaa1111' } })
  assert.equal(leerLog(raiz, 'mi-video').length, 0)
  assert.equal(fs.readFileSync(path.join(raiz, '_monitor', 'eventos.jsonl'), 'utf8').trim().split('\n').length, 1)
})

test('un encargo que dice "aprobado" no cuenta como aprobación', () => {
  const { raiz, env } = entorno()
  const rutaVideo = path.join(raiz, 'mi-video', 'produccion', 'guion.md').split(path.sep).join('/')
  correrHook(env, { hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'editor-video', prompt: `Con el guion aprobado en ${rutaVideo}, armá el ensayo. Bloqueantes B1 cerrados.` }, tool_response: { content: 'Async agent launched\nagentId: 1234abcd5678ef90' } })
  const ev = leerLog(raiz)[0]
  assert.equal(ev.tipo, 'lanzado')
  assert.equal(ev.veredicto, null)
  assert.deepEqual(ev.bloqueantes, [])
})
