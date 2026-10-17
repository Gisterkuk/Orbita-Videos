// Datos del negocio de demo (Configuración → Negocio / Contacto / Redes sociales). Todo cambio es reversible:
// antes de escribir guarda los campos tocables en ~/orbita-videos/demo-negocio-antes.json (una sola vez, no se pisa).
// Fuentes: GET/PUT /business (name, industry, description), GET/PUT /branches/:id de la sucursal principal
// (address, latitude, longitude) y GET/PUT /business/config (whatsapp, email, scheduleText, instagram, tiktok, facebook).
// NO toca cuit ni legalName. El email no se puede dejar en blanco (el API no lo acepta): el plan nunca lo vacía.
//   node herramientas/demo-datos/negocio.mjs --leer                 (SOLO LECTURA: muestra los datos y guarda la copia si no existe)
//   node herramientas/demo-datos/negocio.mjs --plan <plan.json>     (muestra qué cambiaría)
//   node herramientas/demo-datos/negocio.mjs --plan <plan.json> --confirmo   (ESCRIBE EN PRODUCCIÓN, dentro de la autorización de decisiones.md §1)
//   node herramientas/demo-datos/negocio.mjs --revertir --confirmo  (vuelve los campos tocados a la copia)
// Antes de escribir tomar la cerradura: node herramientas/candado.mjs adquirir <video>; liberarla DESPUÉS de revertir y verificar.
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const args = process.argv.slice(2)
const MAN = path.join(VIDEOS_DIR, 'demo-manifiesto.json'), ANTES = path.join(VIDEOS_DIR, 'demo-negocio-antes.json')
const BIZ = ['name', 'industry', 'description']
const SUC = ['address', 'latitude', 'longitude']
const CFG = ['whatsapp', 'email', 'scheduleText', 'instagram', 'tiktok', 'facebook']
const CAMPOS = [...BIZ, ...SUC, ...CFG]
const confirmo = args.includes('--confirmo')
const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const num = v => (v === null || v === undefined || v === '') ? null : Number(v)

const { api, negocio, cerrar } = await conectarApi()
try {
  const biz = await api.pedir('GET', '/business')
  const cfg = await api.pedir('GET', '/business/config')
  const sucursales = await api.pedir('GET', '/branches')
  const suc = sucursales.find(b => b.isDefault) ?? null
  const actual = {
    name: biz.name ?? null, industry: biz.industry ?? null, description: biz.description ?? null,
    address: suc?.address ?? null, latitude: num(suc?.latitude), longitude: num(suc?.longitude),
    ...Object.fromEntries(CFG.map(k => [k, cfg[k] ?? null])),
  }
  if (!fs.existsSync(ANTES) && !args.includes('--revertir')) { fs.writeFileSync(ANTES, JSON.stringify({ negocio, fecha: new Date().toISOString(), sucursal: suc?.id ?? null, config: actual }, null, 1)); console.log('Copia guardada en', ANTES) }
  if (args.includes('--leer') || (!args.includes('--plan') && !args.includes('--revertir'))) { console.log(JSON.stringify(actual, null, 1)); process.exit(0) }

  const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { negocio, creado: [], cambios: [] }
  man.cambios ??= []
  if (man.negocio && man.negocio !== negocio) { console.log('⚠ Otro negocio: no toco nada'); process.exitCode = 3; throw null }

  let cambio
  if (args.includes('--revertir')) {
    const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8')).config
    cambio = Object.fromEntries(CAMPOS.filter(k => !igual(actual[k], antes[k])).map(k => [k, antes[k]]))
  } else {
    const plan = JSON.parse(fs.readFileSync(args[args.indexOf('--plan') + 1], 'utf8'))
    cambio = Object.fromEntries(Object.entries(plan).filter(([k, v]) => CAMPOS.includes(k) && !igual(actual[k], v)))
  }
  if ('email' in cambio && !String(cambio.email ?? '').trim()) { console.log('⚠ El email no se puede dejar en blanco: se omite'); delete cambio.email }
  console.log('Cambios:', JSON.stringify(Object.fromEntries(Object.entries(cambio).map(([k, v]) => [k, { de: actual[k], a: v }])), null, 1))
  if (!Object.keys(cambio).length) { console.log('Nada que cambiar'); process.exit(0) }
  if (!confirmo) { console.log('(solo plan: agregá --confirmo cuando corresponda)'); process.exit(0) }

  const vacio = v => v ?? ''
  const cb = Object.fromEntries(Object.entries(cambio).filter(([k]) => BIZ.includes(k)).map(([k, v]) => [k, vacio(v)]))
  if (Object.keys(cb).length) await api.pedir('PUT', '/business', cb)
  const cs = Object.fromEntries(Object.entries(cambio).filter(([k]) => SUC.includes(k) && (cambio[k] !== null)).map(([k, v]) => [k, k === 'address' ? String(v).trim() : Number(v)]))
  if (cambio.address === null) cs.address = ''
  if (Object.keys(cs).length) {
    if (!suc) throw new Error('El negocio no tiene sucursal principal')
    await api.pedir('PUT', `/branches/${suc.id}`, cs)
  }
  const cc = Object.fromEntries(Object.entries(cambio).filter(([k]) => CFG.includes(k)).map(([k, v]) => [k, vacio(v)]))
  if (Object.keys(cc).length) await api.pedir('PUT', '/business/config', cc)

  // Verificación por lectura
  const biz2 = await api.pedir('GET', '/business'), cfg2 = await api.pedir('GET', '/business/config')
  const suc2 = (await api.pedir('GET', '/branches')).find(b => b.isDefault)
  const ahora = { ...Object.fromEntries(BIZ.map(k => [k, biz2[k] ?? null])), address: suc2?.address ?? null, latitude: num(suc2?.latitude), longitude: num(suc2?.longitude), ...Object.fromEntries(CFG.map(k => [k, cfg2[k] ?? null])) }
  const mal = Object.keys(cambio).filter(k => !igual(ahora[k] === '' ? null : ahora[k], cambio[k] === '' ? null : cambio[k]) && !(typeof cambio[k] === 'number' && Math.abs((ahora[k] ?? 0) - cambio[k]) < 1e-5))
  man.cambios.push({ tipo: 'negocio', accion: args.includes('--revertir') ? 'revertir' : 'cambiar', campos: Object.keys(cambio), fecha: new Date().toISOString() })
  fs.writeFileSync(MAN, JSON.stringify(man, null, 1))
  console.log('✓ listo:', Object.keys(cambio).join(', '))
  if (mal.length) { console.log('⚠ La lectura posterior no coincide en:', mal.join(', ')); process.exitCode = 4 }
} catch (e) { if (e) { console.error(e.message); process.exitCode = e.codigo ?? 1 } } finally { await cerrar() }
