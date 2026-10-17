// La oficina de un video: el director en el centro, cada agente en su puesto dentro de su zona,
// líneas director↔agente por donde viajan los mensajes como partículas y globitos con lo que se dijo.
import * as THREE from 'three'
import { brillo, estrellas, nebulosa, Particulas, Orbitador, Etiquetas, arco, rotuloPlano, suave } from './escena.js'
import { el, recortar, relativo, ROJO, VERDE } from './util.js'

const RAD = Math.PI / 180
const RADIO_PISO = 21, RADIO_PUESTO = 13.5
// Zonas: ángulo del centro en el piso (90° = fondo, 270° = frente, hacia la cámara).
const ZONAS = {
  escritura: { centro: 140, ancho: 72, nombre: 'ESCRITURA', color: '#E879F9' },
  revision: { centro: 40, ancho: 72, nombre: 'REVISIÓN', color: '#A78BFA' },
  edicion: { centro: 222, ancho: 56, nombre: 'EDICIÓN', color: '#FB923C' },
  control: { centro: 318, ancho: 72, nombre: 'CONTROL DE CALIDAD', color: '#A3E635' },
  apoyo: { centro: 268, ancho: 26, nombre: 'APOYO', color: '#94A3B8' },
}
const enPiso = (grados, r, y = 0) => new THREE.Vector3(Math.cos(grados * RAD) * r, y, -Math.sin(grados * RAD) * r)
const VISTA = { azim: 0, polar: 0.86 }
const clave = x => `${x.ts}|${x.tipo}|${x.de}|${x.a}|${x.archivo ?? ''}`

export class Oficina {
  constructor(app) {
    this.app = app
    this.escena = new THREE.Scene()
    this.escena.fog = new THREE.FogExp2('#05080F', 0.006)
    this.camara = new THREE.PerspectiveCamera(42, 1, 0.1, 3000)
    this.orbit = new Orbitador(this.camara, app.lienzo, { distIni: 90, polarIni: 0.45, dist: [16, 85], polar: [0.3, 1.33], giroAuto: 0 })
    this.etiquetas = new Etiquetas(app.capaEtiquetas)
    this.particulas = new Particulas(this.escena, { tam: 0.62 })
    this.tiempo = 0; this.puestos = new Map(); this.burbujas = []; this.vistos = new Set()
    this.desplazamiento = 0; this.desplazamientoMeta = 0
    this.armarFijos()
  }

  armarFijos() {
    this.escena.add(estrellas(1800, 250, 700), nebulosa())
    this.escena.add(new THREE.HemisphereLight('#A5C8FF', '#0B101D', 1.1))
    const sol = new THREE.DirectionalLight('#FFFFFF', 1.6); sol.position.set(12, 26, 18); this.escena.add(sol)
    const contra = new THREE.DirectionalLight('#7C3AED', 0.8); contra.position.set(-18, 10, -20); this.escena.add(contra)

    // Piso: grilla polar que se desvanece, borde luminoso y una onda que sale del centro.
    this.pisoMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color('#60A5FA') }, uTiempo: { value: 0 }, uR: { value: RADIO_PISO } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        uniform vec3 uColor; uniform float uTiempo; uniform float uR; varying vec2 vP;
        void main(){
          float r = length(vP); float a = atan(vP.y, vP.x);
          float fr = fract(r / 2.5); float dr = min(fr, 1.0 - fr) * 2.5;
          float s = 6.2831853 / 36.0; float fa = fract(a / s); float da = min(fa, 1.0 - fa) * s * r;
          float grilla = max(1.0 - smoothstep(0.0, 0.05, dr), (1.0 - smoothstep(0.0, 0.04, da)) * step(4.0, r));
          float vin = 1.0 - smoothstep(uR * 0.55, uR, r);
          float borde = exp(-abs(uR - r) * 2.2);
          float onda = exp(-abs(r - mod(uTiempo * 5.0, uR + 10.0)) * 1.2) * 0.25 * vin;
          vec3 base = vec3(0.025, 0.04, 0.08);
          vec3 col = base + uColor * (grilla * 0.16 * vin + borde * 0.55 + onda);
          float alfa = clamp(0.92 * (1.0 - smoothstep(uR, uR + 0.6, r)) + borde * 0.5, 0.0, 1.0);
          gl_FragColor = vec4(col, alfa);
        }`,
    })
    const piso = new THREE.Mesh(new THREE.CircleGeometry(RADIO_PISO + 1, 128), this.pisoMat)
    piso.rotation.x = -Math.PI / 2; this.escena.add(piso)
    this.canto = new THREE.Mesh(new THREE.CylinderGeometry(RADIO_PISO, RADIO_PISO - 0.4, 1.4, 128, 1, true), new THREE.MeshBasicMaterial({ color: '#1E3A8A', transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }))
    this.canto.position.y = -0.7; this.escena.add(this.canto)

    // Zonas: un sector teñido y el nombre apoyado en el piso.
    for (const z of Object.values(ZONAS)) {
      const sector = new THREE.Mesh(new THREE.RingGeometry(5.5, RADIO_PISO - 0.5, 48, 1, (z.centro - z.ancho / 2) * RAD, z.ancho * RAD), new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.AdditiveBlending }))
      sector.rotation.x = -Math.PI / 2; sector.position.y = 0.01; this.escena.add(sector)
      const rot = rotuloPlano(z.nombre, { color: z.color, alto: 0.75 })
      rot.material.opacity = 0.55; rot.rotation.x = -Math.PI / 2
      rot.position.copy(enPiso(z.centro, RADIO_PISO - 2.3, 0.03)); this.escena.add(rot)
    }

    // Tarima del director.
    const tarima = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.1, 0.5, 64), new THREE.MeshStandardMaterial({ color: '#111A2E', roughness: 0.5, metalness: 0.4 }))
    tarima.position.y = 0.25; this.escena.add(tarima)
    const filo = new THREE.Mesh(new THREE.TorusGeometry(2.72, 0.05, 8, 128), new THREE.MeshBasicMaterial({ color: '#FBBF24', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }))
    filo.rotation.x = Math.PI / 2; filo.position.y = 0.5; this.escena.add(filo)
    const luzDirector = brillo('#FBBF24', 9, 0.18); luzDirector.position.set(0, 0.6, 0); this.escena.add(luzDirector)
  }

  // ---------- Personajes ----------
  personaje(color, escala = 1) {
    const g = new THREE.Group()
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.15, emissive: new THREE.Color(color), emissiveIntensity: 0.18, transparent: true })
    const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.72, 6, 16), mat); cuerpo.position.y = 0.85
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), mat); cabeza.position.y = 1.78
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.1), new THREE.MeshBasicMaterial({ color: '#0B1222' })); visor.position.set(0, 1.8, 0.29)
    g.add(cuerpo, cabeza, visor); g.scale.setScalar(escala)
    return { grupo: g, mat, cuerpo, cabeza }
  }

  armarPuesto(m, angulo, esDirector = false) {
    const pos = esDirector ? new THREE.Vector3(0, 0.5, 0) : enPiso(angulo, RADIO_PUESTO)
    const raiz = new THREE.Group(); raiz.position.copy(pos); this.escena.add(raiz)
    const p = this.personaje(m.color, esDirector ? 1.3 : 1)
    raiz.add(p.grupo)
    // Mira al centro (el director mira hacia la cámara).
    if (!esDirector) raiz.lookAt(0, pos.y, 0)
    // Escritorio con pantalla, entre el agente y el centro.
    let pantalla = null
    if (!esDirector) {
      const mesa = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 0.9), new THREE.MeshStandardMaterial({ color: '#131C30', roughness: 0.6, metalness: 0.3 }))
      mesa.position.set(0, 0.42, 1.25); raiz.add(mesa)
      pantalla = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.72), new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }))
      pantalla.position.set(0, 1.35, 1.35); pantalla.rotation.y = Math.PI; pantalla.rotation.x = -0.12; raiz.add(pantalla)
    }
    const base = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.95, 48), new THREE.MeshBasicMaterial({ color: '#334155', transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }))
    base.rotation.x = -Math.PI / 2; base.position.y = 0.03; raiz.add(base)
    const aura = brillo(m.color, 3.5, 0); aura.position.y = 0.4; raiz.add(aura)
    // Aro que gira sobre la cabeza mientras trabaja.
    const carga = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 6, 40, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }))
    carga.position.y = (esDirector ? 1.3 : 1) * 2.45; carga.rotation.x = Math.PI / 2; raiz.add(carga)
    for (const o of [p.cuerpo, p.cabeza]) o.userData.agente = m.id
    const ancla = new THREE.Vector3(pos.x, esDirector ? 2.9 : 2.2, pos.z)
    return { id: m.id, m, raiz, pers: p, pantalla, base, aura, carga, pos, ancla, director: esDirector, rebote: 0, linea: null, curva: null, ritmo: Math.random() }
  }

  // ---------- Datos → oficina ----------
  mostrar(modelo) {
    this.limpiar()
    this.modelo = modelo
    this.pisoMat.uniforms.uColor.value.set(this.app.colorEstado(modelo.estado))
    this.canto.material.color.set(this.app.colorEstado(modelo.estado))
    const presentes = new Map(modelo.agentes.map(a => [a.id, a]))
    const miembros = modelo.equipo.filter(m => m.id !== 'director' && (!m.opcional || presentes.has(m.id)))
    const porZona = {}
    for (const m of miembros) (porZona[m.zona] ??= []).push(m)
    this.puestos.set('director', this.armarPuesto(modelo.equipo.find(m => m.id === 'director'), 0, true))
    for (const [zona, ms] of Object.entries(porZona)) {
      const z = ZONAS[zona] ?? ZONAS.apoyo
      const paso = Math.min(24, (z.ancho - 14) / Math.max(1, ms.length - 1))
      ms.forEach((m, k) => this.puestos.set(m.id, this.armarPuesto(m, z.centro + (k - (ms.length - 1) / 2) * paso)))
    }
    for (const x of modelo.acciones) this.vistos.add(clave(x))
    this.vestir()
    this.orbit.ir({ objetivo: new THREE.Vector3(0, 1, 0) }); this.orbit.ir({ azim: 0, polar: 0.45, dist: 92 }); this.orbit.saltar()
    this.orbit.ir({ ...VISTA, dist: this.distancia(), k: 1.6 })
    // Repaso: los últimos mensajes vuelven a viajar para que se vea cómo fue la conversación.
    modelo.acciones.slice(-6).forEach((x, i) => setTimeout(() => { if (this.modelo === modelo) this.animar(x, { corta: true }) }, 900 + i * 650))
  }

  // Mismo video, datos nuevos: se animan solo las acciones que no se habían visto.
  actualizar(modelo) {
    if (!this.modelo || modelo.slug !== this.modelo.slug) return this.mostrar(modelo)
    const nuevas = modelo.acciones.filter(x => !this.vistos.has(clave(x)))
    const faltan = modelo.equipo.some(m => m.opcional && modelo.agentes.some(a => a.id === m.id) && !this.puestos.has(m.id))
    if (faltan) { this.mostrar(modelo); return }
    this.modelo = modelo
    this.pisoMat.uniforms.uColor.value.set(this.app.colorEstado(modelo.estado))
    for (const x of nuevas) this.vistos.add(clave(x))
    this.vestir()
    nuevas.slice(-6).forEach((x, i) => setTimeout(() => this.animar(x), i * 500))
  }

  vestir() {
    const porId = new Map(this.modelo.agentes.map(a => [a.id, a]))
    const cuenta = new Map()
    for (const x of this.modelo.acciones) for (const r of [x.de, x.a]) if (r && r !== 'director') cuenta.set(r, (cuenta.get(r) ?? 0) + 1)
    for (const p of this.puestos.values()) {
      const a = porId.get(p.id)
      p.datos = a ?? null
      const fantasma = !p.director && !a
      p.pers.mat.opacity = fantasma ? 0.22 : 1
      p.pers.mat.emissiveIntensity = fantasma ? 0.02 : 0.18
      if (p.pantalla) p.pantalla.material.opacity = fantasma ? 0.08 : 0.5
      p.trabajando = !!a?.trabajando
      const colorBase = a?.trabajando ? p.m.color : a?.ultimoVeredicto === 'RECHAZADO' ? ROJO : a?.ultimoVeredicto === 'APROBADO' ? VERDE : fantasma ? '#1E293B' : '#475569'
      p.base.material.color.set(p.director ? '#FBBF24' : colorBase)
      // Línea al director, más visible cuanto más hablaron.
      if (!p.director && cuenta.get(p.id)) {
        if (!p.curva) {
          p.curva = arco(this.puestos.get('director').ancla, p.ancla, 3.5)
          p.linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.curva.getPoints(60)), new THREE.LineBasicMaterial({ color: p.m.color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }))
          this.escena.add(p.linea)
        }
        p.linea.material.opacity = Math.min(0.55, 0.14 + cuenta.get(p.id) * 0.035)
      }
      this.rotular(p, a, fantasma)
    }
  }

  rotular(p, a, fantasma) {
    if (!p.etiqueta) {
      const b = el('button', 'etq-agente'); b.type = 'button'
      b.onclick = () => this.app.abrirFicha(p.id)
      p.etiqueta = this.etiquetas.agregar(b, p.raiz, { alto: p.director ? 3.7 : 2.75 })
    }
    const n = p.etiqueta.nodo; n.textContent = ''
    n.style.setProperty('--c', p.m.color)
    n.className = 'etq-agente' + (fantasma ? ' fantasma' : '') + (this.app.agenteAbierto === p.id ? ' elegido' : '')
    n.append(el('span', 'nom', p.m.nombre))
    let estado = fantasma ? 'sin tareas en este video' : 'en espera'
    let cls = 'est'
    if (a?.trabajando) { estado = 'trabajando'; cls += ' trabajando' }
    else if (a?.ultimoVeredicto === 'APROBADO') { estado = 'aprobó'; cls += ' ok' }
    else if (a?.ultimoVeredicto === 'RECHAZADO') { estado = a.rechazosSeguidos > 1 ? `pide cambios · ${a.rechazosSeguidos} veces` : 'pide cambios'; cls += ' mal' }
    else if (a && (a.devoluciones || a.documentos)) estado = 'entregó'
    if (p.director) { estado = 'coordina al equipo'; cls = 'est' }
    n.append(el('span', cls, estado))
    if (a?.ultimoVeredicto === 'RECHAZADO' && a.ultimoMotivo) n.append(el('span', 'motivo', recortar(a.ultimoMotivo, 74)))
    n.setAttribute('aria-label', `${p.m.nombre}: ${estado}. Ver su historial.`)
  }

  // Un mensaje viaja por la línea: del director al agente (encargos) o del agente al director (respuestas).
  animar(x, { corta = false } = {}) {
    const agente = x.de === 'director' ? x.a : x.de
    const p = this.puestos.get(agente), d = this.puestos.get('director')
    if (!p || !d || p === d) return
    const ida = x.de === 'director'
    const curva = ida ? arco(d.ancla, p.ancla, 3.5) : arco(p.ancla, d.ancla, 3.5)
    const color = x.veredicto === 'RECHAZADO' ? ROJO : x.veredicto === 'APROBADO' ? VERDE : ida ? '#E0F2FE' : p.m.color
    const destino = ida ? p : d
    for (let k = 0; k < 4; k++) this.particulas.lanzar(curva, { color, velocidad: 0.6, estela: 9, intensidad: 1.3, retraso: k * 0.16, alLlegar: k === 0 ? () => { destino.rebote = 1 } : null })
    if (!ida) p.rebote = 0.6
    this.burbuja(x, curva.getPoint(0.5), corta ? 3200 : 8000)
    this.app.alAccion?.(x)
  }

  burbuja(x, punto, ms) {
    while (this.burbujas.length >= 2) { const v = this.burbujas.shift(); this.etiquetas.quitar(v.e) }
    const de = this.app.miembro(x.de), a = x.a ? this.app.miembro(x.a) : null
    const rechazo = x.veredicto === 'RECHAZADO', ok = x.veredicto === 'APROBADO'
    const b = el('div', 'burbuja' + (rechazo ? ' rechazo' : ok ? ' aprueba' : ''))
    const cab = el('div', 'cab'); cab.append(el('b', null, de.nombre), document.createTextNode(a ? ' → ' + a.nombre : ''), el('span', 'cuando', relativo(x.ts)))
    b.append(cab)
    if (rechazo) b.append(el('div', 'sello', 'Pidió cambios'))
    if (ok) b.append(el('div', 'sello', 'Aprobó'))
    const texto = rechazo && x.motivos?.length ? x.motivos[0] : x.tipo === 'documento' ? x.titulo : x.resumen
    if (texto) b.append(el('p', null, recortar(texto, 120)))
    const e = this.etiquetas.agregar(b, null, { punto: punto.clone().add(new THREE.Vector3(0, 0.8, 0)) })
    const reg = { e }; this.burbujas.push(reg)
    requestAnimationFrame(() => b.classList.add('visible'))
    setTimeout(() => { b.classList.remove('visible'); setTimeout(() => { this.etiquetas.quitar(e); this.burbujas = this.burbujas.filter(r => r !== reg) }, 400) }, ms)
  }

  // ---------- Interacción ----------
  pickables() { return [...this.puestos.values()].flatMap(p => [p.pers.cuerpo, p.pers.cabeza]) }
  hover(obj) {
    const id = obj?.userData.agente ?? null
    if (id !== this.resaltado) {
      for (const p of this.puestos.values()) p.pers.mat.emissiveIntensity = p.id === id ? 0.6 : (p.datos || p.director ? 0.18 : 0.02)
      this.resaltado = id
    }
    this.app.lienzo.style.cursor = id ? 'pointer' : ''
  }
  clic(obj) { if (obj?.userData.agente) this.app.abrirFicha(obj.userData.agente) }

  enfocar(id) {
    const p = id ? this.puestos.get(id) : null
    this.desplazamientoMeta = p ? 1 : 0
    this.orbit.ir(p ? { objetivo: p.pos.clone().multiplyScalar(0.45).setY(1.2), dist: this.distancia() * 0.8 } : { objetivo: new THREE.Vector3(0, 1, 0), dist: this.distancia() })
    for (const q of this.puestos.values()) if (q.etiqueta) q.etiqueta.nodo.classList.toggle('elegido', q.id === id)
  }

  limpiar() {
    for (const p of this.puestos.values()) { this.escena.remove(p.raiz); if (p.linea) this.escena.remove(p.linea) }
    this.puestos.clear(); this.etiquetas.vaciar(); this.burbujas = []; this.vistos.clear(); this.particulas.vaciar(); this.modelo = null
  }

  // Distancia para que el piso entero entre en pantalla (más lejos en ventanas angostas).
  distancia() {
    const aspecto = (this.ancho ?? 16) / (this.alto ?? 9)
    return Math.min(85, Math.max(50, RADIO_PISO / (Math.tan(21 * RAD) * Math.min(aspecto, 1.9) * 0.62)))
  }

  redimensionar(w, h, panel) {
    this.ancho = w; this.alto = h; this.panel = panel
  }

  tick(dt) {
    this.tiempo += dt; const t = this.tiempo
    this.pisoMat.uniforms.uTiempo.value = t
    for (const p of this.puestos.values()) {
      p.rebote = Math.max(0, p.rebote - dt * 2.5)
      const respira = Math.sin(t * 1.6 + p.ritmo * 6) * 0.02
      const trabaja = p.trabajando ? Math.abs(Math.sin(t * 5 + p.ritmo * 6)) * 0.08 : 0
      p.pers.grupo.position.y = respira + trabaja + p.rebote * 0.35
      p.aura.material.opacity = (p.trabajando ? 0.35 + 0.25 * Math.sin(t * 3) : 0) + p.rebote * 0.6
      p.carga.material.opacity = p.trabajando ? 0.9 : 0
      p.carga.rotation.z -= dt * 4
      if (p.pantalla && p.trabajando) p.pantalla.material.opacity = 0.45 + 0.25 * Math.abs(Math.sin(t * 9 + p.ritmo * 10))
      p.base.scale.setScalar(1 + p.rebote * 0.5)
      // Mientras un agente trabaja, el encargo sigue fluyendo hacia él.
      if (p.trabajando && p.curva) {
        p.ritmo -= dt
        if (p.ritmo <= 0) { p.ritmo = 0.75; this.particulas.lanzar(p.curva, { color: p.m.color, velocidad: 0.45, estela: 6, intensidad: 0.9 }) }
      }
    }
    // La ficha ocupa la derecha: la escena se corre a la izquierda.
    this.desplazamiento += (this.desplazamientoMeta - this.desplazamiento) * suave(dt, 4)
    if (this.ancho) {
      const dx = this.desplazamiento * (this.panel ?? 0) / 2
      if (Math.abs(dx) > 0.5) this.camara.setViewOffset(this.ancho, this.alto, dx, 0, this.ancho, this.alto)
      else this.camara.clearViewOffset()
    }
    this.orbit.tick(dt)
    this.particulas.tick(dt)
  }
}
