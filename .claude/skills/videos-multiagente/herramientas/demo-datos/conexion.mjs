// Conexión a la API del panel con la sesión de la persona (perfil persistente): toma la URL de la
// API y el token de los pedidos que hace el propio panel al cargar. Nunca se escribe una contraseña
// ni se copian cookies.   const { api, cerrar, negocio, subir } = await conectarApi()
import { abrirSesion } from '../lib/sesion.mjs'
import { BASE } from '../lib/deps.mjs'

export async function conectarApi() {
  const { ctx, page } = await abrirSesion()
  let API = null, AUTH = null
  page.on('request', r => { const u = r.url(), a = r.headers().authorization; if (!AUTH && a && /\/api\/v1\//.test(u)) { AUTH = a; API = u.slice(0, u.indexOf('/api/v1') + 7) } })
  await page.goto(BASE + '/admin/ventas/dashboard', { waitUntil: 'networkidle' })
  if (/\/login/.test(page.url())) { await ctx.close(); throw Object.assign(new Error('La sesión no está activa: correr herramientas/login.mjs'), { codigo: 2 }) }
  for (let i = 0; i < 20 && !AUTH; i++) await page.waitForTimeout(250)
  if (!AUTH) { await ctx.close(); throw Object.assign(new Error('No pude tomar la sesión del panel'), { codigo: 2 }) }
  const negocio = new URL(page.url()).hostname
  const api = {
    async pedir(metodo, ruta, cuerpo) {
      const r = await page.request.fetch(API + ruta, { method: metodo, headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, data: cuerpo ? JSON.stringify(cuerpo) : undefined })
      if (!r.ok()) throw new Error(`${metodo} ${ruta} → ${r.status()} ${(await r.text()).slice(0, 200)}`)
      return r.status() === 204 ? {} : r.json()
    },
  }
  const subir = async (ruta, archivo, buffer) => {
    const r = await page.request.post(API + ruta, { headers: { Authorization: AUTH }, multipart: { file: { name: archivo, mimeType: /\.png$/i.test(archivo) ? 'image/png' : /\.webp$/i.test(archivo) ? 'image/webp' : 'image/jpeg', buffer } } })
    if (!r.ok()) throw new Error(`subir ${archivo} → ${r.status()} ${(await r.text()).slice(0, 200)}`)
    return r.json()
  }
  return { api, subir, negocio, page, cerrar: () => ctx.close() }
}
