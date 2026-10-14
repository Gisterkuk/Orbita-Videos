# Videos tutoriales: calidad profesional y producción con 5 agentes — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que los tutoriales del panel salgan nítidos y con edición de demo profesional, producidos por guionista → analista → juez ×2 → editor → supervisor (+ espectador mudo) con críticos duros, y probarlo rehaciendo "Conocé tu panel".

**Architecture:** las herramientas viven en `.claude/skills/videos-tutoriales/` (commiteadas) y `preparar.mjs` las copia a cada carpeta de video en `~/orbita-videos/<slug>/`. La captura pasa a 2880×1800 reales; la placa intermedia es casi sin pérdida; HyperFrames rinde borradores 1080p y el final en 4K que se entrega reescalado a 1440p. Los agentes son archivos de `.claude/agents/` que el director (la conversación con el skill) dispara con el tool `Agent`; se pasan el trabajo por archivos en `produccion/`.

**Tech Stack:** Node 22 (ESM, `node:test`), Playwright (kit en `~/orbita-videos/kit`), ffmpeg-static, HyperFrames 0.8.143, ElevenLabs (MCP), agentes de Claude Code.

**Spec:** `docs/superpowers/specs/2026-10-12-videos-tutoriales-multiagente-design.md`

## Global Constraints

- Captura: **2880×1800** reales (viewport CSS 1440×900, densidad 2); JPEG ≥ 97 o PNG; ≥ 25 cuadros/s.
- Placa: PNG por cuadro → H.264 **crf 8**, yuv420p, 2880×1800.
- Zoom de cámara: **tope 1,6×**; dos niveles (general = 1 y primer plano 1,35–1,6).
- Render: borrador **1080p**; final **`--resolution landscape-4k`** → entrega **1440p** reescalado lanczos; liviana para chat a 30 fps.
- Render siempre con `--gpu --browser-gpu --workers 3` y prioridad baja (`cmd //c "start /belownormal /b /wait …"`).
- Silencios entre frases ≤ **0,6 s** salvo tramos `proteger`; audio final **-14 LUFS**; música volumen **0,15**.
- Voz: ElevenLabs **`8mBRP99B2Ng2QwsJMFQl`**, `eleven_v4`, sin tags de tono.
- Críticos: rechazo por defecto, evidencia obligatoria, anclas 0/0,5/1, global = mínimo de los críticos, ciegos al autor, crítico nuevo por ronda que recibe solo bloqueantes abiertos, solo un crítico cierra un bloqueante, umbrales fijos, sin debate, ≤ 3 rondas y luego se escala a la persona (**nunca se aprueba igual**).
- Producción: la persona escribe su contraseña; un solo navegador con `~/orbita-videos/perfil`; ensayo con escrituras bloqueadas antes de toda toma real; permiso explícito para crear/borrar datos, gastar cupo de Orbi o pagar voz.
- Textos para la persona: voseo rioplatense, español.
- No commitear ni pushear sin que la persona lo pida (`main` se pushea solo según CLAUDE.md). Los pasos "Commit" de este plan se agrupan y se ejecutan cuando la persona lo autorice.

## Review Focus

1. **El screencast con densidad 2 sigue entregando 1440×900 en alguna máquina** → la captura tiene que fallar con un error claro en vez de grabar en baja sin avisar (test en Task 2).
2. **Un tramo protegido que cae en el medio de un segmento largo** → solo ese tramo se libra de la aceleración, el resto se acelera (test en Task 4; el bug real de "Conocé tu panel" v1).
3. **Un zoom pedido por encima del tope (p. ej. 1,7 de un `editar.mjs` viejo)** → se recorta a 1,6 y se avisa, no se agranda la imagen (test en Task 4).
4. **Un borrador con un congelamiento de 3 s sin voz, un flash o un silencio** → el escaneo automático lo reporta con su segundo exacto (tests en Task 6).
5. **Un crítico que aprueba "Conocé tu panel" v1** → la calibración lo marca como roto (Task 9).

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `herramientas/lib/nitidez.mjs` | Varianza del laplaciano de una imagen gris (medida de nitidez) |
| `herramientas/prueba-captura.mjs` | Prueba de los 3 métodos de captura sobre el Inicio (solo lectura) |
| `herramientas/lib/grabador.mjs` | Captura 2880×1800 con el método ganador; verifica la resolución |
| `herramientas/compositor/plate.html` | Placa: pantalla editada a 2880×1800 (scroll compensado, retoques) |
| `herramientas/render-placa.mjs` | Render de la placa (capturas PNG → H.264 crf 8), en tramos con reintentos |
| `herramientas/lib/edicion.mjs` | Modo ágil + `proteger`, `ritmoDialogo`, tope de zoom |
| `herramientas/hyperframes/` | Plantilla del proyecto HyperFrames: `armar.mjs`, `partir-voz.mjs`, `fundido-musica.mjs`, `entregar.mjs`, `video.json` de ejemplo |
| `herramientas/revision/cuadros.mjs` | Cuadros por paso + cuadros de palabras clave + transcripción por tramo |
| `herramientas/revision/escaneos.mjs` | Escaneos automáticos → `revision-auto.json` |
| `herramientas/revision/sembrar.mjs` | Defectos sembrados para calibrar críticos |
| `herramientas/test/*.test.mjs` | Tests con `node --test` |
| `referencia/preferencias.md` · `referencia/estilo.md` · `referencia/calidad.md` | Preferencias, guía de edición, checklist y rúbrica |
| `referencia/calibracion/` | Caso malo etiquetado (v1) y procedimiento |
| `referencia/demo.md` + `herramientas/demo-datos/` | Negocio de demo: alta, carga, manifiesto, restaurar, limpiar |
| `.claude/agents/{guionista-video,analista-video,juez-guion,editor-video,supervisor-video,espectador-mudo}.md` | Los agentes |
| `SKILL.md` | Flujo del director |

(Rutas relativas a `.claude/skills/videos-tutoriales/` salvo `.claude/agents/` y `docs/`.)

---

### Task 1: Medida de nitidez y prueba de métodos de captura

**Files:**
- Create: `herramientas/lib/nitidez.mjs`
- Create: `herramientas/prueba-captura.mjs`
- Test: `herramientas/test/nitidez.test.mjs`

**Interfaces:**
- Produces: `varianzaLaplaciano(gris: Uint8Array, ancho: number, alto: number): number`; `nitidezDeArchivo(ruta: string, recorte?: {x,y,w,h}): Promise<number>` (decodifica con ffmpeg a gris crudo).

- [ ] **Step 1: Test que falla**

```js
// herramientas/test/nitidez.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { varianzaLaplaciano } from '../lib/nitidez.mjs'

test('una imagen con bordes nítidos mide más que la misma borrosa', () => {
  const w = 64, h = 64, nitida = new Uint8Array(w * h), borrosa = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    nitida[y * w + x] = (Math.floor(x / 4) % 2) ? 255 : 0                       // rayas de 4 px
    borrosa[y * w + x] = Math.round(127.5 + 127.5 * Math.sin((x / 8) * Math.PI)) // degradé suave
  }
  assert.ok(varianzaLaplaciano(nitida, w, h) > 10 * varianzaLaplaciano(borrosa, w, h))
})

test('una imagen plana mide 0', () => {
  assert.equal(varianzaLaplaciano(new Uint8Array(16 * 16).fill(128), 16, 16), 0)
})
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `node --test herramientas/test/nitidez.test.mjs` → FAIL (`Cannot find module '../lib/nitidez.mjs'`).

- [ ] **Step 3: Implementación**

```js
// herramientas/lib/nitidez.mjs
// Nitidez = varianza del laplaciano (4 vecinos) sobre una imagen en gris. Más alto = más nítido.
// Se usa para comparar métodos de captura y para el control objetivo del supervisor.
import { execFileSync } from 'node:child_process'
import { ffmpegPath } from './deps.mjs'

export function varianzaLaplaciano(g, w, h) {
  let n = 0, s = 0, s2 = 0
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w]
    s += l; s2 += l * l; n++
  }
  if (!n) return 0
  const m = s / n
  return s2 / n - m * m
}

// recorte en px de la imagen (no CSS)
export async function nitidezDeArchivo(ruta, recorte) {
  const vf = [recorte && `crop=${recorte.w}:${recorte.h}:${recorte.x}:${recorte.y}`, 'format=gray'].filter(Boolean).join(',')
  const sonda = execFileSync(ffmpegPath, ['-v', 'error', '-i', ruta, '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 })
  const w = recorte?.w ?? Number(execFileSync(ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', ruta]).toString().trim())
  return varianzaLaplaciano(sonda, w, sonda.length / w)
}
```

Nota: `ffmpeg-static` no trae ffprobe. Si el reemplazo de nombre no existe, pasar siempre `recorte` (los usos de este plan siempre lo pasan) y dejar el fallback con un `throw new Error('nitidezDeArchivo: pasá un recorte')`.

- [ ] **Step 4: Test pasa**

Run: `node --test herramientas/test/nitidez.test.mjs` → PASS.

- [ ] **Step 5: Script de la prueba de captura**

`herramientas/prueba-captura.mjs` (solo lectura: `bloquearEscrituras`), sobre `/admin/ventas/dashboard`, graba 3 s con cada método y escribe `out/prueba-captura/<metodo>/` + un resumen:

```js
// node herramientas/prueba-captura.mjs   (cwd = carpeta de un video; sesión activa)
import fs from 'node:fs'
import { abrirSesion, bloquearEscrituras } from './lib/sesion.mjs'
import { BASE } from './lib/deps.mjs'
import { nitidezDeArchivo } from './lib/nitidez.mjs'

const RECORTE = { x: 1900, y: 160, w: 800, h: 300 }   // en px de 2880×1800: los números del Inicio
const metodos = {
  // (a) screencast forzando las métricas del dispositivo
  async screencast(page, cdp, dir) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
    const fr = []
    cdp.on('Page.screencastFrame', async f => { fr.push(f); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }) })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 97, maxWidth: 2880, maxHeight: 1800, everyNthFrame: 1 })
    await page.waitForTimeout(3000); await cdp.send('Page.stopScreencast')
    fr.forEach((f, i) => fs.writeFileSync(`${dir}/${String(i).padStart(4, '0')}.jpg`, Buffer.from(f.data, 'base64')))
    return fr.length / 3
  },
  // (b) captura cuadro por cuadro
  async capturas(page, cdp, dir) {
    let n = 0; const t0 = Date.now()
    while (Date.now() - t0 < 3000) { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 97, captureBeyondViewport: false }); fs.writeFileSync(`${dir}/${String(n++).padStart(4, '0')}.jpg`, Buffer.from(r.data, 'base64')) }
    return n / 3
  },
}
const { ctx, page } = await abrirSesion({ dpr: 2 })
await bloquearEscrituras(page)
await page.goto(BASE + '/admin/ventas/dashboard', { waitUntil: 'networkidle' })
const cdp = await ctx.newCDPSession(page)
const res = {}
for (const [nombre, fn] of Object.entries(metodos)) {
  const dir = `out/prueba-captura/${nombre}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const fps = await fn(page, cdp, dir)
  const primero = `${dir}/${fs.readdirSync(dir)[0]}`
  const dims = (await page.evaluate(async src => { const i = new Image(); i.src = src; await i.decode(); return [i.naturalWidth, i.naturalHeight] }, 'data:image/jpeg;base64,' + fs.readFileSync(primero).toString('base64')))
  res[nombre] = { fps: +fps.toFixed(1), dims, nitidez: dims[0] >= 2880 ? Math.round(await nitidezDeArchivo(primero, RECORTE)) : null }
}
await ctx.close()
fs.writeFileSync('out/prueba-captura/resumen.json', JSON.stringify(res, null, 1))
console.log(res)
```

El método (c) (ventana 2880×1800 con la página al 200%) se agrega solo si (a) y (b) no cumplen: `abrirSesion({ ancho: 2880, alto: 1800, dpr: 1 })` + `page.evaluate(() => document.body.style.zoom = '2')`, medido igual.

- [ ] **Step 6: Correr la prueba y elegir**

Run (con sesión activa; si no, `node herramientas/login.mjs` y que entre la persona): `node herramientas/prueba-captura.mjs`
Criterio: gana el primero con `dims = [2880, 1800]` y `fps ≥ 25`; anotar el resultado en `referencia/tecnica.md` § Captura (fecha, fps y nitidez de cada método, el elegido).

- [ ] **Step 7: Commit** (cuando la persona lo autorice)

```bash
git add .claude/skills/videos-tutoriales/herramientas/lib/nitidez.mjs .claude/skills/videos-tutoriales/herramientas/prueba-captura.mjs .claude/skills/videos-tutoriales/herramientas/test/nitidez.test.mjs .claude/skills/videos-tutoriales/referencia/tecnica.md
git commit -m "feat(videos): medida de nitidez y prueba de métodos de captura"
```

### Task 2: Captura 2880×1800 en el grabador

**Files:**
- Modify: `herramientas/lib/grabador.mjs` (función `iniciar()` y el manejo de cuadros)
- Test: `herramientas/test/grabador-resolucion.test.mjs`

**Interfaces:**
- Consumes: método ganador de Task 1.
- Produces: `crearGrabador(...)` igual que hoy, pero los cuadros de `tomas/<toma>/frames/` son 2880×1800 y `log.json` incluye `vista: { w: 1440, h: 900, escala: 2 }`. Exporta `verificarResolucion(rutaCuadro): {w,h}` que tira `Error('Captura en baja resolución: …')` si `w < 2880`.

- [ ] **Step 1: Test que falla**

```js
// herramientas/test/grabador-resolucion.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dimensionesJpeg } from '../lib/grabador.mjs'
import fs from 'node:fs'

test('lee ancho y alto de un JPEG sin decodificarlo', () => {
  // JPEG mínimo de 2×1 generado con ffmpeg y guardado como fixture
  const buf = fs.readFileSync(new URL('./fixtures/2x1.jpg', import.meta.url))
  assert.deepEqual(dimensionesJpeg(buf), { w: 2, h: 1 })
})
```

Crear el fixture: `ffmpeg -f lavfi -i color=red:s=2x1 -frames:v 1 herramientas/test/fixtures/2x1.jpg`.

- [ ] **Step 2: Correrlo y ver que falla** → `dimensionesJpeg is not a function`.

- [ ] **Step 3: Implementación**

En `grabador.mjs`:

```js
// Ancho/alto de un JPEG leyendo el marcador SOFn (sin decodificar)
export function dimensionesJpeg(b) {
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue }
    const m = b[i + 1], len = b.readUInt16BE(i + 2)
    if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }
    i += 2 + len
  }
  throw new Error('JPEG sin SOF')
}
```

y en `iniciar()` aplicar el método ganador de Task 1 (si es el screencast: `Emulation.setDeviceMetricsOverride` con `deviceScaleFactor: 2` antes de `startScreencast` con `quality: 97, maxWidth: 2880, maxHeight: 1800`). En el handler del primer cuadro:

```js
if (frames.length === 1) {
  const { w, h } = dimensionesJpeg(buf)
  if (w < VW * dpr) throw new Error(`Captura en baja resolución: ${w}×${h} (se esperaba ${VW * dpr}×${VH * dpr}). Revisá referencia/tecnica.md § Captura.`)
}
```

y `ev('vista', { w: VW, h: VH, movil, escala: dpr })`.

- [ ] **Step 4: Test pasa** → `node --test herramientas/test/grabador-resolucion.test.mjs` PASS.

- [ ] **Step 5: Prueba real de solo lectura**

En una carpeta de video: `ENSAYO=1 node grabar.mjs ensayo-res` con un `grabar.mjs` mínimo (ir al Inicio, `iniciar()`, 2 s, `terminar()`); verificar con `node -e` que `tomas/ensayo-res/frames/000000.jpg` es 2880×1800 (`dimensionesJpeg`).

- [ ] **Step 6: Commit** (cuando se autorice) — `feat(videos): captura 2880×1800 con verificación de resolución`.

### Task 3: Placa de alta calidad, en tramos con reintentos

**Files:**
- Create: `herramientas/compositor/plate.html` (desde `~/orbita-videos/cargar-producto/compose/plate.html`, con los retoques)
- Create: `herramientas/render-placa.mjs` (desde `herramientas/render-promo.mjs` de `cargar-producto`, generalizado)
- Create: `herramientas/placa-tramos.sh` (desde `~/orbita-videos/conoce-tu-panel/herramientas/placa-tramos.sh`)
- Test: `herramientas/test/placa.test.mjs`

**Interfaces:**
- Consumes: tomas con `vista.escala = 2`.
- Produces: `PAGE=compose/plate.html TL=<tl> node herramientas/render-placa.mjs <salida.mp4> [desde] [hasta]` → H.264 crf 8 yuv420p a `tl.W×tl.H` (por defecto **2880×1800**); `bash herramientas/placa-tramos.sh <tl> <salida>`.

- [ ] **Step 1: Test que falla** — render de 1 s de una línea de tiempo de fixture (un solo cuadro fijo de 2880×1800 con texto) y verificación de resolución y nitidez:

```js
// herramientas/test/placa.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { nitidezDeArchivo } from '../lib/nitidez.mjs'

test('la placa sale a 2880×1800 y conserva la nitidez del cuadro fuente', { timeout: 120000 }, async () => {
  const dir = fs.mkdtempSync('placa-test-')
  execFileSync('node', ['herramientas/test/fixtures/hacer-tl-placa.mjs', dir])        // crea dir/tl.json + dir/frame.png
  execFileSync('node', ['herramientas/render-placa.mjs', `${dir}/placa.mp4`, '0', '1'], { env: { ...process.env, PAGE: 'herramientas/compositor/plate.html', TL: `${dir}/tl.json`, WAV: 'none' } })
  execFileSync('node', ['-e', `require('child_process').execFileSync(require('${process.env.FFMPEG ?? 'ffmpeg'}'),['-v','error','-i','${dir}/placa.mp4','-frames:v','1','${dir}/out.png'])`])
  const fuente = await nitidezDeArchivo(`${dir}/frame.png`, { x: 200, y: 200, w: 800, h: 300 })
  const placa = await nitidezDeArchivo(`${dir}/out.png`, { x: 200, y: 200, w: 800, h: 300 })
  assert.ok(placa > 0.85 * fuente, `nitidez placa ${placa} vs fuente ${fuente}`)
})
```

(`hacer-tl-placa.mjs`: dibuja con ffmpeg `drawtext` un PNG de 2880×1800 con texto chico y escribe un `tl.json` mínimo: `{W:2880,H:1800,duration:1,segs:[{o0:0,o1:1,s0:0,s1:0}],frames:[{s:0,f:'frame.png'}],scrolls:[]}`.)

- [ ] **Step 2: Correrlo y ver que falla** (no existe `render-placa.mjs`).

- [ ] **Step 3: Implementación**
  - `render-placa.mjs`: copia de `render-promo.mjs` con estos cambios: viewport = `tl.W×tl.H`; `page.screenshot({ type: 'png' })`; ffmpeg de entrada `-f image2pipe -c:v png -i -` y salida `-c:v libx264 -preset slow -crf 8 -pix_fmt yuv420p` + flags bt709; `WORKERS = 3`.
  - `plate.html`: igual a la de `cargar-producto/compose/plate.html` (ya tiene retoques y compensación de scroll); `k = W / 1440` sigue valiendo (con W = 2880, k = 2: dibuja la imagen 2× sin reescalar).
  - `placa-tramos.sh`: el de `conoce-tu-panel`, llamando a `render-placa.mjs`.

- [ ] **Step 4: Test pasa** → `node --test herramientas/test/placa.test.mjs` PASS.

- [ ] **Step 5: Commit** (cuando se autorice) — `feat(videos): placa 2880×1800 casi sin pérdida, en tramos con reintentos`.

### Task 4: Edición — modo ágil con `proteger`, ritmo del diálogo y tope de zoom

**Files:**
- Modify: `herramientas/lib/edicion.mjs` (traer la versión de `~/orbita-videos/conoce-tu-panel/herramientas/lib/edicion.mjs` y sumar el tope)
- Test: `herramientas/test/edicion.test.mjs` + `herramientas/test/fixtures/toma-sintetica/log.json`

**Interfaces:**
- Produces: `crearEdicion({ …, agil: { hueco, max, proteger: [[s0,s1]…] }, ritmoDialogo, zoomMax = 1.6 })`; `E.camara(s, d, x, y, z)` recorta `z` a `zoomMax` y avisa por consola una vez por cámara recortada.

- [ ] **Step 1: Tests que fallan**

```js
// herramientas/test/edicion.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearEdicion } from '../lib/edicion.mjs'
const dir = new URL('./fixtures/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')

// toma sintética: 'inicio' en 0, frase A de 0 a 1 s, después 12 s de movimiento sin voz con una
// marca 'leer' en el s 4, y la frase B al final
const voz = { frases: [
  { id: 'a', desde: 'a0', hasta: 'a1', dur: 1 },
  { id: 'b', desde: 'b0', hasta: 'b1', dur: 1 },
] }

test('un tramo protegido no se acelera aunque caiga en medio de un segmento largo', () => {
  const ag = { hueco: .6, max: 3, proteger: [] }
  const E = crearEdicion({ tomas: [{ nombre: 'toma-sintetica' }], voz, agil: ag, dir })
  ag.proteger.push([E.M('leer'), E.M('leer') + 2])
  E.clip(E.M('inicio'), E.M('b1')); E.armar()
  const dentro = E.segs.find(g => !g.hold && g.s0 >= E.M('leer') - 1e-6 && g.s1 <= E.M('leer') + 2 + 1e-6)
  assert.ok(dentro, 'hay un segmento exactamente sobre el tramo protegido')
  assert.ok(Math.abs((dentro.s1 - dentro.s0) / (dentro.o1 - dentro.o0) - 1.2) < .01, 'va a velocidad base (1,2×)')
  const fuera = E.segs.find(g => !g.hold && g.s0 >= E.M('leer') + 2)
  assert.ok((fuera.s1 - fuera.s0) / (fuera.o1 - fuera.o0) > 1.3, 'lo de afuera sí se acelera')
})

test('un zoom por encima del tope se recorta a 1,6', () => {
  const E = crearEdicion({ tomas: [{ nombre: 'toma-sintetica' }], dir })
  E.clip(E.M('inicio'), E.M('b1')); E.armar()
  E.camara(E.M('a0'), 1, 700, 400, 1.9)
  const tl = E.escribir({ nombre: 'test', soloDatos: true })
  assert.equal(tl.cam.at(-1).z, 1.6)
})
```

El fixture `toma-sintetica/log.json`: `{ log: [ {type:'mark',name:'inicio',t:0}, {type:'mark',name:'a0',t:0}, {type:'mark',name:'a1',t:1}, {type:'move',x:100,y:100,t:1,t1:13}, {type:'mark',name:'leer',t:5}, {type:'mark',name:'b0',t:13}, {type:'mark',name:'b1',t:14} ], frames: [ {s:0,f:'x.jpg'} ] }` (con `t` en segundos: `inicio` en 0).

- [ ] **Step 2: Correr y ver que fallan** (falta `soloDatos`, falta el tope; el primero falla si `edicion.mjs` del skill no tiene `proteger`).

- [ ] **Step 3: Implementación**
  - Copiar `edicion.mjs` de `conoce-tu-panel` (tiene `agil`, `proteger` que corta segmentos en sus bordes, `ritmoDialogo`, `margen`).
  - Agregar `zoomMax = 1.6` a los parámetros y en `camara()`: `if (z > zoomMax) { if (!avisado.has(s)) console.warn(\`⚠ zoom ${z} recortado a ${zoomMax}\`); avisado.add(s); z = zoomMax }`.
  - `escribir({ …, soloDatos })`: si `soloDatos`, devolver el objeto `tl` sin escribir archivos (para tests).

- [ ] **Step 4: Tests pasan** → `node --test herramientas/test/edicion.test.mjs` PASS.

- [ ] **Step 5: Commit** (cuando se autorice) — `feat(videos): modo ágil con tramos protegidos y tope de zoom`.

### Task 5: Plantilla HyperFrames con gráficos de demo profesional

**Files:**
- Create: `herramientas/hyperframes/` con `package.json` (pin `hyperframes@0.8.143`, scripts `armar`, `check`, `render-borrador`, `render-final`), `scripts/armar.mjs`, `scripts/partir-voz.mjs`, `scripts/fundido-musica.mjs`, `scripts/entregar.mjs`, `video.ejemplo.json`, `assets/fonts/` (Geist + Sora)
- Modify: `herramientas/preparar.mjs` (crea también `~/orbita-videos/<slug>-hf/` desde la plantilla)
- Test: `herramientas/test/armar.test.mjs`

**Interfaces:**
- Consumes: `compose/tl-voz.json`, `out/voz-tiempos.json` y `voz.json` de la carpeta del video (Task 4); `assets/placa.mp4` (Task 3).
- Produces: `npm run armar` (genera `index.html` + sub-composiciones); `npm run render-borrador` (1080p) y `npm run render-final` (4K); `node scripts/entregar.mjs` → `<slug>_16x9-1440p.mp4` (lanczos, -14 LUFS) y `<slug>_16x9-liviano.mp4` (30 fps, NVENC). `video.json`: `{ src, tl, tiempos, voz, titulo, lista, recreaciones: [{ o0, o1, etiqueta, html }] }`.

Base de `armar.mjs`: `~/orbita-videos/conoce-tu-panel-hf/scripts/armar.mjs` (ya lee `video.json`). Cambios de estilo (§4 del spec):

- [ ] **Step 1: Test que falla** — arma con un fixture mínimo (2 pasos, 1 frase, sin placa real) y verifica el HTML:

```js
// herramientas/test/armar.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

test('armar genera llamadas, barra de progreso y recreaciones marcadas', () => {
  const dir = 'herramientas/test/fixtures/hf'
  execFileSync('node', ['../../../hyperframes/scripts/armar.mjs'], { cwd: dir })
  const pasos = fs.readFileSync(`${dir}/compositions/pasos.html`, 'utf8')
  assert.match(pasos, /class="llamada"/)
  assert.match(pasos, /id="progreso-barra"/)
  assert.doesNotMatch(pasos, /class="paso"/, 'ya no hay tarjeta grande a la izquierda')
  const ventana = fs.readFileSync(`${dir}/compositions/ventana.html`, 'utf8')
  assert.match(ventana, /class="recreacion"[\s\S]*Así lo ve un Empleado/)
  assert.match(ventana, /id="foco"/)
})
```

(Fixture `hf/`: `video.json` con una recreación `{o0:1,o1:3,etiqueta:'Así lo ve un Empleado',html:'<div>menú</div>'}`, `tl.json` y `voz-tiempos.json` mínimos con 2 `caps` y 1 `hl`.)

- [ ] **Step 2: Correr y ver que falla.**

- [ ] **Step 3: Implementación en `armar.mjs`**
  - **Llamadas** en lugar de la tarjeta grande: por cada `cap`, una píldora chica (`class="llamada"`, Geist 22 px, fondo `#0C1A3D` 92 %, borde `#3B82F6`) anclada al elemento en foco del paso (la caja del `foco` o `hl` más cercano en tiempo, convertida a coordenadas de pantalla con la cámara de ese momento), con una flecha corta; entra con fade + 8 px de subida (0,25 s), sale con fade.
  - **Barra de progreso fina** (`id="progreso-barra"`): 4 px abajo de la ventana, avanza por paso; nombre del paso actual a la derecha en 18 px. Se elimina la lista grande de la derecha y la tarjeta numerada.
  - **Foco** (`id="foco"`) para los resaltados: capa negra al 45 % con un hueco redondeado sobre la caja (máscara `clip-path` animada con la cámara) en vez del recuadro.
  - **Subtítulos**: 30 px (antes 40), centrados abajo, máximo 2 líneas, fondo más sutil.
  - **Recreaciones**: por cada item de `video.recreaciones`, una capa dentro de la ventana con el `html` provisto y una etiqueta fija arriba a la izquierda "Así se ve si…"/la `etiqueta`, con borde punteado `#3B82F6` para que se note que es ilustrativa.
  - Resolución: el composition sigue en 1920×1080; `render-final` usa `--resolution landscape-4k`.
  - `entregar.mjs`: `ffmpeg -i renders/final-4k.mp4 -vf scale=2560:1440:flags=lanczos -c:v h264_nvenc -preset p7 -tune hq -rc vbr -cq 18 -b:v 16M -maxrate 24M -c:a copy` + `loudnorm=I=-14:TP=-1.5:LRA=9` sobre el audio; liviana: `fps=30,scale=1920:1080:flags=lanczos`, NVENC multipass ~2,5 Mbps, AAC 96k; copia a `marketing/videos/tutoriales/AAAA-MM-DD_<slug>_16x9[-liviano].mp4`.

- [ ] **Step 4: Test pasa + `npx hyperframes check` del fixture sin errores.**

- [ ] **Step 5: Commit** (cuando se autorice) — `feat(videos): plantilla HyperFrames con llamadas, foco, barra de progreso y recreaciones`.

### Task 6: Herramientas de revisión (cuadros por tramo y escaneos automáticos)

**Files:**
- Create: `herramientas/revision/cuadros.mjs`, `herramientas/revision/escaneos.mjs`
- Test: `herramientas/test/escaneos.test.mjs`

**Interfaces:**
- Produces:
  - `node herramientas/revision/cuadros.mjs <video.mp4> <carpeta-hf> <salida-dir>` → por paso (`caps`): hoja de cuadros a 2/s + el cuadro de cada palabra clave (sustantivos del guion en `palabrasGuion`) + `tramos.json` `[{ paso, o0, o1, texto, cuadros: [...] }]`.
  - `escanear(video): Promise<{ negros:[{t0,t1}], flashes:[{t}], congelados:[{t0,t1}], silencios:[{t0,t1}], saturacion:[{t}], lufs:number, nitidez:[{t, valor}] }>` y CLI `node herramientas/revision/escaneos.mjs <video> > revision-auto.json`. Saltos de cursor y congelados se cruzan con `voz-tiempos.json` si se pasa `--voz` (congelado sin voz = problema).

- [ ] **Step 1: Tests que fallan** — videos sintéticos generados con ffmpeg en el test:

```js
// herramientas/test/escaneos.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { ffmpegPath } from '../lib/deps.mjs'
import { escanear } from '../revision/escaneos.mjs'

const tmp = fs.mkdtempSync('esc-')
// 0–2 s ruido en movimiento, 2–3 s negro, 3–6 s congelado, 6–8 s ruido; audio: tono 0–4 s, silencio 4–8 s
execFileSync(ffmpegPath, ['-v', 'error', '-y',
  '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=2', '-f', 'lavfi', '-i', 'color=black:s=640x360:r=30:d=1',
  '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=0.04,loop=89:1:0', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=2',
  '-f', 'lavfi', '-i', 'sine=f=440:d=4', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono:d=4',
  '-filter_complex', '[0][1][2][3]concat=n=4:v=1:a=0[v];[4][5]concat=n=2:v=0:a=1[a]', '-map', '[v]', '-map', '[a]', `${tmp}/s.mp4`])

test('detecta el tramo negro, el congelado y el silencio', async () => {
  const r = await escanear(`${tmp}/s.mp4`)
  assert.ok(r.negros.some(n => n.t0 > 1.8 && n.t1 < 3.2))
  assert.ok(r.congelados.some(c => c.t0 > 2.8 && c.t1 > 5.5))
  assert.ok(r.silencios.some(s => s.t0 > 3.8))
})
```

- [ ] **Step 2: Correr y ver que falla.**

- [ ] **Step 3: Implementación** (`escaneos.mjs`), parseando stderr de ffmpeg:
  - negros: `-vf blackdetect=d=0.2:pix_th=0.10` → líneas `black_start:… black_end:…`.
  - congelados: `-vf freezedetect=n=-60dB:d=1.5` → `freeze_start` / `freeze_end`.
  - flashes: `-vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG"` → salto de YAVG > 60 entre cuadros consecutivos.
  - silencios: `-af silencedetect=n=-40dB:d=1.0`; saturación: `-af astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level` con pico ≥ -0,1 dBFS; LUFS: `-af ebur128` (línea `I:`).
  - nitidez: 1 cuadro cada 2 s → `nitidezDeArchivo` sobre el recorte central de la ventana (en 1080p: `{x: 420, y: 160, w: 1080, h: 600}`).
  - `cuadros.mjs`: `ffmpeg -ss o0 -to o1 -vf fps=2,scale=960:-1,tile=…` por paso; palabras clave = palabras del guion de más de 5 letras que no sean conectores, cuyo `t = voz.t + palabra.a`.

- [ ] **Step 4: Tests pasan.**

- [ ] **Step 5: Commit** (cuando se autorice) — `feat(videos): cuadros por tramo y escaneos automáticos para el supervisor`.

### Task 7: Preferencias, guía de edición, checklist y rúbrica

**Files:**
- Create: `referencia/preferencias.md`
- Modify: `referencia/estilo.md` (sección nueva "Edición estilo demo de producto"), `referencia/calidad.md` (checklist del supervisor, rúbrica con anclas, umbrales, escaneos)

- [ ] **Step 1:** `preferencias.md` con el contenido exacto de §5 del spec (voz `8mBRP99B2Ng2QwsJMFQl`, música 0,15, ritmo, "lo que se nombra se muestra", alternativas antes del resultado, Avanzado marcado, contenido, calidad, entrega) y una sección "Historial" con las correcciones ya recibidas, fechadas: 2026-10-09 (huecos sin voz, música más baja), 2026-10-10 (tono original, Orbi antes del resultado, sin categorías de prueba), 2026-10-12 (numeritos, empleado, input de Orbi, calidad).
- [ ] **Step 2:** `estilo.md` § "Edición estilo demo de producto": cámara, ritmo y gráficos tal cual §4 del spec, con valores numéricos (zoom 1,35–1,6; curvas 0,8–1,1 s; silencios ≤ 0,6 s; llamada 22 px; foco al 45 %; subtítulos 30 px).
- [ ] **Step 3:** `calidad.md`: checklist 1–8, anclas 0/0,5/1 por criterio (texto concreto de cada nivel), críticos = {1,2,3,6,8} tienen que valer 1, ninguno < 0,5, severidades, escaneos automáticos y qué umbral marca cada uno.
- [ ] **Step 4: Verificación:** `grep -c "8mBRP99B2Ng2QwsJMFQl" referencia/preferencias.md` ≥ 1; `grep -n "0,5" referencia/calidad.md` muestra las anclas.
- [ ] **Step 5: Commit** (cuando se autorice) — `docs(videos): preferencias, guía de edición demo y rúbrica del supervisor`.

### Task 8: Los agentes

**Files:**
- Create: `.claude/agents/guionista-video.md`, `analista-video.md`, `juez-guion.md`, `editor-video.md`, `supervisor-video.md`, `espectador-mudo.md`

**Interfaces:**
- Cada agente lee y escribe en `~/orbita-videos/<slug>/produccion/` (la ruta la pasa el director en el prompt). Salidas: `guion.md`, `analisis.md`, `veredicto-claridad.md` / `veredicto-adversarial.md`, `revision.md`, `espectador.md`. Formato del veredicto (común a los críticos):

```md
# Veredicto: RECHAZADO | APROBADO
## Puntajes
| Criterio | 0 / 0,5 / 1 | Evidencia (frase del guion o segundo + cuadro) |
## Bloqueantes
- [B1] <qué> — evidencia — qué haría
## Mejoras
## Abogado del diablo
<en qué paso se confunde o abandona un comerciante no técnico>
```

- [ ] **Step 1: `guionista-video.md`** — frontmatter `name`, `description`, `tools: Read, Grep, Glob, Bash, Write`, `model: opus`. Cuerpo: lee el pedido, `referencia/preferencias.md`, `referencia/planes.md`, el tema del manual y el código de la pantalla; puede correr `recon.mjs` (solo lectura). Escribe `guion.md` con: objetivo (una frase), gancho, pasos, y la **tabla obligatoria frase → prueba en pantalla (real / negocio demo / recreación marcada) → cómo se logra en la toma**. Regla: una frase sin prueba no se escribe. Si recibe bloqueantes, los responde uno por uno en el guion nuevo, sin justificarse.
- [ ] **Step 2: `analista-video.md`** — `tools: Read, Grep, Glob, Bash, Write`, `model: opus`. Principios de los críticos (copiados de §3 del spec). Produce `analisis.md` con el formato de veredicto más la **lista de afirmaciones verificables**: cada afirmación con `archivo:línea` que la respalda, o "SIN RESPALDO → la frase se cae".
- [ ] **Step 3: `juez-guion.md`** — `tools: Read, Write` (no Bash: no investiga, juzga), `model: sonnet` (familia distinta del guionista, igual de capaz en esta tarea). Recibe en el prompt `modo: claridad | adversarial`. Lee **solo** `guion.md` y `preferencias.md`. Criterios: cada frase con prueba en pantalla; claridad para un comerciante no técnico; gancho; preferencias; revisión anti-IA (explica lo que se ve, "no es X, es Y", listas de negaciones, vocabulario de IA, relleno); riesgos de contenido. En modo adversarial, además, busca activamente por qué el guion fallaría. Escribe `veredicto-<modo>.md`. Rechaza por defecto.
- [ ] **Step 4: `editor-video.md`** — `tools: Read, Grep, Glob, Bash, Write, Edit`, `model: opus`. Implementa el guion aprobado con las herramientas del skill y `estilo.md`; **no graba ni genera voz** (lo pide al director escribiendo `pedidos.md`); antes de entregar un borrador corre `escaneos.mjs` y no entrega si hay negros, congelados sin voz o silencios > 0,6 s fuera de tramos protegidos. Versiona `renders/borrador-vN.mp4`.
- [ ] **Step 5: `supervisor-video.md`** — `tools: Read, Bash, Write` (Bash solo para `cuadros.mjs` / `escaneos.mjs`), `model: sonnet`. Recibe `modo: fidelidad | adversarial` (en rondas normales, `fidelidad`; en el corte final, las dos instancias). Lee el borrador, `guion.md` aprobado, `revision-auto.json`, los bloqueantes abiertos de la ronda anterior (si hay) y `calidad.md`; **no** lee `editar.mjs` ni notas del editor. Aplica la rúbrica; escribe `revision.md`. Solo él cierra bloqueantes.
- [ ] **Step 6: `espectador-mudo.md`** — `tools: Read, Write`, `model: sonnet`. Recibe solo las hojas de cuadros (sin audio ni guion). Escribe `espectador.md`: qué enseña el video, en 3 frases, y qué no entendió. El director lo compara con el objetivo del guion; si no coincide → bloqueante.
- [ ] **Step 7: Verificación:** cada archivo tiene frontmatter válido (`name`, `description`, `tools`, `model`) y los críticos contienen las 8 reglas de "Principios de los críticos" (`grep -c "Rechazo por defecto" .claude/agents/{analista-video,juez-guion,supervisor-video,espectador-mudo}.md`).
- [ ] **Step 8: Commit** (cuando se autorice) — `feat(videos): agentes guionista, analista, juez, editor, supervisor y espectador mudo`.

### Task 9: Calibración de los críticos

**Files:**
- Create: `referencia/calibracion/README.md`, `referencia/calibracion/conoce-tu-panel-v1.md` (defectos etiquetados con segundo), `herramientas/revision/sembrar.mjs`

**Interfaces:**
- Produces: `node herramientas/revision/sembrar.mjs <video> <salida> --defecto silencio|congelado|sin-zoom|panel-abierto --en <seg>`; procedimiento para correr supervisor + espectador sobre el caso v1 y sobre 3 videos con defectos sembrados.

- [ ] **Step 1:** `conoce-tu-panel-v1.md`: video `marketing/videos/tutoriales/2026-10-10_tutorial-conoce-tu-panel_16x9.mp4` y defectos esperados: numeritos nombrados sin verse (~0:17–0:21), "un Empleado ve menos módulos" sin mostrarlo (~0:24–0:28), Orbi sin la caja de texto visible al elegir la pregunta (~0:48–0:51), texto borroso con zoom (varios tramos). Más el caso de producción de la tienda (Fortnite) como contenido con derechos.
- [ ] **Step 2:** `sembrar.mjs`: `silencio` (ffmpeg `volume=0` 3 s), `congelado` (`tpad`/`loop` de 3 s), `panel-abierto` (superponer un recorte del panel de Orbi 4 s después de que se cerró), `sin-zoom` (re-armar con una cámara menos: requiere la carpeta HF; si no, omitir).
- [ ] **Step 3: Correr la calibración** (procedimiento del README): el director dispara `supervisor-video` (modo fidelidad) y `espectador-mudo` sobre v1 y sobre cada sembrado. **Criterio:** v1 → RECHAZADO con al menos los 3 bloqueantes de "lo que se dice, se ve"; cada sembrado → su defecto como bloqueante con el segundo correcto ±1 s. Si falla, se ajusta el prompt del agente y se repite; el resultado queda anotado con fecha en el README.
- [ ] **Step 4: Commit** (cuando se autorice) — `test(videos): calibración de críticos con v1 y defectos sembrados`.

### Task 10: Flujo del director en el skill

**Files:**
- Modify: `SKILL.md` (sección "Producción con agentes" que reemplaza al flujo actual de tutoriales; la parte de promos queda igual)
- Modify: `herramientas/preparar.mjs` (crea `produccion/` con `estado.md` plantilla y la carpeta `<slug>-hf`)
- Create: `referencia/produccion.md` (detalle del flujo, formatos de archivos, rondas)

- [ ] **Step 1:** `SKILL.md` — flujo: preparar → guionista → analista (1–2 vueltas) → juez claridad + juez adversarial (en paralelo, independientes; ambos aprueban o vuelve al guionista; ≤ 3 rondas) → negocio de demo restaurado → ensayo → **permiso de la persona** → toma → voz (**permiso/costo**) → editor (borrador 1080p + escaneos) → supervisor + espectador mudo (≤ 3 rondas, crítico nuevo por ronda con solo los bloqueantes abiertos) → corte final: 2 supervisores (fidelidad + adversarial) → render 4K → `entregar.mjs` → reportar y agregar correcciones de la persona a `preferencias.md`. Si algo no aprueba en 3 rondas: escalar con los bloqueantes. Las reglas que no se negocian (contraseñas, perfil, datos, claves) se mantienen.
- [ ] **Step 2:** `estado.md` plantilla: etapa, ronda, decisiones (con fecha), costos (voz US$, cupo de Orbi, minutos de render), bloqueantes abiertos.
- [ ] **Step 3: Verificación:** `node herramientas/preparar.mjs prueba-flujo` crea `~/orbita-videos/prueba-flujo/produccion/estado.md` y `~/orbita-videos/prueba-flujo-hf/`; borrar después las dos carpetas.
- [ ] **Step 4: Commit** (cuando se autorice) — `docs(videos): flujo del director con agentes en el skill`.

### Task 11: Negocio de demo

**Files:**
- Create: `referencia/demo.md` (guía de alta para la persona + qué datos lleva)
- Create: `herramientas/demo-datos/cargar.mjs`, `restaurar.mjs`, `limpiar.mjs`, `datos.json`, `fotos/` (con `LICENCIAS.md`)

**Interfaces:**
- Produces: `node herramientas/demo-datos/cargar.mjs` (con sesión del negocio de demo activa) → crea por la API del panel categorías, productos con fotos con licencia, clientes, pedidos y un mensaje sin leer; escribe `~/orbita-videos/demo-manifiesto.json` `{ creado: [{ tipo, id, nombre }] }`. `restaurar.mjs --estado <nombre>` deja el estado que pide un guion (p. ej. `mensaje-sin-leer`). `limpiar.mjs` borra solo lo del manifiesto.

- [ ] **Step 1:** `demo.md`: la persona crea el negocio (nombre y rubro creíbles, p. ej. una remería), activa el paquete Avanzado y entra con `login.mjs`. **Nadie más escribe la contraseña.** El perfil persistente pasa a apuntar a ese negocio para los tutoriales (anotar en `tecnica.md` cómo volver al negocio anterior).
- [ ] **Step 2:** Leer los endpoints reales antes de escribir `cargar.mjs`: `graphify query "endpoints para crear categoría, producto, cliente, pedido y mensaje en el panel"` y los controllers de `apps/api/src/{categories,products,customers,orders,messages}`; anotar en `demo.md` cada endpoint usado con `archivo:línea`.
- [ ] **Step 3:** `cargar.mjs` usa `abrirSesion()` y `page.request` (las cookies de la sesión) para llamar a la API; **pide confirmación por consola** con el resumen de lo que va a crear antes de escribir; registra cada id en el manifiesto a medida que crea (si falla a mitad, el manifiesto refleja lo creado).
- [ ] **Step 4:** Fotos: solo con licencia que permita uso comercial (Pixabay/Unsplash o propias de la persona), con `LICENCIAS.md` (fuente, licencia, fecha).
- [ ] **Step 5: Ejecución real** — solo con el negocio de demo creado por la persona y su permiso explícito para cargar los datos; verificar en el panel (recon) que no aparece nada de prueba.
- [ ] **Step 6: Commit** (cuando se autorice) — `feat(videos): negocio de demo con carga, manifiesto, restaurar y limpiar`.

### Task 12: Piloto — "Conocé tu panel" v2

**Files:**
- Create: `~/orbita-videos/conoce-tu-panel-v2/` (fuera del repo) con todo el flujo
- Modify: `referencia/preferencias.md` (correcciones de la persona al final)

- [ ] **Step 1:** Antes de guionar, verificar en el código qué módulos ve un Empleado y si el dueño puede habilitarlos uno por uno (`graphify query "permisos por rol Empleado módulos del menú y configuración de equipo"` → `apps/web/src/layouts/components/Sidebar.tsx`, Configuración → Equipo). El resultado (con `archivo:línea`) va como insumo al guionista.
- [ ] **Step 2:** Correr el flujo completo de Task 10 con el pedido: "Conocé tu panel, resolviendo: numeritos visibles, vista de Empleado (recreación marcada si no hay forma real), Orbi con la caja de texto y el Enviar a la vista".
- [ ] **Step 3: Criterios de aceptación:** los dos jueces aprueban en ≤ 3 rondas; el supervisor cierra sin bloqueantes en ≤ 3 rondas; el espectador mudo describe el objetivo del guion; la nitidez del texto con el zoom máximo en el final 1440p es ≥ 1,5× la de v1 en el mismo recorte (`nitidezDeArchivo`); ninguno de los 4 defectos de v1 aparece.
- [ ] **Step 4:** Entregar (`entregar.mjs`), mandar la liviana con SendUserFile, reportar costos y lo creado en producción; anotar las correcciones de la persona en `preferencias.md`.
