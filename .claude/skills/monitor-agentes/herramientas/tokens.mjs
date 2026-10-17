// Consumo de tokens de un video, por agente, a partir de lo que registró el hook.
//   node herramientas/tokens.mjs <slug>
import { leerEventos, slugValido, normalizarEventos } from './lib/eventos.mjs'
const slug = process.argv[2]
if (!slugValido(slug)) { console.error('Uso: node herramientas/tokens.mjs <slug>'); process.exit(1) }
const por = new Map(); let total = 0, lectura = 0, corridas = 0
for (const e of normalizarEventos(leerEventos(slug))) {
  if (!e.tokens) continue
  const k = e.agente || 'sin nombre'; const p = por.get(k) ?? { total: 0, lectura: 0, corridas: 0 }
  const u = e.tokens.corrida ?? e.tokens.total; p.total += u; p.lectura += e.tokens.cacheLectura ?? 0; p.corridas++
  total += u; lectura += e.tokens.cacheLectura ?? 0; corridas++
  por.set(k, p)
}
const f = n => n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' mil' : String(n)
if (!corridas) { console.log('Todavía no hay consumo medido para', slug, '(el hook lo registra al terminar cada agente).'); process.exit(0) }
console.log(`Consumo de ${slug}: ${f(total)} tokens en ${corridas} corridas (más ${f(lectura)} de contexto releído desde caché)\n`)
for (const [k, p] of [...por].sort((a, b) => b[1].total - a[1].total)) console.log(`${k.padEnd(28)} ${f(p.total).padStart(9)}   ${p.corridas} corrida${p.corridas > 1 ? 's' : ''}`)
