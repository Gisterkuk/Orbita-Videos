// Desactiva (reversible) productos y categorías del negocio de la sesión y renombra categorías:
// productos → borrador (PATCH /products/:id/status), categorías → isActive false (PUT /categories/:id).
// Cada cambio queda en ~/orbita-videos/demo-manifiesto.json → "cambios", con el estado anterior,
// para revertirlo con --revertir. ESCRIBE EN PRODUCCIÓN: sin --confirmo solo muestra el plan.
//   node herramientas/demo-datos/desactivar.mjs --productos "a,b" --categorias "x,y" [--renombrar "viejo=Nuevo"] [--confirmo]
//   node herramientas/demo-datos/desactivar.mjs --revertir --confirmo
// (los nombres se buscan exactos en el inventario: correr inventario.mjs antes)
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const args = process.argv.slice(2)
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : '' }
const lista = n => opt(n).split(',').map(s => s.trim()).filter(Boolean)
const MAN = path.join(VIDEOS_DIR, 'demo-manifiesto.json'), INV = path.join(VIDEOS_DIR, 'demo-inventario.json')
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { negocio: null, creado: [] }
man.cambios ??= []
const inv = JSON.parse(fs.readFileSync(INV, 'utf8'))
const buscar = (col, nombre) => { const x = inv[col].find(e => e.name === nombre); if (!x) throw new Error(`No está en el inventario: "${nombre}"`); return x }

const plan = args.includes('--revertir')
  ? man.cambios.filter(c => !c.revertido).map(c => ({ ...c, revertir: true }))
  : [
      ...lista('productos').map(n => { const p = buscar('productos', n); return { tipo: 'producto', id: p.id, nombre: n, antes: { status: p.estado }, despues: { status: 'DRAFT' } } }),
      ...lista('categorias').map(n => { const c = buscar('categorias', n); return { tipo: 'categoria', id: c.id, nombre: n, antes: { name: c.name, isActive: c.isActive ?? true }, despues: { name: c.name, isActive: false } } }),
      ...lista('renombrar').map(par => { const [viejo, nuevo] = par.split('='); const c = buscar('categorias', viejo); return { tipo: 'categoria', id: c.id, nombre: viejo, antes: { name: c.name, isActive: c.isActive ?? true }, despues: { name: nuevo, isActive: c.isActive ?? true } } }),
    ]
for (const c of plan) console.log(`  ${c.revertir ? 'revertir' : 'cambiar'} ${c.tipo} "${c.nombre}": ${JSON.stringify(c.revertir ? c.despues : c.antes)} → ${JSON.stringify(c.revertir ? c.antes : c.despues)}`)
if (!args.includes('--confirmo')) { console.log('(solo plan: agregá --confirmo cuando la persona lo apruebe)'); process.exit(0) }

const { api, negocio, cerrar } = await conectarApi()
if (inv.negocio !== negocio) { console.log(`⚠ El inventario es de ${inv.negocio} y la sesión de ${negocio}: no toco nada`); await cerrar(); process.exit(3) }
// el PUT de categorías pone en null lo que no se manda (icon, color, imageUrl, parentId:
// categories.service.ts update): se lee la categoría completa y se mandan todos sus campos
const catsRaw = await api.pedir('GET', '/categories?flat=1')
const cats = Array.isArray(catsRaw) ? catsRaw : catsRaw.data ?? catsRaw.items ?? []
const completa = id => { const c = cats.find(x => x.id === id); if (!c) throw new Error('Categoría no encontrada: ' + id); return { name: c.name, slug: c.slug, icon: c.icon ?? undefined, color: c.color ?? undefined, imageUrl: c.imageUrl ?? undefined, parentId: c.parentId ?? undefined, isActive: c.isActive ?? true } }
try {
  for (const c of plan) {
    if (c.tipo === 'categoria' && !c.revertir) { const actual = completa(c.id); c.antes = actual; c.despues = { ...actual, ...c.despues, slug: c.despues.name === actual.name ? actual.slug : undefined } }
    const estado = c.revertir ? c.antes : c.despues
    if (c.tipo === 'producto') await api.pedir('PATCH', `/products/${c.id}/status`, { status: estado.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED' })
    else await api.pedir('PUT', `/categories/${c.id}`, estado)
    if (c.revertir) man.cambios.find(x => x.id === c.id && x.fecha === c.fecha).revertido = new Date().toISOString()
    else man.cambios.push({ ...c, fecha: new Date().toISOString() })
    console.log('  ✓', c.tipo, c.nombre)
  }
} finally { man.negocio ??= negocio; fs.writeFileSync(MAN, JSON.stringify(man, null, 1)); await cerrar() }
