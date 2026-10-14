// node --test herramientas/test/demo-datos.test.mjs   (cwd = .claude/skills/videos-multiagente)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cargar, limpiar } from '../demo-datos/lib.mjs'

const datos = {
  categorias: [{ clave: 'remeras', name: 'Remeras', icon: 'shirt' }],
  productos: [{ clave: 'r1', name: 'Remera Básica Blanca', categoria: 'remeras', basePrice: 15990, talles: ['S', 'M'], stock: 5, fotos: [] }],
  clientes: [{ clave: 'c1', firstName: 'Lucía', lastName: 'Ferreyra' }],
  pedidos: [{ cliente: 'c1', canal: 'POS', items: [{ producto: 'r1', talle: 'M', cantidad: 1 }], pago: 'CASH' }],
}

function apiFalsa({ fallarEn } = {}) {
  const llamadas = [], creados = {}; let n = 0
  return { llamadas, async pedir(metodo, ruta, cuerpo) {
    llamadas.push({ metodo, ruta, cuerpo })
    if (fallarEn && ruta.startsWith(fallarEn)) throw new Error('falla simulada')
    const id = `id-${++n}`
    if (metodo === 'GET' && ruta.startsWith('/categories')) return [{ id: 'cat-existente', name: 'Remeras' }]
    // forma real de la API: POST /products devuelve el producto sin variantes útiles; GET /products/:id
    // trae las variantes con optionValues [{ optionValueId, value }]
    if (metodo === 'GET' && /^\/products\//.test(ruta)) { const pid = ruta.split('/')[2]; const c = creados[pid]; return { id: pid, variants: c.variants.map((v, i) => ({ id: `${pid}-v${i}`, optionValues: v.optionValues.map(value => ({ optionValueId: 'x', value })) })) } }
    if (ruta === '/products') { creados[id] = cuerpo; return { id } }
    return { id }
  } }
}

test('crea en orden (categoría → producto → cliente → pedido) y conecta los ids', async () => {
  const api = apiFalsa(), man = { creado: [] }
  await cargar(api, datos, man)
  assert.deepEqual(api.llamadas.filter(l => l.metodo === 'POST').map(l => l.ruta), ['/categories', '/products', '/customers', '/orders'])
  const post = r => api.llamadas.find(l => l.metodo === 'POST' && l.ruta === r).cuerpo
  assert.equal(post('/products').categoryId, 'id-1')
  assert.deepEqual(post('/products').options, [{ name: 'Talle', values: ['S', 'M'] }])
  assert.equal(post('/orders').items[0].variantId, 'id-2-v1')
  assert.equal(post('/orders').notifyCustomer, false, 'nunca se le manda un mail a un cliente de demo')
  assert.equal(man.creado.length, 4)
})

test('si algo falla a mitad, el manifiesto tiene lo que sí se creó', async () => {
  const api = apiFalsa({ fallarEn: '/customers' }), man = { creado: [] }
  await assert.rejects(cargar(api, datos, man), /falla simulada/)
  assert.deepEqual(man.creado.map(c => c.tipo), ['categoria', 'producto'])
})

test('limpiar borra solo lo del manifiesto, en orden inverso, y saltea los pedidos', async () => {
  const api = apiFalsa(), man = { creado: [{ tipo: 'categoria', id: 'a' }, { tipo: 'producto', id: 'b' }, { tipo: 'cliente', id: 'c' }, { tipo: 'pedido', id: 'd' }] }
  const quedan = await limpiar(api, man)
  assert.deepEqual(api.llamadas.map(l => `${l.metodo} ${l.ruta}`), ['DELETE /products/b', 'DELETE /categories/a'])
  assert.deepEqual(quedan.map(c => c.tipo), ['cliente', 'pedido'])
})

test('usa una categoría que ya existe (por nombre) sin crearla ni anotarla en el manifiesto', async () => {
  const api = apiFalsa(), man = { creado: [] }
  await cargar(api, { categorias: [{ clave: 'remeras', existente: 'Remeras' }], productos: [{ clave: 'r', name: 'R', categoria: 'remeras', basePrice: 1000, talles: ['M'], fotos: [] }] }, man)
  assert.deepEqual(api.llamadas.filter(l => !/^\/products\//.test(l.ruta)).map(l => `${l.metodo} ${l.ruta.split('?')[0]}`), ['GET /categories', 'POST /products'])
  assert.equal(api.llamadas.find(l => l.ruta === '/products').cuerpo.categoryId, 'cat-existente')
  assert.deepEqual(man.creado.map(c => c.tipo), ['producto'])
})

test('retoma una carga cortada: lo que ya está en el manifiesto no se vuelve a crear', async () => {
  const api = apiFalsa(), man = { creado: [] }
  await assert.rejects(cargar(apiFalsa({ fallarEn: '/orders' }), datos, man))   // quedan categoría, producto y cliente
  // la API falsa nueva no conoce el producto creado antes: lo "conoce" por el GET
  api.pedir = (orig => async (m, r, c) => (m === 'GET' && r.startsWith('/products/')) ? { id: r.split('/')[2], variants: [{ id: 'v-s', optionValues: [{ value: 'S' }] }, { id: 'v-m', optionValues: [{ value: 'M' }] }] } : orig(m, r, c))(api.pedir)
  await cargar(api, datos, man)
  assert.deepEqual(api.llamadas.filter(l => l.metodo === 'POST').map(l => l.ruta), ['/orders'])
  assert.equal(api.llamadas.find(l => l.ruta === '/orders').cuerpo.items[0].variantId, 'v-m')
  assert.equal(man.creado.filter(c => c.tipo === 'producto').length, 1)
})

test('un pedido con "comprador" va como venta anónima (solo el nombre, sin cliente ni email)', async () => {
  const api = apiFalsa(), man = { creado: [] }
  await cargar(api, { ...datos, pedidos: [{ comprador: 'Lucía Ferreyra', canal: 'POS', items: [{ producto: 'r1', talle: 'S' }], pago: 'CASH' }] }, man)
  const o = api.llamadas.find(l => l.ruta === '/orders').cuerpo
  assert.deepEqual(o.buyer, { name: 'Lucía Ferreyra' })
  assert.equal(o.customerId, undefined)
})
