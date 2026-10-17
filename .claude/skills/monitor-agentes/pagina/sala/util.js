// Utilidades de la sala: DOM, tiempos, textos y un lector de markdown chico (el mismo de la vista clásica).

export const $ = id => document.getElementById(id)
export const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n }

export const bonito = slug => { const t = String(slug ?? '').replace(/[-_]+/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1) }
export const recortar = (t, max) => { const x = String(t ?? '').replace(/\s+/g, ' ').trim(); return x.length > max ? x.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : x }
export const inicial = n => (n || '?').trim().charAt(0).toUpperCase()
export const fmtTokens = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' mil' : String(n)

export const relativo = iso => {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 45) return 'recién'
  if (s < 3600) return `hace ${Math.round(s / 60)} min`
  if (s < 86400) { const h = Math.round(s / 3600); return `hace ${h} ${h === 1 ? 'hora' : 'horas'}` }
  const d = Math.round(s / 86400); return `hace ${d} ${d === 1 ? 'día' : 'días'}`
}
export const exacto = iso => iso ? new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''
// Un <span> con "hace X min" que se renueva solo (ver renovarTiempos).
export const tiempo = iso => { const s = el('span', 'cuando', relativo(iso)); s.dataset.ts = iso ?? ''; s.title = exacto(iso); return s }
export const renovarTiempos = () => document.querySelectorAll('[data-ts]').forEach(n => { if (n.dataset.ts) n.textContent = relativo(n.dataset.ts) })

export const ESTADOS = {
  trabajando: { texto: 'Trabajando', color: '#60A5FA' },
  cambios: { texto: 'Pide cambios', color: '#FBBF24' },
  trabado: { texto: 'Trabado', color: '#F87171' },
  listo: { texto: 'Listo', color: '#34D399' },
  pausa: { texto: 'En pausa', color: '#64748B' },
}
export const ROJO = '#F87171', VERDE = '#34D399'

export const json = async url => { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error(String(r.status)); return r.json() }

// ---------- Markdown chico ----------
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const inline = x => x.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
export function md(t) {
  const out = []; let lista = false, codigo = false, tabla = false
  const cierra = () => { if (lista) { out.push('</ul>'); lista = false } if (tabla) { out.push('</tbody></table>'); tabla = false } }
  for (const cruda of t.split('\n')) {
    const l = esc(cruda); let m
    if (/^```/.test(l)) { cierra(); out.push(codigo ? '</pre>' : '<pre>'); codigo = !codigo; continue }
    if (codigo) { out.push(l); continue }
    if (/^\s*\|.*\|\s*$/.test(l)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue
      const celdas = l.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()))
      if (!tabla) { if (lista) { out.push('</ul>'); lista = false } out.push('<table><thead><tr>' + celdas.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>'); tabla = true }
      else out.push('<tr>' + celdas.map(c => `<td>${c}</td>`).join('') + '</tr>')
      continue
    }
    if (tabla) { out.push('</tbody></table>'); tabla = false }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) { cierra(); const n = Math.min(5, m[1].length + 2); out.push(`<h${n}>${inline(m[2])}</h${n}>`) }
    else if ((m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(l))) { if (!lista) { out.push('<ul>'); lista = true } out.push(`<li>${inline(m[1])}</li>`) }
    else if (!l.trim()) cierra()
    else { cierra(); out.push(`<p>${inline(l)}</p>`) }
  }
  cierra(); if (codigo) out.push('</pre>')
  return out.join('\n')
}
export const escapar = esc
