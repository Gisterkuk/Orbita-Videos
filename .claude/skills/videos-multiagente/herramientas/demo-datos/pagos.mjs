// Cobros del negocio de demo (Configuración → Pagos). Todo cambio es reversible: antes de escribir guarda
// la config de cobros completa en ~/orbita-videos/demo-pagos-antes.json (una sola vez, no se pisa).
// PUT /business/config solo cambia los campos que se mandan (businesses.service.ts).
//   node herramientas/demo-datos/pagos.mjs --leer                 (SOLO LECTURA: muestra los cobros y guarda la copia si no existe)
//   node herramientas/demo-datos/pagos.mjs --plan <plan.json>     (muestra qué cambiaría)
//   node herramientas/demo-datos/pagos.mjs --plan <plan.json> --confirmo   (ESCRIBE EN PRODUCCIÓN, con permiso de la persona)
//   node herramientas/demo-datos/pagos.mjs --revertir --confirmo  (vuelve los campos tocados a la copia)
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const args = process.argv.slice(2)
const MAN = path.join(VIDEOS_DIR, 'demo-manifiesto.json'), ANTES = path.join(VIDEOS_DIR, 'demo-pagos-antes.json')
const CAMPOS = ['acceptsMercadopago', 'acceptsCash', 'acceptsTransfer', 'acceptsPickup', 'acceptsCoordinateLater', 'pickupPaymentMethods',
  'cashDiscountPercent', 'mercadopagoDiscountPercent', 'transferDiscountPercent', 'transferAlias', 'transferHolder', 'transferBank']
const confirmo = args.includes('--confirmo')
const recortar = c => Object.fromEntries(CAMPOS.map(k => [k, c[k] ?? null]))
const unidad = v => (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) ? Number(v) : v

const { api, negocio, cerrar } = await conectarApi()
try {
  const actual = recortar(await api.pedir('GET', '/business/config'))
  if (!fs.existsSync(ANTES) && !args.includes('--revertir')) { fs.writeFileSync(ANTES, JSON.stringify({ negocio, fecha: new Date().toISOString(), config: actual }, null, 1)); console.log('Copia guardada en', ANTES) }
  if (args.includes('--leer') || (!args.includes('--plan') && !args.includes('--revertir'))) { console.log(JSON.stringify(actual, null, 1)); process.exit(0) }

  const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { negocio, creado: [], cambios: [] }
  man.cambios ??= []
  if (man.negocio && man.negocio !== negocio) { console.log('⚠ Otro negocio: no toco nada'); process.exitCode = 3; throw null }

  let cambio
  if (args.includes('--revertir')) {
    const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8')).config
    cambio = Object.fromEntries(CAMPOS.filter(k => JSON.stringify(actual[k]) !== JSON.stringify(antes[k])).map(k => [k, antes[k]]))
  } else {
    const plan = JSON.parse(fs.readFileSync(args[args.indexOf('--plan') + 1], 'utf8'))
    cambio = Object.fromEntries(Object.entries(plan).filter(([k, v]) => CAMPOS.includes(k) && JSON.stringify(actual[k]) !== JSON.stringify(v)))
  }
  console.log('Cambios:', JSON.stringify(Object.fromEntries(Object.entries(cambio).map(([k, v]) => [k, { de: actual[k], a: v }])), null, 1))
  if (!Object.keys(cambio).length) { console.log('Nada que cambiar'); process.exit(0) }
  if (!confirmo) { console.log('(solo plan: agregá --confirmo cuando la persona lo apruebe)'); process.exit(0) }
  // El API guarda vacío como null; los descuentos viajan como número.
  const cuerpo = Object.fromEntries(Object.entries(cambio).map(([k, v]) => [k, /DiscountPercent$/.test(k) ? (v === null || v === '' ? null : Number(unidad(v))) : (v === null && /^transfer(Alias|Holder|Bank)$/.test(k) ? '' : v)]))
  await api.pedir('PUT', '/business/config', cuerpo)
  man.cambios.push({ tipo: 'pagos', accion: args.includes('--revertir') ? 'revertir' : 'cambiar', campos: Object.keys(cambio), fecha: new Date().toISOString() })
  fs.writeFileSync(MAN, JSON.stringify(man, null, 1))
  console.log('✓ listo:', Object.keys(cambio).join(', '))
} catch (e) { if (e) { console.error(e.message); process.exitCode = e.codigo ?? 1 } } finally { await cerrar() }
