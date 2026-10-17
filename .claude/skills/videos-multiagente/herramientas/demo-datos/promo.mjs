// Pausar / reanudar un descuento AUTOMÁTICO del negocio de demo (sin código), reversible.
// Solo lleva el descuento al estado pedido (no alterna a ciegas) y guarda el estado anterior en
// ~/orbita-videos/demo-promo-antes.json. ESCRIBE EN PRODUCCIÓN: sin --confirmo solo muestra el plan.
//   node herramientas/demo-datos/promo.mjs --leer
//   node herramientas/demo-datos/promo.mjs --pausar "promo alexander" [--confirmo]
//   node herramientas/demo-datos/promo.mjs --reanudar "promo alexander" [--confirmo]
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const args = process.argv.slice(2)
const ANTES = path.join(VIDEOS_DIR, 'demo-promo-antes.json')
const accion = args.includes('--pausar') ? 'pausar' : args.includes('--reanudar') ? 'reanudar' : 'leer'
const nombre = accion === 'leer' ? null : args[args.indexOf('--' + accion) + 1]
const confirmo = args.includes('--confirmo')

const { api, cerrar } = await conectarApi()
try {
  const r = await api.pedir('GET', '/discounts?limit=100')
  const lista = r.data ?? r.items ?? r
  const resumen = d => ({ id: d.id, nombre: d.name, activo: d.isActive, codigo: d.code ?? null, tipo: d.type ?? d.kind ?? null, valor: d.value ?? d.percentage ?? null })
  if (accion === 'leer') { console.log(JSON.stringify(lista.map(resumen), null, 1)); process.exit(0) }
  const coinciden = lista.filter(d => !d.code && d.name?.toLowerCase().includes(nombre.toLowerCase()))
  if (coinciden.length !== 1) { console.log(`⚠ ${coinciden.length} coincidencias para "${nombre}" (tiene que ser exactamente 1):`, JSON.stringify(coinciden.map(resumen))); process.exitCode = 3; throw null }
  const d = coinciden[0], objetivo = accion === 'reanudar'
  console.log(`${accion}: "${d.name}" (${d.id}) activo ${d.isActive} → ${objetivo}`)
  if (d.isActive === objetivo) { console.log('Ya está así: nada que cambiar'); process.exit(0) }
  if (!confirmo) { console.log('(solo plan: agregá --confirmo cuando la persona lo apruebe)'); process.exit(0) }
  if (accion === 'pausar' && !fs.existsSync(ANTES)) fs.writeFileSync(ANTES, JSON.stringify({ fecha: new Date().toISOString(), descuento: resumen(d) }, null, 1))
  await api.pedir('PATCH', `/discounts/${d.id}/toggle`)
  const despues = (await api.pedir('GET', `/discounts/${d.id}`))
  console.log(`✓ "${d.name}" ahora activo=${despues.isActive}`)
} catch (e) { if (e) { console.error(e.message); process.exitCode = e.codigo ?? 1 } } finally { await cerrar() }
