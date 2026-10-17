// Lo que la sala necesita además de los eventos: los videos para mirar (final o último borrador), los pedidos que el
// equipo le dejó a la persona (pedidos.md) y las indicaciones que la persona le deja al director (indicaciones.md).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VIDEOS_DIR, carpetaProduccion, limpiar } from './eventos.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
// Entregas del repo (marketing/videos/<tipo>/AAAA-MM-DD_slug_formato.mp4; no se versionan).
export const ENTREGAS_DIR = process.env.MONITOR_ENTREGAS ?? path.resolve(AQUI, '..', '..', '..', '..', '..', 'marketing', 'videos')

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const mp4s = dir => { try { return fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isFile() && /\.mp4$/i.test(d.name)) } catch { return [] } }

// Videos que se pueden mirar desde la oficina: las entregas finales primero (la liviana antes, carga más rápido) y
// después los borradores del proyecto HyperFrames, del más nuevo al más viejo.
export function videosDe(slug) {
  const out = []
  const re = new RegExp(`^\\d{4}-\\d{2}-\\d{2}_${escRe(slug)}_`, 'i')
  let tipos = []; try { tipos = fs.readdirSync(ENTREGAS_DIR, { withFileTypes: true }).filter(d => d.isDirectory()) } catch {}
  for (const t of tipos) {
    for (const f of mp4s(path.join(ENTREGAS_DIR, t.name)).filter(f => re.test(f.name))) {
      const ruta = path.join(ENTREGAS_DIR, t.name, f.name); const st = fs.statSync(ruta)
      out.push({ id: `final/${t.name}/${f.name}`, tipo: 'final', nombre: f.name, liviano: /liviano/i.test(f.name), ts: st.mtime.toISOString(), bytes: st.size, ruta })
    }
  }
  const renders = path.join(VIDEOS_DIR, `${slug}-hf`, 'renders')
  for (const f of mp4s(renders).filter(f => !/sin-normalizar/i.test(f.name))) {
    const ruta = path.join(renders, f.name); const st = fs.statSync(ruta)
    out.push({ id: `borrador/${f.name}`, tipo: 'borrador', nombre: f.name, liviano: false, ts: st.mtime.toISOString(), bytes: st.size, ruta })
  }
  return out.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'final' ? -1 : 1) || b.ts.localeCompare(a.ts) || Number(b.liviano) - Number(a.liviano))
}

// ---------- Pedidos del equipo a la persona ----------
export function pedidosDe(slug) {
  const ruta = path.join(carpetaProduccion(slug), 'pedidos.md')
  try {
    const texto = fs.readFileSync(ruta, 'utf8')
    const items = texto.split('\n').filter(l => /^\s*\d+\.\s+/.test(l)).length
    return { ts: fs.statSync(ruta).mtime.toISOString(), items, texto: limpiar(texto).slice(0, 6000) }
  } catch { return null }
}

// ---------- Indicaciones de la persona al director ----------
// Cada una es una sección "## <fecha> · <para quién> · <estado>". El director la lee antes de cada ronda y cambia el
// estado de "pendiente" a "aplicada" (o "no aplicada: motivo").
const CABECERA = slug => `# Indicaciones de la persona — ${slug}

Las escribe la persona desde el monitor de agentes. **Director:** leelas antes de cada ronda y al retomar; aplicá las
pendientes y cambiá su estado en el título a \`aplicada\` (o \`no aplicada: motivo\`). Tienen prioridad sobre las
decisiones por defecto, pero no sobre las reglas que no se negocian.
`
export const rutaIndicaciones = slug => path.join(carpetaProduccion(slug), 'indicaciones.md')

export function agregarIndicacion(slug, { para, nombre, decision, texto, motivo }, ahora = new Date()) {
  const ruta = rutaIndicaciones(slug)
  const fecha = ahora.toLocaleString('sv-SE', { hour12: false }).slice(0, 16)
  const linea = s => limpiar(String(s ?? '')).replace(/\r/g, '').trim()
  const partes = [`\n## ${fecha} · ${linea(nombre || para || 'Director').replace(/·/g, '-')} · pendiente`]
  if (para) partes.push(`- **Para:** ${linea(para)}`)
  if (motivo) partes.push(`- **Por lo que pidió:** ${linea(motivo).replace(/\n+/g, ' ')}`)
  if (decision) partes.push(`- **Decisión:** ${linea(decision).replace(/\n+/g, ' ')}`)
  if (texto) partes.push(`- **Detalle:** ${linea(texto).replace(/\n/g, '\n  ')}`)
  if (!fs.existsSync(ruta)) fs.writeFileSync(ruta, CABECERA(slug))
  fs.appendFileSync(ruta, partes.join('\n') + '\n')
  return leerIndicaciones(slug).at(-1)
}

export function leerIndicaciones(slug) {
  let texto = ''; try { texto = fs.readFileSync(rutaIndicaciones(slug), 'utf8') } catch { return [] }
  const out = []
  for (const bloque of texto.split(/\n(?=## )/).slice(1)) {
    const [titulo, ...resto] = bloque.split('\n')
    const m = /^##\s+(.+?)\s+·\s+(.+?)\s+·\s+(.+)$/.exec(titulo.trim())
    if (!m) continue
    const campo = k => { const r = new RegExp(`^- \\*\\*${k}:\\*\\*\\s*([\\s\\S]*?)(?=\\n- \\*\\*|$)`, 'm').exec(resto.join('\n')); return r ? r[1].replace(/\n\s+/g, '\n').trim() : null }
    out.push({ fecha: m[1], nombre: m[2], estado: m[3], pendiente: /^pendiente/i.test(m[3]), para: campo('Para'), decision: campo('Decisión'), texto: campo('Detalle') })
  }
  return out
}
