// Lógica del negocio de demo, sin red: arma los pedidos a la API del panel a partir de datos.json
// y lleva el manifiesto de lo creado (para limpiar o restaurar entre videos). `api.pedir(metodo,
// ruta, cuerpo)` la provee cargar.mjs con la sesión de la persona; en los tests es falsa.
// Endpoints (apps/api/src, 2026-10-12): POST /categories (categories.controller.ts:27),
// POST /products (products.controller.ts:202), POST /products/:id/images (products.controller.ts:234),
// POST /customers (customers.controller.ts:43), POST /orders (orders.controller.ts:45),
// DELETE /categories/:id (:41), DELETE /products/:id (products.controller.ts:227).

export async function cargar(api, datos, manifiesto, { subirFoto } = {}) {
  const ids = { categoria: {}, producto: {}, variante: {}, cliente: {} }
  const anotar = (tipo, clave, id, nombre) => { manifiesto.creado.push({ tipo, clave, id, nombre, fecha: new Date().toISOString() }) }
  // retomar: lo que ya está en el manifiesto (misma clave) no se vuelve a crear
  const ya = (tipo, clave) => manifiesto.creado.find(c => c.tipo === tipo && c.clave === clave)?.id

  // { existente: 'Nombre' }: usa una categoría que ya hay en el negocio (no se crea ni se anota)
  let existentes = null
  for (const c of datos.categorias ?? []) {
    if (c.existente) {
      existentes ??= await api.pedir('GET', '/categories?flat=1').then(r => Array.isArray(r) ? r : r.data ?? r.items ?? [])
      const e = existentes.find(x => x.name === c.existente)
      if (!e) throw new Error(`No existe la categoría "${c.existente}" en el negocio`)
      ids.categoria[c.clave] = e.id
      continue
    }
    if (ya('categoria', c.clave)) { ids.categoria[c.clave] = ya('categoria', c.clave); continue }
    const r = await api.pedir('POST', '/categories', { name: c.name, ...(c.icon ? { icon: c.icon } : {}) })
    ids.categoria[c.clave] = r.id; anotar('categoria', c.clave, r.id, c.name)
  }
  for (const p of datos.productos ?? []) {
    const talles = p.talles ?? []
    const cuerpo = {
      name: p.name, description: p.descripcion, categoryId: ids.categoria[p.categoria], basePrice: p.basePrice,
      ...(p.costo ? { cost: p.costo } : {}), status: 'PUBLISHED',
      ...(talles.length ? { options: [{ name: 'Talle', values: talles }] } : {}),
      variants: (talles.length ? talles : [null]).map(t => ({ price: p.basePrice, optionValues: t ? [t] : [], initialStock: p.stock ?? 5 })),
    }
    let id = ya('producto', p.clave)
    if (!id) {
      id = (await api.pedir('POST', '/products', cuerpo)).id
      anotar('producto', p.clave, id, p.name)
      if (subirFoto) for (const f of p.fotos ?? []) await subirFoto(id, f)
    }
    ids.producto[p.clave] = id
    // las variantes (con su talle como { value }) vienen recién en GET /products/:id
    const detalle = await api.pedir('GET', `/products/${id}`)
    for (const v of detalle.variants ?? []) { const o = v.optionValues?.[0]; ids.variante[`${p.clave}:${typeof o === 'object' ? o?.value ?? '' : o ?? ''}`] = v.id }
  }
  for (const c of datos.clientes ?? []) {
    if (ya('cliente', c.clave)) { ids.cliente[c.clave] = ya('cliente', c.clave); continue }
    const r = await api.pedir('POST', '/customers', { firstName: c.firstName, ...(c.lastName ? { lastName: c.lastName } : {}), ...(c.phone ? { phone: c.phone } : {}) })
    ids.cliente[c.clave] = r.id; anotar('cliente', c.clave, r.id, `${c.firstName} ${c.lastName ?? ''}`.trim())
  }
  for (const [i, o] of (datos.pedidos ?? []).entries()) {
    if (ya('pedido', `pedido-${i + 1}`)) continue
    const items = o.items.map(it => ({ variantId: ids.variante[`${it.producto}:${it.talle ?? ''}`], quantity: it.cantidad ?? 1 }))
    const falta = items.find(it => !it.variantId)
    if (falta) throw new Error(`Pedido ${i + 1}: no encontré la variante de ${JSON.stringify(o.items)}`)
    const cuerpo = {
      channel: o.canal ?? 'POS', notifyCustomer: false,
      // "comprador": venta anónima (solo el nombre: no exige email, orders.service.ts:678);
      // "cliente": pedido de un cliente registrado (la API exige que tenga email)
      ...(o.comprador ? { buyer: { name: o.comprador } } : { customerId: ids.cliente[o.cliente] }),
      items,
      ...(o.pago ? { paymentMethod: o.pago } : {}),
    }
    const r = await api.pedir('POST', '/orders', cuerpo)
    anotar('pedido', `pedido-${i + 1}`, r.id, `Pedido de ${o.comprador ?? o.cliente}`)
  }
  return ids
}

// Borra lo que se puede borrar desde el panel, en orden inverso (productos antes que categorías).
// Clientes y pedidos no tienen DELETE en la API: quedan en la lista que devuelve (y en el manifiesto).
export async function limpiar(api, manifiesto) {
  const ruta = { producto: '/products/', categoria: '/categories/' }
  const quedan = []
  for (const c of [...manifiesto.creado].reverse()) {
    if (ruta[c.tipo]) await api.pedir('DELETE', ruta[c.tipo] + c.id)
    else quedan.unshift(c)
  }
  return quedan
}
