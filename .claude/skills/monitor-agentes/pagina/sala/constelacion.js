// La constelación: Órbita en el centro, un anillo por etapa y un planeta por video.
// Cuanto más afuera está el planeta, más avanzado va el video. El color dice su estado.
import * as THREE from 'three'
import { brillo, estrellas, nebulosa, Particulas, Orbitador, Etiquetas, arco, materialPlaneta, suave } from './escena.js'
import { el, bonito, recortar, relativo, ESTADOS } from './util.js'

const ETAPAS = ['Preparación', 'Guion', 'Revisión del guion', 'Grabación', 'Voz', 'Edición', 'Control de calidad', 'Entrega']
const radioDe = i => 11 + i * 5.6
const VISTA = { azim: 0.35, polar: 1.02, dist: 112 }

export class Constelacion {
  constructor(app) {
    this.app = app
    this.escena = new THREE.Scene()
    this.escena.fog = new THREE.FogExp2('#05080F', 0.0016)
    this.camara = new THREE.PerspectiveCamera(48, 1, 0.1, 3000)
    this.orbit = new Orbitador(this.camara, app.lienzo, { distIni: 260, polarIni: 0.55, azim: -0.6, dist: [24, 190], polar: [0.25, 1.38], giroAuto: 0.035 })
    this.orbit.saltar(); this.orbit.ir(VISTA)
    this.etiquetas = new Etiquetas(app.capaEtiquetas)
    this.particulas = new Particulas(this.escena, { tam: 0.9 })
    this.planetas = new Map()
    this.tiempo = 0
    this.armarFondo(); this.armarCentro(); this.armarAnillos()
  }

  armarFondo() {
    this.escena.add(estrellas(), nebulosa())
  }

  armarCentro() {
    const g = new THREE.Group()
    this.nucleoMat = materialPlaneta('#93C5FD')
    g.add(new THREE.Mesh(new THREE.SphereGeometry(3.2, 64, 48), this.nucleoMat))
    g.add(brillo('#60A5FA', 22, 0.75), brillo('#3B82F6', 52, 0.28), brillo('#E0F2FE', 9, 0.6, 0.4))
    this.aros = []
    for (const [r, inc, c] of [[4.6, 0.35, '#93C5FD'], [5.4, -0.5, '#A78BFA']]) {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
      aro.rotation.x = Math.PI / 2 + inc; g.add(aro); this.aros.push(aro)
    }
    this.nucleo = g; this.escena.add(g)
    const et = el('div', 'etq-nucleo'); et.append(el('b', null, 'Órbita'), el('span', null, 'todos los videos'))
    this.etiquetas.agregar(et, g, { alto: -4.6 })
  }

  armarAnillos() {
    ETAPAS.forEach((nombre, i) => {
      const r = radioDe(i), pts = []
      for (let k = 0; k <= 256; k++) { const a = k / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)) }
      const final = i === ETAPAS.length - 1
      const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: final ? '#1F6F5C' : '#22314F', transparent: true, opacity: final ? 0.9 : 0.75 }))
      this.escena.add(linea)
      const marca = new THREE.Object3D(); marca.position.set(Math.sin(0.8) * (r + 0.5), 0, Math.cos(0.8) * (r + 0.5)); this.escena.add(marca)
      const et = el('div', 'etq-anillo', `${i + 1} · ${nombre}`)
      this.etiquetas.agregar(et, marca)
    })
    // Disco muy tenue para dar sensación de plano.
    const disco = new THREE.Mesh(new THREE.RingGeometry(8, radioDe(7) + 3, 128), new THREE.MeshBasicMaterial({ color: '#1E3A8A', transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }))
    disco.rotation.x = -Math.PI / 2; this.escena.add(disco)
  }

  // ---------- Datos → planetas ----------
  actualizar(resumen) {
    const vistos = new Set()
    const porAnillo = new Map()
    for (const v of resumen.videos) { const i = v.etapa?.indice ?? 0; if (!porAnillo.has(i)) porAnillo.set(i, []); porAnillo.get(i).push(v) }
    for (const [i, vs] of porAnillo) {
      vs.sort((a, b) => a.slug.localeCompare(b.slug))
      vs.forEach((v, k) => {
        vistos.add(v.slug)
        const angulo = i * 0.95 + k * Math.PI * 2 / vs.length
        let p = this.planetas.get(v.slug)
        if (!p) { p = this.crearPlaneta(v); this.planetas.set(v.slug, p) }
        const antes = p.datos
        p.anillo = i; p.angulo0 = angulo; p.datos = v
        this.vestir(p)
        if (antes && v.ultimaActividad && v.ultimaActividad !== antes.ultimaActividad) this.pulso(p, 4)
      })
    }
    for (const [slug, p] of this.planetas) if (!vistos.has(slug)) { this.escena.remove(p.grupo); this.etiquetas.quitar(p.etiqueta); this.planetas.delete(slug) }
  }

  crearPlaneta(v) {
    const grupo = new THREE.Group()
    const mat = materialPlaneta(ESTADOS[v.estado]?.color ?? '#64748B')
    const esfera = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat)
    esfera.userData.slug = v.slug
    const halo = brillo('#FFFFFF', 10, 0.5)
    const aro = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.07, 8, 96), new THREE.MeshBasicMaterial({ color: '#F87171', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }))
    aro.rotation.x = Math.PI / 2.3
    grupo.add(halo, esfera, aro)
    this.escena.add(grupo)
    const etiqueta = this.etiquetas.agregar(el('button', 'etq-planeta'), grupo, { alto: 3.2 })
    etiqueta.nodo.type = 'button'
    etiqueta.nodo.onclick = () => this.app.entrar(v.slug)
    etiqueta.nodo.onmouseenter = e => this.mostrarFicha(this.planetas.get(v.slug), e)
    etiqueta.nodo.onmouseleave = () => this.app.ocultarTip()
    return { grupo, esfera, mat, halo, aro, lunas: [], etiqueta, brilloExtra: 0, ritmo: 0 }
  }

  vestir(p) {
    const v = p.datos, est = ESTADOS[v.estado] ?? ESTADOS.pausa
    p.mat.uniforms.uColor.value.set(est.color)
    p.halo.material.color.set(est.color)
    const tam = v.estado === 'listo' ? 1.35 : v.estado === 'pausa' ? 1.45 : 1.75
    p.esfera.scale.setScalar(tam); p.tam = tam
    p.aro.material.color.set(est.color)
    p.aroVisible = v.estado === 'trabado' || v.estado === 'cambios'
    // Lunas: un integrante del equipo cada una (las que trabajan brillan más).
    const firma = v.agentes.map(a => a.id + (a.trabajando ? '*' : '') + (a.ultimoVeredicto ?? '')).join(',')
    if (firma !== p.firmaLunas) {
      p.firmaLunas = firma
      for (const l of p.lunas) p.grupo.remove(l.obj)
      p.lunas = v.agentes.slice(0, 11).map((a, k) => {
        const obj = new THREE.Group()
        const bola = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: a.color }))
        obj.add(bola, brillo(a.color, a.trabajando ? 2.4 : 1.1, a.trabajando ? 0.95 : 0.55))
        p.grupo.add(obj)
        return { obj, r: tam + 1.1 + (k % 4) * 0.42, vel: 0.5 + ((k * 37) % 10) / 14, fase: k * 2.1, inc: ((k * 53) % 10) / 10 - 0.5, trabajando: a.trabajando }
      })
    }
    const n = p.etiqueta.nodo; n.textContent = ''
    n.className = 'etq-planeta est-' + v.estado
    n.style.setProperty('--c', est.color)
    const t = el('span', 'tit'); t.append(el('i', 'punto' + (v.activo ? ' vivo' : '')), document.createTextNode(bonito(v.slug)))
    n.append(t, el('span', 'sub', `${(v.etapa?.indice ?? 0) + 1}/8 · ${v.estado === 'trabado' || v.estado === 'cambios' ? est.texto + (v.motivo ? ' · ' + v.motivo.nombre.toLowerCase() : '') : est.texto}`))
    n.setAttribute('aria-label', `${bonito(v.slug)}: ${est.texto}, etapa ${(v.etapa?.indice ?? 0) + 1} de 8. Entrar a la oficina.`)
  }

  posicion(p, t) {
    const r = radioDe(p.anillo)
    const w = 0.03 * Math.pow(11 / r, 1.2)
    const a = p.angulo0 + w * t
    return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
  }

  pulso(p, fuerza = 3) {
    p.brilloExtra = fuerza
    const desde = p.grupo.position.clone()
    const color = ESTADOS[p.datos.estado]?.color ?? '#93C5FD'
    for (let k = 0; k < 3; k++) this.particulas.lanzar(arco(desde, new THREE.Vector3(0, 0, 0), 6 + k * 2), { color, velocidad: 0.42, estela: 10, intensidad: 1.4, retraso: k * 0.25, alLlegar: () => { this.nucleoFlash = 1.5 } })
  }

  // ---------- Interacción ----------
  pickables() { return [...this.planetas.values()].map(p => p.esfera) }
  hover(obj, e) {
    const p = obj ? this.planetas.get(obj.userData.slug) : null
    if (p) this.mostrarFicha(p, e); else this.app.ocultarTip()
    this.app.lienzo.style.cursor = p ? 'pointer' : ''
  }
  clic(obj) { if (obj?.userData.slug) this.app.entrar(obj.userData.slug) }

  mostrarFicha(p, e) {
    if (!p) return
    const v = p.datos, est = ESTADOS[v.estado] ?? ESTADOS.pausa
    const c = el('div', 'tip-video'); c.style.setProperty('--c', est.color)
    c.append(el('b', null, bonito(v.slug)))
    c.append(el('div', 'tip-linea', `Etapa ${(v.etapa?.indice ?? 0) + 1} de 8 · ${v.etapa?.nombre ?? ''}`))
    c.append(el('div', 'tip-estado', est.texto + (v.activo && v.estado !== 'trabajando' ? ' · con actividad' : '')))
    if (v.motivo) {
      const m = el('div', 'tip-motivo')
      m.append(el('span', 'quien', `${v.motivo.nombre} ${v.motivo.veces > 1 ? `rechazó ${v.motivo.veces} veces seguidas` : 'pidió cambios'}`))
      if (v.motivo.motivo) m.append(el('span', 'por', '«' + recortar(v.motivo.motivo, 180) + '»'))
      c.append(m)
    }
    const trabajan = v.agentes.filter(a => a.trabajando).length
    c.append(el('div', 'tip-pie', `${v.agentes.length} en el equipo${trabajan ? ` · ${trabajan} trabajando ahora` : ''} · ${v.rechazos} rechazos · ${v.ultimaActividad ? 'último movimiento ' + relativo(v.ultimaActividad) : 'sin movimientos'}`))
    c.append(el('div', 'tip-accion', 'Clic para entrar →'))
    this.app.mostrarTip(c, e.clientX, e.clientY)
  }

  // La cámara vuela hasta el planeta; resuelve cuando ya está cerca.
  acercarA(slug) {
    const p = this.planetas.get(slug)
    if (!p) return Promise.resolve()
    this.siguiendo = p
    this.orbit.ir({ objetivo: p.grupo.position, dist: 7, polar: 0.95, k: 2.4 })
    return new Promise(r => setTimeout(r, 900))
  }
  volver() { this.siguiendo = null; this.orbit.ir({ ...VISTA, objetivo: new THREE.Vector3(), k: 2.2 }) }

  tick(dt) {
    this.tiempo += dt
    const t = this.tiempo
    this.nucleoMat.uniforms.uTiempo.value = t
    this.nucleoFlash = Math.max(0, (this.nucleoFlash ?? 0) - dt * 2)
    this.nucleoMat.uniforms.uBrillo.value = 1 + this.nucleoFlash
    this.aros[0].rotation.z += dt * 0.12; this.aros[1].rotation.z -= dt * 0.08
    for (const p of this.planetas.values()) {
      p.grupo.position.copy(this.posicion(p, t))
      p.mat.uniforms.uTiempo.value = t
      p.brilloExtra = Math.max(0, p.brilloExtra - dt * 2.2)
      const late = p.datos.activo ? 0.5 + 0.5 * Math.sin(t * 3) : 0
      p.mat.uniforms.uBrillo.value = 0.9 + late * 0.5 + p.brilloExtra * 0.6
      p.halo.material.opacity = (p.datos.estado === 'pausa' ? 0.25 : 0.5) + late * 0.3 + p.brilloExtra * 0.15
      p.halo.scale.setScalar(p.tam * 6 + late * 2 + p.brilloExtra * 2)
      p.aro.material.opacity = p.aroVisible ? (p.datos.estado === 'trabado' ? 0.55 + 0.35 * Math.sin(t * 4) : 0.35) : 0
      p.aro.rotation.z += dt * 0.4
      for (const l of p.lunas) {
        const a = l.fase + t * l.vel
        l.obj.position.set(Math.cos(a) * l.r, Math.sin(a) * l.r * l.inc, Math.sin(a) * l.r)
      }
      // Un video con actividad manda partículas al centro de vez en cuando.
      if (p.datos.activo) {
        p.ritmo -= dt
        if (p.ritmo <= 0) { p.ritmo = 1.4 + Math.random(); this.particulas.lanzar(arco(p.grupo.position, new THREE.Vector3(), 7), { color: ESTADOS[p.datos.estado]?.color ?? '#60A5FA', velocidad: 0.38, estela: 8 }) }
      }
    }
    if (this.siguiendo) this.orbit.ir({ objetivo: this.siguiendo.grupo.position, k: this.orbit.k })
    // Con el panel de actividad abierto a la izquierda, la escena se corre a la derecha.
    const w = window.innerWidth, h = window.innerHeight
    const dx = this.app.desplazarEscena?.() ?? 0
    if (dx) this.camara.setViewOffset(w, h, -dx, 0, w, h); else this.camara.clearViewOffset()
    this.orbit.tick(dt)
    this.particulas.tick(dt)
  }
}
export { suave }
