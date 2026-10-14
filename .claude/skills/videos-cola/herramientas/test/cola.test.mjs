// Tests de las herramientas de la cola: node --test "herramientas/test/*.test.mjs"  (desde .claude/skills/videos-cola)
// Los videos de prueba los genera ffmpeg al vuelo (2–4 s, sin archivos en el repo) y el almacenamiento es un servidor local.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { correr, parsearSonda, sondear } from '../ffmpeg.mjs'
import { bitrateObjetivo, preparar } from '../preparar.mjs'
import { medir, parsearLoudness, parsearTramos } from '../controles.mjs'
import { subir } from '../subir.mjs'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cola-'))
const ruta = (n) => path.join(tmp, n)

// Un video sintético: imagen en movimiento, y una onda con el volumen elegido (o sin audio).
function generar(nombre, { ancho = 1080, alto = 1920, seg = 3, audio = 'sine=f=440:r=44100', volumen = 0.3 } = {}) {
  const args = ['-y', '-f', 'lavfi', '-i', `testsrc2=s=${ancho}x${alto}:r=30:d=${seg}`]
  if (audio) args.push('-f', 'lavfi', '-i', `${audio}:d=${seg}`, '-af', `volume=${volumen}`, '-c:a', 'aac')
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-t', String(seg), ruta(nombre))
  const r = correr(args)
  assert.equal(r.codigo, 0, r.salida.slice(-300))
  return ruta(nombre)
}

before(() => assert.equal(correr(['-version']).codigo, 0, 'hace falta ffmpeg'))
after(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('lectura de ffmpeg', () => {
  it('parsearSonda saca duración, imagen y audio', () => {
    const t = '  Duration: 00:00:30.04, start: 0.0, bitrate: 5000 kb/s\n  Stream #0:0: Video: h264 (High), yuv420p(tv), 1080x1920 [SAR 1:1 DAR 9:16], 30 fps\n  Stream #0:1: Audio: aac (LC), 44100 Hz, stereo'
    assert.deepEqual(parsearSonda(t), { duracionSeg: 30.04, ancho: 1080, alto: 1920, tieneVideo: true, tieneAudio: true })
  })
  it('parsearSonda de algo sin video ni duración no inventa nada', () => {
    assert.deepEqual(parsearSonda('basura'), { duracionSeg: null, ancho: null, alto: null, tieneVideo: false, tieneAudio: false })
  })
  it('parsearLoudness toma el resumen final y entiende -inf', () => {
    const t = '[Parsed_ebur128_0] t: 1 I: -30.0 LUFS\n  Summary:\n  Integrated loudness:\n    I:         -15.2 LUFS\n  True peak:\n    Peak:       -1.3 dBFS'
    assert.deepEqual(parsearLoudness(t), { lufs: -15.2, pico: -1.3 })
    assert.deepEqual(parsearLoudness('Summary:\n I: -inf LUFS\n Peak: -inf dBFS'), { lufs: null, pico: null })
  })
  it('parsearTramos cuenta negros, congelados y silencios', () => {
    assert.deepEqual(parsearTramos('black_start:0 black_end:2.5 black_duration:2.5', 'negro'), [2.5])
    assert.deepEqual(parsearTramos('lavfi.freezedetect.freeze_duration: 5.2\nlavfi.freezedetect.freeze_duration: 4.1', 'congelado'), [5.2, 4.1])
    assert.deepEqual(parsearTramos('silence_duration: 3.4', 'silencio'), [3.4])
  })
})

describe('preparar', () => {
  it('el bitrate objetivo entra en el tope y respeta el piso y el techo', () => {
    const bps = bitrateObjetivo(45 * 1024 * 1024, 40)
    assert.ok((bps + 128_000) * 40 / 8 <= 45 * 1024 * 1024)
    assert.equal(bitrateObjetivo(45 * 1024 * 1024, 5), 10_000_000) // corto: techo
    assert.equal(bitrateObjetivo(1024 * 1024, 600), 800_000) // larguísimo: piso
    assert.throws(() => bitrateObjetivo(1000, 0), /duración/)
  })
  it('un mp4 que ya cumple solo se reordena, sin recomprimir', () => {
    const r = preparar(generar('chico.mp4'), ruta('chico-ok.mp4'))
    assert.equal(r.recomprimido, false)
    assert.ok(r.bytes > 0 && r.duracionSeg > 2.5 && r.duracionSeg < 3.5)
    assert.equal(`${r.ancho}x${r.alto}`, '1080x1920')
  })
  it('uno que pasa el tope se recomprime hasta entrar', () => {
    const origen = generar('pesado.mp4', { seg: 4 })
    const tope = Math.floor(fs.statSync(origen).size * 0.6)
    const r = preparar(origen, ruta('pesado-ok.mp4'), { maxBytes: tope })
    assert.equal(r.recomprimido, true)
    assert.ok(r.bytes <= tope, `${r.bytes} > ${tope}`)
  })
  it('no acepta un tope mayor al de la cola ni un archivo sin video', () => {
    assert.throws(() => preparar(generar('a.mp4'), ruta('b.mp4'), { maxBytes: 80 * 1024 * 1024 }), /50 MB/)
    fs.writeFileSync(ruta('audio.m4a'), '')
    assert.throws(() => sondear(ruta('no-existe.mp4')), /No existe/)
  })
})

describe('controles de calidad', () => {
  const por = (c) => Object.fromEntries(c.map((x) => [x.nombre, x]))

  it('un reel vertical con buen volumen pasa todos los controles', () => {
    // 3 s: más corto que el mínimo de un reel (10 s), así que se mide como cuadrado "largo" no: se prueba con un reel de 11 s.
    const c = por(medir(generar('reel.mp4', { seg: 11, volumen: 0.2 })))
    assert.equal(c['formato'].ok, true, c['formato'].detalle)
    assert.equal(c['duración'].ok, true, c['duración'].detalle)
    assert.equal(c['peso'].ok, true)
    assert.equal(c['sin negro'].ok, true)
    assert.ok(c['audio'], 'mide el audio')
  })
  it('un video horizontal falla el formato de un reel, y uno muy corto la duración', () => {
    const c = por(medir(generar('horizontal.mp4', { ancho: 1920, alto: 1080, seg: 3 })))
    assert.equal(c['formato'].ok, false)
    assert.match(c['formato'].detalle, /se esperaba 1080x1920/)
    assert.equal(c['duración'].ok, false)
  })
  it('el mismo video horizontal sí pasa el formato si el pedido es horizontal', () => {
    const c = por(medir(generar('h2.mp4', { ancho: 1920, alto: 1080, seg: 3 }), { formato: 'HORIZONTAL_16_9' }))
    assert.equal(c['formato'].ok, true)
  })
  it('un audio muy bajo falla el volumen; sin audio falla salvo que sea sin voz', () => {
    const bajo = por(medir(generar('bajo.mp4', { volumen: 0.005 })))
    assert.equal(bajo['audio'].ok, false)
    const mudo = generar('mudo.mp4', { audio: null })
    assert.equal(por(medir(mudo))['audio'].ok, false)
    assert.equal(por(medir(mudo, { sinVoz: true }))['audio'].ok, true)
  })
  it('un video negro largo se marca', () => {
    const negro = ruta('negro.mp4')
    const r = correr(['-y', '-f', 'lavfi', '-i', 'color=c=black:s=1080x1920:r=30:d=3', '-f', 'lavfi', '-i', 'sine=f=440:d=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-t', '3', negro])
    assert.equal(r.codigo, 0)
    assert.equal(por(medir(negro))['sin negro'].ok, false)
  })
  it('un formato desconocido es un error, no un resultado', () => {
    assert.throws(() => medir(generar('x.mp4'), { formato: 'VERTICAL' }), /Formato desconocido/)
  })
})

describe('tutoriales (internos)', () => {
  it('preparar admite un tope mayor solo con --tutorial, y nunca más de 250 MB', () => {
    const mp4 = generar('tuto-base.mp4')
    assert.throws(() => preparar(mp4, ruta('t1.mp4'), { maxBytes: 100 * 1024 * 1024 }), /50 MB/)
    assert.equal(preparar(mp4, ruta('t2.mp4'), { maxBytes: 100 * 1024 * 1024, tutorial: true }).recomprimido, false)
    assert.throws(() => preparar(mp4, ruta('t3.mp4'), { maxBytes: 300 * 1024 * 1024, tutorial: true }), /250 MB/)
  })

  it('controles --tutorial: horizontal por defecto, mínimo 20 s y tope de peso de 250 MB', () => {
    const largo = por(medir(generar('tuto-largo.mp4', { ancho: 640, alto: 360, seg: 21 }), { tutorial: true }))
    assert.equal(largo['formato'].ok, false) // 640x360 es 16:9 pero el lado corto es de menos de 720
    assert.equal(largo['duración'].ok, true, largo['duración'].detalle)
    assert.match(largo['peso'].detalle, /máximo 250/)
    const hd = por(medir(generar('tuto-hd.mp4', { ancho: 1280, alto: 720, seg: 21 }), { tutorial: true }))
    assert.equal(hd['formato'].ok, true, hd['formato'].detalle)
    const corto = por(medir(generar('tuto-corto.mp4', { ancho: 1280, alto: 720, seg: 12 }), { tutorial: true }))
    assert.equal(corto['duración'].ok, false) // un reel de 12 s pasa, un tutorial de 12 s no
  })

  it('un video vertical falla el formato de un tutorial', () => {
    assert.equal(por(medir(generar('tuto-vertical.mp4', { seg: 21 }), { tutorial: true }))['formato'].ok, false)
  })
})

function por(c) { return Object.fromEntries(c.map((x) => [x.nombre, x])) }

describe('subir', () => {
  let servidor, recibido, url
  before(async () => {
    servidor = http.createServer((req, res) => {
      const trozos = []
      req.on('data', (d) => trozos.push(d))
      req.on('end', () => {
        recibido = { metodo: req.method, tipo: req.headers['content-type'], bytes: Buffer.concat(trozos).length, ruta: req.url }
        res.statusCode = req.url.includes('rechazar') ? 403 : 200
        res.end()
      })
    })
    await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
    url = `http://127.0.0.1:${servidor.address().port}`
  })
  after(() => servidor.close())

  it('hace un PUT con el Content-Type exacto y devuelve el tamaño', async () => {
    const mp4 = generar('subida.mp4')
    const r = await subir(mp4, `${url}/marketing/videos/a.mp4?firmado=1`)
    assert.deepEqual(r, { bytes: fs.statSync(mp4).size, status: 200 })
    assert.deepEqual({ metodo: recibido.metodo, tipo: recibido.tipo, bytes: recibido.bytes }, { metodo: 'PUT', tipo: 'video/mp4', bytes: r.bytes })
  })
  it('si el almacenamiento rechaza, avisa cómo seguir y no muestra la dirección', async () => {
    await assert.rejects(subir(generar('r.mp4'), `${url}/rechazar?firma=secreta`), (e) => /HTTP 403/.test(e.message) && !/secreta/.test(e.message))
  })
  it('rechaza direcciones inválidas, http que no es local, archivos que no existen y vacíos', async () => {
    const mp4 = generar('v.mp4')
    await assert.rejects(subir(mp4, 'no es una url'), /no es válida/)
    await assert.rejects(subir(mp4, 'http://ejemplo.com/x'), /https/)
    await assert.rejects(subir(ruta('nada.mp4'), `${url}/x`), /No existe/)
    fs.writeFileSync(ruta('vacio.mp4'), '')
    await assert.rejects(subir(ruta('vacio.mp4'), `${url}/x`), /vacío/)
  })
})
