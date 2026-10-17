// Ficha de un agente: todo lo que recibió, devolvió y rechazó, de lo más nuevo a lo más viejo, y por qué.
import { el, recortar, tiempo, fmtTokens, inicial, ROJO, VERDE } from './util.js'

const FILTROS = [['todo', 'Todo'], ['recibio', 'Recibió'], ['devolvio', 'Devolvió'], ['rechazos', 'Rechazos']]

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
      } else if (a.ultimoVeredicto === 'APROBADO') ahora.append(el('span', 'est ok', 'Aprobó lo último que revisó'))
      else ahora.append(el('span', 'est', a.ultimaActividad ? 'Último movimiento ' : 'Sin movimientos'), a.ultimaActividad ? tiempo(a.ultimaActividad) : '')
      r.append(ahora)
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
    const acs = this.acciones().filter(x => this.pasa(x)).reverse()
    if (!acs.length) lista.append(el('p', 'ficha-vacia', 'Nada para mostrar con este filtro.'))
    for (const x of acs) lista.append(this.tarjeta(x))
    r.append(lista)
    lista.scrollTop = scroll
  }

  pasa(x) {
    const id = this.id
    if (this.filtro === 'recibio') return x.a === id
    if (this.filtro === 'devolvio') return x.de === id
    if (this.filtro === 'rechazos') return x.de === id && x.veredicto === 'RECHAZADO'
    return true
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
