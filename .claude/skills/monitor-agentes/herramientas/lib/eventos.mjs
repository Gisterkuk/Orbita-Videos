// Núcleo compartido del monitor: dónde se guarda el registro, cómo se detecta el proyecto,
// qué es un veredicto y cómo se limpia el texto antes de guardarlo.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const VIDEOS_DIR = process.env.ORBITA_VIDEOS ?? path.join(os.homedir(), 'orbita-videos')
export const MONITOR_DIR = path.join(VIDEOS_DIR, '_monitor')
const MAX_TEXTO = 6000

// Agente "legible" a partir de lo que declara el nombre del archivo de produccion/.
export const AGENTE_DE_ARCHIVO = [
  [/^guion\.md$/, 'guionista-video'],
  [/^analisis/, 'analista-video'],
  [/^veredicto-claridad/, 'juez-guion (claridad)'],
  [/^veredicto-adversarial/, 'juez-guion (adversarial)'],
  [/^espectador/, 'espectador-mudo'],
  [/^revision-final-fidelidad/, 'supervisor-video (fidelidad)'],
  [/^revision-final-adversarial/, 'supervisor-video (adversarial)'],
  [/^revision/, 'supervisor-video'],
  [/^estado\.md$/, 'director'],
  [/^informe/, 'director'],
]

export function agenteDeArchivo(nombre) {
  for (const [re, ag] of AGENTE_DE_ARCHIVO) if (re.test(nombre)) return ag
  return null
}

// "RECHAZADO" / "APROBADO" en el encabezado del veredicto o en el resumen del agente.
export function veredictoDe(texto) {
  if (!texto) return null
  const cabecera = texto.slice(0, 600)
  const m = /\b(RECHAZADO|APROBADO)\b/i.exec(cabecera) ?? /\bveredicto[^.\n]{0,60}?\b(RECHAZADO|APROBADO)\b/i.exec(texto)
  return m ? m[1].toUpperCase() : null
}

// Ids de bloqueantes citados (B1, J2, A1…) — solo para mostrar chips, no se interpretan.
export function bloqueantesDe(texto) {
  if (!texto) return []
  return [...new Set((texto.match(/\b(?:B|J|A)\d{1,2}\b/g) ?? []))].slice(0, 12)
}

// Saca claves y tokens que no deberían quedar en un log.
export function limpiar(texto) {
  if (typeof texto !== 'string') return ''
  return texto
    .replace(/\b(sk|xi|AIza)[-_A-Za-z0-9]{20,}\b/g, '[clave oculta]')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]{20,}/gi, '$1[oculto]')
    .replace(/((?:api[_-]?key|token|password|contraseña)["'\s:=]+)[^\s"']{6,}/gi, '$1[oculto]')
    .slice(0, MAX_TEXTO)
}

export function slugValido(s) {
  return typeof s === 'string' && /^[a-z0-9][a-z0-9_-]{0,60}$/i.test(s)
}

export function carpetaProduccion(slug) {
  return path.join(VIDEOS_DIR, slug, 'produccion')
}

// Slug del video al que pertenece un texto: la ruta ~/orbita-videos/<slug>/ que más se repite
// y que de verdad tiene una carpeta produccion/.
export function slugDe(texto) {
  if (!texto) return null
  const cuenta = new Map()
  const base = VIDEOS_DIR.replace(/\\/g, '/').replace(/[.*+?^${}()|[\]]/g, '\\$&')
  const re = new RegExp(`(?:orbita-videos|${base})[\\\\/]+([A-Za-z0-9_-]+)[\\\\/]`, 'gi')
  for (const m of texto.replace(/\\/g, '/').matchAll(re)) cuenta.set(m[1], (cuenta.get(m[1]) ?? 0) + 1)
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s)
  return orden.find(s => slugValido(s) && fs.existsSync(carpetaProduccion(s))) ?? null
}

export function rutaLog(slug) {
  if (slug && slugValido(slug) && fs.existsSync(carpetaProduccion(slug))) return path.join(carpetaProduccion(slug), 'eventos.jsonl')
  return path.join(MONITOR_DIR, 'eventos.jsonl')
}

const ULTIMO = path.join(MONITOR_DIR, 'ultimo-slug.txt')
export function recordarSlug(slug) {
  try { fs.mkdirSync(MONITOR_DIR, { recursive: true }); fs.writeFileSync(ULTIMO, slug) } catch {}
}
export function ultimoSlug() {
  try { const s = fs.readFileSync(ULTIMO, 'utf8').trim(); return slugValido(s) ? s : null } catch { return null }
}

export function registrar(evento) {
  const slug = evento.slug ?? null
  const ev = {
    ts: evento.ts ?? new Date().toISOString(),
    slug,
    tipo: evento.tipo,            // lanzado | mensaje | devolucion | archivo
    agente: evento.agente ?? null,
    a: evento.a ?? null,          // destinatario (mensajes)
    descripcion: evento.descripcion ? limpiar(evento.descripcion).slice(0, 200) : null,
    texto: limpiar(evento.texto ?? ''),
    // Un veredicto solo existe en lo que un revisor devuelve: un encargo que diga "guion aprobado" no es una aprobación.
    veredicto: evento.tipo === 'devolucion' ? (evento.veredicto ?? veredictoDe(evento.texto)) : null,
    bloqueantes: evento.tipo === 'devolucion' ? bloqueantesDe(evento.texto) : [],
    agenteId: evento.agenteId ?? null,
    resumen: resumenDe(evento.texto),
    ...(evento.tokens ? { tokens: evento.tokens } : {}),
  }
  const archivo = rutaLog(slug)
  fs.mkdirSync(path.dirname(archivo), { recursive: true })
  fs.appendFileSync(archivo, JSON.stringify(ev) + '\n')
  if (slug) recordarSlug(slug)
  return ev
}

export function leerEventos(slug) {
  const archivo = rutaLog(slug)
  if (!fs.existsSync(archivo)) return []
  return fs.readFileSync(archivo, 'utf8').split('\n').filter(Boolean).flatMap(l => { try { return [JSON.parse(l)] } catch { return [] } })
}

// "Qué pidió cambiar" en lenguaje llano: las líneas de la sección "Bloqueantes" de un veredicto o análisis,
// sin ids ni marcas de formato ("- [B1] **algo** — evidencia" → "algo").
export function extraerCambios(texto) {
  if (!texto) return []
  const lineas = texto.split('\n')
  const ini = lineas.findIndex(l => /^#{1,4}\s*Bloqueantes\b(?!\s+anteriores)/i.test(l.trim()))
  if (ini < 0) return []
  const out = []
  for (const l of lineas.slice(ini + 1)) {
    if (/^#{1,4}\s/.test(l.trim())) break
    const m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(l)
    if (!m) continue
    // "[B1] **Severidad A** — 0:14 a 0:42 — La línea queda en cuadro…": se salta la severidad y el tramo de tiempo.
    const partes = m[1].replace(/\*\*|`/g, '').replace(/^\[?\b[A-Z]\d{1,2}\b\]?:?\s*/, '').split(/\s[—–]\s/).map(s => s.trim())
    const limpio = partes.find(s => s && !/^severidad\b/i.test(s) && !/^\(?\d{1,2}:\d{2}/.test(s)) ?? partes[0]
    if (!limpio || /^(ninguno|ninguna|sin bloqueantes|0\b)/i.test(limpio)) continue
    const punto = limpio.indexOf('. ')
    out.push(limpio.length <= 220 ? limpio : punto > 40 && punto < 220 ? limpio.slice(0, punto + 1) : limpio.slice(0, 217) + '…')
    if (out.length >= 5) break
  }
  return out
}

// En qué parte del proceso está un video, según lo que ya existe en su carpeta (aproximado).
export const ETAPAS = ['Preparación', 'Guion', 'Revisión del guion', 'Grabación', 'Voz', 'Edición', 'Control de calidad', 'Entrega']
export function etapaDe(slug) {
  const raiz = path.join(VIDEOS_DIR, slug)
  const prod = carpetaProduccion(slug)
  const ls = d => { try { return fs.readdirSync(d) } catch { return [] } }
  const enProd = ls(prod)
  const hay = re => enProd.some(n => re.test(n))
  const out = ls(path.join(raiz, 'out'))
  let i = 0
  if (hay(/^guion\.md$/)) i = 1
  if (hay(/^(veredicto|analisis)/)) i = 2
  if (ls(path.join(raiz, 'tomas')).length || out.some(n => /^ensayo/.test(n))) i = 3
  if (fs.existsSync(path.join(raiz, 'voz.json')) || ls(path.join(raiz, 'voz')).length) i = 4
  if (out.some(n => /\.mp4$/.test(n)) || ls(path.join(raiz, 'renders')).length) i = 5
  if (hay(/^(revision|espectador)/)) i = 6
  if (hay(/^informe/)) i = 7
  return { indice: i, nombre: ETAPAS[i], total: ETAPAS.length, etapas: ETAPAS }
}

// ---------- Texto legible ----------

// Rutas largas → solo el nombre del archivo ("C:/Users/x/orbita-videos/v/produccion/guion.md" → "guion.md").
export function sinRutas(texto) {
  return (texto ?? '').replace(/(?:[A-Za-z]:[\\/]|~[\\/]|\/)(?:[^\s`"'()<>|]+[\\/])+([^\s`"'()<>|\\/]+)/g, '$1')
}

// Lo esencial de un mensaje o documento en una o dos frases, sin marcas ni rutas:
// el "Objetivo:" si lo hay, si no las primeras líneas con contenido.
export function resumenDe(texto, max = 260) {
  if (!texto) return ''
  const lineas = sinRutas(texto).split('\n').map(l => l.trim()).filter(Boolean)
  const limpia = l => l.replace(/^#+\s*/, '').replace(/^[-*]\s+/, '').replace(/\*\*|`|>|\|/g, '').replace(/\s+/g, ' ').trim()
  const obj = lineas.find(l => /^(\*\*)?Objetivo:?(\*\*)?:?/i.test(l))
  let base = obj ? limpia(obj) : lineas.filter(l => !/^#{1,6}\s/.test(l) && !/^[-|:\s]+$/.test(l)).slice(0, 3).map(limpia).join(' ')
  if (!base) base = lineas.slice(0, 2).map(limpia).join(' ')
  if (base.length <= max) return base
  const corte = base.slice(0, max)
  const punto = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('; '))
  return (punto > max * 0.5 ? corte.slice(0, punto + 1) : corte.replace(/\s+\S*$/, '')) + (punto > max * 0.5 ? '' : '…')
}

// ---------- Tokens reales de un agente (del transcrito) ----------

// Suma el uso de un transcrito JSONL. Cada mensaje del agente aparece en varias líneas (una por bloque) con el mismo
// message.id: se cuenta una sola vez, quedándose con la línea de mayor salida. "Tokens" = entrada + salida + caché nuevo;
// la lectura de caché (el contexto que se vuelve a leer) va aparte porque es mucho más barata.
export function tokensDeTranscripto(ruta) {
  try {
    const por = new Map()
    for (const l of fs.readFileSync(ruta, 'utf8').split('\n')) {
      if (!l.trim()) continue
      let j; try { j = JSON.parse(l) } catch { continue }
      const m = j.message
      if (!m || !m.usage) continue
      const k = m.id ?? j.uuid
      const previo = por.get(k)
      if (!previo || (m.usage.output_tokens ?? 0) >= (previo.output_tokens ?? 0)) por.set(k, m.usage)
    }
    if (!por.size) return null
    let entrada = 0, salida = 0, cacheNuevo = 0, cacheLectura = 0
    for (const u of por.values()) {
      entrada += u.input_tokens ?? 0; salida += u.output_tokens ?? 0
      cacheNuevo += u.cache_creation_input_tokens ?? 0; cacheLectura += u.cache_read_input_tokens ?? 0
    }
    return { total: entrada + salida + cacheNuevo, salida, cacheLectura, mensajes: por.size }
  } catch { return null }
}

// ---------- Quién es cada agente (id → nombre y video) ----------

const AGENTES = path.join(MONITOR_DIR, 'agentes.json')
function leerAgentes() { try { return JSON.parse(fs.readFileSync(AGENTES, 'utf8')) } catch { return {} } }

export function guardarAgente(id, datos) {
  if (!id) return
  try {
    const todos = leerAgentes()
    todos[id] = { ...(todos[id] ?? {}), ...datos }
    const claves = Object.keys(todos)
    if (claves.length > 400) for (const k of claves.slice(0, claves.length - 400)) delete todos[k]
    fs.mkdirSync(MONITOR_DIR, { recursive: true })
    fs.writeFileSync(AGENTES, JSON.stringify(todos))
  } catch {}
}
export function datosDeAgente(id) { return id ? (leerAgentes()[id] ?? null) : null }

// El id que devuelve el tool al lanzar un agente ("agentId: a1b2…"), venga como texto o como objeto.
export function idDeAgenteLanzado(respuesta) {
  const t = typeof respuesta === 'string' ? respuesta : (() => { try { return JSON.stringify(respuesta) } catch { return '' } })()
  const m = /agent[_ ]?id["']?\s*[:=]\s*["']?([A-Za-z0-9]{8,})/i.exec(t ?? '')
  return m ? m[1] : null
}

// Ordena los eventos para mostrarlos: un agente puede "terminar" dos veces seguidas (el primer cierre llega con el
// transcrito sin completar) y el uso del transcrito es acumulado. Se descarta el cierre repetido y se calcula lo que
// gastó cada corrida (el acumulado menos lo anterior).
export function normalizarEventos(evs) {
  const out = []
  for (const e of evs) {
    if (e.tipo === 'devolucion' && e.agenteId) {
      const i = out.map(x => x.tipo === 'devolucion' && x.agenteId === e.agenteId && x.texto === e.texto && Math.abs(new Date(e.ts) - new Date(x.ts)) < 30000).lastIndexOf(true)
      if (i >= 0) out.splice(i, 1)
    }
    out.push(e.tipo === 'lanzado' || e.tipo === 'mensaje' ? { ...e, veredicto: null, bloqueantes: [] } : { ...e })
  }
  const acumulado = new Map()
  for (const e of out) {
    if (!e.tokens) continue
    const antes = e.agenteId ? (acumulado.get(e.agenteId) ?? 0) : 0
    e.tokens = { ...e.tokens, corrida: Math.max(0, e.tokens.total - antes) }
    if (e.agenteId) acumulado.set(e.agenteId, Math.max(antes, e.tokens.total))
  }
  return out
}
