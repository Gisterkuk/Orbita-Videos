// Inventario de SOLO LECTURA del catálogo del negocio de la sesión: categorías y productos con
// precio, estado y fotos, marcando los que parecen de prueba. Escribe ~/orbita-videos/demo-inventario.json
//   node herramientas/demo-datos/inventario.mjs
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const { api, negocio, cerrar } = await conectarApi()
try {
  const cats = await api.pedir('GET', '/categories?flat=1')
  const lista = Array.isArray(cats) ? cats : cats.data ?? cats.items ?? []
  const prods = []
  for (let p = 1; p < 20; p++) {
    const r = await api.pedir('GET', `/products?page=${p}&limit=100`)
    const items = Array.isArray(r) ? r : r.data ?? r.items ?? r.products ?? []
    prods.push(...items)
    if (items.length < 100) break
  }
  const sospechoso = x => /prueba|test|asd|xxx/i.test(x.name ?? '') || Number(x.basePrice ?? x.price ?? 99) <= 1
  const inv = {
    negocio, fecha: new Date().toISOString(),
    categorias: lista.map(c => ({ id: c.id, name: c.name, parentId: c.parentId ?? null, isActive: c.isActive, productos: c._count?.products ?? c.productCount ?? null, prueba: /prueba|test/i.test(c.name) })),
    productos: prods.map(x => ({ id: x.id, name: x.name, precio: x.basePrice ?? x.price, estado: x.status, categoria: x.category?.name ?? x.categoryId, fotos: (x.images ?? []).length, prueba: sospechoso(x) })),
  }
  fs.writeFileSync(path.join(VIDEOS_DIR, 'demo-inventario.json'), JSON.stringify(inv, null, 1))
  console.log(`${negocio}: ${inv.categorias.length} categorías, ${inv.productos.length} productos`)
  for (const c of inv.categorias) console.log(`  [cat] ${c.prueba ? '⚠ ' : '  '}${c.name}${c.isActive === false ? ' (inactiva)' : ''}`)
  for (const x of inv.productos) console.log(`  [prod] ${x.prueba ? '⚠ ' : '  '}${x.name} · $${x.precio} · ${x.estado} · ${x.categoria} · ${x.fotos} fotos`)
} finally { await cerrar() }
