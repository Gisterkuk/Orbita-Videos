// Modelo de la vista 3D: a partir de los eventos de un video (hook + archivos de produccion/) arma quién es cada
// agente, qué hizo, por qué rechazó y en qué estado está el video. La página solo dibuja lo que sale de acá.
import { extraerCambios, resumenDe, sinRutas } from './eventos.mjs'

// Integrantes del equipo: id estable, nombre de todos los días, qué hace, color y zona de la oficina.
export const EQUIPO = [
  { id: 'director', nombre: 'Director', rol: 'Coordina a todos y decide', color: '#FBBF24', zona: 'centro' },
  { id: 'guionista', nombre: 'Guionista', rol: 'Escribe lo que se dice y lo que se ve', color: '#E879F9', zona: 'escritura' },
  { id: 'analista', nombre: 'Analista', rol: 'Comprueba contra el código que el guion diga la verdad', color: '#2DD4BF', zona: 'escritura' },
  { id: 'juez-claridad', nombre: 'Juez de claridad', rol: 'Revisa que alguien sin conocimientos lo entienda', color: '#A78BFA', zona: 'revision' },
  { id: 'juez-exigente', nombre: 'Juez exigente', rol: 'Busca todo lo que podría salir mal o confundir', color: '#FB7185', zona: 'revision' },
  { id: 'juez', nombre: 'Juez del guion', rol: 'Revisa el guion antes de grabar', color: '#C4B5FD', zona: 'revision', opcional: true },
  { id: 'editor', nombre: 'Editor', rol: 'Graba la pantalla y arma el video', color: '#FB923C', zona: 'edicion' },
  { id: 'espectador', nombre: 'Espectador sin sonido', rol: 'Mira el video mudo para ver si se entiende solo', color: '#38BDF8', zona: 'control' },
  { id: 'supervisor-fidelidad', nombre: 'Supervisor de fidelidad', rol: 'Controla que el video cumpla el guion', color: '#A3E635', zona: 'control' },
  { id: 'supervisor-exigente', nombre: 'Supervisor exigente', rol: 'Busca fallas en el video terminado', color: '#F59E0B', zona: 'control' },
  { id: 'supervisor', nombre: 'Supervisor', rol: 'Mira el borrador y marca lo que falla', color: '#BEF264', zona: 'control', opcional: true },
  { id: 'ayudante', nombre: 'Ayudante', rol: 'Hace tareas puntuales', color: '#94A3B8', zona: 'apoyo', opcional: true },
]
const POR_ID = Object.fromEntries(EQUIPO.map(m => [m.id, m]))
export const miembro = id => POR_ID[id] ?? POR_ID.ayudante

// "adversarial" o "claridad", lo que aparezca primero en la pista (la descripción pesa más que el texto).
function modo(pista, opciones) {
  for (const fuente of pista) {
    const t = (fuente ?? '').toLowerCase()
    let mejor = null, pos = Infinity
    for (const [re, valor] of opciones) { const i = t.search(re); if (i >= 0 && i < pos) { pos = i; mejor = valor } }
    if (mejor) return mejor
  }
  return null
}

// Rol a partir del tipo de agente que registró el hook ("juez-guion", "editor-video", "claude"…).
// pista: [descripción, comienzo del texto] para distinguir juez de claridad / exigente, etc.
export function rolDe(crudo, pista = []) {
  const k = String(crudo ?? '').trim().toLowerCase()
  if (!k || /^[a-f0-9]{10,}$/.test(k)) return null
  if (k === 'director' || /^director\b/.test(k)) return 'director'
  if (k.startsWith('guionista')) return 'guionista'
  if (k.startsWith('analista')) return 'analista'
  if (k.startsWith('juez')) return modo([k, ...pista], [[/adversarial|exigente/, 'juez-exigente'], [/claridad/, 'juez-claridad']]) ?? 'juez'
  if (k.startsWith('editor')) return 'editor'
  if (k.startsWith('espectador')) return 'espectador'
  if (k.startsWith('supervisor')) return modo([k, ...pista], [[/fidelidad/, 'supervisor-fidelidad'], [/adversarial|exigente/, 'supervisor-exigente']]) ?? 'supervisor'
  // Un "claude" lanzado como director de otro tutorial es un director, no un ayudante de este video.
  if (/director/i.test(pista[0] ?? '')) return 'director'
  return 'ayudante'
}

// Nombre legible de un documento de produccion/.
export function nombreDoc(n) {
  let m
  const vuelta = s => { const r = /-r(\d+)\.md$/.exec(s); return r ? Number(r[1]) : 1 }
  if (n === 'pedido.md') return 'El pedido del video'
  if (n === 'pedidos.md') return 'Pedidos para vos'
  if (n === 'indicaciones.md') return 'Tus indicaciones'
  if (n === 'guion.md') return 'El guion'
  if (n === 'estado.md') return 'El estado del trabajo'
  if (n === 'informe.md') return 'El informe final'
  if (/^analisis/.test(n)) return `Análisis del guion · vuelta ${vuelta(n)}`
  if (/^veredicto-claridad/.test(n)) return `Opinión del juez de claridad · vuelta ${vuelta(n)}`
  if (/^veredicto-adversarial/.test(n)) return `Opinión del juez exigente · vuelta ${vuelta(n)}`
  if ((m = /^revision-v(\d+)/.exec(n))) return `Revisión del video · versión ${m[1]}`
  if (/^revision-final-fidelidad/.test(n)) return 'Revisión final de fidelidad'
  if (/^revision-final-adversarial/.test(n)) return 'Revisión final exigente'
  if ((m = /^espectador-v(\d+)/.exec(n))) return `Lo que entendió el espectador sin sonido · versión ${m[1]}`
  return n.replace(/\.(md|txt|json|jsonl)$/, '').replace(/[-_]/g, ' ')
}
const esDocumento = n => /\.(md|txt)$/.test(n ?? '')

const ABIERTO_MAX = 6 * 3600e3      // un agente lanzado hace más de 6 h sin devolver ya no cuenta como "trabajando"
const RECIENTE = 15 * 60e3          // actividad en los últimos 15 min = el video está activo
export const SEGUIDOS_TRABADO = 3   // rechazos seguidos del mismo revisor para marcar el video como trabado

// Eventos crudos → acciones con quién (de) le habla a quién (a), en orden.
export function acciones(evs) {
  const idRol = new Map()
  const porId = id => (id ? idRol.get(id) : undefined)
  const out = []
  for (const e of evs) {
    const pista = [e.descripcion, (e.texto ?? '').slice(0, 300)]
    const base = { ts: e.ts, titulo: e.descripcion ?? null, texto: sinRutas(e.texto ?? ''), resumen: e.resumen || resumenDe(e.texto), veredicto: null, motivos: [], bloqueantes: [], archivo: null, tokens: null }
    if (e.tipo === 'lanzado') {
      const a = rolDe(e.agente, pista) ?? 'ayudante'
      if (e.agenteId) idRol.set(e.agenteId, a)
      if (a === 'director') continue
      out.push({ ...base, tipo: 'encargo', de: 'director', a })
    } else if (e.tipo === 'mensaje') {
      const a = porId(e.agenteId) ?? porId(e.a) ?? rolDe(e.a, pista) ?? 'ayudante'
      if (a === 'director') continue
      out.push({ ...base, tipo: 'mensaje', de: 'director', a })
    } else if (e.tipo === 'devolucion') {
      // Sin nombre y sin un lanzamiento conocido es ruido (mensajes de la sesión principal que se colaron).
      const de = porId(e.agenteId) ?? rolDe(e.agente, pista)
      if (!de || de === 'director' || !(e.texto ?? '').trim()) continue
      out.push({ ...base, tipo: 'devolucion', de, a: 'director', veredicto: e.veredicto ?? null, motivos: e.veredicto === 'RECHAZADO' ? extraerCambios(e.texto) : [], bloqueantes: e.bloqueantes ?? [], tokens: e.tokens ? (e.tokens.corrida ?? e.tokens.total) : null })
    } else if (e.tipo === 'archivo') {
      if (!esDocumento(e.archivo) || e.archivo === 'indicaciones.md') continue   // las indicaciones se muestran aparte
      const de = rolDe(e.agente, pista) ?? 'director'
      out.push({ ...base, tipo: 'documento', de, a: 'director', titulo: nombreDoc(e.archivo), archivo: e.archivo, veredicto: e.veredicto ?? null, motivos: e.veredicto === 'RECHAZADO' ? (e.cambios ?? []) : [], bloqueantes: e.bloqueantes ?? [] })
    }
  }
  return out.map((x, i) => ({ id: i, ...x }))
}

// Resumen de cada integrante que participó: cuánto hizo, sus veredictos y si está trabajando ahora.
export function agentes(acs, ahora = Date.now()) {
  const por = new Map()
  const de = id => { if (!por.has(id)) por.set(id, { id, ...miembro(id), tareas: 0, devoluciones: 0, documentos: 0, tokens: 0, veredictos: [], ultimaActividad: null, ultimoEncargo: null, ultimaDevolucion: null }); return por.get(id) }
  de('director')
  for (const x of acs) {
    for (const r of [x.de, x.a]) if (r) { const m = de(r); if (!m.ultimaActividad || x.ts > m.ultimaActividad) m.ultimaActividad = x.ts }
    if (x.tipo === 'encargo' || x.tipo === 'mensaje') { const m = de(x.a); m.tareas++; m.ultimoEncargo = x.ts }
    if (x.tipo === 'devolucion') { const m = de(x.de); m.devoluciones++; m.ultimaDevolucion = x.ts; m.tokens += x.tokens ?? 0 }
    if (x.tipo === 'documento') de(x.de).documentos++
  }
  // Los veredictos se cuentan de los documentos (veredicto-*.md, revision-*.md) si el agente los escribió; si no, de
  // sus devoluciones. Así un rechazo no se cuenta dos veces (el agente lo dice al terminar y también lo deja escrito).
  for (const m of por.values()) {
    const docs = acs.filter(x => x.de === m.id && x.tipo === 'documento' && x.veredicto)
    const fuente = docs.length ? docs : acs.filter(x => x.de === m.id && x.tipo === 'devolucion' && x.veredicto)
    m.veredictos = fuente.map(x => ({ id: x.id, ts: x.ts, veredicto: x.veredicto, motivos: x.motivos }))
    m.rechazos = m.veredictos.filter(v => v.veredicto === 'RECHAZADO').length
    m.aprobaciones = m.veredictos.filter(v => v.veredicto === 'APROBADO').length
    const ultimo = m.veredictos.at(-1) ?? null
    m.ultimoVeredicto = ultimo?.veredicto ?? null
    let seguidos = 0
    for (let i = m.veredictos.length - 1; i >= 0 && m.veredictos[i].veredicto === 'RECHAZADO'; i--) seguidos++
    m.rechazosSeguidos = seguidos
    m.ultimoMotivo = ultimo?.veredicto === 'RECHAZADO' ? (ultimo.motivos[0] ?? null) : null
    m.trabajando = m.id !== 'director' && !!m.ultimoEncargo && (!m.ultimaDevolucion || m.ultimoEncargo > m.ultimaDevolucion) && ahora - Date.parse(m.ultimoEncargo) < ABIERTO_MAX
  }
  return [...por.values()]
}

// Estado del video para la constelación: listo, trabado, pide cambios, trabajando o en pausa.
export function estadoDeVideo(etapa, ags, acs, ahora = Date.now()) {
  const ultima = acs.at(-1)?.ts ?? null
  const activo = ags.some(a => a.trabajando) || (ultima && ahora - Date.parse(ultima) < RECIENTE)
  const piden = ags.filter(a => a.ultimoVeredicto === 'RECHAZADO').sort((a, b) => b.rechazosSeguidos - a.rechazosSeguidos)
  const motivo = piden[0] ? { agente: piden[0].id, nombre: piden[0].nombre, veces: piden[0].rechazosSeguidos, motivo: piden[0].ultimoMotivo } : null
  let estado = 'pausa'
  if (etapa?.indice === (etapa?.total ?? 8) - 1) estado = 'listo'
  else if (piden.some(a => a.rechazosSeguidos >= SEGUIDOS_TRABADO)) estado = 'trabado'
  else if (piden.length) estado = 'cambios'
  else if (activo) estado = 'trabajando'
  return { estado, activo: !!activo, ultimaActividad: ultima, motivo: estado === 'listo' ? null : motivo }
}

export function modeloDeVideo(slug, evs, etapa, ahora = Date.now()) {
  const acs = acciones(evs)
  const ags = agentes(acs, ahora)
  return { slug, etapa, ...estadoDeVideo(etapa, ags, acs, ahora), agentes: ags, acciones: acs, equipo: EQUIPO }
}

// Frase corta de una acción para el feed en vivo ("El juez exigente pidió cambios").
export function frase(x) {
  const de = miembro(x.de).nombre, a = x.a ? miembro(x.a).nombre : ''
  if (x.tipo === 'encargo') return `${de} le encargó una tarea a ${a}`
  if (x.tipo === 'mensaje') return `${de} le escribió a ${a}`
  if (x.veredicto === 'RECHAZADO') return `${de} pidió cambios`
  if (x.veredicto === 'APROBADO') return `${de} aprobó`
  if (x.tipo === 'documento') return `${de} dejó «${x.titulo}»`
  return `${de} le respondió al director`
}

// Lo mínimo de cada video para la constelación (sin el texto completo de cada acción).
export function resumenDeVideo(m) {
  return {
    slug: m.slug, etapa: m.etapa, estado: m.estado, activo: m.activo, ultimaActividad: m.ultimaActividad, motivo: m.motivo,
    agentes: m.agentes.filter(a => a.id !== 'director').map(a => ({ id: a.id, color: a.color, trabajando: a.trabajando, ultimoVeredicto: a.ultimoVeredicto })),
    rechazos: m.agentes.reduce((s, a) => s + a.rechazos, 0), acciones: m.acciones.length,
  }
}
