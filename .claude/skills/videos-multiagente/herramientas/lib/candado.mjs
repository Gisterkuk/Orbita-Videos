// Cerraduras entre procesos y entre agentes que trabajan en paralelo (varios videos a la vez).
// Dos nombres en uso:
//   'perfil' → el perfil de navegador del panel (~/orbita-videos/perfil). Lo toma solo abrirSesion() y lo suelta ctx.close():
//              dos navegadores con el mismo perfil rompen la sesión (el token de renovación rota y el servidor revoca todo).
//              Se considera huérfana si el proceso que la tomó ya no existe.
//   'demo'   → la ventana en la que un video cambia la configuración del negocio de demo (de la primera escritura a la
//              reversión): mientras alguien la tiene, ningún otro video escribe ni graba la tienda. Se toma y se suelta
//              con herramientas/candado.mjs; como lo toma un comando que termina, vence por tiempo (VENCE_MIN).
// Atómica: crear el directorio falla si ya existe. Sin dependencias.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DIR = path.join(process.env.ORBITA_VIDEOS ?? path.join(os.homedir(), 'orbita-videos'), '.candados')
const VENCE_MIN = { perfil: 90, demo: 120, render: 90 }
const dormir = ms => new Promise(r => setTimeout(r, ms))
const ruta = nombre => path.join(DIR, nombre + '.lock')
const vivo = pid => { try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' } }

export function leerCandado(nombre) {
  try { return JSON.parse(fs.readFileSync(path.join(ruta(nombre), 'dueno.json'), 'utf8')) } catch { return null }
}

function huerfano(nombre, d) {
  if (!d) return true // directorio sin dueño: quedó a medio crear
  if (Date.now() - d.ts > (VENCE_MIN[nombre] ?? 60) * 60_000) return true
  return nombre === 'perfil' && d.pid && !vivo(d.pid)
}

// Toma la cerradura; espera hasta `esperaMin` minutos. Devuelve una función que la suelta.
export async function tomarCandado(nombre, { quien = 'sin-nombre', esperaMin = 90, pid = process.pid } = {}) {
  fs.mkdirSync(DIR, { recursive: true })
  const limite = Date.now() + esperaMin * 60_000
  let avisado = false
  for (;;) {
    try {
      fs.mkdirSync(ruta(nombre))
      fs.writeFileSync(path.join(ruta(nombre), 'dueno.json'), JSON.stringify({ quien, pid, ts: Date.now() }))
      let suelta = false
      return () => { if (suelta) return; suelta = true; if (leerCandado(nombre)?.ts) fs.rmSync(ruta(nombre), { recursive: true, force: true }) }
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
      const d = leerCandado(nombre)
      if (huerfano(nombre, d)) { fs.rmSync(ruta(nombre), { recursive: true, force: true }); continue }
      // 'demo' y 'render' son de un VIDEO (quien = su slug): si la tiene el mismo video, entra sin esperar. Sirve cuando un
      // comando "esperando" del video la gana mientras otro del mismo video ya la necesita. 'perfil' no: ahí quien es solo
      // carpeta:script y dos procesos iguales no pueden compartir el navegador.
      if (nombre !== 'perfil' && d.quien === quien) {
        fs.writeFileSync(path.join(ruta(nombre), 'dueno.json'), JSON.stringify({ quien, pid, ts: Date.now() }))
        let suelta = false
        return () => { if (suelta) return; suelta = true; if (leerCandado(nombre)?.quien === quien) fs.rmSync(ruta(nombre), { recursive: true, force: true }) }
      }
      if (!avisado) { console.log(`[candado ${nombre}] ocupado por ${d.quien} (desde ${new Date(d.ts).toLocaleTimeString('es-AR')}): espero…`); avisado = true }
      if (Date.now() > limite) throw new Error(`candado "${nombre}" ocupado por ${d.quien} después de ${esperaMin} min`)
      await dormir(4000)
    }
  }
}

// Soltar a mano (comando candado.mjs liberar). Solo lo suelta su dueño, salvo force.
export function soltarCandado(nombre, quien, force = false) {
  const d = leerCandado(nombre)
  if (!d) return 'libre'
  if (!force && quien && d.quien !== quien) return `no es tuyo (dueño: ${d.quien})`
  fs.rmSync(ruta(nombre), { recursive: true, force: true })
  return 'liberado'
}
