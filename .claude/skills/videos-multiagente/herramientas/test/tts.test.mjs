// tts.mjs contra un ElevenLabs de mentira (servidor local): no gasta créditos ni necesita clave real.
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ffmpegPath } from '../../../videos-cola/herramientas/ffmpeg.mjs'

const TTS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tts.mjs')
const CLAVE = 'clave-de-prueba-123'
let servidor, url, mp3, tmp
const pedidos = []

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'))
  // 0,3 s de silencio + 0,8 s de tono + 0,3 s de silencio: el recorte tiene que dejar ~0,9 s
  const f = path.join(tmp, 'base.mp3')
  const r = spawnSync(ffmpegPath(), ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono:d=0.3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.8:sample_rate=44100', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono:d=0.3', '-filter_complex', '[0][1][2]concat=n=3:v=0:a=1', '-ac', '1', '-b:a', '128k', f])
  assert.equal(r.status, 0, String(r.stderr))
  mp3 = fs.readFileSync(f)
  servidor = http.createServer((req, res) => {
    let cuerpo = ''
    req.on('data', d => { cuerpo += d })
    req.on('end', () => {
      pedidos.push({ url: req.url, clave: req.headers['xi-api-key'], cuerpo: JSON.parse(cuerpo) })
      res.writeHead(200, { 'content-type': 'audio/mpeg' })
      res.end(mp3)
    })
  })
  await new Promise(ok => servidor.listen(0, '127.0.0.1', ok))
  url = `http://127.0.0.1:${servidor.address().port}`
})
after(() => { servidor.close(); fs.rmSync(tmp, { recursive: true, force: true }) })

function correr(cwd, env) {
  return new Promise(ok => {
    const p = spawn(process.execPath, [TTS, 'guion.json'], { cwd, env: { ...process.env, ELEVEN_KEY: '', ELEVENLABS_API_KEY: '', ...env } })
    let salida = ''
    p.stdout.on('data', d => { salida += d })
    p.stderr.on('data', d => { salida += d })
    p.on('close', codigo => ok({ codigo, salida }))
  })
}
function carpeta(guion) {
  const d = fs.mkdtempSync(path.join(tmp, 'v-'))
  fs.writeFileSync(path.join(d, 'guion.json'), JSON.stringify(guion))
  return d
}

describe('tts.mjs (ElevenLabs)', () => {
  it('sin clave frena con un mensaje claro y no llama a nadie', async () => {
    const d = carpeta({ frases: [{ id: 'a', texto: 'Hola' }] })
    const antes = pedidos.length
    const r = await correr(d, { ELEVEN_API_URL: url })
    assert.equal(r.codigo, 2)
    assert.match(r.salida, /ELEVEN_KEY/)
    assert.equal(pedidos.length, antes)
  })

  it('usa la voz del equipo y eleven_v4 por defecto, pide mp3_44100_128 y deja wav 16 bits mono recortado + voz.json', async () => {
    const d = carpeta({ frases: [{ id: 'a', texto: '¿Qué se vende más?' }, { id: 'b', texto: 'Preguntale a Orbi' }] })
    const antes = pedidos.length
    const r = await correr(d, { ELEVEN_KEY: CLAVE, ELEVEN_API_URL: url })
    assert.equal(r.codigo, 0, r.salida)
    const p = pedidos.slice(antes)
    assert.equal(p.length, 2)
    assert.equal(p[0].url, '/v1/text-to-speech/8mBRP99B2Ng2QwsJMFQl?output_format=mp3_44100_128')
    assert.equal(p[0].clave, CLAVE)
    assert.deepEqual(p[0].cuerpo, { text: '¿Qué se vende más?', model_id: 'eleven_v4' })
    assert.ok(!r.salida.includes(CLAVE), 'la clave no se imprime')
    const w = fs.readFileSync(path.join(d, 'out/voz/a.wav'))
    assert.equal(w.toString('ascii', 0, 4), 'RIFF')
    assert.equal(w.readUInt16LE(22), 1) // mono
    assert.equal(w.readUInt32LE(24), 44100)
    assert.equal(w.readUInt16LE(34), 16)
    const voz = JSON.parse(fs.readFileSync(path.join(d, 'voz.json'), 'utf8'))
    assert.equal(voz.voz, '8mBRP99B2Ng2QwsJMFQl')
    assert.equal(voz.modelo, 'eleven_v4')
    for (const f of voz.frases) assert.ok(f.dur > 0.7 && f.dur < 1.1, `dur ${f.dur}`) // 0,8 s de tono + aire; el silencio de los bordes se recortó
  })

  it('respeta voz, modelo, ajustes e idioma del guion; SOLO regenera una frase y conserva lo de las otras', async () => {
    const d = carpeta({ voz: 'OTRA', modelo: 'eleven_x', ajustes: { stability: 0.4 }, idioma: 'es', frases: [{ id: 'a', texto: 'Uno' }, { id: 'b', texto: 'Dos' }] })
    fs.writeFileSync(path.join(d, 'voz.json'), JSON.stringify({ frases: [{ id: 'a', texto: 'Uno', dur: 9, tramos: [[0, 1]] }, { id: 'b', texto: 'Dos', dur: 9 }] }))
    const antes = pedidos.length
    const r = await correr(d, { ELEVEN_KEY: CLAVE, ELEVEN_API_URL: url, SOLO: 'b' })
    assert.equal(r.codigo, 0, r.salida)
    const p = pedidos.slice(antes)
    assert.equal(p.length, 1)
    assert.match(p[0].url, /\/text-to-speech\/OTRA\?/)
    assert.deepEqual(p[0].cuerpo, { text: 'Dos', model_id: 'eleven_x', voice_settings: { stability: 0.4 }, language_code: 'es' })
    const voz = JSON.parse(fs.readFileSync(path.join(d, 'voz.json'), 'utf8'))
    assert.deepEqual(voz.frases[0].tramos, [[0, 1]]) // la frase no regenerada conserva sus tramos
    assert.equal(voz.frases[0].dur, 9)
    assert.ok(voz.frases[1].dur < 2)
  })
})
