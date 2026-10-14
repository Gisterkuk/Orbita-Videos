// Extras de "Conocé tu panel" v2 (después de armar.mjs):
//   - el gancho de la frase 1: las seis pastillas de los pasos sobre el Inicio
//   - la pantalla partida Panel / Tienda de las frases 2–3: grande, cada mitad con su propia barra
//   - la posición de cada llamada (pasos.html): junto a su objetivo y del lado que se le indica, para
//     que ninguna tape lo que nombra la voz (armar.mjs solo sabe ponerlas arriba o abajo del foco)
// Lee ../conoce-tu-panel-v2/out/extras.json (lo escribe editar.mjs), arma las dos fotos fijas (el nombre
// del dueño del saludo, desenfocado: P4) y agrega la sub-composición "extras" a index.html.
//   node scripts/extras.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const X = JSON.parse(fs.readFileSync('../conoce-tu-panel-v2/out/extras.json', 'utf8'))
const ffmpeg = createRequire(path.join(os.homedir(), 'orbita-videos', 'kit', 'package.json'))('ffmpeg-static')
const r3 = v => +(+v).toFixed(3)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── fotos fijas (2880×1800 → 1800×1125) ──
fs.mkdirSync('assets/fotos', { recursive: true })
const s = X.saludo, K = 2
const blur = `[0]split[a][b];[b]crop=${Math.round(s.w * K)}:${Math.round(s.h * K)}:${Math.round(s.x * K)}:${Math.round(s.y * K)},scale=iw/14:ih/14,scale=${Math.round(s.w * K)}:${Math.round(s.h * K)}:flags=bilinear,boxblur=10:2[bl];[a][bl]overlay=${Math.round(s.x * K)}:${Math.round(s.y * K)},scale=1800:1125:flags=lanczos`
execFileSync(ffmpeg, ['-loglevel', 'error', '-y', '-i', X.panel, '-filter_complex', blur, '-q:v', '2', 'assets/fotos/partida-panel.jpg'])
execFileSync(ffmpeg, ['-loglevel', 'error', '-y', '-i', X.tienda, '-vf', 'scale=1800:1125:flags=lanczos', '-q:v', '2', 'assets/fotos/partida-tienda.jpg'])

// ── tiempos (salida) ──
const g0 = r3(X.f1.t), g1 = r3(X.f2.t)
const p0 = r3(X.f2.t), pFoco = r3(X.f2.t + 1.6), pTienda = r3(X.f3.t + .4), p1 = r3(X.f3.t + X.f3.dur + .2)
const W = { x: 264, y: 78, w: 1392, h: 870 }          // contenido de la ventana (WIN de armar.mjs)
// pantalla partida: dos ventanas de 900 de ancho (imagen 900×562,5 + barra de 40)
const PW = 900, PB = 40, PH = PW * 900 / 1440, GAP = 40, PX = (1920 - 2 * PW - GAP) / 2, PY = 245

const css = `
@font-face { font-family: 'Geist'; font-weight: 100 900; src: url(assets/fonts/geist-latin.woff2) format('woff2'); }
@font-face { font-family: 'Geist'; font-weight: 100 900; src: url(assets/fonts/geist-latin-ext.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
#extras { position: absolute; inset: 0; font-family: 'Geist', sans-serif; color: #F1F5FF; -webkit-font-smoothing: antialiased; }
#velo-g { position: absolute; left: ${W.x}px; top: ${W.y}px; width: ${W.w}px; height: ${W.h}px; background: rgba(6,12,32,.42); opacity: 0; }
#pastillas { position: absolute; left: ${W.x + 60}px; top: ${W.y + 300}px; width: ${W.w - 120}px; display: grid; grid-template-columns: repeat(3, auto); justify-content: center; gap: 20px 20px; }
.pas { display: inline-flex; align-items: center; gap: 12px; padding: 15px 26px 16px; border-radius: 999px; background: rgba(12,26,61,.95); border: 2px solid #3B82F6;
  box-shadow: 0 18px 40px rgba(2,6,23,.45); font: 700 28px/1 'Geist'; letter-spacing: -.01em; opacity: 0; white-space: nowrap; }
.pas .n { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: #2563EB; color: #fff; font: 700 18px/1 'Geist'; }
#partida { position: absolute; left: 0; top: 0; width: 1920px; height: 990px; opacity: 0; overflow: hidden;
  background: radial-gradient(1200px 700px at 30% 20%, rgba(37,99,235,.35), rgba(37,99,235,0)), #0A1432; }
.mitad { position: absolute; top: ${PY}px; width: ${PW}px; height: ${PH + PB}px; border-radius: 16px; overflow: hidden; background: #fff;
  box-shadow: 0 40px 90px rgba(2,6,23,.6), 0 0 0 1px rgba(255,255,255,.12); transform-origin: 50% 50%; }
.mitad .bar { position: absolute; left: 0; top: 0; width: 100%; height: ${PB}px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
.mitad .pt { position: absolute; top: 14px; width: 12px; height: 12px; border-radius: 50%; }
.mitad .url { position: absolute; left: 110px; right: 110px; top: 7px; height: 26px; border-radius: 8px; background: #EEF2F7; color: #475569; font: 500 15px/26px 'Geist'; text-align: center; }
.mitad img { position: absolute; left: 0; top: ${PB}px; width: ${PW}px; height: ${PH}px; }
.mitad .apaga { position: absolute; inset: 0; background: #060C20; opacity: 0; }
.rot { position: absolute; top: ${PY - 72}px; padding: 11px 24px; border-radius: 999px; background: rgba(59,130,246,.22); border: 2px solid rgba(147,197,253,.6); color: #E2ECFF; font: 700 28px/1 'Geist'; }`
const mitad = (id, x, url, img) => `<div class="mitad" id="${id}" style="left:${x}px"><div class="bar"><div class="pt" style="left:16px;background:#FF5F57"></div><div class="pt" style="left:36px;background:#FEBC2E"></div><div class="pt" style="left:56px;background:#28C840"></div><div class="url">🔒 ${url}</div></div><img src="${img}" /><div class="apaga" id="${id}-apaga"></div></div>`
const body = `<div id="velo-g"></div>
<div id="pastillas">${X.pastillas.map((t, i) => `<div class="pas" id="pas-${i}"><span class="n">${i + 1}</span>${esc(t)}</div>`).join('')}</div>
<div id="partida">
  <div class="rot" style="left:${PX}px">Panel · lo manejás vos</div><div class="rot" style="left:${PX + PW + GAP}px">Tienda · la ven tus clientes</div>
  ${mitad('lado-p', PX, 'negocio.orbita.site/admin', 'assets/fotos/partida-panel.jpg')}
  ${mitad('lado-t', PX + PW + GAP, 'negocio.orbita.site', 'assets/fotos/partida-tienda.jpg')}
</div>`
const script = `
// gancho: las seis pastillas entran de a una entre 0,4 y 3,4 s de la frase 1 y se van antes de la frase 2
tl.fromTo('#velo-g', { opacity: 0 }, { opacity: 1, duration: .4, ease: 'none' }, ${r3(g0 + .2)});
${X.pastillas.map((_, i) => `tl.fromTo('#pas-${i}', { opacity: 0, y: 14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .35, ease: 'power3.out' }, ${r3(g0 + .4 + i * .6)});`).join('\n')}
tl.to(['#velo-g', '#pastillas'], { opacity: 0, duration: .25, ease: 'none' }, ${r3(g1 - .3)});
// pantalla partida: entra con la frase 2; foco en el panel ("el panel") y después en la tienda ("la tienda")
tl.fromTo('#partida', { opacity: 0 }, { opacity: 1, duration: .3, ease: 'none' }, ${r3(p0)});
tl.fromTo(['#lado-p', '#lado-t'], { y: 30, scale: .97 }, { y: 0, scale: 1, duration: .55, ease: 'expo.out' }, ${r3(p0)});
tl.to('#lado-t-apaga', { opacity: .55, duration: .4, ease: 'power2.inOut' }, ${pFoco});
tl.to('#lado-p', { scale: 1.02, duration: .4, ease: 'power2.inOut' }, ${pFoco});
tl.to('#lado-t-apaga', { opacity: 0, duration: .4, ease: 'power2.inOut' }, ${pTienda});
tl.to('#lado-p-apaga', { opacity: .55, duration: .4, ease: 'power2.inOut' }, ${pTienda});
tl.to('#lado-p', { scale: 1, duration: .4, ease: 'power2.inOut' }, ${pTienda});
tl.to('#lado-t', { scale: 1.02, duration: .4, ease: 'power2.inOut' }, ${pTienda});
tl.to('#partida', { opacity: 0, duration: .2, ease: 'none' }, ${r3(p1 - .2)});`
fs.writeFileSync('compositions/extras.html', `<!doctype html>
<html lang="es"><head><meta charset="UTF-8" /></head>
<body>
<template>
<style>${css}
</style>
<div id="extras" data-composition-id="extras" data-width="1920" data-height="1080">
${body}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${script}
window.__timelines["extras"] = tl;
</script>
</template>
</body></html>
`)

// ── llamadas junto a su objetivo ──
{
  const vh = fs.readFileSync('compositions/ventana.html', 'utf8')
  const cam = JSON.parse(vh.match(/const DATA = (\{.*?\});\n/s)[1]).cam
  const p2io = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, cl = (v, a, b) => Math.min(b, Math.max(a, v))
  const camEn = t => { let e = { scale: 1, x: 0, y: 0 }; for (const k of cam) { if (k.t > t) break; const u = p2io(cl((t - k.t) / k.d, 0, 1)); e = { scale: e.scale + (k.scale - e.scale) * u, x: e.x + (k.x - e.x) * u, y: e.y + (k.y - e.y) * u } } return e }
  const KW = 1392 / 1440, aSalida = (sx, sy, t) => { const c = camEn(t); return { x: W.x + (sx * c.scale + c.x) * KW, y: W.y + (sy * c.scale + c.y) * KW } }
  let ph = fs.readFileSync('compositions/pasos.html', 'utf8')
  const P = JSON.parse(ph.match(/const P = (\[.*?\]), N/s)[1])
  const reL = /<div class="llamada (arriba|abajo)" id="(paso-\d+)-l" style="left:[\d.-]+px;top:[\d.-]+px;width:([\d.]+)px"><div class="tit">([^<]*)<\/div>(?:<div class="sub">([^<]*)<\/div>)?<div class="flecha" style="left:[\d.-]+px"><\/div><\/div>/g
  const des = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  let n = 0
  ph = ph.replace(reL, (todo, clase, id, anchoS, tit, sub) => {
    const l = X.llamadas.find(q => q.tit === des(tit) && (q.sub ?? null) === (sub != null ? des(sub) : null))
    if (!l) { console.warn('⚠ llamada sin objetivo:', des(tit)); return todo }
    const ancho = Number(anchoS), alto = sub != null ? 76 : 50, o0 = P.find(p => p.id === id).o0
    const q = aSalida(l.sx, l.sy, o0 + .35), A = 24
    let left, top, nueva = clase, fl
    if (l.lado === 'izq') { left = q.x - ancho - A; top = q.y - alto / 2; fl = `left:auto;right:-10px;top:${alto / 2 - 8}px;bottom:auto;border:2px solid #3B82F6;border-left:none;border-bottom:none` }
    else if (l.lado === 'der') { left = q.x + A; top = q.y - alto / 2; fl = `left:-10px;right:auto;top:${alto / 2 - 8}px;bottom:auto;border:2px solid #3B82F6;border-top:none;border-right:none` }
    else if (l.lado === 'arriba') { left = q.x - ancho / 2; top = q.y - alto - A; nueva = 'arriba'; fl = null }
    else { left = q.x - ancho / 2; top = q.y + A; nueva = 'abajo'; fl = null }
    const L0 = cl(left, W.x + 10, W.x + W.w - ancho - 10), T0 = cl(top, W.y + 10, W.y + W.h - alto - 10)
    if (!fl) fl = `left:${r3(cl(q.x - L0, 22, ancho - 22) - 8)}px`
    n++
    return `<div class="llamada ${nueva}" id="${id}-l" style="left:${r3(L0)}px;top:${r3(T0)}px;width:${ancho}px"><div class="tit">${tit}</div>${sub != null ? `<div class="sub">${sub}</div>` : ''}<div class="flecha" style="${fl}"></div></div>`
  })
  fs.writeFileSync('compositions/pasos.html', ph)
  console.log(`llamadas ubicadas junto a su objetivo: ${n}/${X.llamadas.length}`)
}

let index = fs.readFileSync('index.html', 'utf8')
const D = Number(index.match(/data-composition-id="main" data-start="0" data-duration="([\d.]+)"/)[1])
const host = `<div id="extras-host" data-composition-id="extras" data-composition-src="compositions/extras.html" data-start="0" data-duration="${D}" data-track-index="7" data-width="1920" data-height="1080"></div>`
index = index.replace(/\s*<div id="extras-host"[^>]*><\/div>/, '')
index = index.replace(/(<div id="cierre-host"[^>]*><\/div>)/, `$1\n  ${host}`)
fs.writeFileSync('index.html', index)
console.log(`extras: gancho ${g0}–${g1} s · pantalla partida ${p0}–${p1} s (foco panel ${pFoco}, tienda ${pTienda})`)
