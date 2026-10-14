// Mezcla de "Una foto" (YouTube 4K): voz + música + efectos, todo sincronizado con la imagen.
//
//   node audio/mezcla.mjs A   -> assets/audio/mezcla-A.wav   (48 kHz, 24 bit, −14 LUFS, pico real −1 dBTP)
//   node audio/mezcla.mjs D   -> assets/audio/mezcla-D.wav
//
// Los tiempos salen de audio/marcas-<V>.json con las MISMAS fórmulas que escenas.js (si cambiás una
// ancla allá, cambiala acá). Estructura:
//   0 → clic      oscuro: dron grave, tipeo, un golpe sordo por campo, reloj que corre en "por cada
//                 producto", subida hasta el obturador.
//   clic          impacto + flash: entra el groove (tempo calculado para que el acorde final caiga
//                 justo en "Tu negocio, en órbita").
//   tUna → tTu    el beat se retira (solo pad y marimba) y resuelve en Do mayor con el logo.
// Voz: pasaaltos, de-esser, compresión 3:1, presencia. La música baja sola cuando habla (sidechain).

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const V = (process.argv[2] || 'A').toUpperCase();
const SR = 48000;
const marcas = JSON.parse(readFileSync(`audio/marcas-${V}.json`, 'utf8'));
const M = marcas.palabras;
const DUR = marcas.duracion + 0.7;
const T = (i) => M[i].ini, F = (i) => M[i].fin;

// ───── anclas (copiadas de escenas.js) ─────
const tP = T(11) - 0.42, tPorCada = T(17), tQ = T(22), tFotoQ = T(27), tClick = F(27) + 0.42;
const tOrbi = T(33), tNom = T(38), tCat = T(40), tDesc = T(42), tHasta = T(44), tVar = T(46);
const tFondo = T(50) - 0.05, tLift = tFondo + 0.5, tRev = T(55), tPub = T(57);
const tTienda = T(58), tSin = T(63), tUna = T(67), tTu = T(72);
const tSplit = V === 'A' ? 0 : T(9) + 0.12;
const tAro = V === 'A' ? T(5) : tSplit + 0.05;
const tObt = V === 'A' ? T(8) + 0.02 : tSplit + 0.42;
const tChips = tObt + 0.3, finChips = (V === 'A' ? F(10) : tP) - 0.05;

// ───── utilidades ─────
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(2026);
const ruido = () => rnd() * 2 - 1;
const N = { A1: 55, C2: 65.41, E2: 82.41, F1: 43.65, G1: 49, A2: 110, C3: 130.81, E3: 164.81, F3: 174.61, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98 };
const largo = Math.ceil(SR * DUR);
const pista = () => ({ L: new Float32Array(largo), R: new Float32Array(largo) });
const buf = (seg) => new Float32Array(Math.max(1, Math.round(seg * SR)));
function sumar(p, t0, m, amp = 1, pan = 0) {
  const i0 = Math.round(t0 * SR), gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < m.length; k++) { const i = i0 + k; if (i < 0 || i >= largo) continue; p.L[i] += m[k] * amp * gl; p.R[i] += m[k] * amp * gr; }
}

// ───── instrumentos ─────
function marimba(f, seg = 1.0) { const b = buf(seg); for (let k = 0; k < b.length; k++) { const t = k / SR; b[k] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.3) + 0.35 * Math.sin(2 * Math.PI * f * 3.93 * t) * Math.exp(-t / 0.05) + (t < 0.003 ? ruido() * 0.2 : 0); } return b; }
function bombo(seg = 0.45, fuerza = 1) { const b = buf(seg); let fase = 0; for (let k = 0; k < b.length; k++) { const t = k / SR; const f = 46 + 110 * Math.exp(-t / 0.035); fase += (2 * Math.PI * f) / SR; b[k] = Math.sin(fase) * Math.exp(-t / (0.16 * fuerza)) + (t < 0.003 ? ruido() * 0.3 : 0); } return b; }
function palmas(seg = 0.25) { const b = buf(seg); let low = 0, band = 0; const Fq = 2 * Math.sin((Math.PI * 1500) / SR); for (let k = 0; k < b.length; k++) { const t = k / SR; const env = [0, 0.011, 0.022].reduce((s, d) => s + (t >= d ? Math.exp(-(t - d) / (d === 0.022 ? 0.09 : 0.006)) : 0), 0); const high = ruido() - low - 0.8 * band; band += Fq * high; low += Fq * band; b[k] = band * env * 1.4; } return b; }
function hat(seg = 0.05, abierto = false) { const b = buf(abierto ? 0.22 : seg); let prev = 0; for (let k = 0; k < b.length; k++) { const t = k / SR; const n = ruido(); const hp = n - prev; prev = n; b[k] = hp * Math.exp(-t / (abierto ? 0.08 : 0.014)) * 0.6; } return b; }
function bajo(f, seg) { const b = buf(seg); let low = 0, fase = 0; const Fq = 2 * Math.sin((Math.PI * 420) / SR); for (let k = 0; k < b.length; k++) { const t = k / SR; fase = (fase + f / SR) % 1; low += Fq * (2 * fase - 1 - low); const env = Math.min(1, t / 0.006) * Math.min(1, (seg - t) / 0.03); b[k] = (low * 0.8 + 0.5 * Math.sin(2 * Math.PI * f * t)) * env; } return b; }
function pad(fs, seg, ataque = 0.5) { const b = buf(seg); for (let k = 0; k < b.length; k++) { const t = k / SR; const env = Math.min(1, t / ataque) * Math.min(1, (seg - t) / 0.6); let s = 0; for (const f of fs) s += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t) + 0.12 * Math.sin(2 * Math.PI * f * 3.01 * t); b[k] = (s / fs.length) * env; } return b; }
function campana(f, seg = 1.6) { const b = buf(seg); for (let k = 0; k < b.length; k++) { const t = k / SR; b[k] = (Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.9) + 0.45 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t / 0.35) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t / 0.15)) * Math.min(1, t / 0.002); } return b; }
function whoosh(seg, fIni = 300, fPico = 2800, fFin = 700) { const b = buf(seg); let low = 0, band = 0; for (let k = 0; k < b.length; k++) { const x = k / b.length; const fc = x < 0.6 ? fIni + (fPico - fIni) * (x / 0.6) : fPico + (fFin - fPico) * ((x - 0.6) / 0.4); const Fq = 2 * Math.sin((Math.PI * fc) / SR); const high = ruido() - low - 0.6 * band; band += Fq * high; low += Fq * band; b[k] = band * Math.pow(Math.sin(Math.PI * Math.pow(x, 0.8)), 2) * 1.6; } return b; }
function subida(seg) { const b = buf(seg); let low = 0, band = 0, fase = 0; for (let k = 0; k < b.length; k++) { const x = k / b.length; const Fq = 2 * Math.sin((Math.PI * (300 + 6000 * x * x)) / SR); const high = ruido() - low - 0.7 * band; band += Fq * high; low += Fq * band; fase += (2 * Math.PI * N.A3 * Math.pow(2, 1.5 * x)) / SR; b[k] = (band * 0.9 + 0.3 * Math.sin(fase)) * x * x; } return b; }
function tic(f = 2400, dec = 0.006) { const b = buf(0.04); for (let k = 0; k < b.length; k++) b[k] = Math.sin(2 * Math.PI * f * (k / SR)) * Math.exp(-k / SR / dec); return b; }
function pop(f) { const b = buf(0.25); let fase = 0; for (let k = 0; k < b.length; k++) { const t = k / SR; fase += (2 * Math.PI * f * (1 + Math.exp(-t / 0.012))) / SR; b[k] = Math.sin(fase) * Math.exp(-t / 0.07); } return b; }
function tecla() { // tecla de teclado: clic seco con cuerpo
  const b = buf(0.05); let low = 0; const Fq = 2 * Math.sin((Math.PI * 2500) / SR);
  for (let k = 0; k < b.length; k++) { const t = k / SR; low += Fq * (ruido() - low); b[k] = (low * 1.5 * Math.exp(-t / 0.004) + 0.4 * Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.01)); }
  return b;
}
function obturador() { // espejo que sube y baja: dos golpes metálicos cortos
  const b = buf(0.22); let low = 0, band = 0; const Fq = 2 * Math.sin((Math.PI * 3200) / SR);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR; const high = ruido() - low - 0.5 * band; band += Fq * high; low += Fq * band;
    const env = Math.exp(-t / 0.008) + 0.8 * (t >= 0.075 ? Math.exp(-(t - 0.075) / 0.012) : 0);
    b[k] = band * env * 2 + 0.3 * Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t / 0.03);
  }
  return b;
}
function impacto(seg = 2.2) { // golpe grave con cola, para el paso de la oscuridad a la luz
  const b = buf(seg); let fase = 0;
  for (let k = 0; k < b.length; k++) { const t = k / SR; const f = 38 + 70 * Math.exp(-t / 0.08); fase += (2 * Math.PI * f) / SR; b[k] = Math.sin(fase) * Math.exp(-t / 0.7) + ruido() * 0.25 * Math.exp(-t / 0.05); }
  return b;
}
function barrido(seg, fIni, fFin) { // tono que se desliza (sub que crece en el vuelo de la zapatilla)
  const b = buf(seg); let fase = 0;
  for (let k = 0; k < b.length; k++) { const x = k / b.length; fase += (2 * Math.PI * (fIni + (fFin - fIni) * x * x)) / SR; b[k] = Math.sin(fase) * Math.sin(Math.PI * x); }
  return b;
}

const mus = pista(), sfx = pista();

// ═════ OSCURO (0 → clic) ═════
sumar(mus, 0, pad([N.A1, N.E2, N.A2], tClick + 0.3, 1.2), 0.15);
sumar(mus, tP - 0.3, pad([N.C3, N.E3], tClick - tP + 0.5, 1.5), 0.05);
// tipeo del formulario eterno (mismos tiempos que tipear() en escenas.js)
const tipeo = 'Zapatilla urbana de mal';
[...tipeo].forEach((c, i) => c !== ' ' && sumar(sfx, 0.35 + ((tP - 0.6) * i) / tipeo.length, tecla(), 0.16, -0.45));
// lado derecho del gancho
sumar(sfx, tAro, whoosh(Math.max(0.4, tObt - tAro), 200, 1800, 2600), 0.14, 0.4);
sumar(sfx, tObt - 0.01, obturador(), 0.55, 0.35);
sumar(sfx, tObt, bombo(0.5, 0.8), 0.35);
[N.C6, N.D6, N.E6, N.G6].forEach((f, i) => sumar(sfx, tChips + (i * (finChips - tChips - 0.35)) / 3, pop(f), 0.13, 0.45));
sumar(sfx, finChips, campana(N.C6, 1.0), 0.1, 0.4);
// problema: un golpe sordo por campo
[11, 12, 13, 14, 15, 16].forEach((i, k) => { sumar(mus, T(i) - 0.12, bombo(0.4, 0.6), 0.32); sumar(sfx, T(i) - 0.14, whoosh(0.25, 400, 1600, 600), 0.08); sumar(sfx, T(i) - 0.02, tic(900 + k * 60, 0.012), 0.08); });
// "por cada producto": golpe grave y un reloj que corre
sumar(mus, tPorCada - 0.05, impacto(1.6), 0.28);
sumar(sfx, tPorCada - 0.1, whoosh(0.8, 2400, 400, 120), 0.14);
for (let t = tPorCada + 0.2, k = 0; t < tQ - 0.1; t += 0.25, k++) sumar(sfx, t, tic(k % 2 ? 1900 : 2300, 0.004), 0.07, 0.15);
// el giro: los formularios se vuelven puntos, subida hasta el obturador
sumar(mus, tQ, subida(tClick - tQ), 0.32);
for (let k = 0; k < 10; k++) sumar(sfx, tQ + 0.1 + k * 0.11, tic(3200 + k * 140, 0.01), 0.04, (k % 3) * 0.3 - 0.3);
for (let k = 0; k < 6; k++) sumar(sfx, tFotoQ - 0.05 + k * 0.06, tic(1400, 0.003), 0.08); // diafragma
sumar(sfx, tClick - 0.16, obturador(), 0.6);

// ═════ EL CLIC: de la oscuridad a la luz ═════
sumar(mus, tClick, impacto(), 0.55);
sumar(mus, tClick, palmas(0.6), 0.3);
sumar(sfx, tClick, whoosh(1.1, 7000, 1500, 300), 0.18);
for (const f of [N.C4, N.E4, N.G4, N.C5]) sumar(mus, tClick + 0.05, campana(f, 2.4), 0.07);

// ═════ GROOVE (clic → tUna) — 8 compases exactos hasta "Tu negocio" ═════
const COMPAS = (tTu - tClick) / 8, SEMI = COMPAS / 16;
const ACORDES = [[N.C2, [N.C3, N.E3, N.G3]], [N.A1, [N.A3, N.C4, N.E4]], [N.F1, [N.F3, N.A3, N.C4]], [N.G1, [N.G3, N.D4, N.G4]]];
const BOMBO = [0, 6, 8, 11], PALMAS = [4, 12], BAJO = [0, 3, 6, 8, 11, 14];
const MELO = [[[0, N.E5], [3, N.G5], [6, N.A5], [8, N.G5], [11, N.E5], [14, N.D5]], [[0, N.C5], [3, N.D5], [6, N.E5], [10, N.G5], [12, N.E5]]];
const finBeat = tUna - 0.35;
for (let c = 0; c < 8; c++) {
  const t0 = tClick + c * COMPAS;
  const [raiz, triada] = ACORDES[c % 4];
  sumar(mus, t0, pad(triada, COMPAS + 0.4, 0.3), c === 0 ? 0.05 : 0.075);
  for (let s = 0; s < 16; s++) {
    const t = t0 + s * SEMI;
    if (c === 0 && s < 8) continue;          // el primer medio compás respira después del impacto
    if (t >= finBeat) {                        // el beat se retira: queda la marimba
      if (s % 4 === 0) sumar(mus, t, marimba([N.C5, N.E5, N.G5, N.C6][(s / 4) | 0], 0.8), 0.12, 0.2);
      continue;
    }
    if (BOMBO.includes(s)) sumar(mus, t, bombo(), s === 0 ? 0.62 : 0.48);
    if (PALMAS.includes(s)) sumar(mus, t, palmas(), 0.32, 0.1);
    if (s % 2 === 0) sumar(mus, t, hat(), s % 4 === 2 ? 0.14 : 0.08, 0.35);
    if (c % 2 === 1 && s >= 13) sumar(mus, t, hat(), 0.08, 0.35);
    if (BAJO.includes(s)) sumar(mus, t, bajo(raiz * (s === 6 || s === 14 ? 2 : 1), SEMI * 1.6), 0.28);
  }
  if (t0 < finBeat) for (const [s, f] of MELO[c % 2]) if (t0 + s * SEMI < finBeat && !(c === 0 && s < 8)) sumar(mus, t0 + s * SEMI, marimba(f, 0.7), 0.17, ((s % 5) - 2) * 0.15);
}
sumar(mus, finBeat - 1.0, whoosh(1.0, 300, 3000, 6000), 0.1);

// ═════ EFECTOS DE LA SOLUCIÓN ═════
sumar(sfx, T(31), obturador(), 0.42, -0.1);                         // "le sacás una foto"
sumar(sfx, T(31) + 0.02, campana(N.G6, 0.6), 0.05);
sumar(sfx, tOrbi - 0.05, whoosh(0.9, 900, 5200, 3200), 0.1, -0.2);   // escaneo
for (let i = 0; i < 4; i++) sumar(sfx, tOrbi + 1.0 + i * 0.12, tic(2800 + i * 300, 0.01), 0.06, -0.1); // ramas
const llenados = [[tNom - 0.05, 0.45, 'Zapatilla urbana de malla', N.G5], [tCat - 0.05, 0.3, 'Calzado › Zapatillas', N.A5], [tDesc - 0.05, 1.0, 'Liviana y respirable, con capellada de malla y suela de goma. Cómoda para todo el día.', N.C6]];
for (const [t0, d, tx, nota] of llenados) {
  [...tx].forEach((c, i) => i % 2 === 0 && c !== ' ' && sumar(sfx, t0 + (d * i) / tx.length, tic(3400, 0.003), 0.025, 0.1));
  sumar(sfx, t0 + d, marimba(nota, 0.8), 0.13, 0.1);
}
sumar(sfx, tVar + 0.4, marimba(N.E6, 0.8), 0.13, 0.1);
[0.1, 0.42, 0.74].forEach((d, i) => sumar(sfx, tVar + d, pop([N.D6, N.E6, N.G6][i]), 0.09, -0.2)); // colores
sumar(sfx, tFondo, whoosh(0.5, 5000, 9000, 4000), 0.1);              // se va el fondo
for (let k = 0; k < 5; k++) sumar(sfx, tFondo + 0.05 + k * 0.08, campana(N.C6 * (1 + k * 0.125), 0.5), 0.025);
sumar(sfx, tLift, whoosh(0.9, 250, 2400, 500), 0.2, 0.3);            // la zapatilla sale de la foto
sumar(mus, tLift, barrido(1.0, 45, 70), 0.3);
for (let i = 0; i < 4; i++) sumar(sfx, tRev + i * 0.12, tic(2200 + i * 200, 0.008), 0.06);
sumar(sfx, tPub + 0.15, tecla(), 0.3, -0.1);                         // clic en Publicar
sumar(sfx, tPub + 0.22, campana(N.C6, 1.2), 0.1);
sumar(sfx, tPub + 0.3, campana(N.E6, 1.2), 0.08);

// ═════ TIENDA ═════
sumar(sfx, tTienda - 0.2, whoosh(0.7, 600, 4000, 1500), 0.16);
for (let i = 0; i < 14; i++) sumar(sfx, tTienda - 0.12 + i * 0.035, tic(1800 + (i % 4) * 250, 0.005), 0.05, (i % 5) * 0.2 - 0.4);
sumar(sfx, tTienda + 0.1, pop(N.G5), 0.08);
sumar(sfx, tSin - 0.45, whoosh(0.6, 800, 6000, 9000), 0.14);
sumar(sfx, F(66) - 0.05, pop(N.C6), 0.12);

// ═════ CIERRE ═════
[67, 68, 69, 70].forEach((i, k) => sumar(sfx, T(i) - 0.04, marimba([N.C5, N.E5, N.G5, N.A5][k], 0.6), 0.07));
sumar(sfx, T(71) - 0.04, campana(N.C6, 1.4), 0.1);
sumar(sfx, tTu - 0.25, whoosh(1.0, 400, 2600, 900), 0.12);           // el satélite dibuja la órbita
sumar(mus, tTu, bombo(0.7), 0.6);
sumar(mus, tTu, impacto(2.4), 0.2);
for (const f of [N.C4, N.E4, N.G4, N.C5, N.E5]) sumar(mus, tTu, campana(f, 3.2), 0.09);
sumar(mus, tTu, pad([N.C3, N.E3, N.G3, N.C4], DUR - tTu, 0.2), 0.11);
sumar(mus, tTu, bajo(N.C2, 1.6), 0.3);
sumar(sfx, F(75) + 0.1, marimba(N.C6, 1.2), 0.1);                    // orbita.site

// ═════ VOZ, SIDECHAIN Y MÁSTER ═════
mkdirSync('assets/audio', { recursive: true });
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', `assets/audio/voz-${V}.wav`, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 256 * 1024 * 1024 });
const voz = new Float32Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 4));
const env = new Float32Array(largo);
let e = 0;
const aA = Math.exp(-1 / (0.015 * SR)), aR = Math.exp(-1 / (0.28 * SR));
for (let i = 0; i < largo; i++) { const v = Math.abs(i < voz.length ? voz[i] : 0); e = v > e ? aA * e + (1 - aA) * v : aR * e + (1 - aR) * v; env[i] = e; }
const cama = { L: new Float32Array(largo), R: new Float32Array(largo) };
for (let i = 0; i < largo; i++) {
  const duck = Math.pow(10, (-8 * Math.min(1, env[i] / 0.02)) / 20); // la música baja hasta 8 dB, los efectos 4
  const duckSfx = Math.pow(10, (-4 * Math.min(1, env[i] / 0.02)) / 20);
  cama.L[i] = mus.L[i] * 0.5 * duck + sfx.L[i] * duckSfx;
  cama.R[i] = mus.R[i] * 0.5 * duck + sfx.R[i] * duckSfx;
}
for (let k = 0, n = Math.round(0.6 * SR); k < n; k++) { const g = (1 - k / n) ** 2; cama.L[largo - n + k] *= g; cama.R[largo - n + k] *= g; }

function wavFloat(ruta, L, R) {
  const n = L.length, datos = Buffer.alloc(n * 8);
  for (let i = 0; i < n; i++) { datos.writeFloatLE(L[i], i * 8); datos.writeFloatLE(R[i], i * 8 + 4); }
  const c = Buffer.alloc(44);
  c.write('RIFF', 0); c.writeUInt32LE(36 + datos.length, 4); c.write('WAVE', 8); c.write('fmt ', 12); c.writeUInt32LE(16, 16);
  c.writeUInt16LE(3, 20); c.writeUInt16LE(2, 22); c.writeUInt32LE(SR, 24); c.writeUInt32LE(SR * 8, 28); c.writeUInt16LE(8, 32); c.writeUInt16LE(32, 34);
  c.write('data', 36); c.writeUInt32LE(datos.length, 40);
  writeFileSync(ruta, Buffer.concat([c, datos]));
}
// Reverb de sala para la cama: respuesta al impulso de ruido con caída exponencial (1,8 s), estéreo
const IR = { L: new Float32Array(Math.round(1.8 * SR)), R: new Float32Array(Math.round(1.8 * SR)) };
for (let k = 0; k < IR.L.length; k++) { const d = Math.exp(-k / SR / 0.45); IR.L[k] = ruido() * d; IR.R[k] = ruido() * d; }
const TMP = 'audio/.tmp';
mkdirSync(TMP, { recursive: true });
wavFloat(`${TMP}/cama-${V}.wav`, cama.L, cama.R);
wavFloat(`${TMP}/ir.wav`, IR.L, IR.R);

const grafo = [
  // voz de estudio: pasaaltos, calidez, presencia, de-esser, compresión, a estéreo
  `[0:a]aresample=${SR},highpass=f=75,equalizer=f=170:t=q:w=1.1:g=1.5,equalizer=f=3600:t=q:w=1.3:g=2,deesser=i=0.35,acompressor=threshold=-22dB:ratio=3:attack=8:release=150:makeup=3dB,pan=stereo|c0=c0|c1=c0,apad=whole_len=${largo}[voz]`,
  // la cama con un poco de sala
  `[1:a]asplit=2[seca][amojar]`,
  `[amojar][2:a]afir=dry=0:wet=1:irgain=-14dB[mojada]`,
  `[seca][mojada]amix=inputs=2:weights='1 0.22':normalize=0[cama]`,
  `[voz][cama]amix=inputs=2:weights='1 0.85':normalize=0:duration=first,atrim=0:${DUR.toFixed(3)}[mezcla]`,
];
const cruda = `${TMP}/cruda-${V}.wav`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `assets/audio/voz-${V}.wav`, '-i', `${TMP}/cama-${V}.wav`, '-i', `${TMP}/ir.wav`, '-filter_complex', grafo.join(';'), '-map', '[mezcla]', '-c:a', 'pcm_f32le', cruda]);
// máster en dos pasadas: −14 LUFS integrados, pico real −1 dBTP (loudnorm escribe su medición en stderr)
const LN = 'loudnorm=I=-14:TP=-1:LRA=9';
const r1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', cruda, '-af', `${LN}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const m = JSON.parse(r1.stderr.slice(r1.stderr.lastIndexOf('{'), r1.stderr.lastIndexOf('}') + 1));
const salida = `assets/audio/mezcla-${V}.wav`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', cruda, '-af',
  `${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=${SR}`,
  '-c:a', 'pcm_s24le', salida]);
const r2 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', salida, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
const I = (r2.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop(), TP = (r2.stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
console.log(`${salida} · ${DUR.toFixed(2)} s · compás ${COMPAS.toFixed(3)} s (${(240 / COMPAS).toFixed(1)} BPM) · clic ${tClick.toFixed(2)} s · resolución ${tTu.toFixed(2)} s · ${I} · pico real ${TP}`);
