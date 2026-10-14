// Descarga los videos de referencia de urls.txt (Instagram, TikTok, YouTube…) en la mejor calidad
// disponible y prepara el material para analizarlos: hoja de cuadros, el gancho (primeros 3 s) cuadro
// a cuadro, cortes de escena, espectrograma y volumen. Escribe una ficha por video y el catálogo.
//
//   node marketing/referencias/descargar.mjs              -> procesa solo las URLs nuevas
//   node marketing/referencias/descargar.mjs --reanalizar -> vuelve a generar el análisis de todas
//
// Requiere yt-dlp (pip install -U yt-dlp) y ffmpeg/ffprobe en el PATH.
// Si Instagram pide iniciar sesión: exportá vos un cookies.txt del navegador y corré con
//   REFERENCIAS_COOKIES=C:\ruta\cookies.txt node marketing/referencias/descargar.mjs
// (el script nunca lee las cookies del navegador por su cuenta).

import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const URLS = join(RAIZ, 'urls.txt');
const VIDEOS = join(RAIZ, 'videos'); // no se versiona (pesa y no es nuestro)
const FICHAS = join(RAIZ, 'fichas'); // sí se versiona (texto)
const CATALOGO_JSON = join(RAIZ, 'catalogo.json');
const CATALOGO_MD = join(RAIZ, 'catalogo.md');
const FUENTE = 'C\\:/Windows/Fonts/arial.ttf';
const REANALIZAR = process.argv.includes('--reanalizar');

// ffmpeg escribe showinfo y ebur128 en stderr
const stderrDe = (args) => String(spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stderr);

const correr = (cmd, args, opciones = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], ...opciones });

// ---------- URLs y catálogo ----------
const clave = (url) => {
  if (/^[a-zA-Z]:[\\/]|^\//.test(url)) return `local:${url.toLowerCase().replace(/\\/g, '/')}`;
  // Instagram: /reel/<código>/, /reels/<código>/, /p/<código>/ -> instagram:<código>
  const ig = url.match(/instagram\.com\/(?:[^/]+\/)?(?:reels?|p|tv)\/([\w-]+)/i);
  if (ig) return `instagram:${ig[1]}`;
  return url.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
};

// Cada línea: una URL o la ruta de un archivo de video local, y opcionalmente " # nota".
const esLocal = (x) => /^[a-zA-Z]:[\\/]|^\//.test(x);
const leerUrls = () =>
  readFileSync(URLS, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const corte = l.search(/\s+#\s*/);
      const fuente = (corte >= 0 ? l.slice(0, corte) : l).trim().replace(/^"|"$/g, '');
      const nota = corte >= 0 ? l.slice(corte).replace(/^\s+#\s*/, '').trim() : '';
      return { url: fuente, nota };
    })
    .filter((x) => /^https?:\/\//.test(x.url) || esLocal(x.url));

const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Un archivo local se copia a videos/<slug>/ con un info.json mínimo (sin estadísticas)
function importarLocal(ruta) {
  if (!existsSync(ruta)) throw new Error(`ERROR: no existe el archivo ${ruta}`);
  const id = `local-${slug(basename(ruta, extname(ruta)))}`;
  const dir = join(VIDEOS, id);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, 'video.mp4'))) {
    if (extname(ruta).toLowerCase() === '.mp4') copyFileSync(ruta, join(dir, 'video.mp4'));
    else correr('ffmpeg', ['-v', 'error', '-y', '-i', ruta, '-c:v', 'libx264', '-crf', '16', '-c:a', 'aac', join(dir, 'video.mp4')]);
  }
  writeFileSync(join(dir, 'video.info.json'), JSON.stringify({ id, title: basename(ruta, extname(ruta)), extractor_key: 'Archivo local' }));
  return [id];
}

const catalogo = existsSync(CATALOGO_JSON) ? JSON.parse(readFileSync(CATALOGO_JSON, 'utf8')) : [];
const porClave = new Map(catalogo.map((e) => [e.clave, e]));

// ---------- descarga ----------
function descargar(url) {
  const args = [
    '-m', 'yt_dlp', url,
    '-f', 'bv*+ba/b', '--merge-output-format', 'mp4',
    '-o', join(VIDEOS, '%(id)s', 'video.%(ext)s'),
    '--write-info-json', '--write-thumbnail', '--convert-thumbnails', 'jpg',
    '--no-overwrites', '--no-progress', '--retries', '3', '--sleep-requests', '1',
    '--print', 'after_move:%(id)s',
  ];
  if (process.env.REFERENCIAS_COOKIES) args.push('--cookies', process.env.REFERENCIAS_COOKIES);
  const salida = correr('python', args);
  return [...new Set(salida.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];
}

// ---------- análisis ----------
function analizar(id) {
  const dir = join(VIDEOS, id);
  const video = join(dir, 'video.mp4');
  const an = join(dir, 'analisis');
  mkdirSync(an, { recursive: true });
  const info = JSON.parse(readFileSync(join(dir, 'video.info.json'), 'utf8'));

  const probe = JSON.parse(correr('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', video]));
  const v = probe.streams.find((s) => s.codec_type === 'video') || {};
  const tieneAudio = probe.streams.some((s) => s.codec_type === 'audio');
  const duracion = Number(probe.format.duration);
  const [fn, fd] = String(v.r_frame_rate || '30/1').split('/').map(Number);
  const ancho = Math.round(1620 / (v.width >= v.height ? 4 : 6)); // celdas de la hoja

  // Cortes de escena
  let cortes = [...stderrDe(['-i', video, '-vf', "select='gt(scene,0.3)',showinfo", '-f', 'null', '-']).matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
  // Cortes casi pegados (< 0,1 s) son el mismo corte con motion blur
  cortes = cortes.filter((t, i) => i === 0 || t - cortes[i - 1] > 0.1).map((t) => Math.round(t * 100) / 100);

  // Hoja de cuadros (2 por segundo) y gancho (primeros 3 s, 6 por segundo), con el tiempo impreso
  const texto = `drawtext=fontfile='${FUENTE}':text='%{pts\\:hms}':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6`;
  const cols = v.width >= v.height ? 4 : 6;
  correr('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `fps=2,scale=${ancho}:-1,${texto},tile=${cols}x3`, join(an, 'hoja_%02d.png')]);
  correr('ffmpeg', ['-v', 'error', '-y', '-t', '3', '-i', video, '-vf', `fps=6,scale=${ancho}:-1,${texto},tile=${cols}x${Math.ceil(18 / cols)}`, '-frames:v', '1', join(an, 'gancho.png')]);

  let lufs = null;
  if (tieneAudio) {
    correr('ffmpeg', ['-v', 'error', '-y', '-i', video, '-lavfi', 'showspectrumpic=s=1600x400:legend=1:scale=log', join(an, 'espectro.png')]);
    const m = [...stderrDe(['-i', video, '-af', 'ebur128', '-f', 'null', '-']).matchAll(/^\s+I:\s+(-?[\d.]+) LUFS/gm)].pop();
    lufs = m ? Number(m[1]) : null;
  }

  return {
    id,
    titulo: info.title || '',
    autor: info.uploader || info.channel || info.uploader_id || '',
    cuenta: info.uploader_id || info.channel_id || '',
    seguidores: info.channel_follower_count ?? null,
    vistas: info.view_count ?? null,
    likes: info.like_count ?? null,
    comentarios: info.comment_count ?? null,
    fecha: info.upload_date ? `${info.upload_date.slice(0, 4)}-${info.upload_date.slice(4, 6)}-${info.upload_date.slice(6, 8)}` : null,
    descripcion: info.description || info.title || '',
    hashtags: (info.description || '').match(/#[\p{L}\p{N}_]+/gu) || [],
    url: info.webpage_url || '',
    plataforma: info.extractor_key || info.extractor || '',
    duracion: Math.round(duracion * 10) / 10,
    resolucion: `${v.width}x${v.height}`,
    fps: fd ? Math.round((fn / fd) * 100) / 100 : null,
    audio: tieneAudio,
    lufs,
    cortes,
    cortesPorSegundo: duracion ? Math.round((cortes.length / duracion) * 100) / 100 : null,
    primerCorte: cortes[0] ?? null,
    hojas: readdirSync(an).filter((f) => f.startsWith('hoja_')).sort(),
  };
}

// ---------- fichas y catálogo ----------
const num = (n) => (n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)} k` : String(n));

function escribirFicha(e) {
  const a = e.analisis;
  const rel = (f) => relative(FICHAS, join(VIDEOS, a.id, 'analisis', f)).replace(/\\/g, '/');
  const interaccion = a.vistas && a.likes != null ? `${((a.likes / a.vistas) * 100).toFixed(1)} % de likes sobre vistas` : '—';
  const md = `# ${a.autor || a.cuenta || a.titulo || a.id}${a.autor || a.cuenta ? ` · ${a.id}` : ''}

- **URL:** ${a.url || e.url}
- **Agregado:** ${e.agregado}${e.nota ? ` · **Nota:** ${e.nota}` : ''}
- **Publicado:** ${a.fecha || '—'} · **Plataforma:** ${a.plataforma}
- **Vistas:** ${num(a.vistas)} · **Likes:** ${num(a.likes)} · **Comentarios:** ${num(a.comentarios)} · **Seguidores:** ${num(a.seguidores)}
- **Interacción:** ${interaccion}
- **Duración:** ${a.duracion} s · **Formato:** ${a.resolucion} a ${a.fps} fps · **Audio:** ${a.audio ? `sí (${a.lufs ?? '—'} LUFS)` : 'no'}
- **Ritmo:** ${a.cortes.length} cortes (${a.cortesPorSegundo ?? '—'} por segundo) · primer corte a los ${a.primerCorte ?? '—'} s
- **Cortes:** ${a.cortes.join(', ') || 'ninguno detectado (movimiento continuo)'}

## Descripción

${a.descripcion ? a.descripcion.split('\n').map((l) => `> ${l}`).join('\n') : '_sin descripción_'}

${a.hashtags.length ? `**Hashtags:** ${a.hashtags.join(' ')}` : ''}

## Material de análisis (local, no se versiona)

- Gancho, primeros 3 s cuadro a cuadro: [gancho.png](${rel('gancho.png')})
- Hoja de cuadros (2 por segundo): ${a.hojas.map((h) => `[${h}](${rel(h)})`).join(' · ')}
${a.audio ? `- Espectrograma del audio: [espectro.png](${rel('espectro.png')})` : ''}

## Patrones observados

_Lo completa el análisis (paso 2): gancho, estructura, ritmo, texto en pantalla, sonido, cierre._
`;
  writeFileSync(join(FICHAS, `${a.id}.md`), md);
}

function escribirCatalogo() {
  writeFileSync(CATALOGO_JSON, JSON.stringify(catalogo, null, 2));
  const filas = catalogo.map((e) => {
    if (e.error) return `| ${e.agregado} | — | — | — | — | — | ${e.nota || ''} | ❌ ${e.error} |`;
    const a = e.analisis;
    return `| ${e.agregado} | ${a.autor || a.cuenta || a.titulo} | ${num(a.vistas)} | ${num(a.likes)} | ${a.duracion} s | ${a.cortesPorSegundo ?? '—'} | ${e.nota || ''} | [ficha](fichas/${a.id}.md) |`;
  });
  writeFileSync(
    CATALOGO_MD,
    `# Catálogo de referencias\n\nGenerado por \`descargar.mjs\`: no editar a mano (las notas van en \`urls.txt\`).\n\n| Agregado | Autor | Vistas | Likes | Duración | Cortes/s | Nota | Ficha |\n|---|---|---|---|---|---|---|---|\n${filas.join('\n')}\n`,
  );
}

// ---------- principal ----------
mkdirSync(VIDEOS, { recursive: true });
mkdirSync(FICHAS, { recursive: true });
const hoy = new Date().toISOString().slice(0, 10);
let nuevas = 0, fallidas = 0;

for (const { url, nota } of leerUrls()) {
  const k = clave(url);
  const previa = porClave.get(k);
  if (previa && !previa.error && !REANALIZAR) continue;
  try {
    let ids = previa?.analisis ? [previa.analisis.id] : [];
    if (!ids.length || !existsSync(join(VIDEOS, ids[0], 'video.mp4'))) {
      console.log(`↓ ${url}`);
      ids = esLocal(url) ? importarLocal(url) : descargar(url);
    }
    for (const id of ids) {
      console.log(`  analizando ${id}…`);
      const analisis = analizar(id);
      const entrada = { clave: ids.length > 1 ? `${k}#${id}` : k, url, nota, agregado: previa?.agregado || hoy, analisis };
      const i = catalogo.findIndex((e) => e.clave === entrada.clave);
      if (i >= 0) catalogo[i] = entrada; else catalogo.push(entrada);
      porClave.set(entrada.clave, entrada);
      escribirFicha(entrada);
      if (analisis.audio) {
        // Voz en off: transcripción con tiempos, ritmo y pausas (local, con faster-whisper). Si falla, sigue.
        const r = spawnSync('python', [join(RAIZ, 'voz.py'), id], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
        console.log(r.status === 0 ? '  ✓ voz transcripta' : '  · voz: no se pudo analizar (¿falta faster-whisper?)');
      }
      nuevas++;
      console.log(`  ✓ ${analisis.autor || analisis.id} · ${num(analisis.vistas)} vistas · ${analisis.duracion} s · ${analisis.cortes.length} cortes`);
    }
  } catch (e) {
    fallidas++;
    const msg = String(e.stderr || e.message || e).split('\n').find((l) => /ERROR/.test(l)) || String(e.message).split('\n')[0];
    const pideLogin = /login|cookies|rate-limit|not available|private/i.test(msg);
    const error = pideLogin ? 'Instagram pide iniciar sesión (ver README: cookies)' : msg.replace(/\|/g, '/').slice(0, 160);
    console.log(`  ✗ ${url}\n    ${msg}`);
    const entrada = { clave: k, url, nota, agregado: previa?.agregado || hoy, error };
    const i = catalogo.findIndex((x) => x.clave === k);
    if (i >= 0) catalogo[i] = entrada; else catalogo.push(entrada);
    porClave.set(k, entrada);
  }
}

escribirCatalogo();
console.log(`\nListo: ${nuevas} procesadas, ${fallidas} con error. Catálogo: ${relative(process.cwd(), CATALOGO_MD)}`);
