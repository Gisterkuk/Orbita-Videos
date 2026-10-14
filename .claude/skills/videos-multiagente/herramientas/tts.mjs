// Narración con ElevenLabs: una frase por pedido → out/voz/<id>.wav y voz.json
// (el guion con la duración real de cada frase, para el editor con voz).
//
//   ELEVEN_KEY=<clave> node herramientas/tts.mjs [guion.json]
//   SOLO=id1,id2 …   regenera solo esas frases (no reescribe voz.json de cero: conserva las demás)
//
// En guion.json: `voz` (id de la voz; por defecto la del equipo, 8mBRP99B2Ng2QwsJMFQl), `modelo` (por defecto eleven_v4),
// `ajustes` (voice_settings, opcional) e `idioma` (language_code, opcional: no todos los modelos lo aceptan).
//
// La clave va SOLO en la variable de entorno ELEVEN_KEY (o ELEVENLABS_API_KEY) de esa sesión: no se lee de archivos ni se imprime.
// El plan del equipo solo entrega mp3_44100_128: se decodifica con ffmpeg a WAV 16 bits mono, que es lo que esperan
// limpiar-voz.mjs, tramos-voz.mjs y el editor.
//
// IMPORTANTE: tono original. NO mandar instrucciones de estilo ni etiquetas de tono en el texto: el modelo las puede leer en voz alta.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { ffmpegPath } from '../../videos-cola/herramientas/ffmpeg.mjs'

export const VOZ_DEL_EQUIPO = '8mBRP99B2Ng2QwsJMFQl'
export const MODELO_POR_DEFECTO = 'eleven_v4'
const FORMATO = 'mp3_44100_128'
const RATE = 44100

const KEY = (process.env.ELEVEN_KEY ?? process.env.ELEVENLABS_API_KEY ?? '').trim()
if (!KEY) {
  console.error('Falta la clave de ElevenLabs: definí la variable de entorno ELEVEN_KEY en esta sesión (la pasa la persona; nunca la busques en archivos ni la imprimas).')
  process.exit(2)
}
const API = (process.env.ELEVEN_API_URL ?? 'https://api.elevenlabs.io').replace(/\/$/, '')
const GUION = process.argv[2] ?? 'guion.json'
const G = JSON.parse(fs.readFileSync(GUION, 'utf8'))
const SOLO = process.env.SOLO
// guion.json → voz.json; guion-avanzado.json → voz-avanzado.json
const VOZ_OUT = process.env.VOZ ?? GUION.replace(/guion/, 'voz')
fs.mkdirSync('out/voz', { recursive: true })

async function decir(voz, modelo, texto) {
  const cuerpo = { text: texto, model_id: modelo }
  if (G.ajustes) cuerpo.voice_settings = G.ajustes
  if (G.idioma) cuerpo.language_code = G.idioma
  for (let intento = 1; intento <= 4; intento++) {
    const r = await fetch(`${API}/v1/text-to-speech/${encodeURIComponent(voz)}?output_format=${FORMATO}`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'xi-api-key': KEY, accept: 'audio/mpeg' }, body: JSON.stringify(cuerpo),
    })
    if (r.ok) return Buffer.from(await r.arrayBuffer())
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 2000 * intento)); continue }
    throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`)
  }
  throw new Error('ElevenLabs: demasiados reintentos')
}
// mp3 → PCM 16 bits mono a 44,1 kHz
function decodificar(mp3) {
  const r = spawnSync(ffmpegPath(), ['-hide_banner', '-nostdin', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', String(RATE), 'pipe:1'], { input: mp3, maxBuffer: 256 * 1024 * 1024 })
  if (r.error) throw new Error(`No se pudo ejecutar ffmpeg (${r.error.message}). Instalalo o definí FFMPEG con su ruta.`)
  if (r.status !== 0 || !r.stdout?.length) throw new Error(`ffmpeg no pudo leer el audio: ${String(r.stderr ?? '').slice(-300)}`)
  return r.stdout
}
function recortar(pcm, rate) {
  const n = pcm.length / 2, th = 32768 * Math.pow(10, -45 / 20), win = Math.round(rate * .01)
  const nivel = i => { let m = 0; for (let k = i; k < Math.min(n, i + win); k++) m = Math.max(m, Math.abs(pcm.readInt16LE(k * 2))); return m }
  let a = 0; while (a < n && nivel(a) < th) a += win
  let b = n; while (b > a && nivel(Math.max(0, b - win)) < th) b -= win
  return pcm.subarray(Math.max(0, a - Math.round(rate * .04)) * 2, Math.min(n, b + Math.round(rate * .04)) * 2)
}
function wav(pcm, rate) {
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24)
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([h, pcm])
}

const voz = G.voz ?? VOZ_DEL_EQUIPO
const modelo = G.modelo ?? MODELO_POR_DEFECTO
const frases = []
let caracteres = 0
for (const fr of G.frases.filter(f => !SOLO || SOLO.split(',').includes(f.id))) {
  const mp3 = await decir(voz, modelo, fr.texto)
  caracteres += fr.texto.length
  const rec = recortar(decodificar(mp3), RATE)
  fs.writeFileSync(`out/voz/${fr.id}.wav`, wav(rec, RATE))
  const dur = rec.length / 2 / RATE
  frases.push({ ...fr, dur: +dur.toFixed(3) })
  // una frase corta no debería durar más de ~0,6 s por palabra: si pasa, leyó algo de más
  const palabras = fr.texto.split(/\s+/).length
  console.log(`${fr.id.padEnd(12)} ${dur.toFixed(2)} s${dur > palabras * .6 + 1.5 ? '  ⚠ demasiado larga: ¿leyó algo de más?' : ''}  ${fr.texto}`)
}
if (!SOLO) fs.writeFileSync(VOZ_OUT, JSON.stringify({ voz, modelo, frases }, null, 1))
else {
  // rearmar voz.json en el orden del guion: duraciones nuevas para las frases
  // regeneradas, las de antes para el resto (frases sin audio → aviso)
  const viejo = fs.existsSync(VOZ_OUT) ? JSON.parse(fs.readFileSync(VOZ_OUT, 'utf8')) : { frases: [] }
  const dur = id => frases.find(f => f.id === id)?.dur ?? viejo.frases.find(f => f.id === id)?.dur
  // las frases que no se regeneraron conservan lo que ya tenían (p. ej. 'tramos' de tramos-voz.mjs)
  const nuevas = new Set(frases.map(f => f.id))
  const todas = G.frases.map(fr => ({ ...(nuevas.has(fr.id) ? {} : viejo.frases.find(f => f.id === fr.id) ?? {}), ...fr, dur: dur(fr.id) }))
  for (const f of todas) if (f.dur == null) console.warn('⚠ falta el audio de', f.id, '(generalo con SOLO=' + f.id + ')')
  fs.writeFileSync(VOZ_OUT, JSON.stringify({ voz, modelo, frases: todas }, null, 1))
}
console.log(`Listo · ${caracteres} caracteres enviados a ElevenLabs (gastan créditos del plan; verificá cuántos quedan) · después: node herramientas/limpiar-voz.mjs`)
