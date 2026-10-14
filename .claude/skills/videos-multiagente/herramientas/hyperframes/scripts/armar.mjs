// Arma la composición HyperFrames (index.html + compositions/*.html) a partir de la edición
// del tutorial, con la guía "Edición estilo demo de producto" (referencia/estilo.md):
//   - la placa de pantalla (video.json "placa": el panel ya editado, en tiempo de salida)
//   - la línea de tiempo del editor (cámara, cursor, clics, pasos, resaltados, diálogos
//     "Abrir", capítulos, URLs)
//   - la voz partida por frase (voz.json + voz-tiempos.json)
//   - recreaciones marcadas (video.json "recreaciones"): lo que la pantalla real no muestra
// Pasos = llamadas chicas junto al elemento + barra de progreso fina; resaltados = foco que
// oscurece el resto. Escenas como sub-composiciones; el audio en la raíz.
//   node scripts/armar.mjs
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// Configuración del video (video.json): carpeta de la toma, archivos de la línea de tiempo,
// la voz, el título de la apertura y la lista de pasos de la derecha.
const VIDEO = JSON.parse(fs.readFileSync('video.json', 'utf8'))
// src: carpeta del video (relativa a ~/orbita-videos, o una ruta que empiece con "." o absoluta)
const SRC = path.isAbsolute(VIDEO.src) || VIDEO.src.startsWith('.') ? path.resolve(VIDEO.src) : path.join(os.homedir(), 'orbita-videos', VIDEO.src)
const PLACA = VIDEO.placa ?? 'assets/placa.mp4', SFX = VIDEO.sfx ?? 'assets/sfx.wav'
const RECREACIONES = (VIDEO.recreaciones ?? []).map((r, i) => ({ id: 'rec-' + i, ...r }))
const TL = JSON.parse(fs.readFileSync(path.join(SRC, VIDEO.tl), 'utf8'))
const TIEMPOS = JSON.parse(fs.readFileSync(path.join(SRC, VIDEO.tiempos), 'utf8'))
const VOZ = JSON.parse(fs.readFileSync(VIDEO.voz, 'utf8'))
const MUSICA = fs.existsSync('assets/musica.json') ? JSON.parse(fs.readFileSync('assets/musica.json', 'utf8')) : null
const D = +TL.duration.toFixed(3), INTRO = TL.intro, FIN = +(TL.duration - TL.outro).toFixed(3)
const r3 = v => +(+v).toFixed(3)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const sm = u => u * u * u * (u * (u * 6 - 15) + 10), cl = (v, a, b) => Math.min(b, Math.max(a, v))

// ── geometría: ventana del navegador centrada, con el contenido a 1392×870 (pantalla 1440×900 a 0,9667);
// sin tarjetas a los costados, la ventana usa ese lugar y se ve más grande ──
const WIN = { x: 264, y: 34, w: 1392, ch: 44 }, K = WIN.w / 1440
WIN.h = WIN.ch + 900 * K

// ── cámara: cada objetivo (foco en px de pantalla + zoom) → transform del envoltorio #cam ──
function vista(k) {
  const z = Math.max(1, k.z ?? 1), w = 1440 / z, h = 900 / z
  const b = sm(cl((z - 1) / .35, 0, 1))
  let cx = 720 + ((k.x ?? 720) - 720) * b, cy = 450 + ((k.y ?? 450) - 450) * b
  cx = cl(cx, w / 2, 1440 - w / 2); cy = cl(cy, h / 2, 900 - h / 2)
  return { scale: r3(z), x: r3(-(cx - w / 2) * z), y: r3(-(cy - h / 2) * z) }
}
const cam = []
let prevFin = 0
// si el próximo movimiento llega antes de que termine éste (tramos acelerados), éste se acorta en vez de atrasar al siguiente
const camOrden = [...TL.cam].sort((a, b) => a.t - b.t)
camOrden.forEach((k, i) => { const t = Math.max(k.t, prevFin), sig = camOrden[i + 1]?.t ?? Infinity, d = Math.max(.05, Math.min(k.d, Math.max(.3, sig - t))); cam.push({ t: r3(t), d: r3(d), ...vista(k) }); prevFin = t + d })

// estado de la cámara en el segundo t (misma curva que GSAP power2.inOut), para ubicar las llamadas
const p2io = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
function camEn(t) {
  let est = { scale: 1, x: 0, y: 0 }
  for (const k of cam) {
    if (k.t > t) break
    const e = p2io(cl((t - k.t) / k.d, 0, 1))
    est = { scale: est.scale + (k.scale - est.scale) * e, x: est.x + (k.x - est.x) * e, y: est.y + (k.y - est.y) * e }
  }
  return est
}
// px de pantalla (1440×900) → px de salida (1920×1080) con la cámara del segundo t
function aSalida(sx, sy, t) { const c = camEn(t); return { x: WIN.x + (sx * c.scale + c.x) * K, y: WIN.y + WIN.ch + (sy * c.scale + c.y) * K } }

// ── URL de la barra en tiempo de SALIDA (las URLs vienen en tiempo de fuente) ──
const segAt = t => { let i = 0; TL.segs.forEach((s, k) => { if (s.o0 <= t) i = k }); return i }
const srcT = t => { const s = TL.segs[segAt(t)], u = cl((t - s.o0) / Math.max(1e-6, s.o1 - s.o0), 0, 1); return s.s0 + (s.s1 - s.s0) * u }
const urlEn = s => { let u = TL.urls[0]?.u ?? ''; for (const e of TL.urls) if (e.s <= s) u = e.u; return u }
const urls = []
for (let t = 0; t < D; t += .25) { const u = urlEn(srcT(t)); if (!urls.length || urls.at(-1).u !== u) urls.push({ t: r3(t), u }) }

// ── voz: una pista por frase; si dos se pisan, la anterior arranca antes ──
const voz = TIEMPOS.map(x => ({ ...x, f: VOZ.frases.find(f => f.id === x.id) }))
for (let i = voz.length - 2; i >= 0; i--) { const sobra = voz[i].t + voz[i].dur + .08 - voz[i + 1].t; if (sobra > 0) voz[i].t = Math.max(.15, voz[i].t - sobra) }

// ── subtítulos: grupos de hasta ~42 letras, cortando en la puntuación ──
const subs = []
for (const v of voz) {
  // sin subtítulo en el cierre: la frase final ya está escrita en la placa del logo
  if (!v.f || v.t >= FIN) continue
  const ws = v.f.palabrasGuion.map(p => ({ w: p.w, a: r3(v.t + p.a), z: r3(v.t + p.z) }))
  let g = []
  const largo = () => g.reduce((s, x) => s + x.w.length + 1, 0)
  const cerrar = () => { if (g.length) subs.push({ t0: g[0].a, t1: g.at(-1).z, ws: g }); g = [] }
  for (const w of ws) {
    if (g.length && largo() + w.w.length > 42) cerrar()
    g.push(w)
    if (/[.:;?!]$/.test(w.w) && largo() > 14) cerrar()
    else if (/,$/.test(w.w) && largo() > 26) cerrar()
  }
  cerrar()
}
subs.forEach((s, i) => { const sig = subs[i + 1]; s.fin = r3(Math.min(s.t1 + .6, sig ? sig.t0 - .02 : s.t1 + .6)) })

// ── pasos: llamada chica junto a lo que mira la cámara + barra de progreso fina ──
const LISTA = VIDEO.lista
const focoEn = t => { let f = { x: 720, y: 450 }; for (const k of TL.cam) { if (k.t > t) break; f = { x: k.x ?? 720, y: k.y ?? 450 } } return f }
const pasos = TL.caps.map((c, i) => {
  const t = Math.min(c.o1, c.o0 + .7), f = focoEn(t), p = aSalida(f.x, f.y, t)
  const ancho = r3(Math.min(520, 44 + 12.5 * Math.max(c.txt.length, (c.sub ?? '').length * .78)))
  const arriba = p.y - 150 > WIN.y + WIN.ch + 10 || p.y + 150 > WIN.y + WIN.h   // si no entra arriba del elemento, va abajo
  const alto = c.sub ? 76 : 50, yMin = WIN.y + WIN.ch + 12, yMax = WIN.y + WIN.h - alto - 12   // siempre dentro de la ventana
  const x = cl(p.x - ancho / 2, WIN.x + 16, WIN.x + WIN.w - ancho - 16), y = cl(arriba ? p.y - alto - 60 : p.y + 60, yMin, yMax)
  return { id: 'paso-' + i, ...c, x: r3(x), y: r3(y), ancho, arriba, flechaX: r3(cl(p.x - x, 24, ancho - 24)), item: LISTA.findIndex(l => l.n === c.n) }
})

// ── cursor, clics, resaltados, diálogos, capítulos (px de pantalla) ──
const cur = TL.cur.map(k => ({ t: r3(k.t), d: r3(Math.max(.05, k.d)), x: r3(k.x), y: r3(k.y) }))
const curVis = TL.curVis.map(v => ({ t: r3(v.t), v: v.v }))
const posEn = t => { let p = { x: cur[0].x, y: cur[0].y }; for (const k of cur) { if (k.t > t) break; p = { x: k.x, y: k.y } } return p }
const clicks = TL.clicks.map(t => ({ t: r3(t), ...posEn(t) }))
const hl = TL.hl.map((h, i) => ({ id: 'hl-' + i, o0: r3(h.o0), o1: r3(h.o1), boxes: h.boxes.map(b => ({ t: r3(b.t), x: r3(b.x - 10), y: r3(b.y - 10), w: r3(b.w + 20), h: r3(b.h + 20) })) }))
const dialogos = TL.dialogos.map((d, i) => ({ id: 'dlg-' + i, o0: r3(d.o0), click1: r3(d.click1), click2: d.click2 == null ? null : r3(d.click2), click3: r3(d.click3), close: r3(d.close), carpeta: d.carpeta, nombres: d.nombres, fotos: d.fotos.map(f => 'assets/fotos/' + path.basename(f)) }))
const capitulos = TL.capitulos.map((c, i) => ({ id: 'cap-' + i, ...c, o0: r3(c.o0), o1: r3(c.o1) }))

const FONT_FACES = `@font-face { font-family: 'Geist'; font-weight: 100 900; src: url(assets/fonts/geist-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215; }
@font-face { font-family: 'Geist'; font-weight: 100 900; src: url(assets/fonts/geist-latin-ext.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F; }
@font-face { font-family: 'Sora'; font-weight: 100 900; src: url(assets/fonts/sora-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215; }
@font-face { font-family: 'Sora'; font-weight: 100 900; src: url(assets/fonts/sora-latin-ext.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F; }`
// ── helpers de archivo ─────────────────────────────────────────────────────
const clip = (id, t0, t1, track, extra = '') => `id="${id}" class="clip" data-start="${r3(t0)}" data-duration="${r3(Math.max(.04, t1 - t0))}" data-track-index="${track}" ${extra}`
const sub = (id, css, body, script) => `<!doctype html>
<html lang="es"><head><meta charset="UTF-8" /></head>
<body>
<template>
<style>
${FONT_FACES}
#${id} { position: absolute; inset: 0; font-family: 'Geist', sans-serif; color: #F1F5FF; -webkit-font-smoothing: antialiased; }
${css}
</style>
<div id="${id}" data-composition-id="${id}" data-width="1920" data-height="1080">
${body}
</div>
<script>
const tl = gsap.timeline({ paused: true });
const E = { io: 'power2.inOut', o: 'power3.out', o5: 'expo.out', i: 'power2.in' };
${script}
window.__timelines["${id}"] = tl;
</script>
</template>
</body></html>
`
fs.mkdirSync('compositions', { recursive: true })
const escribir = (id, css, body, script) => fs.writeFileSync(`compositions/${id}.html`, sub(id, css, body, script))
const logoSvg = p => `<svg class="logo" viewBox="0 0 88 88" fill="none"><circle cx="44" cy="44" r="18" fill="rgba(96,165,250,.14)"/><g id="${p}-giro"><circle id="${p}-arco" cx="44" cy="44" r="32" stroke-width="3" stroke="#60A5FA" stroke-linecap="round" stroke-dasharray="151 50" transform="rotate(-90 44 44)"/><circle cx="44" cy="12" r="9" fill="rgba(59,130,246,.3)"/><circle id="${p}-sat" cx="44" cy="12" r="5.5" fill="#3B82F6"/></g><circle id="${p}-hub" cx="44" cy="44" r="10" fill="#FFFFFF"/></svg>`
const logoMotion = (p, t0, giro) => `
tl.fromTo('#${p}-hub', { scale: 0, svgOrigin: '44 44' }, { scale: 1, svgOrigin: '44 44', duration: .55, ease: 'back.out(2.2)' }, ${t0});
tl.fromTo('#${p}-arco', { strokeDasharray: '0 201' }, { strokeDasharray: '151 50', duration: .75, ease: E.o }, ${t0 + .07});
tl.fromTo('#${p}-giro', { rotation: 0, svgOrigin: '44 44' }, { rotation: ${giro.rot}, svgOrigin: '44 44', duration: ${giro.dur}, ease: '${giro.ease}' }, ${t0 + .07});
tl.fromTo('#${p}-sat', { scale: 0, svgOrigin: '44 12' }, { scale: 1, svgOrigin: '44 12', duration: .4, ease: 'back.out(2)' }, ${t0 + .3});`

// ── fondo: azul marino + halos + anillos orbitales con satélites ───────────
escribir('fondo', `
#fondo-base { position: absolute; inset: 0; background: #0A1432; }
.halo { position: absolute; border-radius: 50%; }
#halo1 { left: -380px; top: -420px; width: 1300px; height: 1100px; background: radial-gradient(closest-side, rgba(37,99,235,.55), rgba(37,99,235,0)); }
#halo2 { left: 1040px; top: 500px; width: 1300px; height: 1100px; background: radial-gradient(closest-side, rgba(59,130,246,.40), rgba(59,130,246,0)); }
#anillos { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
#grano { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; opacity: .06; mix-blend-mode: overlay; }`,
`<div id="fondo-base"></div><div class="halo" id="halo1"></div><div class="halo" id="halo2"></div>
<svg id="anillos" viewBox="0 0 1920 1080"><g transform="translate(1500 130) rotate(-18)">
${[260, 470, 700, 960, 1240].map((r, i) => `<ellipse rx="${r}" ry="${r * .62}" fill="none" stroke="rgba(147,197,253,${(.16 - i * .022).toFixed(3)})" stroke-width="2"/>`).join('')}
<g id="sat1"><circle cx="470" cy="0" r="12" fill="rgba(147,197,253,.16)"/><circle cx="470" cy="0" r="5" fill="rgba(191,219,254,.7)"/></g>
<g id="sat2"><circle cx="-960" cy="0" r="12" fill="rgba(147,197,253,.16)"/><circle cx="-960" cy="0" r="5" fill="rgba(191,219,254,.7)"/></g>
</g></svg>
<svg id="grano"><filter id="ruido"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="1920" height="1080" filter="url(#ruido)"/></svg>`,
`tl.fromTo('#sat1', { rotation: 0, svgOrigin: '0 0' }, { rotation: ${r3(360 * D / 40)}, svgOrigin: '0 0', duration: ${D}, ease: 'none' }, 0);
tl.fromTo('#sat2', { rotation: 40, svgOrigin: '0 0' }, { rotation: ${r3(40 - 360 * D / 70)}, svgOrigin: '0 0', duration: ${D}, ease: 'none' }, 0);
tl.fromTo('#halo1', { scale: 1, x: 0 }, { scale: 1.12, x: 60, duration: ${r3(D / 2)}, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
tl.fromTo('#halo2', { scale: 1.08, y: 0 }, { scale: .96, y: -50, duration: ${r3(D / 2)}, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);`)

// ── ventana: placa + cámara + cursor + resaltados + diálogos; entra, se aleja en los capítulos y se va ──
const hlCajas = hl.flatMap(h => h.boxes.map((b, j) => ({ id: `${h.id}-${j}`, h, j, b })))
escribir('ventana', `
#win { position: absolute; left: ${WIN.x}px; top: ${WIN.y}px; width: ${WIN.w}px; height: ${r3(WIN.h)}px; border-radius: 16px; overflow: hidden; background: #fff;
  box-shadow: 0 60px 140px rgba(2,6,23,.62), 0 18px 40px rgba(2,6,23,.32), 0 0 0 1px rgba(255,255,255,.10); transform-origin: 50% 60%; }
#barra { position: absolute; left: 0; top: 0; width: 100%; height: ${WIN.ch}px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
.punto { position: absolute; top: 16px; width: 12px; height: 12px; border-radius: 50%; }
#url { position: absolute; left: 372px; top: 8px; width: 600px; height: 28px; border-radius: 8px; background: #EEF2F7; color: #475569; font: 500 14px/28px 'Geist'; text-align: center; white-space: nowrap; overflow: hidden; }
#url span { position: absolute; left: 0; right: 0; top: 0; opacity: 0; }
#pantalla { position: absolute; left: 0; top: ${WIN.ch}px; width: 1440px; height: 900px; transform: scale(${K}); transform-origin: 0 0; overflow: hidden; background: #fff; }
#cam { position: absolute; left: 0; top: 0; width: 1440px; height: 900px; transform-origin: 0 0; }
#placa { position: absolute; left: 0; top: 0; width: 1440px; height: 900px; object-fit: fill; }
#cursor { position: absolute; left: 0; top: 0; width: 34px; height: 34px; }
.onda { position: absolute; width: 80px; height: 80px; border-radius: 50%; border: 4px solid #3B82F6; background: rgba(59,130,246,.18); opacity: 0; }
.foco-caja { position: absolute; border-radius: 14px; box-shadow: 0 0 0 2400px rgba(6,12,32,.45), 0 0 24px 8px rgba(6,12,32,.25); opacity: 0; }
.recreacion { position: absolute; left: 0; top: 0; width: 1440px; height: 900px; opacity: 0; outline: 4px dashed #3B82F6; outline-offset: -4px; }
.etiqueta-rec { position: absolute; left: 18px; top: ${WIN.ch + 14}px; padding: 8px 14px; border-radius: 10px; background: rgba(12,26,61,.94); border: 2px dashed #60A5FA; color: #E2ECFF; font: 650 18px/1 'Geist'; opacity: 0; }
.dlg { position: absolute; left: 280px; top: 138px; width: 880px; height: 560px; border-radius: 8px; overflow: hidden; background: #F3F3F3; border: 1px solid rgba(0,0,0,.14);
  box-shadow: 0 32px 64px rgba(0,0,0,.30), 0 2px 21px rgba(0,0,0,.20); font: 13px/1.2 'Geist', sans-serif; color: #1A1A1A; opacity: 0; }
.dlg .tb { height: 34px; padding-left: 14px; display: flex; align-items: center; gap: 10px; font-size: 12px; background: #EEF2F7; }
.dlg .tool { height: 46px; display: flex; align-items: center; gap: 8px; padding: 0 10px; background: #EEF2F7; }
.dlg .addr { flex: 1; height: 32px; border-radius: 4px; background: #fff; border: 1px solid #E5E5E5; display: flex; align-items: center; padding: 0 10px; }
.dlg .buscar { width: 240px; height: 32px; border-radius: 4px; background: #fff; border: 1px solid #E5E5E5; display: flex; align-items: center; padding: 0 10px; color: #6B6B6B; }
.dlg .cmd { height: 40px; display: flex; align-items: center; gap: 18px; padding: 0 16px; border-bottom: 1px solid #E5E5E5; }
.dlg .nav { position: absolute; left: 0; top: 120px; width: 196px; bottom: 104px; padding: 8px 6px; border-right: 1px solid #E8E8E8; }
.dlg .nav div { height: 30px; display: flex; align-items: center; padding: 0 12px; border-radius: 4px; }
.dlg .nav .sel { background: #E0E7F1; }
.dlg .items { position: absolute; left: 196px; right: 0; top: 120px; bottom: 104px; background: #fff; }
.dlg .item { position: absolute; top: 18px; width: 136px; height: 170px; text-align: center; }
.dlg .item .bg { position: absolute; left: 0; top: 0; width: 136px; height: 170px; border-radius: 4px; background: #CCE8FF; border: 1px solid #99D1FF; opacity: 0; }
.dlg .item .foto { position: relative; display: block; width: 116px; height: 110px; margin: 9px auto 6px; background-size: contain; background-repeat: no-repeat; background-position: center; }
.dlg .item .nm { position: relative; font-size: 12px; padding: 0 6px; word-break: break-all; }
.dlg .pie { position: absolute; left: 0; right: 0; bottom: 0; height: 104px; border-top: 1px solid #E5E5E5; background: #F3F3F3; }
.dlg .fila { position: absolute; left: 22px; right: 22px; top: 16px; display: flex; align-items: center; gap: 10px; }
.dlg .nombre { flex: 1; height: 30px; border-radius: 4px; background: #fff; border: 1px solid #D9D9D9; border-bottom: 2px solid #005FB8; position: relative; overflow: hidden; }
.dlg .nombre span { position: absolute; left: 10px; top: 6px; white-space: nowrap; opacity: 0; }
.dlg .btn { position: absolute; top: 58px; width: 96px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.dlg .ok { right: 132px; background: #005FB8; color: #fff; }
.dlg .no { right: 24px; background: #fff; border: 1px solid #D0D0D0; }
.tecla { position: absolute; left: 0; top: 0; padding: 6px 12px; border-radius: 8px; background: #0F172A; color: #fff; font: 600 18px/1 'Geist'; opacity: 0; }`,
`<div id="win">
  <div id="barra">
    <div class="punto" style="left:18px;background:#FF5F57"></div><div class="punto" style="left:38px;background:#FEBC2E"></div><div class="punto" style="left:58px;background:#28C840"></div>
    <div id="url">${urls.map((u, i) => `<span id="url-${i}">🔒 ${esc(u.u)}</span>`).join('')}</div>
  </div>
  <div id="pantalla"><div id="cam">
    <video ${clip('placa', 0, D, 0, `src="${PLACA}" muted playsinline`)}></video>
    ${RECREACIONES.map(r => `<div class="recreacion" id="${r.id}">${r.html}</div>`).join('')}
    <div id="foco">${hlCajas.map(c => `<div class="foco-caja" id="${c.id}" style="left:${c.b.x}px;top:${c.b.y}px;width:${c.b.w}px;height:${c.b.h}px"></div>`).join('')}</div>
    ${dialogos.map(d => `<div class="dlg" id="${d.id}">
      <div class="tb">📁 Abrir</div>
      <div class="tool"><div class="addr">🖼️ › Este equipo › ${esc(d.carpeta.split(/\s*[›>]\s*/).join(' › '))}</div><div class="buscar">🔍 Buscar en ${esc(d.carpeta.split(/\s*[›>]\s*/).pop())}</div></div>
      <div class="cmd"><span>Organizar ▾</span><span>Nueva carpeta</span></div>
      <div class="nav"><div>🏠 Inicio</div><div>🖼️ Galería</div><div>🖥️ Escritorio</div><div>⬇️ Descargas</div><div>📄 Documentos</div><div class="sel">🖼️ Imágenes</div><div>🎵 Música</div><div>🎬 Videos</div></div>
      <div class="items">${d.fotos.map((f, i) => `<div class="item" style="left:${22 + i * 148}px"><div class="bg" id="${d.id}-sel${i}"></div><div class="foto" style="background-image:url('${f}')"></div><div class="nm">${esc(d.nombres[i])}</div></div>`).join('')}</div>
      <div class="pie"><div class="fila"><span>Nombre:</span><div class="nombre"><span id="${d.id}-n1">${esc(d.nombres[0])}</span><span id="${d.id}-n2">${esc(d.nombres.map(n => '"' + n + '"').join(' '))}</span></div></div><div class="btn ok" id="${d.id}-ok">Abrir</div><div class="btn no">Cancelar</div></div>
    </div>${d.fotos.length > 1 ? `<div class="tecla" id="${d.id}-shift">⇧ Shift</div>` : ''}`).join('')}
    ${clicks.map((c, i) => `<div class="onda" id="onda-${i}" style="left:${r3(c.x - 40)}px;top:${r3(c.y - 40)}px"></div>`).join('')}
    <svg id="cursor" viewBox="0 0 34 34"><path d="M5 3 L5 26 L10.6 20.8 L14.4 29.6 L18.6 27.8 L14.9 19.2 L22.6 19.2 Z" fill="#0F172A" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>
  </div></div>
  ${RECREACIONES.map(r => `<div class="etiqueta-rec" id="${r.id}-e">${esc(r.etiqueta)}</div>`).join('')}
</div>`,
`const DATA = ${JSON.stringify({ rec: RECREACIONES.map(r => ({ id: r.id, o0: r3(r.o0), o1: r3(r.o1) })), cam, urls: urls.map(u => u.t), cur, curVis, clicks, hl: hl.map(h => ({ id: h.id, o0: h.o0, o1: h.o1, boxes: h.boxes.map(b => b.t) })), dialogos: dialogos.map(d => ({ id: d.id, o0: d.o0, click1: d.click1, click2: d.click2, click3: d.click3, close: d.close, n: d.fotos.length })), capitulos: capitulos.map(c => ({ o0: c.o0, o1: c.o1 })) })};
// entrada en 3D al terminar la apertura
tl.fromTo('#win', { opacity: 0, y: 160, scale: .9, rotationX: 22, transformPerspective: 1600 }, { opacity: 1, y: 0, scale: 1, rotationX: 0, transformPerspective: 1600, duration: 1.1, ease: E.o5 }, 2.55);
// cámara: zoom suave adentro de la ventana
for (const k of DATA.cam) tl.to('#cam', { scale: k.scale, x: k.x, y: k.y, duration: k.d, ease: 'power2.inOut' }, k.t);
// barra de direcciones
tl.set('#url-0', { opacity: 1 }, 0);
DATA.urls.forEach((t, i) => { if (i === 0) return; tl.set('#url-' + (i - 1), { opacity: 0 }, t); tl.set('#url-' + i, { opacity: 1 }, t); });
// cursor
tl.set('#cursor', { x: DATA.cur[0].x - 4, y: DATA.cur[0].y - 3, opacity: 0 }, 0);
for (const k of DATA.cur) tl.to('#cursor', { x: k.x - 4, y: k.y - 3, duration: k.d, ease: 'power2.inOut' }, k.t);
for (const v of DATA.curVis) tl.to('#cursor', { opacity: v.v, duration: .22, ease: 'none' }, v.t);
DATA.clicks.forEach((c, i) => {
  tl.fromTo('#onda-' + i, { scale: .2, opacity: .95 }, { scale: 1.1, opacity: 0, duration: .55, ease: E.o, immediateRender: false }, c.t);
  tl.to('#cursor', { scale: .84, duration: .07, ease: 'none', transformOrigin: '4px 3px' }, Math.max(0, c.t - .04));
  tl.to('#cursor', { scale: 1, duration: .14, ease: 'power2.out', transformOrigin: '4px 3px' }, c.t + .05);
});
// recreaciones marcadas: entran y salen con fundido, con su etiqueta fija arriba a la izquierda
for (const r of DATA.rec) {
  tl.fromTo(['#' + r.id, '#' + r.id + '-e'], { opacity: 0 }, { opacity: 1, duration: .3, ease: 'none' }, r.o0);
  tl.to(['#' + r.id, '#' + r.id + '-e'], { opacity: 0, duration: .3, ease: 'none' }, r.o1 - .3);
}
// resaltados (foco): entra la primera caja; si el bloque crece, fundido a la caja siguiente
for (const h of DATA.hl) {
  h.boxes.forEach((t, j) => {
    const id = '#' + h.id + '-' + j, fin = h.boxes[j + 1] ?? h.o1;
    if (j === 0) tl.fromTo(id, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: .35, ease: E.o }, h.o0);
    else tl.fromTo(id, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'none' }, t);
    tl.to(id, { opacity: 0, duration: j + 1 < h.boxes.length ? .3 : .4, ease: 'power2.out' }, fin);
  });
}
// diálogo "Abrir"
for (const d of DATA.dialogos) {
  tl.fromTo('#' + d.id, { opacity: 0, scale: .965 }, { opacity: 1, scale: 1, duration: .2, ease: E.o }, d.o0);
  tl.to('#' + d.id + '-sel0', { opacity: 1, duration: .05 }, d.click1);
  tl.to('#' + d.id + '-n1', { opacity: 1, duration: .05 }, d.click1);
  if (d.n > 1 && d.click2) {
    for (let i = 1; i < d.n; i++) tl.to('#' + d.id + '-sel' + i, { opacity: 1, duration: .05 }, d.click2);
    tl.to('#' + d.id + '-n1', { opacity: 0, duration: .05 }, d.click2);
    tl.to('#' + d.id + '-n2', { opacity: 1, duration: .05 }, d.click2);
    const p = DATA.clicks.find(c => Math.abs(c.t - d.click2) < .02) ?? { x: 700, y: 400 };
    tl.set('#' + d.id + '-shift', { x: p.x + 26, y: p.y + 26 }, d.click2 - .6);
    tl.fromTo('#' + d.id + '-shift', { opacity: 0 }, { opacity: 1, duration: .2 }, d.click2 - .5);
    tl.to('#' + d.id + '-shift', { opacity: 0, duration: .2 }, d.click2 + .35);
  }
  tl.to('#' + d.id + '-ok', { backgroundColor: '#00508F', duration: .05 }, d.click3);
  tl.to('#' + d.id, { opacity: 0, scale: .985, duration: .16, ease: E.i }, d.close);
}
// capítulos: la ventana se desenfoca y se aleja mientras entra la placa del capítulo
for (const c of DATA.capitulos) {
  tl.to('#win', { scale: .9, opacity: .35, filter: 'blur(14px)', duration: .55, ease: E.io }, c.o0);
  tl.to('#url', { opacity: 0, duration: .3, ease: 'none' }, c.o0);
  tl.to('#url', { opacity: 1, duration: .3, ease: 'none' }, c.o1 - .3);
  tl.to('#win', { scale: 1, opacity: 1, filter: 'blur(0px)', duration: .6, ease: E.io }, c.o1 - .45);
}
// cierre: la ventana se va hacia atrás
tl.to('#win', { opacity: 0, y: 120, scale: .86, rotationX: -14, transformPerspective: 1600, duration: .9, ease: E.io }, ${FIN});`)

// ── pasos: llamadas junto al elemento + barra de progreso fina bajo la ventana ──────
const BARRA = { x: WIN.x, y: r3(WIN.y + WIN.h + 18), w: WIN.w }
escribir('pasos', `
.llamada { position: absolute; padding: 12px 18px 13px; border-radius: 14px; background: rgba(12,26,61,.94); border: 2px solid #3B82F6;
  box-shadow: 0 18px 40px rgba(2,6,23,.45); color: #F1F5FF; }
.llamada .tit { font: 700 22px/1.2 'Geist'; letter-spacing: -.01em; white-space: nowrap; }
.llamada .sub { margin-top: 5px; font: 500 17px/1.3 'Geist'; color: #B7C6E6; white-space: nowrap; }
.llamada .flecha { position: absolute; width: 16px; height: 16px; background: rgba(12,26,61,.94); border: 2px solid #3B82F6; transform: rotate(45deg); }
.llamada.arriba .flecha { bottom: -10px; border-top: none; border-left: none; }
.llamada.abajo .flecha { top: -10px; border-bottom: none; border-right: none; }
#progreso-barra { position: absolute; left: ${BARRA.x}px; top: ${BARRA.y}px; width: ${BARRA.w}px; height: 40px; opacity: 0; }
#progreso-pista { position: absolute; left: 0; top: 0; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,.14); }
#progreso-lleno { position: absolute; left: 0; top: 0; height: 4px; width: 100%; border-radius: 2px; background: #3B82F6; transform-origin: 0 50%; transform: scaleX(0); }
#progreso-nombre { position: absolute; right: 0; top: 14px; width: 100%; height: 24px; font: 600 18px/24px 'Geist'; color: #A9B8D8; white-space: nowrap; }
#progreso-nombre span { position: absolute; right: 0; top: 0; opacity: 0; }`,
`${pasos.map(p => `<div ${clip(p.id, p.o0, p.o1, 1)}><div class="llamada ${p.arriba ? 'arriba' : 'abajo'}" id="${p.id}-l" style="left:${p.x}px;top:${p.y}px;width:${p.ancho}px"><div class="tit">${esc(p.txt)}</div>${p.sub ? `<div class="sub">${esc(p.sub)}</div>` : ''}<div class="flecha" style="left:${r3(p.flechaX - 8)}px"></div></div></div>`).join('\n')}
<div id="progreso-barra"><div id="progreso-pista"><div id="progreso-lleno"></div></div><div id="progreso-nombre">${LISTA.map((x, i) => `<span id="prog-${i}">Paso ${i + 1} de ${LISTA.length} · ${esc(x.t)}</span>`).join('')}</div></div>`,
`const P = ${JSON.stringify(pasos.map(p => ({ id: p.id, o0: p.o0, item: p.item, arriba: p.arriba })))}, N = ${LISTA.length};
tl.fromTo('#progreso-barra', { opacity: 0 }, { opacity: 1, duration: .6, ease: 'none' }, ${INTRO});
tl.to('#progreso-barra', { opacity: 0, duration: .5, ease: 'none' }, ${FIN});
let actual = -1;
P.forEach(p => {
  tl.fromTo('#' + p.id + '-l', { opacity: 0, y: p.arriba ? 8 : -8 }, { opacity: 1, y: 0, duration: .25, ease: E.o }, p.o0);
  if (p.item >= 0 && p.item !== actual) {
    tl.to('#progreso-lleno', { scaleX: (p.item + 1) / N, duration: .5, ease: E.io }, p.o0);
    if (actual >= 0) tl.to('#prog-' + actual, { opacity: 0, duration: .2, ease: 'none' }, p.o0);
    tl.to('#prog-' + p.item, { opacity: 1, duration: .25, ease: 'none' }, p.o0 + .1);
    actual = p.item;
  }
});`)

// ── subtítulos (abajo, palabra por palabra) ────────────────────────────────
escribir('subtitulos', `
.sub-l { position: absolute; left: 0; width: 1920px; top: 1012px; display: flex; justify-content: center; }
.sub-l .caja { padding: 9px 20px 11px; border-radius: 12px; background: rgba(6,11,30,.72); font: 650 30px/1.15 'Geist'; letter-spacing: -.01em; color: #C3CEE8; white-space: nowrap; }
.sub-l .w { display: inline-block; margin: 0 .13em; }`,
subs.map((s, i) => `<div ${clip('sub-' + i, s.t0 - .05, s.fin, 1)}><div class="sub-l"><div class="caja" id="sub-${i}-c">${s.ws.map((w, j) => `<span class="w" id="sub-${i}-${j}">${esc(w.w)}</span>`).join('')}</div></div></div>`).join('\n'),
`const S = ${JSON.stringify(subs.map(s => ({ t0: s.t0, ws: s.ws.map(w => w.a) })))};
S.forEach((s, i) => {
  tl.fromTo('#sub-' + i + '-c', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .22, ease: E.o }, Math.max(0, s.t0 - .05));
  s.ws.forEach((t, j) => tl.to('#sub-' + i + '-' + j, { color: '#FFFFFF', duration: .12, ease: 'none' }, t));
});`)

// ── capítulos ───────────────────────────────────────────────────────────────
escribir('capitulos', `
.cap { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
.cap .kicker { padding: 12px 26px; border-radius: 999px; background: rgba(59,130,246,.22); border: 2px solid rgba(147,197,253,.55); color: #DCE8FF; font: 700 24px/1 'Geist'; letter-spacing: .16em; text-transform: uppercase; }
.cap .tit { font: 700 96px/1.02 'Sora'; letter-spacing: -.045em; color: #FFFFFF; text-align: center; }
.cap .sub { font: 500 34px/1.3 'Geist'; color: #C9D4EC; }`,
capitulos.map(c => `<div ${clip(c.id, c.o0, c.o1, 1)}><div class="cap" id="${c.id}-c"><div class="kicker" id="${c.id}-k">✦ ${esc(c.kicker)}</div><div class="tit" id="${c.id}-t">${esc(c.titulo)}</div><div class="sub" id="${c.id}-s">${esc(c.sub)}</div></div></div>`).join('\n'),
`const C = ${JSON.stringify(capitulos.map(c => ({ id: c.id, o0: c.o0, o1: c.o1 })))};
for (const c of C) {
  tl.fromTo('#' + c.id + '-k', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .5, ease: E.o }, c.o0 + .2);
  tl.fromTo('#' + c.id + '-t', { opacity: 0, y: 50, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .65, ease: E.o5 }, c.o0 + .3);
  tl.fromTo('#' + c.id + '-s', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .5, ease: E.o }, c.o0 + .5);
  tl.to('#' + c.id + '-c', { opacity: 0, y: -30, duration: .4, ease: E.i }, c.o1 - .45);
}`)

// ── apertura y cierre ───────────────────────────────────────────────────────
const marcaCss = `
.marca-c { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.logo { width: 200px; height: 200px; }
.k { margin-top: 30px; font: 700 26px/1 'Geist'; letter-spacing: .2em; text-transform: uppercase; color: #9DBAF5; }
.t { margin-top: 18px; font: 700 84px/1.04 'Sora'; letter-spacing: -.045em; color: #FFFFFF; text-align: center; }
.sitio { margin-top: 34px; padding: 14px 30px; border-radius: 999px; background: rgba(59,130,246,.2); border: 2px solid rgba(147,197,253,.5); color: #DCE8FF; font: 650 30px/1 'Geist'; }`
escribir('apertura', marcaCss, `<div class="marca-c" id="ap-c">${logoSvg('ap')}<div class="k" id="ap-k">Tutorial · Órbita</div><div class="t" id="ap-t">${esc(VIDEO.titulo)}</div></div>`,
`${logoMotion('ap', .05, { rot: 540, dur: 2.6, ease: 'power1.in' })}
tl.fromTo('#ap-k', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .55, ease: E.o }, .6);
tl.fromTo('#ap-t', { opacity: 0, y: 40, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: E.o5 }, .85);
tl.to('#ap-c', { opacity: 0, y: -60, scale: .94, duration: .6, ease: E.i }, 2.35);`)
const dCierre = r3(D - FIN - .3)
escribir('cierre', marcaCss, `<div class="marca-c" id="ci-c">${logoSvg('ci')}<div class="t" id="ci-t">${esc(TL.endTitle)}</div><div class="sitio" id="ci-s">orbita.site</div></div>`,
`${logoMotion('ci', .2, { rot: 720, dur: r3(dCierre - .3), ease: 'power1.inOut' })}
tl.fromTo('#ci-t', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .7, ease: E.o5 }, .9);
tl.fromTo('#ci-s', { opacity: 0, y: 24, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: E.o }, 1.35);`)

// ── raíz: escenas + audio ──────────────────────────────────────────────────
const host = (id, t0, dur, track) => `<div id="${id}-host" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${r3(t0)}" data-duration="${r3(dur)}" data-track-index="${track}" data-width="1920" data-height="1080"></div>`
const index = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
@font-face { font-family: 'Geist'; font-weight: 100 900; src: url(assets/fonts/geist-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215; }
@font-face { font-family: 'Geist'; font-weight: 100 900; src: url(assets/fonts/geist-latin-ext.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F; }
@font-face { font-family: 'Sora'; font-weight: 100 900; src: url(assets/fonts/sora-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215; }
@font-face { font-family: 'Sora'; font-weight: 100 900; src: url(assets/fonts/sora-latin-ext.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #0A1432; }
#root { width: 100%; height: 100%; position: relative; overflow: hidden; background: #0A1432; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1920" data-height="1080">
  ${host('fondo', 0, D, 0)}
  ${host('ventana', 0, D, 1)}
  ${host('pasos', 0, D, 2)}
  ${host('subtitulos', 0, D, 3)}
  ${host('capitulos', 0, D, 4)}
  ${host('apertura', 0, INTRO + .2, 5)}
  ${host('cierre', FIN + .3, D - FIN - .3, 6)}
  ${voz.map((v, i) => `<audio id="voz-${v.id}" src="${v.f?.archivo ?? `assets/voz/${v.id}.wav`}" data-start="${r3(v.t)}" data-duration="${r3(v.dur)}" data-track-index="${10 + (i % 2)}" data-volume="1" data-audio-group="voiceover"></audio>`).join('\n  ')}
  <audio id="sfx" src="${SFX}" data-start="0" data-duration="${D}" data-track-index="12" data-volume="0.5" data-audio-group="sfx"></audio>
  ${MUSICA ? `<audio id="musica" src="${MUSICA.archivo}" data-start="0" data-duration="${D}" data-media-start="${MUSICA.desde ?? 0}" data-track-index="13" data-volume="${MUSICA.volumen ?? .2}" data-audio-group="music"></audio>` : ''}
</div>
<script>
const tl = gsap.timeline({ paused: true });
window.__timelines["main"] = tl;
</script>
</body>
</html>
`
fs.writeFileSync('index.html', index)
console.log(`index.html + 7 sub-composiciones · ${D} s · ${cam.length} cámaras · ${cur.length} cursor · ${clicks.length} clics · ${pasos.length} llamadas · ${subs.length} subtítulos · ${hl.length} focos · ${RECREACIONES.length} recreaciones · ${dialogos.length} diálogos · ${capitulos.length} capítulos · ${voz.length} frases · ${urls.length} URLs`)
