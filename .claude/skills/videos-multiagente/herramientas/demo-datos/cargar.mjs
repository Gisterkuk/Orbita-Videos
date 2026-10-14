// Carga el negocio de demo con datos ficticios creíbles (herramientas/demo-datos/datos.json) por la
// API del panel, con la sesión de la persona (perfil persistente: nunca se escribe una contraseña).
// ESCRIBE EN PRODUCCIÓN: sin --confirmo solo muestra el plan. El director pasa --confirmo recién
// cuando la persona lo aprobó en el chat. Cada cosa creada queda en ~/orbita-videos/demo-manifiesto.json.
//   node herramientas/demo-datos/cargar.mjs [--datos <json>]            → plan (no escribe)
//   node herramientas/demo-datos/cargar.mjs --confirmo [--datos <json>] → crea
//   node herramientas/demo-datos/cargar.mjs --limpiar --confirmo        → borra productos y categorías del manifiesto
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VIDEOS_DIR } from '../lib/deps.mjs'
import { conectarApi } from './conexion.mjs'
import { cargar, limpiar } from './lib.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined }
const DATOS = JSON.parse(fs.readFileSync(opt('datos') ?? path.join(AQUI, 'datos.json'), 'utf8'))
const MAN = path.join(VIDEOS_DIR, 'demo-manifiesto.json')
const manifiesto = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { negocio: null, creado: [] }
manifiesto.creado ??= []
const guardar = () => fs.writeFileSync(MAN, JSON.stringify(manifiesto, null, 1))

const plan = args.includes('--limpiar')
  ? `Borrar ${manifiesto.creado.filter(c => c.tipo === 'producto').length} productos y ${manifiesto.creado.filter(c => c.tipo === 'categoria').length} categorías del manifiesto`
  : `Usar ${DATOS.categorias.filter(c => c.existente).length} categorías existentes, crear ${DATOS.categorias.filter(c => !c.existente).length}, ${DATOS.productos.length} productos (${DATOS.productos.reduce((s, p) => s + (p.fotos?.length ?? 0), 0)} fotos), ${DATOS.clientes.length} clientes ficticios sin email y ${DATOS.pedidos.length} pedidos (sin avisar por mail)`
console.log('Plan:', plan)
if (!args.includes('--confirmo')) { console.log('(solo plan: agregá --confirmo cuando la persona lo apruebe)'); process.exit(0) }

const { api, subir, negocio, cerrar } = await conectarApi()
if (manifiesto.negocio && manifiesto.negocio !== negocio) { console.log(`⚠ El manifiesto es de "${manifiesto.negocio}" y la sesión es de "${negocio}": no toco nada`); await cerrar(); process.exit(3) }
manifiesto.negocio = negocio
const subirFoto = (productoId, archivo) => subir(`/products/${productoId}/images`, archivo, fs.readFileSync(path.join(AQUI, 'fotos', archivo)))
try {
  if (args.includes('--limpiar')) { manifiesto.creado = await limpiar(api, manifiesto); console.log('Quedan en el manifiesto (sin DELETE en la API):', manifiesto.creado.length) }
  else { await cargar(api, DATOS, manifiesto, { subirFoto }); console.log('Creado:', manifiesto.creado.length, '→', MAN) }
} finally { guardar(); await cerrar() }
