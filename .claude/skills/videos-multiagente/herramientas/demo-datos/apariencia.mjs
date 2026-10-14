// Apariencia de la tienda para los videos: banner (heroSlides) y links del menú (headerLinks).
// PUT /business/storefront-config solo cambia los campos que se mandan (businesses.service.ts
// updateAppearance). Antes de cambiar guarda la config completa en ~/orbita-videos/demo-apariencia-antes.json
// y anota el cambio en el manifiesto. ESCRIBE EN PRODUCCIÓN: sin --confirmo solo muestra el plan.
//   node herramientas/demo-datos/apariencia.mjs [--confirmo]
//   node herramientas/demo-datos/apariencia.mjs --revertir --confirmo   (vuelve heroSlides y headerLinks a la copia)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const MAN = path.join(VIDEOS_DIR, 'demo-manifiesto.json'), ANTES = path.join(VIDEOS_DIR, 'demo-apariencia-antes.json')
const SLIDES = [
  { id: 'demo-basicos', titulo: 'Básicos que\nvan con todo', subtitulo: 'Remeras de algodón desde $15.990.', cta: 'Ver remeras', ctaLink: '/catalogo', foto: 'remeras-negras.jpg' },
  { id: 'demo-nuevos', titulo: 'Recién llegados', subtitulo: 'Buzos de frisa para esta temporada.', cta: 'Ver buzos', ctaLink: '/catalogo', foto: 'buzo-gris.jpg' },
]
const LINKS = [{ id: 'catalogo', on: true, label: 'Catálogo' }, { id: 'masVendidos', on: true, label: 'Más vendidos' }, { id: 'cat:remeras', on: true, label: 'Remeras' }, { id: 'cat:buzos', on: true, label: 'Buzos' }]

console.log(args.includes('--revertir') ? 'Plan: volver el banner y el menú a la copia de antes' : `Plan: banner con ${SLIDES.length} slides (${SLIDES.map(s => s.titulo.replace('\n', ' ')).join(' / ')}) y menú: ${LINKS.map(l => l.label).join(', ')}`)
if (!args.includes('--confirmo')) { console.log('(solo plan: agregá --confirmo cuando la persona lo apruebe)'); process.exit(0) }

const { api, subir, negocio, cerrar } = await conectarApi()
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { negocio, creado: [], cambios: [] }
man.cambios ??= []
if (man.negocio && man.negocio !== negocio) { console.log('⚠ Otro negocio: no toco nada'); await cerrar(); process.exit(3) }
try {
  if (args.includes('--revertir')) {
    const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8'))
    await api.pedir('PUT', '/business/storefront-config', { heroSlides: antes.heroSlides, headerLinks: antes.headerLinks })
    man.cambios.push({ tipo: 'apariencia', accion: 'revertir', fecha: new Date().toISOString() })
    console.log('✓ banner y menú como estaban')
  } else {
    const actual = await api.pedir('GET', '/business/storefront-config')
    if (!fs.existsSync(ANTES)) fs.writeFileSync(ANTES, JSON.stringify(actual, null, 1))
    const base = actual.heroSlides?.[0] ?? {}
    const slides = []
    for (const s of SLIDES) {
      const r = await subir('/business/storefront-config/upload-image', s.foto, fs.readFileSync(path.join(AQUI, 'fotos', s.foto)))
      const { foto, ...resto } = s
      slides.push({ ...base, ...resto, img: r.url ?? r.imageUrl ?? r, bgColor: '', bgPattern: 'none', imageStyle: 'full', imageOverlay: 'tint', imagePosition: 'right', bgPatternScope: 'image' })
    }
    await api.pedir('PUT', '/business/storefront-config', { heroSlides: slides, headerLinks: LINKS })
    man.cambios.push({ tipo: 'apariencia', accion: 'banner+menu', antes: path.basename(ANTES), fecha: new Date().toISOString() })
    console.log('✓ banner:', slides.map(s => s.titulo.replace('\n', ' ')).join(' / '), '· menú:', LINKS.map(l => l.label).join(', '))
  }
} finally { fs.writeFileSync(MAN, JSON.stringify(man, null, 1)); await cerrar() }
