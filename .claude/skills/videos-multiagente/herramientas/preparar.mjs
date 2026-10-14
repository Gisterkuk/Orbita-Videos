// Prepara el entorno de trabajo (FUERA del repo):
//   node .claude/skills/videos-multiagente/herramientas/preparar.mjs --kit
//       instala Playwright + ffmpeg en ~/orbita-videos/kit (una vez por máquina)
//   node .claude/skills/videos-multiagente/herramientas/preparar.mjs <slug> [--promo]
//       crea ~/orbita-videos/<slug>/ con una copia de las herramientas, el
//       compositor (+ fuentes de la marca), carpetas y la plantilla del ejemplo
// Solo usa módulos de Node: no depende del kit.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rutaCodigoOrbita } from './lib/config.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))          // …/videos-multiagente/herramientas
const SKILL = path.dirname(AQUI)
const REPO = path.resolve(SKILL, '..', '..', '..')                // este repo de videos (las entregas van a REPO/marketing)
const CODIGO = rutaCodigoOrbita({ raiz: REPO })                     // el código de Órbita (orbita.config.json)
const VIDEOS = process.env.ORBITA_VIDEOS ?? path.join(os.homedir(), 'orbita-videos')
const KIT = path.join(VIDEOS, 'kit')
const arg = process.argv[2]

function kit() {
  fs.mkdirSync(KIT, { recursive: true })
  const pkg = path.join(KIT, 'package.json')
  if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, JSON.stringify({ name: 'orbita-videos-kit', private: true, type: 'module' }, null, 2))
  const tiene = n => fs.existsSync(path.join(KIT, 'node_modules', n))
  if (!tiene('playwright') || !tiene('ffmpeg-static')) {
    console.log('Instalando playwright y ffmpeg-static en', KIT)
    execSync('npm install playwright ffmpeg-static --no-audit --no-fund', { cwd: KIT, stdio: 'inherit' })
  }
  // ¿Hay un Chromium usable? Si no, bajar el de Playwright
  try {
    execSync(`node -e "import('${pathToUrl(path.join(AQUI, 'lib', 'deps.mjs'))}').then(m => { if (!m.chromePath()) process.exit(3) })"`, { stdio: 'pipe' })
    console.log('Chromium: OK')
  } catch {
    console.log('Bajando Chromium de Playwright (~150 MB)…')
    execSync('npx playwright install chromium', { cwd: KIT, stdio: 'inherit' })
  }
  console.log('Kit listo en', KIT)
}
function pathToUrl(p) { return 'file:///' + p.split(path.sep).join('/').replace(/^\/+/, '') }

function copiar(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, e.name), b = path.join(dst, e.name)
    if (e.isDirectory()) copiar(a, b); else fs.copyFileSync(a, b)
  }
}

if (!arg) { console.log('Uso: preparar.mjs --kit | <slug-del-video>'); process.exit(1) }
if (arg === '--kit') { kit(); process.exit(0) }

if (!fs.existsSync(path.join(KIT, 'node_modules', 'playwright'))) kit()
const DIR = path.join(VIDEOS, arg)
fs.mkdirSync(DIR, { recursive: true })
for (const d of ['tomas', 'out', 'fotos', 'compose/fonts']) fs.mkdirSync(path.join(DIR, d), { recursive: true })
// herramientas: copia CONGELADA (el video queda reproducible aunque el skill cambie)
copiar(AQUI, path.join(DIR, 'herramientas'))
for (const d of ['compositor', 'hyperframes', 'test']) fs.rmSync(path.join(DIR, 'herramientas', d), { recursive: true, force: true })
// compositores: index.html (tutoriales) y promo.html (reels / promos)
for (const f of fs.readdirSync(path.join(AQUI, 'compositor')).filter(f => f.endsWith('.html'))) fs.copyFileSync(path.join(AQUI, 'compositor', f), path.join(DIR, 'compose', f))
const fuentes = path.join(CODIGO, 'apps', 'web', 'public', 'fonts')
for (const f of fs.readdirSync(fuentes).filter(f => /^(geist|sora)-latin/.test(f))) fs.copyFileSync(path.join(fuentes, f), path.join(DIR, 'compose', 'fonts', f))
// plantilla: el ejemplo completo para adaptar (no pisa archivos existentes)
// --promo: plantilla de promos (reel / YouTube) en vez de la del tutorial
const EJ = path.join(SKILL, process.argv.includes('--promo') ? 'ejemplo-promo' : 'ejemplo-cargar-producto')
for (const f of fs.readdirSync(EJ).filter(f => f !== 'LEEME.md')) {
  const dst = path.join(DIR, f)
  if (!fs.existsSync(dst)) fs.copyFileSync(path.join(EJ, f), dst)
}
// producción con agentes: estado de la corrida (etapa, rondas, decisiones, costos)
const PROD = path.join(DIR, 'produccion')
fs.mkdirSync(PROD, { recursive: true })
const ESTADO = path.join(PROD, 'estado.md')
if (!fs.existsSync(ESTADO)) fs.writeFileSync(ESTADO, `# Estado — ${arg}

Etapa: guion | análisis | jueces | ensayo | toma | voz | edición | supervisión | final | entregado
Ronda: guion 0/3 · supervisión 0/3

## Decisiones (con fecha)

## Costos
- Voz (ElevenLabs): US$ 0
- Cupo de Orbi: —
- Render: 0 min

## Bloqueantes abiertos

## Pedidos al director (tomas, voz, datos)

## Dudas
`)
// proyecto HyperFrames del video (tutoriales): plantilla + video.json apuntando a esta carpeta
if (!process.argv.includes('--promo')) {
  const HF = path.join(VIDEOS, `${arg}-hf`)
  if (!fs.existsSync(path.join(HF, 'package.json'))) {
    copiar(path.join(AQUI, 'hyperframes'), HF)
    const ej = JSON.parse(fs.readFileSync(path.join(HF, 'video.ejemplo.json'), 'utf8'))
    fs.writeFileSync(path.join(HF, 'video.json'), JSON.stringify({ ...ej, src: arg, repo: REPO.split(path.sep).join('/'), codigoOrbita: CODIGO.split(path.sep).join('/'), titulo: '', lista: [], recreaciones: [] }, null, 1))
    fs.rmSync(path.join(HF, 'video.ejemplo.json'))
    // música de fondo con licencia (si ya hay una elegida en otro video)
    const musica = path.join(VIDEOS, 'kit', 'musica')
    if (fs.existsSync(musica)) {
      copiar(musica, path.join(HF, 'assets', 'musica'))
      const mj = path.join(HF, 'assets', 'musica', 'musica.json')
      if (fs.existsSync(mj)) fs.renameSync(mj, path.join(HF, 'assets', 'musica.json'))
    }
    try { execSync('npm install --no-audit --no-fund --silent', { cwd: HF, stdio: 'ignore' }) } catch { console.log('  (npm install del proyecto HF falló: correrlo a mano)') }
  }
  console.log(`  proyecto HyperFrames: ${HF} (video.json: completar titulo, lista y recreaciones)`)
}
console.log(`Listo: ${DIR}
  grabar.mjs / grabar-lista.mjs / editar.mjs / guion.json → adaptar al nuevo flujo (vienen del ejemplo "cargar producto")
  fotos/  → archivos que se suben en el video (si hace falta)
  Trabajá con cwd = esa carpeta: cd "${DIR}"`)
