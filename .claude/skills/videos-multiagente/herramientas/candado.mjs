// Cerraduras de los videos en paralelo (ver lib/candado.mjs). Por defecto la de escritura en el negocio de demo;
// con --candado render, la de los renders de GPU (uno a la vez: tomala antes de npm run render-* y soltala al terminar).
//   node herramientas/candado.mjs adquirir <video> [--espera min]   toma 'demo' (espera si otro video la tiene)
//   node herramientas/candado.mjs liberar <video> [--force]         la suelta (solo su dueño, salvo --force)
//   node herramientas/candado.mjs estado                            quién tiene qué
// Regla: todo video que va a escribir en el demo (cobros, envíos, datos…) o a grabar su tienda con un estado cambiado
// adquiere 'demo' ANTES de la primera escritura y la libera DESPUÉS de revertir. Vence a los 120 min.
import { tomarCandado, soltarCandado, leerCandado } from './lib/candado.mjs'

const [accion, quien, ...resto] = process.argv.slice(2)
const opt = n => { const i = resto.indexOf('--' + n); return i >= 0 ? resto[i + 1] : undefined }
const NOMBRE = opt('candado') ?? 'demo' // 'demo' (escrituras al negocio de demo) o 'render' (un render de GPU a la vez)
if (accion === 'estado') {
  for (const n of ['perfil', 'demo', 'render']) { const d = leerCandado(n); console.log(n.padEnd(7), d ? `${d.quien} · desde ${new Date(d.ts).toLocaleTimeString('es-AR')}` : 'libre') }
} else if (accion === 'adquirir' && quien) {
  await tomarCandado(NOMBRE, { quien, esperaMin: Number(opt('espera') ?? 90), pid: 0 })
  console.log(`✓ '${NOMBRE}' tomado por ${quien}`)
} else if (accion === 'liberar' && quien) {
  console.log(soltarCandado(NOMBRE, quien, resto.includes('--force')))
} else { console.log('Uso: candado.mjs adquirir|liberar <video> | estado'); process.exit(1) }
