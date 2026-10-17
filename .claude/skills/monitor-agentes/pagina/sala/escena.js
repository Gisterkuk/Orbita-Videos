// Piezas 3D compartidas por la constelación y la oficina: brillos, partículas que viajan por curvas,
// cámara orbital con suavizado, etiquetas HTML pegadas a objetos 3D y el fondo de estrellas.
import * as THREE from 'three'

export const suave = (dt, k) => 1 - Math.exp(-dt * k)       // factor de acercamiento independiente de los FPS

// ---------- Texturas ----------
const cacheTex = new Map()
// Disco difuso blanco (se tiñe con el color del material): brillos, halos y partículas.
export function texturaBrillo(dureza = 0) {
  if (cacheTex.has(dureza)) return cacheTex.get(dureza)
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.18 + dureza * 0.4, 'rgba(255,255,255,' + (0.55 + dureza * 0.4) + ')')
  gr.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  cacheTex.set(dureza, t); return t
}

export function brillo(color, tam, opacidad = 1, dureza = 0) {
  const m = new THREE.SpriteMaterial({ map: texturaBrillo(dureza), color: new THREE.Color(color), transparent: true, opacity: opacidad, blending: THREE.AdditiveBlending, depthWrite: false })
  const s = new THREE.Sprite(m); s.scale.setScalar(tam); return s
}

// Texto pintado en un plano (para rótulos apoyados en el piso).
export function rotuloPlano(texto, { color = '#7E89A6', alto = 1, peso = 700, espaciado = 0.28 } = {}) {
  const c = document.createElement('canvas'); const g = c.getContext('2d')
  const px = 64; const fuente = `${peso} ${px}px Geist, Inter, system-ui, sans-serif`
  g.font = fuente
  const letras = texto.split('')
  const ancho = letras.reduce((s, l) => s + g.measureText(l).width + px * espaciado, 0)
  c.width = Math.ceil(ancho + px); c.height = Math.ceil(px * 1.5)
  g.font = fuente; g.fillStyle = color; g.textBaseline = 'middle'
  let x = px / 2; for (const l of letras) { g.fillText(l, x, c.height / 2); x += g.measureText(l).width + px * espaciado }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.9 })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(alto * c.width / c.height, alto), m)
  return mesh
}

// ---------- Fondo ----------
export function estrellas(cantidad = 2600, rMin = 300, rMax = 900) {
  const pos = new Float32Array(cantidad * 3), col = new Float32Array(cantidad * 3)
  const paleta = [new THREE.Color('#E8EDF7'), new THREE.Color('#93C5FD'), new THREE.Color('#C4B5FD'), new THREE.Color('#FDE68A')]
  for (let i = 0; i < cantidad; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin)
    const s = Math.sqrt(1 - u * u)
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3)
    const c = paleta[Math.random() < 0.8 ? 0 : 1 + Math.floor(Math.random() * 3)].clone().multiplyScalar(0.35 + Math.random() * 0.65)
    col.set([c.r, c.g, c.b], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const m = new THREE.PointsMaterial({ size: 2.2, map: texturaBrillo(0.6), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })
  return new THREE.Points(g, m)
}

// Nubes de color muy tenues detrás de todo.
export function nebulosa() {
  const g = new THREE.Group()
  for (const [c, x, y, z, s, o] of [['#1D4ED8', -260, 60, -420, 520, 0.16], ['#7C3AED', 300, -40, -380, 460, 0.12], ['#0EA5E9', 60, 160, -520, 600, 0.08], ['#BE185D', -380, -120, -200, 380, 0.06]]) {
    const b = brillo(c, s, o); b.position.set(x, y, z); g.add(b)
  }
  return g
}

// ---------- Partículas que viajan por una curva, con estela ----------
const PASO_ESTELA = 0.022
export class Particulas {
  constructor(escena, { max = 1400, tam = 0.55 } = {}) {
    this.max = max; this.viajes = []
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3)
    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setDrawRange(0, 0)
    this.mat = new THREE.PointsMaterial({ size: tam, map: texturaBrillo(0.5), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })
    this.puntos = new THREE.Points(this.geo, this.mat); this.puntos.frustumCulled = false
    escena.add(this.puntos)
    this.tmp = new THREE.Vector3()
  }
  // curva: cualquier THREE.Curve. velocidad: fracción de la curva por segundo. alLlegar: se llama al tocar el final.
  lanzar(curva, { color = '#FFFFFF', velocidad = 0.55, estela = 7, intensidad = 1, retraso = 0, alLlegar = null } = {}) {
    if (this.viajes.length > 220) this.viajes.shift()
    this.viajes.push({ curva, t: -retraso * velocidad, v: velocidad, color: new THREE.Color(color).multiplyScalar(intensidad), estela, alLlegar, llego: false })
  }
  tick(dt) {
    let n = 0
    const vivos = []
    for (const p of this.viajes) {
      p.t += p.v * dt
      if (!p.llego && p.t >= 1) { p.llego = true; p.alLlegar?.() }
      if (p.t - p.estela * PASO_ESTELA > 1) continue
      vivos.push(p)
      for (let k = 0; k <= p.estela && n < this.max; k++) {
        const tt = p.t - k * PASO_ESTELA
        if (tt < 0 || tt > 1) continue
        p.curva.getPoint(tt, this.tmp)
        const f = Math.pow(1 - k / (p.estela + 1), 1.6)
        this.pos[n * 3] = this.tmp.x; this.pos[n * 3 + 1] = this.tmp.y; this.pos[n * 3 + 2] = this.tmp.z
        this.col[n * 3] = p.color.r * f; this.col[n * 3 + 1] = p.color.g * f; this.col[n * 3 + 2] = p.color.b * f
        n++
      }
    }
    this.viajes = vivos
    this.geo.setDrawRange(0, n)
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true
  }
  vaciar() { this.viajes = []; this.geo.setDrawRange(0, 0) }
}

// Arco entre dos puntos, levantado en el medio (para que las líneas no se crucen por el piso).
export function arco(a, b, altura) {
  const medio = a.clone().lerp(b, 0.5); medio.y += altura ?? a.distanceTo(b) * 0.35
  return new THREE.QuadraticBezierCurve3(a.clone(), medio, b.clone())
}

// ---------- Cámara orbital con suavizado ----------
export class Orbitador {
  constructor(camara, dom, op = {}) {
    this.camara = camara; this.dom = dom; this.activo = false
    this.lim = { dist: op.dist ?? [10, 200], polar: op.polar ?? [0.15, 1.45] }
    this.meta = { azim: op.azim ?? 0, polar: op.polarIni ?? 0.95, dist: op.distIni ?? 80, objetivo: (op.objetivo ?? new THREE.Vector3()).clone() }
    this.ahora = { ...this.meta, objetivo: this.meta.objetivo.clone() }
    this.giroAuto = op.giroAuto ?? 0; this.quieto = 0; this.k = 3.2
    this.arrastre = null
    dom.addEventListener('pointerdown', e => { if (!this.activo || e.button !== 0) return; this.arrastre = { x: e.clientX, y: e.clientY, movido: 0 }; this.quieto = 0 })
    window.addEventListener('pointermove', e => {
      if (!this.activo || !this.arrastre) return
      const dx = e.clientX - this.arrastre.x, dy = e.clientY - this.arrastre.y
      this.arrastre.x = e.clientX; this.arrastre.y = e.clientY; this.arrastre.movido += Math.abs(dx) + Math.abs(dy)
      this.meta.azim -= dx * 0.0055; this.meta.polar = clamp(this.meta.polar - dy * 0.0045, ...this.lim.polar); this.quieto = 0
    })
    window.addEventListener('pointerup', () => { this.ultimoMovido = this.arrastre?.movido ?? 0; this.arrastre = null })
    dom.addEventListener('wheel', e => {
      if (!this.activo) return
      e.preventDefault(); this.quieto = 0
      this.meta.dist = clamp(this.meta.dist * Math.pow(1.0015, e.deltaY), ...this.lim.dist)
    }, { passive: false })
  }
  fueArrastre() { return (this.ultimoMovido ?? 0) > 5 }
  ir({ azim, polar, dist, objetivo, k } = {}) {
    if (azim != null) this.meta.azim = azim
    if (polar != null) this.meta.polar = polar
    if (dist != null) this.meta.dist = dist
    if (objetivo) this.meta.objetivo.copy(objetivo)
    this.k = k ?? 3.2; this.quieto = 0
  }
  saltar() { Object.assign(this.ahora, { azim: this.meta.azim, polar: this.meta.polar, dist: this.meta.dist }); this.ahora.objetivo.copy(this.meta.objetivo) }
  tick(dt) {
    this.quieto += dt
    if (this.giroAuto && this.quieto > 5 && !this.arrastre) this.meta.azim += this.giroAuto * dt
    const f = suave(dt, this.k)
    this.ahora.azim += (this.meta.azim - this.ahora.azim) * f
    this.ahora.polar += (this.meta.polar - this.ahora.polar) * f
    this.ahora.dist += (this.meta.dist - this.ahora.dist) * f
    this.ahora.objetivo.lerp(this.meta.objetivo, f)
    const { azim, polar, dist, objetivo } = this.ahora
    this.camara.position.set(objetivo.x + dist * Math.sin(polar) * Math.sin(azim), objetivo.y + dist * Math.cos(polar), objetivo.z + dist * Math.sin(polar) * Math.cos(azim))
    this.camara.lookAt(objetivo)
  }
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// ---------- Etiquetas HTML pegadas a objetos 3D ----------
export class Etiquetas {
  constructor(capa) { this.capa = capa; this.lista = []; this.v = new THREE.Vector3() }
  agregar(nodo, objeto, { alto = 0, punto = null } = {}) {
    const e = { nodo, objeto, alto, punto }; this.capa.appendChild(nodo); this.lista.push(e); return e
  }
  quitar(e) { e.nodo.remove(); this.lista = this.lista.filter(x => x !== e) }
  vaciar() { for (const e of this.lista) e.nodo.remove(); this.lista = [] }
  tick(camara, ancho, alto) {
    for (const e of this.lista) {
      if (e.punto) this.v.copy(e.punto); else e.objeto.getWorldPosition(this.v)
      this.v.y += e.alto
      this.v.project(camara)
      const visible = this.v.z < 1 && Math.abs(this.v.x) < 1.2 && Math.abs(this.v.y) < 1.2
      e.nodo.style.display = visible ? '' : 'none'
      if (!visible) continue
      const x = (this.v.x + 1) / 2 * ancho, y = (1 - this.v.y) / 2 * alto
      e.nodo.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      e.nodo.style.zIndex = String(1000 - Math.round(this.v.z * 1000))
    }
  }
}

// ---------- Material de planeta: bandas suaves + borde luminoso (fresnel) ----------
export function materialPlaneta(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTiempo: { value: 0 }, uBrillo: { value: 1 }, uSemilla: { value: Math.random() * 10 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTiempo; uniform float uBrillo; uniform float uSemilla;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        vec3 p = normalize(vP);
        float bandas = sin(p.y * 9.0 + sin(p.x * 4.0 + uTiempo * 0.25 + uSemilla) * 1.4 + uSemilla) * 0.5 + 0.5;
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.4);
        float luz = clamp(dot(vN, normalize(vec3(-0.4, 0.6, 0.7))) * 0.5 + 0.5, 0.0, 1.0);
        vec3 base = mix(vec3(0.02, 0.035, 0.08), uColor * 0.42, bandas * 0.55 + 0.1) * (0.35 + luz * 0.75);
        vec3 col = base + uColor * fres * 1.35 * uBrillo;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
}
