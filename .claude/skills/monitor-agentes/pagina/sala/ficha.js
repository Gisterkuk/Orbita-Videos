// Ficha de un agente: sus vueltas de un vistazo y cada ida y vuelta con el director (qué le pidió → qué respondió),
// de la más nueva a la más vieja, con el porqué de cada rechazo.
import { el, recortar, tiempo, fmtTokens, inicial, ROJO, VERDE } from './util.js'

const FILTROS = [['todo', 'Todo'], ['rechazos', 'Solo rechazos']]

export class Ficha {
  constructor(app, raiz) {
    this.app = app; this.raiz = raiz; this.filtro = 'todo'; this.id = null; this.modelo = null
  }

  abrir(modelo, id) {
    if (this.id !== id) this.filtro = 'todo'
    this.id = id; this.modelo = modelo
    this.pintar(true)
    this.raiz.hidden = false
    requestAnimationFrame(() => this.raiz.classList.add('abierta'))
  }
  actualizar(modelo) { if (this.id) { this.modelo = modelo; this.pintar(false) } }
  cerrar() { this.id = null; this.raiz.classList.remove('abierta'); setTimeout(() => { if (!this.id) this.raiz.hidden = true }, 350) }

  acciones() {
    const id = this.id
    return this.modelo.acciones.filter(x => id === 'director' ? x.de === 'director' : (x.de === id || x.a === id))
  }

  pintar(arriba) {
    const scroll = arriba ? 0 : (this.raiz.querySelector('.lista')?.scrollTop ?? 0)
    const m = this.app.miembro(this.id)
    const a = this.modelo.agentes.find(x => x.id === this.id)
    const r = this.raiz; r.textContent = ''
    r.style.setProperty('--c', m.color)

    const cab = el('div', 'ficha-cab')
    const av = el('div', 'avatar', inicial(m.nombre))
    const tit = el('div', 'ficha-tit'); tit.append(el('h2', null, m.nombre), el('p', null, m.rol))
    const cerrar = el('button', 'cerrar', '×'); cerrar.type = 'button'; cerrar.setAttribute('aria-label', 'Cerrar la ficha'); cerrar.onclick = () => this.app.cerrarFicha()
    cab.append(av, tit, cerrar); r.append(cab)

    if (a) {
      const cifras = el('div', 'ficha-cifras')
      const cifra = (n, t, cls) => { const d = el('div', 'cifra' + (cls ? ' ' + cls : '')); d.append(el('b', null, String(n)), el('span', null, t)); cifras.append(d) }
      if (this.id === 'director') cifra(this.acciones().filter(x => x.tipo !== 'documento').length, 'mensajes enviados')
      else if (a.tareas) cifra(a.tareas, a.tareas === 1 ? 'tarea recibida' : 'tareas recibidas')
      if (a.veredictos.length) { cifra(a.rechazos, a.rechazos === 1 ? 'rechazo' : 'rechazos', a.rechazos ? 'mal' : ''); cifra(a.aprobaciones, a.aprobaciones === 1 ? 'aprobación' : 'aprobaciones', a.aprobaciones ? 'ok' : '') }
      else cifra(a.devoluciones + a.documentos, 'entregas')
      if (a.tokens) cifra(fmtTokens(a.tokens), 'tokens medidos')
      r.append(cifras)

      // Lo que pasa hoy con este agente, en una frase.
      const ahora = el('div', 'ficha-ahora')
      if (a.trabajando) ahora.append(el('span', 'est trabajando', 'Trabajando ahora'), document.createTextNode(' · le llegó una tarea '), tiempo(a.ultimoEncargo))
      else if (a.ultimoVeredicto === 'RECHAZADO') {
        ahora.classList.add('mal')
        ahora.append(el('span', 'est mal', a.rechazosSeguidos > 1 ? `Pide cambios (${a.rechazosSeguidos} veces seguidas)` : 'Pide cambios'))
        if (a.ultimoMotivo) ahora.append(el('p', null, a.ultimoMotivo))
        const d = el('button', 'boton-primario chico', '✋ Destrabar'); d.type = 'button'; d.onclick = () => this.app.destrabar(this.id)
        const pie = el('div', 'ahora-pie'); pie.append(d, el('span', null, 'Dejale una indicación al director sobre este rechazo.')); ahora.append(pie)
      } else if (a.ultimoVeredicto === 'APROBADO') ahora.append(el('span', 'est ok', 'Aprobó lo último que revisó'))
      else ahora.append(el('span', 'est', a.ultimaActividad ? 'Último movimiento ' : 'Sin movimientos'), a.ultimaActividad ? tiempo(a.ultimaActividad) : '')
      r.append(ahora)
      if (a.veredictos.length) r.append(this.tiraVueltas(a))
    } else {
      r.append(el('p', 'ficha-vacia', 'Este integrante todavía no tuvo tareas en este video.'))
      return
    }

    const fil = el('div', 'ficha-filtros'); fil.setAttribute('role', 'group'); fil.setAttribute('aria-label', 'Filtrar el historial')
    for (const [k, t] of FILTROS) {
      if (this.id === 'director' && k !== 'todo') continue
      const b = el('button', 'pildora', t); b.type = 'button'; b.setAttribute('aria-pressed', String(this.filtro === k))
      b.onclick = () => { this.filtro = k; this.pintar(true) }; fil.append(b)
    }
    r.append(fil)

    const lista = el('div', 'lista')
    const hilos = this.hilos()
    const ver = hilos.map((h, i) => ({ h, n: i + 1 })).filter(({ h }) => this.filtro !== 'rechazos' || h.respuestas.some(x => x.veredicto === 'RECHAZADO')).reverse()
    if (!ver.length) lista.append(el('p', 'ficha-vacia', 'Nada para mostrar con este filtro.'))
    for (const { h, n } of ver) lista.append(this.hilo(h, n, a))
    r.append(lista)
    this.lista = lista
    lista.scrollTop = scroll
  }

  // Ida y vuelta: cada pedido que recibió, con lo que devolvió después (hasta el pedido siguiente).
  hilos() {
    const id = this.id, out = []
    let actual = null
    for (const x of this.acciones()) {
      if (id === 'director') { out.push({ pedido: null, respuestas: [x] }); continue }
      if (x.a === id && x.de !== id) { actual = { pedido: x, respuestas: [] }; out.push(actual); continue }
      // Sin pedido registrado (videos sin hook), cada veredicto nuevo abre su propia vuelta.
      if (!actual || (x.veredicto && actual.respuestas.some(r => r.veredicto))) { actual = { pedido: null, respuestas: [] }; out.push(actual) }
      actual.respuestas.push(x)
    }
    return out
  }

  hilo(h, n, a) {
    const rechazo = h.respuestas.some(x => x.veredicto === 'RECHAZADO')
    const ok = !rechazo && h.respuestas.some(x => x.veredicto === 'APROBADO')
    const c = el('section', 'hilo' + (rechazo ? ' mal' : ok ? ' ok' : ''))
    c.dataset.vuelta = String(n)
    for (const x of h.respuestas) if (x.veredicto) c.dataset['v' + x.id] = '1'
    const cab = el('div', 'hilo-cab')
    const enCurso = !h.respuestas.length && h.pedido && a?.trabajando && h.pedido.ts === a.ultimoEncargo
    const resumen = rechazo ? 'Pidió cambios' : ok ? 'Aprobó' : h.respuestas.length ? 'Entregó' : enCurso ? 'Trabajando…' : 'Sin respuesta registrada'
    cab.append(el('b', null, this.id === 'director' ? 'Movimiento' : `Vuelta ${n}`), el('span', 'hilo-est', resumen), tiempo((h.pedido ?? h.respuestas[0]).ts))
    c.append(cab)
    if (h.pedido) {
      const p = el('div', 'pedido')
      const de = this.app.miembro(h.pedido.de).nombre
      p.append(el('span', 'rot', h.pedido.tipo === 'encargo' ? `${de} le encargó` : `${de} le escribió`))
      if (h.pedido.titulo) p.append(el('h3', null, h.pedido.titulo))
      if (h.pedido.resumen) p.append(el('p', 'dicho', recortar(h.pedido.resumen, 260)))
      if (h.pedido.texto) { const d = el('details', 'completo'); d.append(el('summary', null, 'Ver el pedido completo'), el('pre', null, h.pedido.texto)); p.append(d) }
      c.append(p)
    }
    for (const x of h.respuestas) c.append(this.tarjeta(x))
    return c
  }

  // Tira con cada veredicto: ✗ rechazó, ✓ aprobó. Clic → va a esa vuelta.
  tiraVueltas(a) {
    const t = el('div', 'tira'); t.append(el('span', 'rot', 'Sus veredictos'))
    const fila = el('div', 'tira-fila')
    a.veredictos.forEach((v, i) => {
      const b = el('button', 'tira-v ' + (v.veredicto === 'APROBADO' ? 'ok' : 'mal'), `${i + 1} ${v.veredicto === 'APROBADO' ? '✓' : '✗'}`); b.type = 'button'
      b.title = (v.veredicto === 'APROBADO' ? 'Aprobó' : 'Pidió cambios') + (v.motivos?.[0] ? ': ' + v.motivos[0] : '')
      b.onclick = () => { this.filtro = 'todo'; this.pintar(true); const h = this.lista?.querySelector(`[data-v${v.id}]`); if (h) { h.scrollIntoView({ behavior: 'smooth', block: 'start' }); h.classList.add('destello'); setTimeout(() => h.classList.remove('destello'), 1600) } }
      fila.append(b)
      if (i < a.veredictos.length - 1) fila.append(el('span', 'tira-sep', '→'))
    })
    t.append(fila)
    return t
  }

  tarjeta(x) {
    const id = this.id
    const recibe = x.a === id && x.de !== id
    const rechazo = x.veredicto === 'RECHAZADO', ok = x.veredicto === 'APROBADO'
    const t = el('article', 'item' + (rechazo ? ' mal' : ok ? ' ok' : recibe ? ' recibe' : ''))
    const otro = this.app.miembro(recibe ? x.de : x.a ?? 'director')
    let tipo
    if (recibe) tipo = x.tipo === 'encargo' ? `Recibió una tarea de ${otro.nombre.toLowerCase()}` : `Recibió un mensaje de ${otro.nombre.toLowerCase()}`
    else if (id === 'director') tipo = x.tipo === 'documento' ? 'Escribió' : `Le ${x.tipo === 'encargo' ? 'encargó una tarea' : 'escribió'} a ${otro.nombre}`
    else if (rechazo) tipo = 'Pidió cambios'
    else if (ok) tipo = 'Aprobó'
    else tipo = x.tipo === 'documento' ? 'Escribió' : 'Le respondió al director'
    const fila = el('div', 'fila'); fila.append(el('span', 'tipo', tipo), tiempo(x.ts)); t.append(fila)
    if (x.titulo) t.append(el('h3', null, x.titulo))

    if (rechazo) {
      const por = el('div', 'por-que'); por.append(el('span', 'rot', 'Por qué'))
      if (x.motivos?.length) { const ul = el('ul'); x.motivos.forEach(mo => ul.append(el('li', null, mo))); por.append(ul) }
      else if (x.bloqueantes?.length) por.append(el('p', null, 'Citó los bloqueantes ' + x.bloqueantes.join(', ') + '. El detalle está en el texto completo.'))
      else por.append(el('p', null, recortar(x.resumen, 260) || 'Mirá el texto completo para ver el detalle.'))
      t.append(por)
      const despues = this.despues(x)
      if (despues) t.append(el('p', 'despues', despues))
    } else if (x.resumen) t.append(el('p', 'dicho', recortar(x.resumen, 320)))

    const pie = el('div', 'pie')
    if (x.tokens) pie.append(el('span', 'chip', `Usó ${fmtTokens(x.tokens)} tokens`))
    if (x.archivo) { const b = el('button', 'enlace', 'Abrir documento'); b.type = 'button'; b.onclick = () => this.app.abrirDocumento(x.archivo, x.titulo); pie.append(b) }
    if (x.texto && !x.archivo) { const d = el('details', 'completo'); d.append(el('summary', null, 'Ver el mensaje completo'), el('pre', null, x.texto)); pie.append(d) }
    if (pie.childNodes.length) t.append(pie)
    return t
  }

  // Qué pasó después de un rechazo: a quién se lo pasó el director y cómo terminó la vuelta siguiente.
  despues(x) {
    const acs = this.modelo.acciones
    const i = acs.findIndex(y => y.id === x.id)
    const partes = []
    const pase = acs.slice(i + 1).find(y => y.de === 'director' && (y.tipo === 'encargo' || y.tipo === 'mensaje') && y.a !== x.de)
    if (pase) partes.push(`Después, el director le ${pase.tipo === 'encargo' ? 'encargó la corrección' : 'escribió'} a ${this.app.miembro(pase.a).nombre.toLowerCase()}.`)
    const a = this.modelo.agentes.find(y => y.id === x.de)
    const k = a?.veredictos.findIndex(v => v.id === x.id) ?? -1
    const sig = k >= 0 ? a.veredictos[k + 1] : null
    if (sig) partes.push(sig.veredicto === 'APROBADO' ? 'En la vuelta siguiente aprobó.' : 'En la vuelta siguiente volvió a pedir cambios.')
    else if (k >= 0) partes.push('Todavía no hubo otra vuelta.')
    return partes.join(' ')
  }
}
export { ROJO, VERDE }
