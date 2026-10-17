// Lo que la persona puede hacer desde una oficina: mirar el video (final o último borrador), leer lo que el equipo
// le pidió y destrabar un video dejándole una indicación al director (más el texto listo para pegar en su chat).
import { $, el, bonito, recortar, relativo, exacto, md } from './util.js'

const OPCIONES = [
  ['aceptar', 'Aceptalo como está y seguí', 'Aceptá lo que hay y seguí con la siguiente etapa; anotá en el informe lo que quedó abierto.'],
  ['saltar', 'Este bloqueante no es grave', 'Tomá este bloqueante como no grave (B): aplicá lo que puedas sin ronda nueva y seguí.'],
  ['cambiar', 'Hacé este cambio', 'Hacé este cambio y volvé a pasarlo por el crítico:'],
  ['frenar', 'Frená el video y esperame', 'Frená este video hasta que te escriba; no lances más agentes.'],
  ['otra', 'Otra indicación', ''],
]
const mb = b => b >= 1e6 ? Math.round(b / 1e6) + ' MB' : Math.round(b / 1e3) + ' kB'

export function crearAcciones(app) {
  // ---------- Video ----------
  function abrirVideo(modelo, id) {
    const vs = modelo.videos ?? []; if (!vs.length) return
    const d = $('reproductor'), sel = $('rep-version'), vid = $('rep-video')
    $('rep-titulo').textContent = bonito(modelo.slug)
    sel.textContent = ''
    for (const v of vs) {
      const o = el('option', null, `${v.tipo === 'final' ? 'Final' : 'Render'} · ${v.nombre.replace(/\.mp4$/i, '')} · ${mb(v.bytes)} · ${relativo(v.ts)}`)
      o.value = v.id; sel.append(o)
    }
    const poner = vid2 => {
      const v = vs.find(x => x.id === vid2) ?? vs[0]; sel.value = v.id
      vid.src = `/media?slug=${encodeURIComponent(modelo.slug)}&id=${encodeURIComponent(v.id)}`
      $('rep-nota').textContent = v.tipo === 'final' ? `Versión entregada (${exacto(v.ts)}).` : `Todavía no hay versión final: este es un borrador (${exacto(v.ts)}).`
      vid.play().catch(() => {})
    }
    sel.onchange = () => poner(sel.value)
    d.showModal(); poner(id)
  }
  $('rep-cerrar').onclick = () => $('reproductor').close()
  $('reproductor').addEventListener('close', () => { const v = $('rep-video'); v.pause(); v.removeAttribute('src'); v.load() })
  $('reproductor').addEventListener('click', e => { if (e.target === $('reproductor')) $('reproductor').close() })

  // ---------- Pedidos del equipo ----------
  function abrirPedidos(modelo) {
    const p = modelo.pedidos; if (!p) return
    $('dialogo-titulo').textContent = 'Pedidos para vos · ' + bonito(modelo.slug)
    const l = $('lector'); l.innerHTML = md(p.texto)
    const b = el('button', 'boton-primario', 'Responder al director'); b.type = 'button'
    b.onclick = () => { $('dialogo').close(); abrirDestrabar(modelo, { para: 'director', nombre: 'Director', motivo: 'Lo que pidió en pedidos.md' }) }
    const pie = el('div', 'dialogo-pie'); pie.append(b); l.append(pie)
    $('dialogo').showModal()
  }

  // ---------- Destrabar ----------
  function abrirDestrabar(modelo, { para, nombre, motivo }) {
    const d = $('destrabar'), cuerpo = $('des-cuerpo')
    $('des-titulo').textContent = `Destrabar · ${nombre}`
    cuerpo.textContent = ''
    if (motivo) { const m = el('div', 'des-motivo'); m.append(el('span', 'rot', 'Lo que está frenando'), el('p', null, motivo)); cuerpo.append(m) }

    const grupo = el('fieldset', 'des-opciones'); grupo.append(el('legend', null, '¿Qué querés que haga el director?'))
    for (const [k, t] of OPCIONES) {
      const lab = el('label', 'des-opcion'); const r = el('input'); r.type = 'radio'; r.name = 'des-op'; r.value = k
      if (k === 'aceptar') r.checked = true
      lab.append(r, el('span', null, t)); grupo.append(lab)
    }
    const area = el('textarea'); area.id = 'des-texto'; area.rows = 4; area.placeholder = 'Detalle (opcional): qué cambiar, qué priorizar, qué no tocar…'
    const lblArea = el('label', 'des-lbl', 'Detalle'); lblArea.htmlFor = 'des-texto'
    const nota = el('p', 'des-nota')
    const enviar = el('button', 'boton-primario', 'Dejársela al director'); enviar.type = 'button'
    const copiar = el('button', 'boton-sec', 'Copiar para el chat'); copiar.type = 'button'
    const pie = el('div', 'dialogo-pie'); pie.append(copiar, enviar)
    cuerpo.append(grupo, lblArea, area, pie, nota)

    const previas = (modelo.indicaciones ?? []).slice().reverse()
    if (previas.length) {
      const h = el('div', 'des-previas'); h.append(el('span', 'rot', 'Indicaciones que ya dejaste'))
      for (const i of previas.slice(0, 6)) {
        const fila = el('div', 'des-previa' + (i.pendiente ? ' pendiente' : ''))
        fila.append(el('span', 'chip-ind', i.pendiente ? 'Pendiente' : recortar(i.estado, 40)), el('span', null, `${i.fecha} · ${i.nombre}: ${recortar(i.decision || i.texto || '', 110)}`))
        h.append(fila)
      }
      cuerpo.append(h)
    }

    const armar = () => {
      const op = grupo.querySelector('input:checked')?.value ?? 'otra'
      const [, titulo, base] = OPCIONES.find(o => o[0] === op)
      const texto = area.value.trim()
      if ((op === 'cambiar' || op === 'otra') && !texto) return { error: 'Escribí en el detalle qué querés que haga.' }
      return { para, nombre, motivo: motivo ?? null, decision: base ? (op === 'cambiar' ? base.replace(/:$/, '') : base) : titulo, texto: texto || null }
    }
    const paraChat = ind => [
      `Indicación para el video ${modelo.slug}${para && para !== 'director' ? ` (sobre ${nombre.toLowerCase()})` : ''}:`,
      motivo ? `Lo que está frenando: ${motivo}` : null,
      `Decisión: ${ind.decision}`, ind.texto ? `Detalle: ${ind.texto}` : null,
      'También quedó en produccion/indicaciones.md.',
    ].filter(Boolean).join('\n')

    enviar.onclick = async () => {
      const ind = armar(); if (ind.error) { nota.textContent = ind.error; nota.className = 'des-nota mal'; return }
      enviar.disabled = true; nota.className = 'des-nota'; nota.textContent = 'Guardando…'
      try {
        const r = await fetch('/api/indicacion?slug=' + encodeURIComponent(modelo.slug), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ind) })
        if (!r.ok) throw new Error(String(r.status))
        nota.className = 'des-nota ok'
        nota.textContent = 'Listo: quedó en produccion/indicaciones.md. El director la lee antes de la próxima ronda. Si el director no está corriendo, pegale el texto en su chat (botón de la izquierda).'
        app.refrescar?.()
      } catch { nota.className = 'des-nota mal'; nota.textContent = 'No pude guardarla. Probá de nuevo o copiala para el chat.' }
      finally { enviar.disabled = false }
    }
    copiar.onclick = async () => {
      const ind = armar(); if (ind.error) { nota.textContent = ind.error; nota.className = 'des-nota mal'; return }
      const t = paraChat(ind)
      try { await navigator.clipboard.writeText(t) } catch { area.value = t; area.select(); document.execCommand('copy') }
      nota.className = 'des-nota ok'; nota.textContent = 'Copiado. Pegalo en el chat de la sesión del director.'
    }
    d.showModal()
  }
  $('des-cerrar').onclick = () => $('destrabar').close()
  $('destrabar').addEventListener('click', e => { if (e.target === $('destrabar')) $('destrabar').close() })

  // ---------- Botones de la oficina ----------
  function pintarBotones(modelo, caja) {
    caja.textContent = ''
    const vs = modelo.videos ?? []
    if (vs.length) {
      const final = vs.find(v => v.tipo === 'final')
      const b = el('button', 'accion' + (final ? ' destacada' : ''), final ? '▶ Ver el video' : '▶ Ver el último borrador'); b.type = 'button'
      b.title = final ? 'Versión entregada' : 'Todavía no hay versión final'
      b.onclick = () => abrirVideo(modelo); caja.append(b)
    }
    if (modelo.pedidos) {
      const b = el('button', 'accion aviso', `📋 Pedidos para vos${modelo.pedidos.items ? ` (${modelo.pedidos.items})` : ''} · ${relativo(modelo.pedidos.ts)}`); b.type = 'button'
      b.onclick = () => abrirPedidos(modelo); caja.append(b)
    }
    const pend = (modelo.indicaciones ?? []).filter(i => i.pendiente).length
    if (pend) { const s = el('span', 'accion quieta', `⏳ ${pend} ${pend === 1 ? 'indicación tuya pendiente' : 'indicaciones tuyas pendientes'}`); s.title = 'El director todavía no las marcó como aplicadas'; caja.append(s) }
    const b = el('button', 'accion', '✋ Destrabar'); b.type = 'button'
    b.title = 'Dejale una indicación al director'
    b.onclick = () => abrirDestrabar(modelo, modelo.motivo ? { para: modelo.motivo.agente, nombre: modelo.motivo.nombre, motivo: modelo.motivo.motivo } : { para: 'director', nombre: 'Director' })
    caja.append(b)
  }

  return { abrirVideo, abrirPedidos, abrirDestrabar, pintarBotones }
}
