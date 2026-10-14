// "Conocé tu panel" v2 — edición de toma1 según produccion/guion.md (tomas A–F; G no se usa).
//   node editar.mjs --voz ../conoce-tu-panel-v2-hf/voz.json
//     → compose/tl-voz.json, compose/tl-plate.json (placa 2880×1800 con desenfoques),
//       out/voz-tiempos.json, out/sfx-voz.json, out/extras.json (gancho, pantalla partida y
//       posición de cada llamada) y las recreaciones marcadas en ../conoce-tu-panel-v2-hf/video.json
// Cámara: plano general (1) y primer plano 1,35–1,56 (zoomMax 1,6). Llamadas ≤ 30 / 45 caracteres,
// cada una con su objetivo en pantalla y su lado (extras.mjs las ubica): ninguna tapa lo que nombra la voz.
// v2 (revision-v1): B1–B10 y las notas del espectador mudo; ver produccion/estado.md.
import fs from 'node:fs'
import path from 'node:path'
import { crearEdicion } from './herramientas/lib/edicion.mjs'

const TOMA = process.env.TOMA ?? 'toma1'
const HF = '../conoce-tu-panel-v2-hf'
const iv = process.argv.indexOf('--voz')
const voz = iv > 0 ? JSON.parse(fs.readFileSync(process.argv[iv + 1], 'utf8')) : null
const AG = { hueco: .3, max: 4, proteger: [] }
const E = crearEdicion({
  tomas: [{ nombre: TOMA }],
  esperas: { 'equipo-carga': .3, 'b-carga': .3, 'modal-abre': .3, 'resultados': .2, 'notificaciones': .25, 'orbi-respuesta': .6, 'tienda-carga': .3 },
  velocidad: { base: 1.2, tipeo: 1.15 },          // "buzo" se ve entrar letra por letra
  voz, margen: .3, agil: AG, zoomMax: 1.6, outro: 4.6, scrollFactor: { 'modal-scroll': .55 },
})
const { M, F, C, S, centro } = E
const fc = n => centro(F(n).box)
AG.proteger.push(
  [C('expandido').t - .7, C('expandido').t + 1.0],              // el clic en Expandido y el menú que queda abierto
  [M('cancelado'), M('cancelado') + 2.6],                         // "Sigue igual"
  [C('buscar').t, M('busqueda')],                                 // "buzo" letra por letra
  [M('busqueda'), M('busqueda') + 2.6],                           // resultado del buscador
  [C('orbi-pregunta').t, C('orbi-enviar').t + .4],                // la caja con la pregunta y el clic en Enviar
  [M('orbi-respuesta'), M('orbi-respuesta') + 2.6],               // respuesta de Orbi
  [M('ver-permisos') - .1, C('ver-permisos').t + .35],            // el cursor llega a "Ver permisos" y se ve el clic
  [M('recien'), M('recien') + 2.6],                               // Recién llegados
)

// ── Clips (sin solapes) ─────────────────────────────────────────────────
// el scroll a la grilla se VE empezar recién a sStart (scrolls.mjs), 1,45 s después del evento
const T_REC = JSON.parse(fs.readFileSync('out/scrolls-toma1.json', 'utf8')).find(x => x.label === 't-recien').sStart
E.clip(M('sA'), M('a-fin'))                                   // A · Inicio + menú (1–8)
E.clip(M('b-dueno'), M('b-recarga'))                          // B · menú del dueño…
E.clip(M('b-empleado'), M('b-fin'), { xf: .8 })               //   …se funde con el de Empleado (9–10)
E.clip(M('sC'), M('c-fin'))                                   // C · Equipo y roles (11–16)
E.clip(M('sD'), M('d-fin'))                                   // D · buscador y campana (17–18)
E.clip(C('orbi').t - 1.2, C('ir-tienda').t + .35)             // E · Orbi e iniciales (19–22)
E.clip(T_REC - .4, M('recien') + 2.7, { xf: .22 })            // F · la tienda: arranca con el scroll a la grilla (23)
// B10 (ronda 2): el tramo entre abrir la lista de modos y el clic en Expandido se acelera para que el clic y el menú
// queden abiertos ANTES de "queda siempre abierto" (la voz dice "Expandido" a ~4 s de la frase)
E.acelerar(M('modo-lista') + .1, C('expandido').t - .7, 3)
// ronda 3: el menú del dueño antes de la fusión con el de Empleado pasa ×3 (el rótulo y la fusión llegan antes en la frase 9)
E.acelerar(M('b-dueno') + .05, M('b-recarga'), 3)
// ronda 4 (F1): el modal "Editar rol" abre, baja al grupo Clientes y destilda mientras la voz dice "destildás"
E.acelerar(M('modal') + .05, S('modal-scroll').t, 4)
E.acelerar(M('modal-scroll-fin'), C('destildar').t - .5, 3)
E.pausar(M('pie-modal') + .1, 1.6)
E.armar()
const o = s => E.out(s)
const fr = id => { const f = voz.frases.find(x => x.id === id); return { t: o(E.ref(f.desde)) + (f.offset ?? 0), dur: f.dur } }
const f4 = fr('f4').t

// ── Cámara ──────────────────────────────────────────────────────────────
E.general(M('sA'), .5)
E.camara({ o: f4 + 2.0 }, 1.0, 343, 255, 1.5)                 // frase 4: las tarjetas Ventas y Pedidos
E.camara(M('a-riel'), .9, 100, 330, 1.6)                      // frase 5: el riel → el menú se abre
E.camara(C('nav-pedidos').t - .6, .8, 150, 220, 1.5)          // frase 6: Pedidos desplegado
E.camara(M('a-mensajes'), .8, 150, fc('mensajes').y, 1.55)    // frase 7: la fila de Mensajes (recreación)
E.camara(M('a-menu-lateral'), .9, 160, 780, 1.6)              // frase 8: Menú lateral y la lista de modos (letra grande)
E.general(C('expandido').t + 1.7, .9)                         //   …y el menú que queda abierto
E.camara(M('b-dueno'), .3, 400, 333, 1.35)                    // B · el menú (recreación de Empleado)
E.general(M('sC'), .3)                                        // C · frases 11–16
E.camara(C('nav-configuracion').t - .5, .8, 150, 560, 1.5)    //   "Equipo" legible antes del clic
E.general(C('nav-equipo').t + .25, .7)
E.camara(C('gestionar-roles').t + .2, .9, 720, 450, 1)     //   título + Propietario + Empleado en cuadro
E.general(C('ver-permisos').t + .1, .7)
const pDes = centro(C('destildar').box)
E.camara(M('modal') + .05, .6, 720, 430, 1.5)                  //   el modal desde que abre (frase 14)
E.camara(S('modal-scroll').t - .05, .8, pDes.x, pDes.y, 1.6)     //   el grupo Clientes: el destildado se lee
E.camara(M('pie-modal') - .1, .8, 830, 650, 1.45)              //   pie del modal: Guardar / Cancelar (15–16)
E.camara(C('cancelar').t + .05, .7, 720, 450, 1)           //   vuelve a las tarjetas: "Sigue igual"
E.general(M('sD'), .3)                                        // D · frases 17–18
E.camara(M('d-buscador') + .1, .9, 1000, 140, 1.5)
E.camara(M('busqueda') + .65, 2.6, 1000, 140, 1.56)           //   empuje lento en el tramo protegido
E.camara(C('campana').t - .9, .8, 1180, 281, 1.6)
E.general(C('orbi').t - 1.2, .3)                              // E · frases 19–22
E.camara(C('orbi').t - .9, .8, 1100, 330, 1.35)       //   el botón Orbi AI y su clic en cuadro
E.camara(C('orbi').t + 1.6, .9, 1250, 420, 1.6)
E.camara(M('orbi-caja'), .8, 1300, 780, 1.6)                  //   la caja con la pregunta y Enviar
E.camara(C('orbi-enviar').t + .45, .8, 1240, 281, 1.5)        //   la respuesta
E.camara(M('orbi-respuesta') + .05, 2.6, 1240, 281, 1.6)
E.general(C('orbi-cerrar').t + .1, .8)
E.camara(M('iniciales') - .6, .9, 1300, 150, 1.5)
E.general(T_REC - .4, .3)                                     // F · la tienda
E.camara(M('recien') + .25, 2.8, 720, 450, 1)              //   empuje lento hacia el buzo

// ── Cursor en los cortes ────────────────────────────────────────────────
E.cursorCorte(o(M('sC')), 860, 470)
E.cursorCorte(o(M('sD')), 860, 470)
E.cursorCorte(o(C('orbi').t - 1.2), 860, 470)

// ── Foco (oscurece el resto) ────────────────────────────────────────────
E.resaltarCaja('dia-a-dia', M('b-empleado') + 1.1, M('b-fin') - .05, F('dia-a-dia').box)

// ── Llamadas: [desde, hasta, paso, título, bajada, objetivo x, y (px de pantalla), lado] ──
const LL = []
const ll = (a, b, n, t, s, sx, sy, lado) => { E.cartel(a, b, n, t, s); LL.push({ tit: t, sub: s ?? null, sx, sy, lado }) }
const bCfg = C('nav-configuracion').box, bEq = C('nav-equipo').box, bGes = C('gestionar-roles').box, bVp = C('ver-permisos').box
const bPerm = F('permiso').box, bAv = C('avatar').box, bIr = C('ir-tienda').box, bEnv = C('orbi-enviar').box
ll({ o: f4 + .6 }, { o: f4 + 2.0 }, 1, 'Inicio', 'Acá arrancás', 182, 32, 'der')
ll({ o: f4 + 2.9 }, { o: f4 + 3.9 }, 1, 'Ventas', 'Lo que vendiste hoy', 240, 174, 'arriba')
ll({ o: f4 + 3.9 }, { o: fr('f4').t + fr('f4').dur + .2 }, 1, 'Pedidos', 'Los pedidos de hoy', 445, 174, 'arriba')
ll(M('menu-abierto') - .45, C('nav-pedidos').t - .6, 2, 'El menú', 'Pasás el mouse y se abre', 240, 330, 'der')
ll(C('nav-pedidos').t - .6, M('a-mensajes'), 2, 'Pedidos', 'Sus secciones, abajo', 231, 128, 'der')
ll(M('a-mensajes') + .9, M('a-menu-lateral'), 2, '1 conversación sin leer', null, 235, 368, 'der')
ll(M('a-menu-lateral') + .1, C('menu-lateral').t, 2, 'Menú lateral', null, 231, 874, 'der')
ll(C('menu-lateral').t + .2, C('expandido').t - .05, 2, 'Expandido', 'Esta opción deja el menú abierto', 211, 749, 'der')
ll(C('expandido').t - .05, C('expandido').t + 1.7, 2, 'Elegido: Expandido', 'El menú queda siempre abierto', 231, 874, 'der')
ll(M('b-empleado') + 1.1, M('b-fin') - .05, 3, 'Lo del día a día', 'Pedidos, clientes, productos y mensajes', 231, 194, 'der')
ll(M('sC') + .05, C('nav-configuracion').t + .3, 3, 'Configuración', null, bCfg.x + bCfg.w, bCfg.y + bCfg.h / 2, 'der')
ll(C('nav-configuracion').t + .3, M('equipo'), 3, 'Equipo', 'Equipo y permisos', bEq.x + bEq.w, bEq.y + bEq.h / 2, 'der')
ll(M('invitar'), M('gestionar'), 3, 'Invitar miembro', 'Suma a alguien a tu equipo', 1329, 152, 'abajo')
ll(M('gestionar'), C('gestionar-roles').t + .2, 3, 'Gestionar roles', null, bGes.x + bGes.w / 2, bGes.y + bGes.h, 'abajo')
ll(C('gestionar-roles').t + .9, M('ver-permisos'), 3, 'Tildado', null, 780, 380, 'der')
ll(M('ver-permisos'), C('ver-permisos').t + .1, 3, 'Ver permisos', null, bVp.x + bVp.w, bVp.y + bVp.h / 2, 'der')
ll(C('destildar').t + .1, M('guardar') - .05, 3, 'Ver clientes · destildado', null, bPerm.x + bPerm.w, bPerm.y + bPerm.h / 2, 'der')
ll(M('guardar'), M('guardar') + 2.0, 3, 'Guardar cambios', 'Guarda lo que cambiaste', 931, 776, 'abajo')
ll(M('cancelar') - .3, C('cancelar').t + .15, 3, 'Cancelar', 'Sale sin guardar', 806, 776, 'abajo')
ll(C('cancelar').t + .8, M('c-fin'), 3, 'Sigue igual', null, 780, 380, 'der')
const bBu = C('buscar').box
ll(M('d-buscador') + .1, M('busqueda'), 4, 'Buscador', 'Clic acá y escribí lo que buscás', bBu.x + bBu.w / 2, bBu.y + bBu.h, 'abajo')
ll(M('busqueda'), M('busqueda-fin'), 4, 'Buzo Canguro Gris Claro', 'El producto, con foto y precio', 870, 112, 'izq')
ll(C('campana').t + .5, M('d-fin'), 4, 'Nuevo pedido #58', 'Valentina Ruiz', 1041, 146, 'izq')
const bOrbi = C('orbi').box
ll(C('orbi').t - .1, C('orbi').t + 1.6, 5, 'Orbi AI', 'Tu asistente', bOrbi.x, bOrbi.y + bOrbi.h / 2, 'izq')
ll(M('orbi-caja'), C('orbi-enviar').t + .3, 5, 'Enviar', null, bEnv.x, bEnv.y + bEnv.h / 2, 'izq')
ll(M('orbi-respuesta'), M('orbi-respuesta') + 2.6, 5, 'Pedidos #57 y #56', 'Los que tenés sin enviar', 1060, 294, 'izq')
ll(M('iniciales') - .6, C('avatar').t + .1, 6, 'Tus iniciales', null, bAv.x, bAv.y + bAv.h / 2, 'izq')
ll(C('avatar').t + .1, C('ir-tienda').t + .3, 6, 'Ir a la tienda', null, bIr.x, bIr.y + bIr.h / 2, 'izq')
ll(M('recien') - .2, M('recien') + 2.7, 6, 'El mismo buzo del buscador', 'Lo que cargás en el panel', 150, 762, 'arriba')

// ── Sonidos propios ─────────────────────────────────────────────────────
E.sonido(o(M('orbi-respuesta')) - .15, 'sparkle', .45, { pitch: 1.1 })
E.sonido(o(C('ir-tienda').t + .2), 'whoosh', .5, { dur: .8 })

const { tl } = E.escribir({ titulo: 'Conocé tu panel', cierre: 'Tu negocio, en órbita.' })

// ── post: cursor oculto en la recreación (B) y en la tienda (F); placa con desenfoques ──
const TL = JSON.parse(fs.readFileSync(tl, 'utf8'))
// un scroll partido en varios tramos (modo ágil): cada tramo lleva la fracción del scroll que cubre (p0–p1) para que no se repita
const SCRS = JSON.parse(fs.readFileSync('out/scrolls-toma1.json', 'utf8')).filter(x => x.Y > 5)
for (const g of TL.segs) if (g.scroll != null) { const q = SCRS[g.scroll]; g.p0 = +((g.s0 - q.sStart) / (q.sEnd - q.sStart)).toFixed(5); g.p1 = +((g.s1 - q.sStart) / (q.sEnd - q.sStart)).toFixed(5) }
TL.curVis.push({ t: +(o(M('b-dueno')) - .05).toFixed(3), v: 0 }, { t: +(o(M('sC')) + .6).toFixed(3), v: 1 })
TL.curVis.push({ t: +(o(T_REC - .4) - .05).toFixed(3), v: 0 })
TL.curVis.sort((a, b) => a.t - b.t)
// F2: tras Cancelar el cursor sale de la tarjeta Venta y se apoya en la línea "Ver clientes" de Empleado
TL.cur.push({ t: +(o(C('cancelar').t) + .05).toFixed(3), d: .4, x: 700, y: 380 })
// …y se queda ahí: se descarta el movimiento grabado hacia la tarjeta Venta que sigue al clic
const tCan = o(C('cancelar').t)
TL.cur = TL.cur.filter(c => !(c.t > tCan + .06 && c.t < tCan + 1.5 && !(c.x === 700 && c.y === 380)))
TL.cur.sort((a, b) => a.t - b.t)
fs.writeFileSync(tl, JSON.stringify(TL))
// desenfoques en tiempo de FUENTE y px de pantalla (P4 + respuesta de Orbi): los aplica compose/plate.html
const saludoA = { x: 331, y: 85, w: 146, h: 46 }, saludo = { x: 459, y: 85, w: 146, h: 46 }
const desenfoques = [
  { s0: M('sA') - 1, s1: C('expandido').t, box: saludoA, motivo: 'saludo con el nombre del dueño (menú en riel)' },
  { s0: C('expandido').t, s1: C('expandido').t + .7, box: { x: 331, y: 85, w: 274, h: 46 }, motivo: 'saludo mientras el contenido se corre' },
  { s0: C('expandido').t + .7, s1: M('a-fin') + 1, box: saludo, motivo: 'saludo (menú expandido)' },
  { s0: C('nav-equipo').t, s1: C('gestionar-roles').t + .3, box: { x: 268, y: 228, w: 1144, h: 246 }, motivo: 'tabla de Miembros (3 emails reales)' },
  { s0: M('sD') - 1, s1: M('d-fin') + 1, box: saludo, motivo: 'saludo' },
  { s0: C('orbi').t - 1.5, s1: C('ir-tienda').t + .5, box: saludo, motivo: 'saludo' },
  { s0: M('orbi-respuesta') - 6, s1: C('orbi-cerrar').t + .6, box: { x: 1062, y: 322, w: 346, h: 51 }, motivo: 'pedidos de prueba #50 y #49 en la respuesta de Orbi' },
  { s0: C('avatar').t, s1: C('ir-tienda').t + .5, box: { x: 1213, y: 51, w: 214, h: 88 }, motivo: 'nombre y email del dueño (menú de las iniciales)' },
]
fs.writeFileSync('compose/tl-plate.json', JSON.stringify({ ...TL, W: 2880, H: 1800, desenfoques }))

// ── recreaciones marcadas (video.json) y datos de extras (out/extras.json) ──
const VT = JSON.parse(fs.readFileSync('out/voz-tiempos.json', 'utf8')), fv = id => VT.find(x => x.id === id)
const bM = F('mensajes').box
const badge = `<style>#rec-0{outline:none!important}</style>
<div style="position:absolute;left:${bM.x - 4}px;top:${bM.y - 4}px;width:${bM.w + 8}px;height:${bM.h + 8}px;border:2.5px dashed #3B82F6;border-radius:9px"></div>
<div style="position:absolute;left:${bM.x + bM.w - 52}px;top:${bM.y + (bM.h - 18) / 2}px;min-width:18px;height:18px;padding:0 5px;border-radius:9999px;background:#F1F5F9;color:#64748B;font:700 10px/18px 'Geist Mono',ui-monospace,monospace;text-align:center">1</div>`
const VJ = path.join(HF, 'video.json'), V = JSON.parse(fs.readFileSync(VJ, 'utf8'))
V.titulo = 'Conocé tu panel'
V.lista = ['Panel y tienda', 'El menú', 'Tu equipo', 'Buscador y avisos', 'Orbi', 'Tu tienda'].map((t, i) => ({ n: i + 1, t }))
V.recreaciones = [
  { o0: +(fv('f7').t + .8).toFixed(3), o1: +(fv('f7').t + fv('f7').dur + .2).toFixed(3), etiqueta: 'Recreación · el «1» de Mensajes no es real', html: badge },
  // el rótulo entra antes del primer cuadro recreado (la fusión) y sale después del último (el corte a C)
  { o0: +(o(M('b-empleado')) - .1).toFixed(3), o1: +(o(M('sC')) + .2).toFixed(3), etiqueta: 'Recreación · así lo ve un Empleado', html: '' },
]
fs.writeFileSync(VJ, JSON.stringify(V, null, 1))
const frameEn = s => { let f = TL.frames[0]; for (const x of TL.frames) { if (x.s <= s) f = x; else break } return path.resolve('compose', f.f) }
fs.writeFileSync('out/extras.json', JSON.stringify({
  f1: fv('f1'), f2: fv('f2'), f3: fv('f3'),
  pastillas: V.lista.map(l => l.t),
  panel: frameEn(M('a-inicio') + .5), tienda: frameEn(M('tienda-categorias') + .3),
  saludo: saludoA,
  llamadas: LL,
}, null, 1))
console.log('recreaciones:', V.recreaciones.map(r => `${r.o0}–${r.o1}`).join(' · '), '· desenfoques:', desenfoques.length, '· llamadas:', LL.length)
