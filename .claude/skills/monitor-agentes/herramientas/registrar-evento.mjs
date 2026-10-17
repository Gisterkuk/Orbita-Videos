// Hook de Claude Code: registra cómo el director y los agentes interactúan.
// Se llama desde .claude/settings.json en PostToolUse (Agent|SendMessage) y en SubagentStop.
// Lee el JSON del hook por stdin, escribe una línea en produccion/eventos.jsonl del video y sale en silencio:
// un monitor nunca puede romper ni frenar el trabajo (siempre exit 0).
//
// Dos cosas que evitan errores con varios videos en paralelo:
//  - Al lanzar un agente se guarda su id con su nombre y su video (_monitor/agentes.json). Después, cuando ese agente
//    termina o le escriben, se sabe quién es y a qué video pertenece (no se adivina por "el último video").
//  - Al terminar un agente se mide su consumo real de tokens leyendo su transcrito.
import fs from 'node:fs'
import path from 'node:path'
import { registrar, slugDe, limpiar, guardarAgente, datosDeAgente, idDeAgenteLanzado, tokensDeTranscripto, MONITOR_DIR } from './lib/eventos.mjs'

function leerStdin() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8')) } catch { return null }
}

const texto = v => typeof v === 'string' ? v : (v == null ? '' : (() => { try { return JSON.stringify(v) } catch { return '' } })())

// Último mensaje del agente en su transcript (JSONL), si el hook no lo trae ya.
function ultimoMensajeDe(rutaTranscript) {
  try {
    const lineas = fs.readFileSync(rutaTranscript, 'utf8').trim().split('\n')
    for (let i = lineas.length - 1; i >= 0; i--) {
      const o = JSON.parse(lineas[i])
      const m = o.message ?? o
      if ((m.role ?? o.type) !== 'assistant') continue
      const c = m.content
      const t = Array.isArray(c) ? c.filter(b => b.type === 'text').map(b => b.text).join('\n') : texto(c)
      if (t.trim()) return t
    }
  } catch {}
  return ''
}

// Para entender qué trae cada tipo de hook: guarda el último payload de cada uno, con los textos largos recortados.
function guardarMuestra(h) {
  try {
    const corto = (v, d = 0) => typeof v === 'string' ? (v.length > 160 ? v.slice(0, 160) + `… (${v.length} caracteres)` : v)
      : Array.isArray(v) ? v.slice(0, 4).map(x => corto(x, d + 1)) : (v && typeof v === 'object' && d < 3) ? Object.fromEntries(Object.entries(v).slice(0, 25).map(([k, x]) => [k, corto(x, d + 1)])) : v
    fs.mkdirSync(MONITOR_DIR, { recursive: true })
    fs.writeFileSync(path.join(MONITOR_DIR, `muestra-${(h.hook_event_name ?? 'x')}-${h.tool_name ?? ''}.json`.replace(/-\.json$/, '.json')), JSON.stringify(corto(h), null, 1))
  } catch {}
}

try {
  const h = leerStdin()
  if (!h) process.exit(0)
  guardarMuestra(h)
  const evento = h.hook_event_name
  const entrada = h.tool_input ?? {}

  if (evento === 'PostToolUse' && h.tool_name === 'Agent') {
    const prompt = texto(entrada.prompt)
    const slug = slugDe(prompt)
    const tipo = entrada.subagent_type ?? 'general-purpose'
    const respuesta = h.tool_response?.content ?? h.tool_response
    const id = idDeAgenteLanzado(respuesta) ?? idDeAgenteLanzado(h.tool_response)
    if (id) guardarAgente(id, { tipo, slug, descripcion: entrada.description ?? null, ts: new Date().toISOString() })
    registrar({ slug, tipo: 'lanzado', agente: tipo, agenteId: id, descripcion: entrada.description, texto: prompt })
  } else if (evento === 'PostToolUse' && h.tool_name === 'SendMessage') {
    const mensaje = texto(entrada.message)
    const dest = datosDeAgente(entrada.to)            // "to" suele ser un id de agente
    const slug = dest?.slug ?? slugDe(mensaje)
    registrar({ slug, tipo: 'mensaje', a: dest?.tipo ?? entrada.to ?? null, agenteId: dest ? entrada.to : null, descripcion: entrada.summary, texto: mensaje })
  } else if (evento === 'SubagentStop') {
    const cuerpo = h.last_assistant_message ?? (h.agent_transcript_path ? ultimoMensajeDe(h.agent_transcript_path) : '')
    const quien = datosDeAgente(h.agent_id)
    const slug = quien?.slug ?? slugDe(texto(cuerpo))
    const tokens = h.agent_transcript_path ? tokensDeTranscripto(h.agent_transcript_path) : null
    registrar({ slug, tipo: 'devolucion', agente: h.agent_type || quien?.tipo || null, agenteId: h.agent_id ?? null, descripcion: quien?.descripcion ?? null, texto: limpiar(texto(cuerpo)), tokens })
  }
} catch { /* nunca molestar */ }
process.exit(0)
