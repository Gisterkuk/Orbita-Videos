// "Conocé tu panel" v2 — tomas A–G del guion aprobado (produccion/guion.md), en UNA captura
// continua; el editor corta cada toma por sus marcas.
//   A · Inicio + menú en "Al pasar el mouse" → Pedidos → Mensajes → Menú lateral → Expandido (frases 1–8)
//   B · Pedidos → Lista como dueño y como Empleado (recreación: /auth/me reescrito SOLO en el navegador) (9–10)
//   C · Configuración → Equipo → Invitar miembro (sin clic) → Gestionar roles → Ver permisos →
//       destildar "Ver clientes" → cursor sobre "Guardar cambios" (sin clic) → Cancelar (11–16)
//   D · Buscador "buzo" + campana (sin tocar nada adentro) (17–18)
//   E · Recarga → Orbi AI → sugerencia → Enviar → respuesta → cerrar → iniciales → Ir a la tienda (19–22)
//   F · Portada de la tienda arriba (frases 2–3 y placa) → scroll hasta "Recién llegados" (23–24)
//   G · Productos → Lista de productos quieta (respaldo del plan B 3 de la frase 23, P10)
//
//   ENSAYO=1 node grabar.mjs ensayo1   → todo bloqueado (Orbi no contesta); siempre primero
//   node grabar.mjs toma1              → toma real: la ÚNICA escritura es la pregunta a Orbi
//                                         (1 conversación en su historial + cupo del negocio de demo);
//                                         todo lo demás sigue bloqueado (bloquearEscrituras con excepción)
// Nunca se toca "Invitar miembro", "Guardar cambios", "Eliminar", ni "Limpiar todas" o un aviso de la campana.
// (El "Limpiar todas" de las ALERTAS del Inicio sí, antes de las marcas: solo oculta en memoria, ver abajo.)
// El modo del menú se pone en "Al pasar el mouse" al empezar y se restaura al terminar (P2):
// es localStorage del perfil de grabación, no un dato de producción.
// Además de log.json deja tomas/<toma>/sondeo.json con lo que verifica (P1, P3, P4, P5, P8, P9, P11).
import fs from 'node:fs'
import path from 'node:path'
import { crearGrabador } from './herramientas/lib/grabador.mjs'
import { bloquearEscrituras } from './herramientas/lib/sesion.mjs'

const TOMA = process.argv[2] ?? 'ensayo1'
const ENSAYO = process.env.ENSAYO === '1' || /^ensayo/.test(TOMA)
const P = {
  buscar: 'buzo',
  pregunta: '¿Qué pedidos tengo sin enviar?',
  // P9: los grupos del modal van en orden alfabético y "Ver pedidos" no está entre los 4 permisos
  // de la tarjeta Empleado: el plan sin scroll con "Ver pedidos" NO sirve. Se usa "Ver clientes".
  permiso: 'Ver clientes',
  // permisos de fábrica del Empleado (apps/api/src/onboarding/onboarding.service.ts:131-134)
  permisosEmpleado: ['orders.view', 'customers.view', 'inventory.view', 'catalog.view', 'config.team.view', 'messages.view', 'messages.manage'],
}
const MODO_KEY = 'orbita-sidebar-mode'

const g = await crearGrabador({ toma: TOMA, ensayo: ENSAYO })
// Toma real: igual se bloquea TODA escritura al API salvo la pregunta a Orbi (POST /orbi/chat).
// En los ensayos fue la única escritura que intentó la página (out/ensayo*.log).
if (!ENSAYO) await bloquearEscrituras(g.page, (m, p) => m === 'POST' && /\/orbi\/chat$/.test(p))
const { page, BASE, pausa, mark, clic, tipear, mover, scrollSuave, esperar, hl, caja } = g
const S = { toma: TOMA, ensayo: ENSAYO, fecha: new Date().toISOString() }   // sondeo
const aside = page.locator('aside').first()
const enMenu = txt => aside.getByText(txt, { exact: true }).first()
const filaMenu = txt => aside.locator('nav > div > button').filter({ has: page.getByText(txt, { exact: true }) }).first()
const barra = {
  buscar: page.locator('input[placeholder="Buscar en Orbita..."]').first(),
  orbi: page.locator('button[aria-label="Abrir Orbi AI"]').first(),
  campana: page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first(),
  avatar: page.locator('button[aria-label^="Tu cuenta"]').first(),
}
const PANEL = p => `${BASE}/admin/ventas/${p}`
const centro = b => [b.x + b.w / 2, b.y + b.h / 2]
const une = (a, b, m = 0) => { const x = Math.min(a.x, b.x) - m, y = Math.min(a.y, b.y) - m; return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x + m, h: Math.max(a.y + a.h, b.y + b.h) - y + m } }

// Caja del elemento visible más chico cuyo texto es exactamente `texto`, dentro de un rectángulo
const cajaTxt = (texto, r = {}) => page.evaluate(({ texto, r }) => {
  const { x0 = 0, x1 = 1440, y0 = 0, y1 = 900, sube = 0, minW = 0, minH = 0 } = r
  let best = null, area = Infinity
  for (const el of document.body.querySelectorAll('*')) {
    if ((el.innerText ?? '').trim().toLowerCase() !== texto.toLowerCase()) continue   // innerText aplica text-transform
    const b = el.getBoundingClientRect()
    if (!b.width || !b.height || b.x < x0 || b.x > x1 || b.y < y0 || b.y > y1) continue
    if (b.width * b.height < area) { best = el; area = b.width * b.height }
  }
  if (!best) return null
  let c = best
  for (let i = 0; i < sube && c.parentElement; i++) c = c.parentElement
  while (c.parentElement && (c.getBoundingClientRect().width < minW || c.getBoundingClientRect().height < minH)) c = c.parentElement
  const b = c.getBoundingClientRect()
  return { x: b.x, y: b.y, w: b.width, h: b.height }
}, { texto, r })
// Textos visibles con "@" (emails) y su caja: P4
const emailsVisibles = () => page.evaluate(() => {
  const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (w.nextNode()) {
    const t = w.currentNode.textContent.trim()
    if (!/@\S+\.\S+/.test(t)) continue
    const el = w.currentNode.parentElement, b = el.getBoundingClientRect()
    if (b.width && b.height && b.bottom > 0 && b.top < 900 && getComputedStyle(el).visibility !== 'hidden') out.push({ t, box: { x: b.x, y: b.y, w: b.width, h: b.height } })
  }
  return out
})
const textoMenu = () => aside.evaluate(a => [...a.querySelectorAll('nav > div > button')].map(b => b.innerText.trim().replace(/\s+/g, ' ')))
const subsAbiertas = () => aside.evaluate(a => [...a.querySelectorAll('.sb-subs')].filter(s => s.style.visibility === 'visible').map(s => s.innerText.trim().split('\n')))
const esperarPanel = async () => {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
}

// Inicio: las alertas de arriba ("21 pedidos necesitan tu atención"…) vienen de pedidos de prueba viejos.
// "Limpiar todas" del Inicio solo las oculta en la memoria de la página (Dashboard.tsx:77, 468: estado
// de React, no llama al API): se toca ANTES de las marcas, sin grabarlo en el video (P8).
async function ocultarAlertasInicio() {
  const b = page.locator('button.ds-link').filter({ hasText: 'Limpiar todas' }).first()
  if (await b.isVisible().catch(() => false)) { await b.click(); await pausa(500); return true }
  return false
}
// Pedidos → Lista: filtro de fecha "Últimos 7 días" (solo la vista, no escribe) para que se vean
// solo los 3 pedidos de demo y no los de prueba viejos (#1–#55). Antes de las marcas.
async function filtrarPedidos7d() {
  const abrir = page.locator('button').filter({ hasText: 'Todas las fechas' }).first()
  if (!(await abrir.isVisible().catch(() => false))) return false
  await abrir.click(); await pausa(300)
  await page.getByRole('button', { name: 'Últimos 7 días', exact: true }).click()
  await esperarPanel(); await pausa(800)
  return true
}
// Nombre del dueño en el saludo del Inicio ("Buenas noches, <nombre>"): P4
const cajaSaludo = () => page.evaluate(() => {
  const h = [...document.querySelectorAll('h1, h2')].find(x => /^Buen(as|os) /.test(x.innerText.trim()))
  const n = h && [...h.querySelectorAll('span')].at(-1)
  const r = (n ?? h)?.getBoundingClientRect()
  return r && { x: r.x - 4, y: r.y - 2, w: r.width + 8, h: r.height + 4 }
})

async function ponerModo(m) {
  await page.evaluate(([k, m]) => localStorage.setItem(k, m), [MODO_KEY, m])
  return page.evaluate(k => localStorage.getItem(k), MODO_KEY)
}

let rutaEmpleado = null
try {
  // ── preparación (no se graba) ─────────────────────────────────────────
  await g.cookiesMinimas()
  await page.goto(PANEL('dashboard'), { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=/Buen(as|os) /', { timeout: 30000 }).catch(() => {
    throw new Error('No cargó el Inicio del panel: ¿se cayó la sesión? (url: ' + page.url() + ')')
  })
  S.modoAntes = await page.evaluate(k => localStorage.getItem(k), MODO_KEY)
  S.modoPuesto = await ponerModo('hover')                                         // P2
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=/Buen(as|os) /', { timeout: 30000 })
  await esperarPanel()
  S.alertasOcultas = { A: await ocultarAlertasInicio() }
  await page.mouse.move(900, 470)
  await pausa(2500)
  S.anchoMenuRiel = (await caja(aside)).w
  S.inicio = await page.evaluate(() => (document.querySelector('main')?.innerText ?? document.body.innerText).slice(0, 2500))   // P8
  S.emails = { inicio: await emailsVisibles() }
  await g.iniciar()
  await pausa(800)

  // ── A · Inicio (frases 1–4) ───────────────────────────────────────────
  mark('sA')
  const bSaludo = await cajaSaludo()
  if (bSaludo) mark('desenfocar', { box: bSaludo, motivo: 'P4 nombre del dueño en el saludo del Inicio', hasta: 'a-fin' })
  const bTitulo = await cajaTxt('Inicio', { x0: 60, y0: 0, y1: 64 })
  const bVentas = await cajaTxt('Ventas', { x0: 60, y0: 64, minW: 150, minH: 70 })
  const bPedidosK = await cajaTxt('Pedidos', { x0: 60, y0: 64, minW: 150, minH: 70 })
  if (bTitulo) hl('titulo-inicio', bTitulo)
  if (bVentas) hl('kpi-ventas', bVentas)
  if (bPedidosK) hl('kpi-pedidos', bPedidosK)
  if (bVentas && bPedidosK) mark('foco', { foco: 'kpis', box: une(bVentas, bPedidosK, 8) })
  S.cajasInicio = { bTitulo, bVentas, bPedidosK }
  // "Métricas avanzadas" (abajo del Inicio) y "Avanzado" (menú) son del paquete Avanzado: el editor los
  // marca como tal o los deja fuera de foco
  const bMetAv = await cajaTxt('Métricas avanzadas', { x0: 60, minW: 600 })
  if (bMetAv) hl('metricas-avanzadas', bMetAv)
  S.cajasInicio.bMetAv = bMetAv
  mark('a-inicio')
  await pausa(4500)                                  // frases 1, 2 y 4: el Inicio quieto (riel de íconos)
  mark('a-inicio-fin')

  // ── A · El menú (frases 5–8) ──────────────────────────────────────────
  mark('a-riel', { foco: 'riel', box: await caja(aside) })
  await pausa(900)
  await mover(30, 330, 1000)                         // frase 5: el cursor entra al riel y el menú se abre
  await esperar('menu-abre', t => enMenu('Pedidos').waitFor({ state: 'visible', timeout: t }))
  await pausa(400)
  mark('menu-abierto', { box: await caja(aside) })
  S.menuDueno = await textoMenu()
  S.anchoMenuAbierto = (await caja(aside)).w
  await pausa(1200)
  await clic(filaMenu('Pedidos'), 'nav-pedidos', { ms: 600, dx: .3, antes: 500 })   // frase 6
  await esperar('subs-pedidos', t => enMenu('Historial').waitFor({ state: 'visible', timeout: t }))
  await pausa(400)
  const bLista = await caja(enMenu('Lista')), bNuevo = await caja(enMenu('Nuevo +'))
  mark('subs-pedidos', { foco: 'subs-pedidos', box: { x: bLista.x - 30, y: bLista.y - 40, w: 220, h: bNuevo.y + bNuevo.h - bLista.y + 46 } })
  S.subsPedidosDueno = await subsAbiertas()
  await pausa(2000)
  // frase 7: la fila real de Mensajes (sin número: P1); el editor agrega la recreación encima
  const bMsj = await caja(filaMenu('Mensajes'))
  S.p1 = { mensajes: (await filaMenu('Mensajes').innerText()).trim(), difusion: (await filaMenu('Difusión').innerText()).trim() }
  mark('a-mensajes', { foco: 'mensajes', box: bMsj })
  hl('fila-mensajes', bMsj)
  hl('avanzado', await caja(filaMenu('Avanzado')))   // sin marca en el menú: el editor lo marca o lo deja fuera de foco
  await pausa(5200)                                  // el cursor sigue dentro del menú (sobre Pedidos)
  // frase 8: Menú lateral → Expandido
  const modo = aside.locator('button[title="Modo del menú lateral"]').first()
  const bModo = await caja(modo)
  mark('a-menu-lateral', { foco: 'menu-lateral', box: bModo })
  await mover(bModo.x + bModo.w * .3, bModo.y + bModo.h / 2, 700)
  await pausa(1200)                                  // llamada "Menú lateral" antes del clic
  await clic(modo, 'menu-lateral', { ms: 150, dx: .3, antes: 80 })
  const optExp = page.getByRole('button', { name: 'Expandido', exact: true })
  await esperar('modo-lista', t => optExp.waitFor({ state: 'visible', timeout: t }))
  await pausa(300)
  const bExp = await caja(optExp), bHover = await caja(page.getByRole('button', { name: 'Al pasar el mouse', exact: true }))
  mark('modo-lista', { foco: 'modo-lista', box: une(bExp, bHover, 10) })
  await pausa(900)
  await clic(optExp, 'expandido', { ms: 700, dx: .35, antes: 500 })
  await pausa(300)
  await mover(860, 470, 600)                         // el cursor sale del menú: queda abierto
  await pausa(400)
  S.modoTrasExpandido = await page.evaluate(k => localStorage.getItem(k), MODO_KEY)
  S.anchoMenuTrasSalir = (await caja(aside)).w
  mark('a-expandido', { box: await caja(aside) })
  await pausa(2200)
  mark('a-fin')

  // ── B · Recreación: el menú de un Empleado (frases 9–10) ──────────────
  g.cursor(0)
  await page.mouse.move(1430, 890)
  await page.goto(PANEL('pedidos'), { waitUntil: 'domcontentloaded' })
  await enMenu('Historial').waitFor({ state: 'visible', timeout: 30000 })
  await esperarPanel()
  S.filtroPedidos = { dueno: await filtrarPedidos7d() }
  await page.mouse.move(1430, 890)
  await pausa(1200)
  mark('sB'); mark('b-dueno', { box: await caja(aside) })
  S.menuDuenoPedidos = await textoMenu()
  hl('avanzado', await caja(filaMenu('Avanzado')))
  await pausa(2500)
  // la sesión de Empleado, simulada SOLO en este navegador: se reescribe la respuesta de GET /api/auth/me
  rutaEmpleado = async route => {
    const r = await route.fetch()
    let j = await r.json().catch(() => null)
    if (j && j.type === 'member') j = { ...j, role: 'empleado', permissions: P.permisosEmpleado }
    S.authMeInterceptado = (S.authMeInterceptado ?? 0) + 1
    await route.fulfill({ response: r, json: j })
  }
  await page.route('**/api/auth/me', rutaEmpleado)
  mark('b-recarga')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await esperar('b-carga', async t => {
    await enMenu('Historial').waitFor({ state: 'visible', timeout: t })
    await esperarPanel()
    S.filtroPedidos.empleado = await filtrarPedidos7d()
    await page.mouse.move(1430, 890)
    await pausa(1200)
  })
  S.pedidosVisibles = await page.evaluate(() => [...document.querySelectorAll('main')].map(m => m.innerText.slice(0, 900))[0])
  S.menuEmpleado = await textoMenu()
  S.subsPedidosEmpleado = await subsAbiertas()
  S.urlEmpleado = page.url()
  const bFilas = await Promise.all(['Pedidos', 'Clientes', 'Productos', 'Mensajes'].map(t => caja(filaMenu(t))))
  mark('b-empleado', { box: await caja(aside) })
  mark('foco', { foco: 'dia-a-dia', box: bFilas.reduce((a, b) => une(a, b), bFilas[0]) })
  await pausa(5000)                                  // quieto hasta el final de la frase 10
  mark('b-fin')
  await page.unroute('**/api/auth/me', rutaEmpleado); rutaEmpleado = null

  // ── C · Tu equipo (frases 11–16) ──────────────────────────────────────
  await page.goto(PANEL('pedidos'), { waitUntil: 'domcontentloaded' })
  await enMenu('Inicio').waitFor({ state: 'visible', timeout: 30000 })      // dueño de nuevo
  await esperarPanel()
  S.filtroPedidos.c = await filtrarPedidos7d()
  await page.mouse.move(860, 470)
  await pausa(1200)
  S.menuDuenoDeVuelta = await textoMenu()
  mark('sC'); g.cursor(1)
  await pausa(600)
  await clic(filaMenu('Configuración'), 'nav-configuracion', { ms: 700, dx: .3, antes: 400 })
  await esperar('subs-config', t => enMenu('Equipo').waitFor({ state: 'visible', timeout: t }))
  await pausa(450)
  await clic(enMenu('Equipo'), 'nav-equipo', { ms: 500, dx: .3, antes: 250 })
  await esperar('equipo-carga', async t => {
    await page.getByText('Equipo y permisos', { exact: true }).first().waitFor({ timeout: t })
    await page.getByRole('button', { name: 'Gestionar roles' }).waitFor({ timeout: t })
    await esperarPanel()
    await pausa(500)
  })
  const bTabla = await page.locator('.ds-tabla').first().boundingBox().catch(() => null)
  if (bTabla) mark('desenfocar', { box: { x: bTabla.x, y: bTabla.y, w: bTabla.width, h: bTabla.height }, motivo: 'P4 miembros (nombre y email del dueño)' })
  S.emails.equipo = await emailsVisibles()
  mark('equipo')
  await pausa(900)
  // frase 12: Invitar miembro, SIN clic
  const invitar = page.getByRole('button', { name: 'Invitar miembro' })
  const gestionar = page.getByRole('button', { name: 'Gestionar roles' })
  const bInv = await caja(invitar), bGes = await caja(gestionar)
  mark('c-botones', { foco: 'botones-equipo', box: une(bInv, bGes, 12) })
  await mover(...centro(bInv), 700)
  mark('invitar', { box: bInv })
  await pausa(3600)
  // frase 13: Gestionar roles → tarjetas
  await mover(...centro(bGes), 600)
  mark('gestionar', { box: bGes })
  await pausa(800)
  await clic(gestionar, 'gestionar-roles', { ms: 150, antes: 80 })
  await esperar('roles-carga', t => page.getByText('Permisos incluidos').first().waitFor({ timeout: t }))
  await pausa(500)
  const tarjetas = await page.evaluate(() => {
    const ts = [...document.querySelectorAll('div')].filter(d => /permisos incluidos/i.test(d.innerText) && /(Ver permisos|Editar rol)/.test(d.innerText) && d.getBoundingClientRect().width < 500)
    // la tarjeta = el contenedor más grande que no incluye a otra tarjeta
    const top = ts.filter(d => !ts.some(o => o !== d && d.contains(o) === false && o.contains(d)))
    return top.map(d => { const b = d.getBoundingClientRect(); return { texto: d.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean), box: { x: b.x, y: b.y, w: b.width, h: b.height } } })
  })
  S.p3 = { tarjetas: tarjetas.map(t => t.texto) }
  const tEmp = tarjetas.find(t => t.texto.some(l => /^Empleado$/i.test(l)))
  if (!tEmp) throw new Error('No encontré la tarjeta del rol Empleado: ' + JSON.stringify(S.p3))
  const dentro = b => ({ x0: tEmp.box.x - 1, x1: tEmp.box.x + tEmp.box.w, y0: tEmp.box.y - 1, y1: tEmp.box.y + tEmp.box.h })
  const bVerCli = await cajaTxt(P.permiso, { ...dentro(), sube: 1 })
  S.p3.verClientesEnTarjeta = !!bVerCli
  mark('roles', { foco: 'tarjeta-empleado', box: tEmp.box })
  if (bVerCli) hl('ver-clientes-antes', bVerCli)
  await pausa(2600)
  // frase 14: Ver permisos → modal → scroll → destildar
  const verPermIdx = await page.evaluate(b => [...document.querySelectorAll('button')].findIndex(x => { const r = x.getBoundingClientRect(); return x.innerText.trim() === 'Ver permisos' && r.x >= b.x && r.x <= b.x + b.w && r.y >= b.y && r.y <= b.y + b.h }), tEmp.box)
  if (verPermIdx < 0) throw new Error('No encontré "Ver permisos" en la tarjeta Empleado')
  const verPerm = page.locator('button').nth(verPermIdx)
  const bVerPerm = await caja(verPerm)
  await mover(...centro(bVerPerm), 600)
  mark('ver-permisos', { box: bVerPerm })
  await pausa(600)
  await clic(verPerm, 'ver-permisos', { ms: 120, antes: 60 })
  const dlg = page.locator('[role=dialog]').last()
  await esperar('modal-abre', async t => { await page.getByText('Editar rol: Empleado').first().waitFor({ timeout: t }); await pausa(450) })
  // el contenedor que se desliza (58vh): se le pone un atributo para ubicarlo (solo DOM del navegador)
  const lista = await page.evaluate(() => {
    const d = [...document.querySelectorAll('div')].find(x => x.style.maxHeight === '58vh')
    if (!d) return null
    d.setAttribute('data-v', 'lista-permisos')
    const b = d.getBoundingClientRect()
    const grupos = [...d.querySelectorAll('span')].filter(s => s.style.fontWeight === '600' && s.style.fontSize === '14px').map(s => {
      const g = s.parentElement.parentElement, r = g.getBoundingClientRect()
      return { g: s.innerText.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom) }
    })
    const marcados = [...d.querySelectorAll('button')].filter(x => { const s = x.querySelector('span'); return s && s.style.width === '22px' && s.querySelector('svg') }).map(x => x.innerText.trim().split('\n')[0])
    return { box: { x: b.x, y: b.y, w: b.width, h: b.height }, scrollTop: d.scrollTop, scrollMax: d.scrollHeight - d.clientHeight, grupos, marcados }
  })
  if (!lista) throw new Error('No encontré la lista de permisos del modal')
  S.p3.permisosTildados = lista.marcados
  // P9: los grupos van en orden alfabético (Avanzado, Catálogo, Clientes, …, Pedidos 8.º): Pedidos y Clientes
  // NO entran juntos (≈ 680 px vs 522 px de lista). Se desliza lo justo para que Clientes quede entero
  // abajo (con Catálogo arriba) y el pie del modal (Guardar cambios / Cancelar) en el mismo cuadro.
  const gCli = lista.grupos.find(x => x.g === 'Clientes'), gPed = lista.grupos.find(x => x.g === 'Pedidos')
  const fondo = lista.box.y + lista.box.h
  const dyScroll = Math.max(0, Math.min(Math.round(gCli.bottom - fondo + 36), lista.scrollMax))
  S.p9 = { lista: lista.box, grupos: lista.grupos, scrollMax: lista.scrollMax, dy: dyScroll, pedidosYClientesJuntos: (gPed.bottom - gCli.top) <= lista.box.h }
  mark('modal', { box: lista.box })
  await mover(lista.box.x + lista.box.w * .5, lista.box.y + lista.box.h * .55, 500)   // el mouse sobre la lista
  await pausa(300)
  S.p9.scrollReal = await scrollSuave(dyScroll, 'modal-scroll', { ms: 1000, sel: '[data-v=lista-permisos]', zona: lista.box })
  await pausa(500)
  S.p9.despues = await page.evaluate(() => {
    const d = document.querySelector('[data-v=lista-permisos]'), b = d.getBoundingClientRect()
    return [...d.querySelectorAll('span')].filter(s => s.style.fontWeight === '600' && s.style.fontSize === '14px').map(s => { const r = s.parentElement.parentElement.getBoundingClientRect(); return { g: s.innerText.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom), entero: r.top >= b.top - 1 && r.bottom <= b.bottom + 1 } }).filter(x => x.bottom > b.top && x.top < b.bottom)
  })
  mark('modal-scroll-fin')
  const permBtn = page.locator('[data-v=lista-permisos] button').filter({ has: page.getByText(P.permiso, { exact: true }) }).first()
  const bPerm = await caja(permBtn)
  mark('foco', { foco: 'permiso', box: bPerm })
  await mover(bPerm.x + 36, bPerm.y + bPerm.h / 2, 600)
  await pausa(500)
  await clic(permBtn, 'destildar', { dx: .1, ms: 150, antes: 80 })
  await pausa(300)
  S.p3.destildado = await permBtn.evaluate(b => !b.querySelector('span').querySelector('svg'))
  mark('destildado', { box: bPerm })
  hl('ver-clientes-off', bPerm)
  await pausa(2200)
  // frase 15: Guardar cambios, SIN clic
  const guardar = page.getByRole('button', { name: 'Guardar cambios' }).last()
  const cancelar = page.getByRole('button', { name: 'Cancelar', exact: true }).last()
  const bGua = await caja(guardar), bCan = await caja(cancelar)
  mark('pie-modal', { foco: 'pie', box: une(bPerm, une(bGua, bCan), 12) })
  await mover(...centro(bGua), 700)
  mark('guardar', { box: bGua })
  await pausa(1800)
  // frase 16: Cancelar (sale sin guardar)
  await mover(...centro(bCan), 900)
  mark('cancelar', { box: bCan })
  await pausa(1200)
  await clic(cancelar, 'cancelar', { ms: 120, antes: 60 })
  await esperar('modal-cierra', t => page.getByText('Editar rol: Empleado').first().waitFor({ state: 'hidden', timeout: t }))
  await pausa(300)
  const bVerCli2 = await cajaTxt(P.permiso, { ...dentro(), sube: 1 })
  S.p3.siguieIgual = !!bVerCli2
  mark('cancelado', { foco: 'tarjeta-empleado', box: tEmp.box })
  if (bVerCli2) hl('ver-clientes-sigue', bVerCli2)
  await mover(tEmp.box.x + tEmp.box.w + 60, tEmp.box.y + tEmp.box.h * .6, 700)   // el cursor no tapa la tarjeta
  await pausa(2600)                                  // tramo protegido "Sigue igual"
  mark('c-fin')

  // ── D · Buscador y campana (frases 17–18) ─────────────────────────────
  g.cursor(0)
  await page.goto(PANEL('dashboard'), { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=/Buen(as|os) /', { timeout: 30000 })
  await esperarPanel()
  S.alertasOcultas.D = await ocultarAlertasInicio()
  await page.mouse.move(860, 470)
  await pausa(1500)
  mark('sD')
  { const b = await cajaSaludo(); if (b) mark('desenfocar', { box: b, motivo: 'P4 saludo', hasta: 'd-fin' }) }; g.cursor(1)
  const bBus = await caja(barra.buscar)
  mark('d-buscador', { foco: 'buscador', box: bBus })
  await mover(bBus.x + bBus.w * .3, bBus.y + bBus.h / 2, 800)
  await pausa(400)
  await clic(barra.buscar, 'buscar', { ms: 100, dx: .3, antes: 60 })
  await pausa(300)
  await tipear(P.buscar, 'buscar', 120)
  await esperar('resultados', async t => {
    await page.locator('.admin-search-wrap').getByText('Buzo Canguro Gris Claro').first().waitFor({ state: 'visible', timeout: t })
    await pausa(400)
  })
  const res = await page.evaluate(() => {
    const pop = [...document.querySelectorAll('.admin-search-wrap > div')].find(d => d.style.position === 'absolute')
    const filas = pop ? [...pop.querySelectorAll('a, button, li, div')].filter(x => /Buzo Canguro Gris Claro/.test(x.innerText)).map(x => x.getBoundingClientRect()).filter(r => r.height >= 30) : []
    filas.sort((a, b) => a.height - b.height)
    const bx = r => r && ({ x: r.x, y: r.y, w: r.width, h: r.height })
    return { texto: pop?.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean), pop: bx(pop?.getBoundingClientRect()), fila: bx(filas[0]), borrador: /Borrador/.test(pop?.innerText ?? '') }
  })
  S.p5 = res
  mark('busqueda', { foco: 'resultados', box: res.pop ? une(bBus, res.pop, 6) : bBus })
  if (res.fila) hl('buzo-buscador', res.fila)
  await pausa(3200)                                  // tramo protegido + desplegable abierto ≥ 2,5 s
  mark('busqueda-fin')
  await page.keyboard.press('Escape'); await pausa(200)
  await barra.buscar.fill(''); await page.mouse.click(860, 560)
  await pausa(500)
  // campana: se abre y no se toca nada adentro (marcar uno leído sería escribir)
  const bCam = await caja(barra.campana)
  await mover(...centro(bCam), 700)
  await pausa(300)
  await clic(barra.campana, 'campana', { ms: 100, antes: 60 })
  await esperar('notificaciones', async t => {
    await page.locator('.admin-notif-pop').waitFor({ state: 'visible', timeout: t })
    await page.waitForFunction(() => { const p = document.querySelector('.admin-notif-pop'); return p && !p.querySelector('.admin-notif-list > [aria-hidden="true"]') }, null, { timeout: t })
    await pausa(300)
  })
  const notif = await page.evaluate(() => {
    const p = document.querySelector('.admin-notif-pop'), b = p.getBoundingClientRect()
    const items = [...p.querySelectorAll('.admin-notif-list > div')].map(d => { const r = d.getBoundingClientRect(); return { texto: d.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean), box: { x: r.x, y: r.y, w: r.width, h: r.height } } })
    return { pop: { x: b.x, y: b.y, w: b.width, h: b.height }, texto: p.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean), items }
  })
  S.p11 = notif
  await mover(bCam.x - 420, bCam.y + 380, 700)       // el cursor sale del panel sin tocarlo
  mark('campana', { foco: 'notificaciones', box: notif.pop })
  if (notif.items[0]) hl('aviso-1', notif.items[0].box)
  await pausa(3200)
  mark('d-fin')

  // ── E · Orbi (frases 19–21) e iniciales → Ir a la tienda (22) ─────────
  g.cursor(0)
  await page.reload({ waitUntil: 'domcontentloaded' })                     // P7: Orbi abre vacío
  await page.waitForSelector('text=/Buen(as|os) /', { timeout: 30000 })
  await esperarPanel()
  S.alertasOcultas.E = await ocultarAlertasInicio()
  await page.mouse.move(860, 470)
  await pausa(1500)
  mark('sE')
  { const b = await cajaSaludo(); if (b) mark('desenfocar', { box: b, motivo: 'P4 saludo', hasta: 'orbi' }) }; g.cursor(1)
  const bOrbi = await caja(barra.orbi)
  await mover(...centro(bOrbi), 800)
  await pausa(400)
  await clic(barra.orbi, 'orbi', { ms: 100, antes: 60 })
  const sug = page.getByText(P.pregunta, { exact: true }).last()
  await esperar('orbi-abre', t => sug.waitFor({ state: 'visible', timeout: t }))
  await pausa(500)
  const panelOrbi = () => page.evaluate(() => {
    const cerrar = document.querySelector('button[aria-label="Cerrar Orbi"]')
    let c = cerrar; while (c && c.getBoundingClientRect().height < 600) c = c.parentElement
    const r = c?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height, texto: c.innerText }
  })
  const pO = await panelOrbi()
  const bPanelOrbi = pO && { x: pO.x, y: pO.y, w: pO.w, h: pO.h }
  S.orbiPanel = bPanelOrbi
  S.orbiVacio = /Hola, soy Orbi/.test(pO?.texto ?? '')
  mark('orbi', { foco: 'orbi', box: bPanelOrbi })
  await pausa(1500)
  const bSug = await caja(sug)
  await mover(bSug.x + 40, bSug.y + bSug.h / 2, 600)
  await pausa(300)
  await clic(sug, 'orbi-pregunta', { dx: .2, ms: 100, antes: 60 })
  await pausa(400)
  const enviar = page.locator('button[aria-label="Enviar"]').last()
  const bEnv = await caja(enviar)
  const bCaja = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Enviar"]')].at(-1); let c = b; for (let i = 0; i < 6 && c; i++) { c = c.parentElement; const r = c.getBoundingClientRect(); if (r.width > 280 && r.height > 50) return { x: r.x, y: r.y, w: r.width, h: r.height } } return null })
  S.orbiCaja = { caja: bCaja, texto: await page.evaluate(() => [...document.querySelectorAll('textarea')].at(-1)?.value ?? null) }
  mark('orbi-caja', { foco: 'caja-orbi', box: bCaja ?? bEnv })
  hl('enviar', bEnv)
  await mover(...centro(bEnv), 700)
  await pausa(1000)                                  // caja con la pregunta + llamada "Enviar"
  await clic(enviar, 'orbi-enviar', { ms: 100, antes: 60 })
  await esperar('orbi-respuesta', async t => {
    if (ENSAYO) { await pausa(2500); return }        // ensayo: el POST está bloqueado, Orbi no contesta
    const largo = async () => (await panelOrbi())?.texto.length ?? 0
    const fin = Date.now() + t, l0 = await largo()
    let ult = l0, quieto = Date.now()
    while (Date.now() < fin) {
      await pausa(300)
      const l = await largo()
      if (l !== ult) { ult = l; quieto = Date.now() } else if (l > l0 + 60 && Date.now() - quieto > 1800) return
    }
    throw new Error('Orbi no contestó a tiempo')
  }, 90000)
  await mover(bEnv.x - 160, bEnv.y - 380, 600)       // el cursor no tapa la respuesta
  mark('orbi-respuesta', { foco: 'orbi', box: bPanelOrbi })
  S.orbiRespuesta = ((await panelOrbi())?.texto ?? '').slice(-1500)
  await pausa(3500)                                  // tramo protegido de la respuesta
  mark('orbi-respuesta-fin')
  const cerrarOrbi = page.locator('button[aria-label="Cerrar Orbi"]').first()
  await clic(cerrarOrbi, 'orbi-cerrar', { ms: 600, antes: 200 })
  await cerrarOrbi.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  await pausa(900)
  const bAv = await caja(barra.avatar)
  await mover(...centro(bAv), 900)
  mark('iniciales', { box: bAv })
  await pausa(700)
  await clic(barra.avatar, 'avatar', { ms: 100, antes: 60 })
  const irTienda = page.getByRole('button', { name: 'Ir a la tienda', exact: true })
  await esperar('menu-avatar', t => irTienda.waitFor({ state: 'visible', timeout: t }))
  await pausa(300)
  const datosDueno = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Mi perfil'); const menu = b?.parentElement?.parentElement; const cab = menu?.firstElementChild; const r = cab?.getBoundingClientRect(), m = menu?.getBoundingClientRect(); return { cab: r && { x: r.x, y: r.y, w: r.width, h: r.height }, menu: m && { x: m.x, y: m.y, w: m.width, h: m.height } } })
  if (datosDueno.cab) mark('desenfocar', { box: datosDueno.cab, motivo: 'P4 nombre y email del dueño (menú de las iniciales)' })
  S.emails.avatar = await emailsVisibles()
  S.menuIniciales = datosDueno
  const bIr = await caja(irTienda)
  mark('menu-iniciales', { foco: 'menu-iniciales', box: datosDueno.menu ?? bIr })
  hl('ir-tienda', bIr)
  await mover(bIr.x + 50, bIr.y + bIr.h / 2, 700)
  await pausa(900)
  await clic(irTienda, 'ir-tienda', { dx: .3, ms: 100, antes: 60 })
  await esperar('tienda-carga', async t => {
    await page.waitForURL(u => !/\/admin/.test(String(u)), { timeout: t })
    await page.mouse.move(760, 450)                  // mouse sobre el banner: el carrusel no rota (Inicio.tsx:1381)
    await page.waitForLoadState('domcontentloaded')
    await page.mouse.move(762, 452)
    await page.getByText('Comprá por categoría').first().waitFor({ timeout: t }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.mouse.move(760, 450)
    await pausa(1500)
  })
  g.cursor(0)

  // ── F · La tienda (frases 2–3, 23 y placa) ────────────────────────────
  // y de página del encabezado VISIBLE más abajo con ese texto (el banner 2 del carrusel también dice "Recién llegados")
  const posTienda = () => page.evaluate(() => {
    const y = t => { const rs = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')].filter(x => x.childElementCount === 0 && x.innerText?.trim() === t).map(x => x.getBoundingClientRect()).filter(r => r.height > 0); const r = rs.sort((a, b) => b.top - a.top)[0]; return r ? Math.round(r.top + window.scrollY) : null }
    const banner = [...document.querySelectorAll('h1,h2,p,div')].filter(x => x.childElementCount === 0 && /Básicos que|Buzos de frisa/.test(x.innerText ?? '')).map(x => ({ t: x.innerText.trim(), op: getComputedStyle(x.closest('[style*="opacity"]') ?? x).opacity }))
    return { scrollY: Math.round(window.scrollY), alto: document.documentElement.scrollHeight, categorias: y('Comprá por categoría'), recien: y('Recién llegados'), masVendidos: y('Más vendidos'), video: /Mira nuestro video/i.test(document.body.innerText), banner }
  })
  S.p8 = { ...(await posTienda()), url: page.url() }
  S.p8.pie = await page.evaluate(() => (document.querySelector('footer')?.innerText ?? '').trim().split('\n').map(x => x.trim()).filter(Boolean))
  S.emails.tienda = await page.evaluate(() => document.body.innerText.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [])
  mark('sF'); mark('tienda-arriba')
  await pausa(3000)                                  // portada arriba quieta: frase 2 y la placa
  // frase 3: el banner y la fila "Comprá por categoría" en el mismo cuadro (no baja de ahí)
  if (S.p8.categorias != null) await scrollSuave(Math.max(0, S.p8.categorias + 120 - 880) - S.p8.scrollY, 't-categorias', { sel: null, ms: 1000, zona: 'tienda' })
  await page.mouse.move(760, 380)                    // sigue sobre el banner
  await pausa(300)
  S.p8.enCategorias = await posTienda()
  mark('tienda-categorias')
  await pausa(3000)
  // frase 23: hasta la grilla "Recién llegados" (nunca más abajo de "Más vendidos")
  const p0 = await posTienda()
  if (p0.recien != null) await scrollSuave(Math.max(0, p0.recien - 86) - p0.scrollY, 't-recien', { sel: null, ms: 1600, zona: 'tienda' })
  await page.mouse.move(488, 560)                    // en el hueco entre tarjetas (480–496): ninguna queda en hover
  await pausa(500)
  // tarjeta de cada producto visible: el bloque más grande (< 500 px de ancho) con su nombre y un precio
  const grilla = await page.evaluate(() => {
    const tarjeta = nombre => {
      const e = [...document.querySelectorAll('a, div, article, li')].filter(x => x.innerText?.includes(nombre) && /\$/.test(x.innerText)).map(x => ({ r: x.getBoundingClientRect(), n: x.innerText.length })).filter(o => o.r.top > 60 && o.r.top < 900 && o.r.width < 500 && o.r.height > 0).sort((a, b) => a.n - b.n)
      const r = e.at(-1)?.r; return r && { x: r.x, y: r.y, w: r.width, h: r.height }
    }
    return { cards: ['Buzo Canguro Gris Claro', 'Pack x2 Remeras Negras', 'Remera Verde Oliva', 'Remera Básica Blanca'].map(n => ({ n, box: tarjeta(n) })).filter(c => c.box).sort((a, b) => a.box.x - b.box.x) }
  })
  const bBuzoT = grilla.cards.find(c => c.n === 'Buzo Canguro Gris Claro')?.box
  S.p8.despuesDelScroll = await posTienda()
  S.p8.grilla = grilla
  S.p8.buzoEnCuadro = bBuzoT
  mark('recien', { foco: 'recien-llegados', box: bBuzoT })
  if (bBuzoT) hl('buzo-tienda', bBuzoT)
  await pausa(3500)                                  // tramo protegido de la tienda
  mark('f-fin')

  // ── G · Productos → Lista de productos (respaldo, P10) ────────────────
  await page.goto(PANEL('catalogo'), { waitUntil: 'domcontentloaded' })
  await page.getByText('Buzo Canguro Gris Claro').first().waitFor({ timeout: 30000 }).catch(() => {})
  await esperarPanel()
  await page.mouse.move(1430, 890)
  await pausa(1500)
  S.listaProductos = await page.evaluate(() => (document.querySelector('main')?.innerText ?? '').slice(0, 1500))
  mark('sG'); mark('productos-lista')
  await pausa(2500)
  mark('g-fin')
} catch (err) { await g.error(err); S.error = String(err) } finally {
  if (rutaEmpleado) await page.unroute('**/api/auth/me', rutaEmpleado).catch(() => {})
  // P2: el modo del menú vuelve a "Al pasar el mouse" (localStorage del perfil de grabación)
  try {
    if (!/negocio\.orbita\.site/.test(page.url())) await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    S.modoRestaurado = await ponerModo('hover')
  } catch (e) { S.modoRestaurado = 'ERROR: ' + e }
  fs.writeFileSync(path.join(g.DIR, 'sondeo.json'), JSON.stringify(S, null, 1))
  await g.terminar({ buscar: P.buscar, pregunta: P.pregunta, permiso: P.permiso })
}
