// Prueba de métodos de captura del panel a 2880×1800 (SOLO LECTURA: escrituras bloqueadas).
// Resultado del 2026-10-12 en referencia/tecnica.md § Captura (gana "forzado").
// Graba 3 s del Inicio con cada método y mide resolución real, cuadros por segundo y nitidez
// del texto en un recorte fijo. Gana el primero con 2880×1800 y ≥ 25 cuadros/s.
//   node <skill>/herramientas/prueba-captura.mjs      (cwd = carpeta de un video; sesión activa)
// Escribe out/prueba-captura/<método>/*.jpg y out/prueba-captura/resumen.json
import fs from 'node:fs'
import { abrirSesion, bloquearEscrituras } from './lib/sesion.mjs'
import { BASE } from './lib/deps.mjs'
import { nitidezDeArchivo } from './lib/nitidez.mjs'

const RECORTE = { x: 1900, y: 160, w: 800, h: 300 }      // px de 2880×1800: los números del Inicio
const SEG = 3

async function grabarScreencast(cdp, dir) {
  const fr = []
  const onFrame = async f => { fr.push(f.data); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}) }
  cdp.on('Page.screencastFrame', onFrame)
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 97, maxWidth: 2880, maxHeight: 1800, everyNthFrame: 1 })
  // la página tiene que cambiar para que el screencast mande cuadros: se mueve el mouse
  return { fr, parar: async () => { await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', onFrame); fr.forEach((d, i) => fs.writeFileSync(`${dir}/${String(i).padStart(4, '0')}.jpg`, Buffer.from(d, 'base64'))); return fr.length } }
}

async function mover(page) {   // movimiento continuo para que haya cambios en pantalla durante la prueba
  const t0 = Date.now()
  while (Date.now() - t0 < SEG * 1000) { const u = (Date.now() - t0) / (SEG * 1000); await page.mouse.move(300 + 900 * u, 400 + 100 * Math.sin(u * 6)); await page.waitForTimeout(16) }
}

const metodos = {
  // (a) screencast con las métricas del dispositivo forzadas a densidad 2
  async screencast({ page, cdp, dir }) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
    const s = await grabarScreencast(cdp, dir); await mover(page); return (await s.parar()) / SEG
  },
  // (b) captura cuadro por cuadro
  async capturas({ page, cdp, dir }) {
    let n = 0; const t0 = Date.now()
    const m = mover(page)
    while (Date.now() - t0 < SEG * 1000) { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 97 }); fs.writeFileSync(`${dir}/${String(n++).padStart(4, '0')}.jpg`, Buffer.from(r.data, 'base64')) }
    await m; return n / SEG
  },
}

async function medir(page, dir, fps) {
  const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'))
  if (!archivos.length) return { fps: 0, dims: null, nitidez: null }
  const primero = `${dir}/${archivos[Math.floor(archivos.length / 2)]}`
  const dims = await page.evaluate(async src => { const i = new Image(); i.src = src; await i.decode(); return [i.naturalWidth, i.naturalHeight] }, 'data:image/jpeg;base64,' + fs.readFileSync(primero).toString('base64'))
  return { fps: +fps.toFixed(1), dims, nitidez: dims[0] >= 2880 ? Math.round(await nitidezDeArchivo(primero, RECORTE)) : null }
}

const res = {}
const preparar = n => { const dir = `out/prueba-captura/${n}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); return dir }
{
  const { ctx, page } = await abrirSesion({ dpr: 2 })
  await bloquearEscrituras(page)
  await page.goto(BASE + '/admin/ventas/dashboard', { waitUntil: 'networkidle' })
  if (/\/login/.test(page.url())) { console.log('⚠ La sesión no está activa: correr herramientas/login.mjs'); await ctx.close(); process.exit(2) }
  await page.waitForTimeout(1500)
  for (const [nombre, fn] of Object.entries(metodos)) {
    const cdp = await ctx.newCDPSession(page), dir = preparar(nombre)
    const fps = await fn({ page, cdp, dir })
    res[nombre] = await medir(page, dir, fps)
    await cdp.detach().catch(() => {})
  }
  // (d) screencast tal cual, con la densidad forzada en el arranque (abrirSesion con dpr 2 ya pasa
  // --force-device-scale-factor=2): es el método que usa el grabador desde 2026-10-12
  {
    const cdp = await ctx.newCDPSession(page), dir = preparar('forzado')
    const s = await grabarScreencast(cdp, dir); await mover(page); res.forzado = await medir(page, dir, (await s.parar()) / SEG)
  }
  await ctx.close()
}
// (c) ventana de 2880×1800 con la página al 200% (otro contexto: nunca dos a la vez con el perfil)
{
  const { ctx, page } = await abrirSesion({ dpr: 1, ancho: 2880, alto: 1800 })
  await bloquearEscrituras(page)
  await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = '2' }) })
  await page.goto(BASE + '/admin/ventas/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const cdp = await ctx.newCDPSession(page), dir = preparar('zoom200')
  const s = await grabarScreencast(cdp, dir); await mover(page); res.zoom200 = await medir(page, dir, (await s.parar()) / SEG)
  await ctx.close()
}
fs.writeFileSync('out/prueba-captura/resumen.json', JSON.stringify(res, null, 1))
console.log(JSON.stringify(res, null, 1))
const ok = Object.entries(res).filter(([, r]) => r.dims?.[0] >= 2880 && r.fps >= 25)
console.log(ok.length ? `→ gana: ${ok[0][0]}` : '→ ningún método cumple 2880×1800 a ≥ 25 cuadros/s')
