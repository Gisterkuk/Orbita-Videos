// Sala de control: arma el render, la navegación (#/v/<video>/<agente>), los datos en vivo y el HUD.
// La constelación, la oficina y la ficha viven en sus propios módulos.
import * as THREE from 'three'
import { Constelacion } from './constelacion.js'
import { Oficina } from './oficina.js'
import { Ficha } from './ficha.js'
import { $, el, bonito, recortar, tiempo, renovarTiempos, json, md, escapar, ESTADOS } from './util.js'

const lienzo = $('lienzo')
let renderer
try {
  renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' })
} catch {
  $('sin-3d').hidden = false
  throw new Error('sin WebGL')
}
// Si la placa de video suelta el 3D (pasa con pestañas ocultas mucho tiempo), se avisa y se recarga al volver.
lienzo.addEventListener('webglcontextlost', e => { e.preventDefault(); $('sin-3d').hidden = false })
lienzo.addEventListener('webglcontextrestored', () => location.reload())
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#05080F')
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05

// ---------- Estado ----------
const st = { vista: 'constelacion', slug: null, agente: null, resumen: null, modelo: null, equipo: null, cambiando: false }

const app = {
  lienzo,
  get agenteAbierto() { return st.agente },
  entrar: slug => { location.hash = '#/v/' + slug },
  abrirFicha: id => { if (st.slug) location.hash = `#/v/${st.slug}/${id}` },
  cerrarFicha: () => { if (st.slug) location.hash = '#/v/' + st.slug },
  colorEstado: e => (ESTADOS[e] ?? ESTADOS.pausa).color,
  miembro: id => st.equipo?.find(m => m.id === id) ?? { id, nombre: id, rol: '', color: '#94A3B8' },
  mostrarTip, ocultarTip, abrirDocumento,
  desplazarEscena: () => window.innerWidth >= 1100 && !document.querySelector('.panel.solo-c')?.classList.contains('plegado') ? 190 : 0,
}
const conCapa = capa => Object.create(app, { capaEtiquetas: { value: capa } })
const constelacion = new Constelacion(conCapa($('capa-c')))
const oficina = new Oficina(conCapa($('capa-o')))
const ficha = new Ficha(app, $('ficha'))
const mundo = () => st.vista === 'oficina' ? oficina : constelacion

// ---------- Tamaño ----------
function redimensionar() {
  const w = window.innerWidth, h = window.innerHeight
  renderer.setSize(w, h, false)
  for (const c of [constelacion.camara, oficina.camara]) { c.aspect = w / h; c.updateProjectionMatrix() }
  oficina.redimensionar(w, h, w > 900 ? Math.min(460, w * 0.4) : 0)
}
window.addEventListener('resize', redimensionar); redimensionar()

// ---------- Selección con el mouse ----------
const rayo = new THREE.Raycaster(), puntero = new THREE.Vector2()
function tocado(e) {
  const r = lienzo.getBoundingClientRect()
  puntero.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1)
  rayo.setFromCamera(puntero, mundo().camara)
  return rayo.intersectObjects(mundo().pickables(), false)[0]?.object ?? null
}
lienzo.addEventListener('pointermove', e => { if (!st.cambiando && e.buttons === 0) mundo().hover(tocado(e), e) })
lienzo.addEventListener('pointerleave', () => { mundo().hover(null); ocultarTip() })
lienzo.addEventListener('click', e => { if (st.cambiando || mundo().orbit.fueArrastre()) return; mundo().clic(tocado(e)) })
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || $('dialogo').open) return
  if (st.agente) app.cerrarFicha(); else if (st.vista === 'oficina') location.hash = '#/'
})

// ---------- Tooltip ----------
function mostrarTip(nodo, x, y) {
  const t = $('tip'); t.textContent = ''; t.append(nodo); t.hidden = false
  const w = t.offsetWidth, h = t.offsetHeight
  t.style.left = Math.min(window.innerWidth - w - 12, x + 18) + 'px'
  t.style.top = Math.min(window.innerHeight - h - 12, Math.max(12, y - h / 2)) + 'px'
}
function ocultarTip() { $('tip').hidden = true }

// ---------- Documentos ----------
async function abrirDocumento(nombre, titulo) {
  $('dialogo-titulo').textContent = titulo || nombre; const l = $('lector'); l.textContent = 'Cargando…'
  $('dialogo').showModal()
  try {
    const d = await json(`/api/archivo?slug=${encodeURIComponent(st.slug)}&nombre=${encodeURIComponent(nombre)}`)
    l.innerHTML = /\.(md|txt)$/.test(nombre) ? md(d.texto) : '<pre>' + escapar(d.texto) + '</pre>'
  } catch { l.textContent = 'No pude abrir este documento.' }
}
$('cerrar-dialogo').onclick = () => $('dialogo').close()
$('dialogo').addEventListener('click', e => { if (e.target === $('dialogo')) $('dialogo').close() })

// ---------- HUD ----------
function pintarGeneral() {
  const r = st.resumen; if (!r) return
  const cuenta = {}; for (const v of r.videos) cuenta[v.estado] = (cuenta[v.estado] ?? 0) + 1
  const c = $('contadores'); c.textContent = ''
  for (const [k, sing, plur] of [['trabajando', 'trabajando', 'trabajando'], ['trabado', 'trabado', 'trabados'], ['cambios', 'pide cambios', 'piden cambios'], ['listo', 'listo', 'listos'], ['pausa', 'en pausa', 'en pausa']]) {
    if (!cuenta[k]) continue
    const s = el('span', 'contador'); s.style.setProperty('--c', ESTADOS[k].color)
    s.append(el('b', null, String(cuenta[k])), document.createTextNode(' ' + (cuenta[k] === 1 ? sing : plur))); c.append(s)
  }
  if (!r.videos.length) $('vacio').hidden = false

  const f = $('feed-lista'); f.textContent = ''
  for (const x of r.actividad.slice(0, 9)) {
    const b = el('button', 'feed-item' + (x.veredicto === 'RECHAZADO' ? ' mal' : x.veredicto === 'APROBADO' ? ' ok' : '')); b.type = 'button'
    b.style.setProperty('--c', app.miembro(x.de).color)
    const tx = el('span', 'tx'); tx.append(el('b', null, bonito(x.slug)), document.createTextNode(' · ' + x.frase))
    if (x.motivo) tx.append(el('span', 'motivo', recortar(x.motivo, 110)))
    b.append(el('i', 'punto'), tx, tiempo(x.ts))
    b.onclick = () => app.entrar(x.slug)
    f.append(b)
  }
  if (!r.actividad.length) f.append(el('p', 'nada', 'Todavía no hay mensajes registrados.'))
}

function pintarOficina() {
  const m = st.modelo; if (!m) return
  const est = ESTADOS[m.estado] ?? ESTADOS.pausa
  $('o-titulo').textContent = bonito(m.slug)
  document.title = `${bonito(m.slug)} · Sala de control`
  const chip = $('o-estado'); chip.textContent = est.texto + (m.activo && m.estado !== 'trabajando' ? ' · con actividad' : ''); chip.style.setProperty('--c', est.color)
  $('o-etapa').textContent = `Etapa ${m.etapa.indice + 1} de ${m.etapa.total} · ${m.etapa.nombre}`
  const pasos = $('o-pasos'); pasos.textContent = ''
  m.etapa.etapas.forEach((n, i) => { const p = el('span', 'paso' + (i < m.etapa.indice ? ' hecho' : i === m.etapa.indice ? ' ahora' : '')); p.title = n; pasos.append(p) })

  const ban = $('o-motivo'); ban.textContent = ''; ban.hidden = !m.motivo
  if (m.motivo) {
    ban.style.setProperty('--c', est.color)
    const t = el('div', 'tx')
    t.append(el('span', 'rot', m.estado === 'trabado' ? 'Por qué está trabado' : 'Por qué no avanza'))
    t.append(el('b', null, `${m.motivo.nombre} ${m.motivo.veces > 1 ? `rechazó ${m.motivo.veces} veces seguidas` : 'pidió cambios'}`))
    if (m.motivo.motivo) t.append(el('span', 'cita', '«' + recortar(m.motivo.motivo, 200) + '»'))
    const b = el('button', 'enlace', 'Ver su historial →'); b.type = 'button'; b.onclick = () => app.abrirFicha(m.motivo.agente)
    ban.append(t, b)
  }

  const lista = $('conv-lista'); lista.textContent = ''
  for (const x of m.acciones.slice(-14).reverse()) {
    const quien = x.de === 'director' ? x.a : x.de
    const b = el('button', 'feed-item' + (x.veredicto === 'RECHAZADO' ? ' mal' : x.veredicto === 'APROBADO' ? ' ok' : '')); b.type = 'button'
    b.style.setProperty('--c', app.miembro(x.de).color)
    const tx = el('span', 'tx'); tx.append(document.createTextNode(frase(x)))
    const detalle = x.veredicto === 'RECHAZADO' ? x.motivos?.[0] : x.tipo === 'documento' ? null : x.titulo
    if (detalle) tx.append(el('span', 'motivo', recortar(detalle, 110)))
    b.append(el('i', 'punto'), tx, tiempo(x.ts))
    b.onclick = () => app.abrirFicha(quien)
    lista.append(b)
  }
  if (!m.acciones.length) lista.append(el('p', 'nada', 'Este video todavía no tiene mensajes.'))
}
function frase(x) {
  const de = app.miembro(x.de).nombre, a = x.a ? app.miembro(x.a).nombre : ''
  if (x.tipo === 'encargo') return `${de} → ${a}: nueva tarea`
  if (x.tipo === 'mensaje') return `${de} → ${a}: mensaje`
  if (x.veredicto === 'RECHAZADO') return `${de} pidió cambios`
  if (x.veredicto === 'APROBADO') return `${de} aprobó`
  if (x.tipo === 'documento') return `${de} dejó «${x.titulo}»`
  return `${de} → Director: respuesta`
}

function mostrarVista(v) {
  st.vista = v
  document.body.dataset.vista = v
  $('capa-c').hidden = v !== 'constelacion'; $('capa-o').hidden = v !== 'oficina'
  constelacion.orbit.activo = v === 'constelacion'; oficina.orbit.activo = v === 'oficina'
  $('ayuda').textContent = v === 'oficina'
    ? 'Arrastrá para girar · rueda para acercar · clic en un agente para ver todo lo que hizo · rojo = pidió cambios · verde = aprobó'
    : 'Arrastrá para girar · rueda para acercar · clic en un planeta para entrar a su oficina · cada anillo es una etapa'
  if (v === 'constelacion') document.title = 'Sala de control · Órbita'
}

// ---------- Datos ----------
async function cargarResumen() {
  st.resumen = await json('/api/resumen')
  st.equipo ??= st.resumen.equipo
  constelacion.actualizar(st.resumen)
  pintarGeneral()
}
async function cargarVideo(slug) {
  const m = await json('/api/video?slug=' + encodeURIComponent(slug))
  st.equipo = m.equipo
  return m
}

// ---------- Navegación ----------
const velo = on => new Promise(r => { $('velo').classList.toggle('on', on); setTimeout(r, on ? 380 : 10) })
function ruta() {
  const m = /^#\/v\/([A-Za-z0-9_-]+)(?:\/([a-z-]+))?/.exec(location.hash)
  return m ? { slug: m[1], agente: m[2] ?? null } : { slug: null, agente: null }
}
let cola = Promise.resolve()
window.addEventListener('hashchange', () => { cola = cola.then(aplicarRuta).catch(() => {}) })

async function aplicarRuta() {
  const r = ruta()
  ocultarTip()
  if (r.slug && (st.vista !== 'oficina' || r.slug !== st.slug)) {
    st.cambiando = true
    try {
      const pedido = cargarVideo(r.slug)
      if (st.vista === 'constelacion') await constelacion.acercarA(r.slug)
      await velo(true)
      st.slug = r.slug; st.modelo = await pedido
      st.agente = null; ficha.cerrar(); oficina.enfocar(null)
      oficina.mostrar(st.modelo)
      mostrarVista('oficina'); pintarOficina()
      await velo(false)
    } catch {
      await velo(false); location.hash = '#/'
    } finally { st.cambiando = false }
  } else if (!r.slug && st.vista === 'oficina') {
    st.cambiando = true
    await velo(true)
    st.slug = null; st.modelo = null; st.agente = null; ficha.cerrar(); oficina.enfocar(null); oficina.limpiar()
    constelacion.volver(); mostrarVista('constelacion')
    await velo(false)
    st.cambiando = false
  }
  if (st.vista === 'oficina') {
    if (r.agente && r.agente !== st.agente) { st.agente = r.agente; ficha.abrir(st.modelo, r.agente); oficina.enfocar(r.agente) }
    else if (!r.agente && st.agente) { st.agente = null; ficha.cerrar(); oficina.enfocar(null) }
  }
}

// ---------- En vivo ----------
let espera = null
function refrescar() {
  clearTimeout(espera)
  espera = setTimeout(async () => {
    try {
      await cargarResumen()
      if (st.vista === 'oficina' && st.slug && !st.cambiando) {
        st.modelo = await cargarVideo(st.slug)
        oficina.actualizar(st.modelo); pintarOficina(); ficha.actualizar(st.modelo)
      }
    } catch { vivo(false) }
  }, 350)
}
function vivo(on) { $('vivo').classList.toggle('on', on); $('vivo-t').textContent = on ? 'En vivo' : 'Reconectando…' }
function conectar() {
  const f = new EventSource('/api/stream')
  f.onopen = () => vivo(true)
  f.onerror = () => vivo(false)
  f.addEventListener('cambio', refrescar)
}
setInterval(renovarTiempos, 15000)
setInterval(refrescar, 60000)   // "trabajando" y "hace X" también cambian sin que haya eventos nuevos

// ---------- Bucle ----------
const reloj = new THREE.Clock()
function cuadro() {
  requestAnimationFrame(cuadro)
  const dt = Math.min(0.05, reloj.getDelta())
  if (document.hidden) return
  const w = mundo()
  w.tick(dt)
  w.etiquetas.tick(w.camara, window.innerWidth, window.innerHeight)
  renderer.render(w.escena, w.camara)
}

$('volver').onclick = () => { location.hash = '#/' }
// Paneles plegables (en ventanas chicas arrancan plegados).
let plegados = null; try { plegados = JSON.parse(localStorage.getItem('sala-plegados')) } catch {}
document.querySelectorAll('.panel').forEach((p, i) => {
  const b = p.querySelector('.plegar')
  const poner = on => { p.classList.toggle('plegado', on); b.setAttribute('aria-expanded', String(!on)) }
  poner(plegados?.[i] ?? (window.innerWidth < 1000 || window.innerHeight < 700))
  b.onclick = () => { poner(!p.classList.contains('plegado')); try { localStorage.setItem('sala-plegados', JSON.stringify([...document.querySelectorAll('.panel')].map(x => x.classList.contains('plegado')))) } catch {} }
})
mostrarVista('constelacion')
cargarResumen().then(() => { conectar(); cola = cola.then(aplicarRuta).catch(() => {}); return cola }).catch(() => { vivo(false); $('vivo-t').textContent = 'Sin conexión' })
cuadro()
