// Limpia la portada de la tienda para los videos: apaga la sección de video (showVideo) y cambia el
// email y el horario del pie (GET/PUT /business/config, businesses.controller.ts:63; el pie los lee en
// StorefrontFooter.tsx:155-162). La API no acepta un email vacío, por eso va uno genérico.
// Antes de cambiar guarda lo que había en ~/orbita-videos/demo-portada-antes.json y anota el cambio en el
// manifiesto. ESCRIBE EN PRODUCCIÓN: sin --confirmo solo muestra el plan.
//   node herramientas/demo-datos/portada.mjs [--confirmo]
//   node herramientas/demo-datos/portada.mjs --revertir --confirmo
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const args = process.argv.slice(2)
const MAN = path.join(VIDEOS_DIR, 'demo-manifiesto.json'), ANTES = path.join(VIDEOS_DIR, 'demo-portada-antes.json')
const CONTACTO = { email: 'contacto@orbita-corp.com', scheduleText: 'Lunes a sábado de 10 a 19 h' }

console.log(args.includes('--revertir') ? 'Plan: volver la sección de video, el email y el horario a la copia de antes' : `Plan: ocultar la sección de video y poner en el pie ${CONTACTO.email} · ${CONTACTO.scheduleText}`)
if (!args.includes('--confirmo')) { console.log('(solo plan: agregá --confirmo cuando la persona lo apruebe)'); process.exit(0) }

const { api, negocio, cerrar } = await conectarApi()
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { negocio, creado: [], cambios: [] }
man.cambios ??= []
if (man.negocio && man.negocio !== negocio) { console.log('⚠ Otro negocio: no toco nada'); await cerrar(); process.exit(3) }
try {
  if (args.includes('--revertir')) {
    const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8'))
    await api.pedir('PUT', '/business/storefront-config', { showVideo: antes.showVideo })
    await api.pedir('PUT', '/business/config', { ...(antes.email ? { email: antes.email } : {}), scheduleText: antes.scheduleText ?? '' })
    man.cambios.push({ tipo: 'portada', accion: 'revertir', fecha: new Date().toISOString() })
    console.log('✓ portada y pie como estaban')
  } else {
    const [apariencia, config] = await Promise.all([api.pedir('GET', '/business/storefront-config'), api.pedir('GET', '/business/config')])
    if (!fs.existsSync(ANTES)) fs.writeFileSync(ANTES, JSON.stringify({ showVideo: apariencia.showVideo, email: config.email ?? null, scheduleText: config.scheduleText ?? null }, null, 1))
    await api.pedir('PUT', '/business/storefront-config', { showVideo: false })
    await api.pedir('PUT', '/business/config', CONTACTO)
    man.cambios.push({ tipo: 'portada', accion: 'sin-video+contacto', antes: path.basename(ANTES), fecha: new Date().toISOString() })
    console.log('✓ sin sección de video · pie:', CONTACTO.email, '·', CONTACTO.scheduleText)
  }
} finally { fs.writeFileSync(MAN, JSON.stringify(man, null, 1)); await cerrar() }
