import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))

// Un servidor sobre carpetas de mentira: un video con producción, un borrador y una entrega final.
async function servidor() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'monitor-acciones-'))
  const videos = path.join(raiz, 'videos'), entregas = path.join(raiz, 'entregas')
  fs.mkdirSync(path.join(videos, 'mi-video', 'produccion'), { recursive: true })
  fs.mkdirSync(path.join(videos, 'mi-video-hf', 'renders'), { recursive: true })
  fs.mkdirSync(path.join(entregas, 'tutoriales'), { recursive: true })
  fs.writeFileSync(path.join(videos, 'mi-video', 'produccion', 'pedidos.md'), '# Pedidos\n1. Correr login.mjs\n2. Decidir la promo\n')
  fs.writeFileSync(path.join(videos, 'mi-video-hf', 'renders', 'borrador-v2.mp4'), Buffer.alloc(1000, 1))
  fs.writeFileSync(path.join(videos, 'mi-video-hf', 'renders', 'borrador-v2-sin-normalizar.mp4'), Buffer.alloc(10))
  fs.writeFileSync(path.join(entregas, 'tutoriales', '2026-10-17_mi-video_16x9.mp4'), Buffer.from('0123456789'))
  fs.writeFileSync(path.join(entregas, 'tutoriales', '2026-10-17_mi-video-largo_16x9.mp4'), Buffer.from('x'))
  const puerto = 4800 + Math.floor(Math.random() * 500)
  const srv = spawn(process.execPath, [path.join(AQUI, '..', 'servidor.mjs'), '--puerto', String(puerto)], { env: { ...process.env, ORBITA_VIDEOS: videos, MONITOR_ENTREGAS: entregas } })
  await new Promise((ok, mal) => { srv.stdout.once('data', ok); srv.once('exit', mal) })
  return { srv, base: `http://127.0.0.1:${puerto}`, videos }
}

test('la oficina ofrece el video final y los borradores (sin los intermedios ni otros videos)', async () => {
  const { srv, base } = await servidor()
  try {
    const v = await (await fetch(base + '/api/video?slug=mi-video')).json()
    assert.deepEqual(v.videos.map(x => x.id), ['final/tutoriales/2026-10-17_mi-video_16x9.mp4', 'borrador/borrador-v2.mp4'])
    assert.ok(v.videos.every(x => !('ruta' in x)), 'no se expone la ruta en disco')
    assert.equal(v.pedidos.items, 2)
    const r = await fetch(base + '/media?slug=mi-video&id=' + encodeURIComponent(v.videos[0].id), { headers: { Range: 'bytes=2-5' } })
    assert.equal(r.status, 206)
    assert.equal(r.headers.get('content-range'), 'bytes 2-5/10')
    assert.equal(await r.text(), '2345')
    assert.equal((await fetch(base + '/media?slug=mi-video&id=' + encodeURIComponent('final/../../secreto.mp4'))).status, 404)
  } finally { srv.kill() }
})

test('una indicación queda en indicaciones.md como pendiente, y solo se acepta desde la misma página', async () => {
  const { srv, base, videos } = await servidor()
  try {
    const cuerpo = JSON.stringify({ para: 'juez-claridad', nombre: 'Juez de claridad', decision: 'Aceptalo como está y seguí.', texto: 'El ritmo está bien así', motivo: 'El ritmo no cierra' })
    const ajeno = await fetch(base + '/api/indicacion?slug=mi-video', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://malo.example' }, body: cuerpo })
    assert.equal(ajeno.status, 403)
    const sinJson = await fetch(base + '/api/indicacion?slug=mi-video', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: cuerpo })
    assert.equal(sinJson.status, 415)
    const ok = await fetch(base + '/api/indicacion?slug=mi-video', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: cuerpo })
    assert.equal(ok.status, 200)
    const md = fs.readFileSync(path.join(videos, 'mi-video', 'produccion', 'indicaciones.md'), 'utf8')
    assert.match(md, /^## .+ · Juez de claridad · pendiente$/m)
    assert.match(md, /\*\*Decisión:\*\* Aceptalo como está y seguí\./)
    const v = await (await fetch(base + '/api/video?slug=mi-video')).json()
    assert.equal(v.indicaciones.length, 1)
    assert.deepEqual([v.indicaciones[0].pendiente, v.indicaciones[0].texto], [true, 'El ritmo está bien así'])
    assert.ok(!v.acciones.some(x => x.archivo === 'indicaciones.md'), 'las indicaciones no se mezclan con el historial del equipo')
    // El director la marca como aplicada.
    fs.writeFileSync(path.join(videos, 'mi-video', 'produccion', 'indicaciones.md'), md.replace('· pendiente', '· aplicada'))
    const v2 = await (await fetch(base + '/api/video?slug=mi-video')).json()
    assert.deepEqual([v2.indicaciones[0].pendiente, v2.indicaciones[0].estado], [false, 'aplicada'])
  } finally { srv.kill() }
})
