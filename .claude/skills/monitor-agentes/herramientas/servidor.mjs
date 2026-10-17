// Visor local en vivo de cómo trabajan los agentes. Sin dependencias; solo escucha en 127.0.0.1.
//   node herramientas/servidor.mjs [--puerto 4177]
// Lee, de ~/orbita-videos/<slug>/produccion/: eventos.jsonl (lo escribe el hook) y los archivos de cada etapa
// (guion, análisis, veredictos, estado…), que se muestran como eventos "archivo" aunque no haya hook.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VIDEOS_DIR, agenteDeArchivo, carpetaProduccion, leerEventos, slugValido, veredictoDe, bloqueantesDe, limpiar, extraerCambios, etapaDe, resumenDe, normalizarEventos } from './lib/eventos.mjs'
import { modeloDeVideo, resumenDeVideo, frase, EQUIPO } from './lib/modelo.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const PUERTO = Number(args[args.indexOf('--puerto') + 1]) || Number(process.env.PORT) || 4177
const PAGINA = path.join(AQUI, '..', 'pagina', 'index.html')          // vista clásica (lista)
const SALA = path.join(AQUI, '..', 'pagina', 'sala')                     // vista 3D: constelación + oficinas
const ESTATICO_OK = /^[a-z0-9-]+\.(js|css|html)$/
const TIPOS = { js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', html: 'text/html; charset=utf-8' }
const ARCHIVO_OK = /^[A-Za-z0-9._-]+\.(md|json|jsonl|txt)$/

const json = (res, obj, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)) }

function proyectos() {
  if (!fs.existsSync(VIDEOS_DIR)) return []
  return fs.readdirSync(VIDEOS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && slugValido(d.name) && fs.existsSync(carpetaProduccion(d.name)))
    .map(d => {
      const dir = carpetaProduccion(d.name)
      const archivos = fs.readdirSync(dir).map(n => ({ n, t: fs.statSync(path.join(dir, n)).mtimeMs }))
      return { slug: d.name, ultimo: Math.max(0, ...archivos.map(a => a.t)), archivos: archivos.length }
    })
    .sort((a, b) => b.ultimo - a.ultimo)
}

function archivos(slug) {
  const dir = carpetaProduccion(slug)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && ARCHIVO_OK.test(d.name) && d.name !== 'eventos.jsonl')
    .map(d => { const st = fs.statSync(path.join(dir, d.name)); return { nombre: d.name, bytes: st.size, ts: st.mtime.toISOString() } })
    .sort((a, b) => a.ts.localeCompare(b.ts))
}

// Eventos "archivo": cada archivo de la producción es un hito (el guion v6, un veredicto, el estado…).
function eventosDeArchivos(slug) {
  const dir = carpetaProduccion(slug)
  return archivos(slug).map(a => {
    let texto = ''
    try { texto = fs.readFileSync(path.join(dir, a.nombre), 'utf8') } catch {}
    return {
      ts: a.ts, slug, tipo: 'archivo', agente: agenteDeArchivo(a.nombre), a: null,
      descripcion: a.nombre, texto: limpiar(texto.slice(0, 2500)),
      veredicto: /^(veredicto|revision|analisis|espectador)/.test(a.nombre) ? veredictoDe(texto) : null,
      bloqueantes: /^(veredicto|revision|analisis)/.test(a.nombre) ? bloqueantesDe(texto) : [], archivo: a.nombre,
      cambios: /^(veredicto|revision|analisis|espectador)/.test(a.nombre) ? extraerCambios(texto) : [],
      resumen: resumenDe(texto),
    }
  })
}

// Consumo real de tokens por agente (lo mide el hook al terminar cada uno; ver lib/eventos.mjs tokensDeTranscripto).
function tokensPorAgente(evs) {
  const por = {}; let total = 0, corridas = 0
  for (const e of evs) {
    if (!e.tokens) continue
    const k = e.agente || "sin nombre"; const p = por[k] ?? (por[k] = { total: 0, corridas: 0 })
    const t = e.tokens.corrida ?? e.tokens.total; p.total += t; p.corridas++; total += t; corridas++
  }
  return { total, corridas, por }
}

// Eventos viejos pueden haber caído en el video equivocado (cuando se asignaba "el último video"): si el texto nombra
// claramente a otro video y no a este, no es de este.
function esDeEsteVideo(e, slug, otros) {
  const t = e.texto ?? ""; if (!t) return true
  const cuenta = s => t.split(s).length - 1
  const propio = cuenta(slug)
  const ajeno = Math.max(0, ...otros.map(cuenta))
  return !(ajeno > 0 && ajeno > propio)
}

// Todos los eventos de un video, en orden: los del hook (sin los que son de otro video) + los archivos de produccion/.
function eventosDe(slug, todos = proyectos().map(p => p.slug)) {
  const otros = todos.filter(s => s !== slug)
  return [...normalizarEventos(leerEventos(slug).filter(e => esDeEsteVideo(e, slug, otros))), ...eventosDeArchivos(slug)].sort((a, b) => a.ts.localeCompare(b.ts))
}

// Constelación: el estado de cada video y lo último que pasó en todos (para el feed en vivo).
function resumenGeneral() {
  const slugs = proyectos().map(p => p.slug)
  const videos = [], actividad = []
  for (const slug of slugs) {
    const m = modeloDeVideo(slug, eventosDe(slug, slugs), etapaDe(slug))
    videos.push(resumenDeVideo(m))
    for (const x of m.acciones.slice(-12)) actividad.push({ slug, ts: x.ts, de: x.de, a: x.a, tipo: x.tipo, veredicto: x.veredicto, frase: frase(x), motivo: x.motivos[0] ?? null })
  }
  actividad.sort((a, b) => b.ts.localeCompare(a.ts))
  return { videos, actividad: actividad.slice(0, 40), equipo: EQUIPO, ahora: new Date().toISOString() }
}

// Firma barata del estado de una producción: si cambia, se avisa a los navegadores abiertos.
function firma(slug) {
  const dir = carpetaProduccion(slug)
  if (!fs.existsSync(dir)) return ''
  return fs.readdirSync(dir).map(n => { try { const st = fs.statSync(path.join(dir, n)); return `${n}:${st.size}:${st.mtimeMs}` } catch { return n } }).join('|')
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const slug = url.searchParams.get('slug')
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    return res.end(fs.readFileSync(path.join(SALA, 'index.html')))
  }
  if (url.pathname === '/clasica') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    return res.end(fs.readFileSync(PAGINA))
  }
  if (url.pathname.startsWith('/sala/')) {
    const nombre = url.pathname.slice(6)
    if (!ESTATICO_OK.test(nombre) || !fs.existsSync(path.join(SALA, nombre))) { res.writeHead(404); return res.end('no encontrado') }
    res.writeHead(200, { 'Content-Type': TIPOS[nombre.split('.').pop()], 'Cache-Control': 'no-store' })
    return res.end(fs.readFileSync(path.join(SALA, nombre)))
  }
  if (url.pathname === '/vendor/three.module.min.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'max-age=86400' })
    return res.end(fs.readFileSync(path.join(AQUI, '..', 'pagina', 'vendor', 'three.module.min.js')))
  }
  if (url.pathname === '/api/resumen') return json(res, resumenGeneral())
  if (url.pathname === '/api/stream' && !slug) {
    // Sin video: avisa cuando cambia cualquiera (para la constelación).
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
    res.write('retry: 2000\n\n')
    const firmaTodos = () => proyectos().map(p => p.slug + '=' + firma(p.slug)).join('#')
    let anterior = firmaTodos()
    const t = setInterval(() => {
      const ahora = firmaTodos()
      if (ahora !== anterior) { anterior = ahora; res.write(`event: cambio\ndata: ${Date.now()}\n\n`) } else res.write(': latido\n\n')
    }, 1500)
    req.on('close', () => clearInterval(t))
    return
  }
  if (url.pathname === '/fuentes/geist-latin.woff2') {
    res.writeHead(200, { 'Content-Type': 'font/woff2', 'Cache-Control': 'max-age=86400' })
    return res.end(fs.readFileSync(path.join(AQUI, '..', 'pagina', 'fuentes', 'geist-latin.woff2')))
  }
  if (url.pathname === '/api/proyectos') return json(res, proyectos())
  if (url.pathname.startsWith('/api/') && !slugValido(slug)) return json(res, { error: 'slug inválido' }, 400)
  if (url.pathname.startsWith('/api/') && !fs.existsSync(carpetaProduccion(slug))) return json(res, { error: 'sin producción' }, 404)
  if (url.pathname === '/api/eventos') {
    const evs = eventosDe(slug)
    return json(res, { slug, eventos: evs, archivos: archivos(slug), etapa: etapaDe(slug), tokens: tokensPorAgente(evs) })
  }
  if (url.pathname === '/api/video') return json(res, modeloDeVideo(slug, eventosDe(slug), etapaDe(slug)))
  if (url.pathname === '/api/archivo') {
    const nombre = url.searchParams.get('nombre') ?? ''
    if (!ARCHIVO_OK.test(nombre)) return json(res, { error: 'nombre inválido' }, 400)
    const ruta = path.join(carpetaProduccion(slug), nombre)
    if (!fs.existsSync(ruta)) return json(res, { error: 'no existe' }, 404)
    return json(res, { nombre, texto: limpiar(fs.readFileSync(ruta, 'utf8')).slice(0, 60000) })
  }
  if (url.pathname === '/api/stream') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
    res.write('retry: 2000\n\n')
    let anterior = firma(slug)
    const t = setInterval(() => {
      const ahora = firma(slug)
      if (ahora !== anterior) { anterior = ahora; res.write(`event: cambio\ndata: ${Date.now()}\n\n`) } else res.write(': latido\n\n')
    }, 1000)
    req.on('close', () => clearInterval(t))
    return
  }
  res.writeHead(404); res.end('no encontrado')
})

servidor.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `El puerto ${PUERTO} está ocupado: probá --puerto <otro>` : e.message); process.exit(1) })
servidor.listen(PUERTO, '127.0.0.1', () => console.log(`Monitor de agentes: http://127.0.0.1:${PUERTO}  (leyendo ${VIDEOS_DIR})`))
