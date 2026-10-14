// Mezcla del reel narrado "Tu negocio, en órbita": voz + colchón + golpes + beat, todo sintetizado.
//
//   node audio/mezcla.mjs          -> assets/audio/mezcla.wav (−14 LUFS, pico −1,5 dBFS)
//
// Estructura (los tiempos salen de guiones/2026-10-09_narracion-tiempos.json):
//   0,00–5,42  colchón grave + un golpe afinado por cada cosa que aparece (Do-Re-Mi-Sol de la pentatónica)
//   5,32–7,72  el beat se arma: bombo que acelera, hats que entran, subida de ruido
//   7,72       DROP en "Conocé Órbita": groove a 100 BPM (compás = 2,4 s) en Do mayor (Do–Lam–Fa–Sol)
//   26,92      el último compás cae en "Tu negocio, en órbita": acorde final y cola hasta 30 s
// El gancho melódico del beat usa la misma marimba y las mismas notas que los golpes del principio,
// así el beat "sale" de lo que ya sonó. La música baja sola (sidechain) cada vez que habla la voz.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const SR = 48000;
const DURACION = 30;
const VOZ = 'assets/audio/voz.mp3';
const SALIDA = 'assets/audio/mezcla.wav';

// ---------- utilidades ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2026);
const ruido = () => rnd() * 2 - 1;
const N = {
  C1: 32.7, F1: 43.65, G1: 49.0, A1: 55.0, C2: 65.41, F2: 87.31, G2: 98.0, A2: 110.0,
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880.0, C6: 1046.5, D6: 1174.66, E6: 1318.51,
};
const largo = Math.ceil(SR * DURACION);
const pista = () => ({ L: new Float32Array(largo), R: new Float32Array(largo) });
const buf = (seg) => new Float32Array(Math.round(seg * SR));
function sumar(p, t0, m, amp = 1, pan = 0) {
  const i0 = Math.round(t0 * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < m.length; k++) {
    const i = i0 + k;
    if (i < 0 || i >= largo) continue;
    p.L[i] += m[k] * amp * gl;
    p.R[i] += m[k] * amp * gr;
  }
}

// ---------- instrumentos ----------
function marimba(f, seg = 1.0) {
  const b = buf(seg);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    b[k] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.3) + 0.35 * Math.sin(2 * Math.PI * f * 3.93 * t) * Math.exp(-t / 0.05) + (t < 0.003 ? ruido() * 0.2 : 0);
  }
  return b;
}
function bombo(seg = 0.45, fuerza = 1) {
  const b = buf(seg);
  let fase = 0;
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const f = 48 + 110 * Math.exp(-t / 0.035);
    fase += (2 * Math.PI * f) / SR;
    b[k] = (Math.sin(fase) * Math.exp(-t / (0.16 * fuerza)) + (t < 0.003 ? ruido() * 0.3 : 0));
  }
  return b;
}
function palmas(seg = 0.25) {
  // tres ráfagas de ruido muy juntas (como varias manos) por un pasabanda en ~1,5 kHz
  const b = buf(seg);
  let low = 0, band = 0;
  const F = 2 * Math.sin((Math.PI * 1500) / SR);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const env = [0, 0.011, 0.022].reduce((s, d) => s + (t >= d ? Math.exp(-(t - d) / (d === 0.022 ? 0.09 : 0.006)) : 0), 0);
    const high = ruido() - low - 0.8 * band;
    band += F * high; low += F * band;
    b[k] = band * env * 1.4;
  }
  return b;
}
function hat(seg = 0.05, abierto = false) {
  const b = buf(abierto ? 0.22 : seg);
  let prev = 0;
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const n = ruido();
    const hp = n - prev; prev = n; // pasaaltos simple
    b[k] = hp * Math.exp(-t / (abierto ? 0.08 : 0.014)) * 0.6;
  }
  return b;
}
function bajo(f, seg) {
  // diente de sierra suave filtrado: redondo, sin zumbar
  const b = buf(seg);
  let low = 0, fase = 0;
  const F = 2 * Math.sin((Math.PI * 420) / SR);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    fase = (fase + f / SR) % 1;
    const saw = 2 * fase - 1;
    low += F * (saw - low);
    const env = Math.min(1, t / 0.006) * Math.min(1, (seg - t) / 0.03);
    b[k] = (low * 0.8 + 0.5 * Math.sin(2 * Math.PI * f * t)) * env;
  }
  return b;
}
function pad(fs, seg) {
  const b = buf(seg);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.5) * Math.min(1, (seg - t) / 0.6);
    let s = 0;
    for (const f of fs) s += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t);
    b[k] = (s / fs.length) * env;
  }
  return b;
}
function campana(f, seg = 1.6) {
  const b = buf(seg);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    b[k] = (Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.9) + 0.45 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t / 0.35) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t / 0.15)) * Math.min(1, t / 0.002);
  }
  return b;
}
function whoosh(seg, fIni = 300, fPico = 2800, fFin = 700) {
  const b = buf(seg);
  let low = 0, band = 0;
  for (let k = 0; k < b.length; k++) {
    const x = k / b.length;
    const fc = x < 0.6 ? fIni + (fPico - fIni) * (x / 0.6) : fPico + (fFin - fPico) * ((x - 0.6) / 0.4);
    const F = 2 * Math.sin((Math.PI * fc) / SR);
    const high = ruido() - low - 0.6 * band;
    band += F * high; low += F * band;
    b[k] = band * Math.pow(Math.sin(Math.PI * Math.pow(x, 0.8)), 2) * 1.6;
  }
  return b;
}
function subida(seg) {
  const b = buf(seg);
  let low = 0, band = 0, fase = 0;
  for (let k = 0; k < b.length; k++) {
    const x = k / b.length;
    const F = 2 * Math.sin((Math.PI * (300 + 6000 * x * x)) / SR);
    const high = ruido() - low - 0.7 * band;
    band += F * high; low += F * band;
    fase += (2 * Math.PI * N.C4 * Math.pow(2, x)) / SR;
    b[k] = (band * 0.9 + 0.3 * Math.sin(fase)) * x * x;
  }
  return b;
}
function tic(f = 2400) {
  const b = buf(0.03);
  for (let k = 0; k < b.length; k++) b[k] = Math.sin(2 * Math.PI * f * (k / SR)) * Math.exp(-k / SR / 0.006);
  return b;
}
function pop(f) {
  const b = buf(0.25);
  let fase = 0;
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    fase += (2 * Math.PI * f * (1 + Math.exp(-t / 0.012))) / SR;
    b[k] = Math.sin(fase) * Math.exp(-t / 0.07);
  }
  return b;
}

// ---------- música ----------
const musica = pista();
const BPM = 100, PULSO = 60 / BPM, SEMI = PULSO / 4, COMPAS = PULSO * 4; // 0,6 · 0,15 · 2,4 s
const DROP = 7.72, FIN = 26.92;

// Colchón grave del principio (Do2 + Sol2), que se abre en el drop
sumar(musica, 0, pad([N.C2, N.G2], DROP + 0.4), 0.16);

// Golpes del gancho y del problema, afinados (Do-Re-Mi-Sol): son las mismas notas del gancho del beat
for (const [t, f, a] of [[0.05, N.C5, 0.42], [0.72, N.C5, 0.25], [1.52, N.D5, 0.42], [2.34, N.E5, 0.42], [3.1, N.G5, 0.45]]) {
  sumar(musica, t, marimba(f), a, (t * 0.7) % 1 - 0.5);
  sumar(musica, t, bombo(0.35, 0.6), 0.32);
}
sumar(musica, 4.5, whoosh(0.7, 1400, 300, 200), 0.32, 0.2); // se dispersa

// El beat se arma (5,32–7,72): bombo cada pulso y después cada medio pulso, hats que entran, subida
for (let t = 5.32; t < DROP - 0.01; t += PULSO) sumar(musica, t, bombo(0.3, 0.7), 0.28 + 0.25 * ((t - 5.32) / 2.4));
for (let t = 6.52; t < DROP - 0.01; t += PULSO / 2) sumar(musica, t, bombo(0.2, 0.5), 0.3);
for (let t = 5.92; t < DROP - 0.01; t += SEMI * 2) sumar(musica, t, hat(), 0.1 + 0.12 * ((t - 5.92) / 1.8), 0.3);
sumar(musica, DROP - 1.5, subida(1.5), 0.38);
// los golpes del principio vuelven, más rápido, mientras se arma (Do-Re-Mi-Sol en corcheas)
[N.C5, N.D5, N.E5, N.G5, N.A5, N.G5, N.E5, N.D5].forEach((f, k) => sumar(musica, 6.52 + k * (PULSO / 2), marimba(f, 0.6), 0.22, k % 2 ? 0.35 : -0.35));

// Groove desde el drop: 16 semicorcheas por compás
const ACORDES = [[N.C2, [N.C3, N.E3, N.G3]], [N.A1, [N.A3, N.C4, N.E4]], [N.F1, [N.F3, N.A3, N.C4]], [N.G1, [N.G3, N.D4, N.G3 * 2]]];
const BOMBO = [0, 6, 8, 11];
const PALMAS = [4, 12];
const BAJO = [0, 3, 6, 8, 11, 14];
// Gancho melódico de 2 compases (pentatónica de Do), mismo timbre que los golpes del principio
const GANCHO = [
  [[0, N.E5], [3, N.G5], [6, N.A5], [8, N.G5], [11, N.E5], [14, N.D5]],
  [[0, N.C5], [3, N.D5], [6, N.E5], [10, N.G5], [12, N.E5]],
];
sumar(musica, DROP, palmas(0.6), 0.45);               // golpe del drop
sumar(musica, DROP, whoosh(0.9, 6000, 1200, 300), 0.25);
for (let c = 0; DROP + c * COMPAS < FIN - 0.01; c++) {
  const t0 = DROP + c * COMPAS;
  const [raiz, triada] = ACORDES[c % 4];
  sumar(musica, t0, pad(triada, COMPAS + 0.3), 0.07);
  for (let s = 0; s < 16; s++) {
    const t = t0 + s * SEMI;
    if (BOMBO.includes(s)) sumar(musica, t, bombo(), s === 0 ? 0.7 : 0.55);
    if (PALMAS.includes(s)) sumar(musica, t, palmas(), 0.4, 0.1);
    if (s % 2 === 0) sumar(musica, t, hat(), s % 4 === 2 ? 0.16 : 0.09, 0.35);
    if (c % 2 === 1 && s >= 13) sumar(musica, t, hat(), 0.1, 0.35); // redoble de hats cada 2 compases
    if (s === 14 && c % 4 === 3) sumar(musica, t, hat(0, true), 0.12, 0.35);
    if (BAJO.includes(s)) sumar(musica, t, bajo(raiz * (s === 6 || s === 14 ? 2 : 1), SEMI * 1.6), 0.32);
  }
  for (const [s, f] of GANCHO[c % 2]) sumar(musica, t0 + s * SEMI, marimba(f, 0.7), 0.24, ((s % 5) - 2) * 0.15);
}

// Resolución en "Tu negocio, en órbita": acorde de Do mayor, golpe y cola
sumar(musica, FIN, bombo(0.6), 0.75);
sumar(musica, FIN, palmas(0.6), 0.35);
for (const f of [N.C4, N.E4, N.G4, N.C5]) sumar(musica, FIN, campana(f, 2.8), 0.16);
sumar(musica, FIN, pad([N.C3, N.E3, N.G3, N.C4], DURACION - FIN), 0.12);
sumar(musica, FIN, bajo(N.C2, 1.4), 0.35);
sumar(musica, 28.45, marimba(N.C6, 1.2), 0.22); // brillo cuando aparece orbita.site

// ---------- efectos del guion (en los silencios de la voz) ----------
const sfx = pista();
sumar(sfx, 8.8, campana(N.E6, 1.2), 0.18);                                   // después de "Conocé Órbita"
[9.62, 9.7, 9.78, 9.9, 9.98, 10.08, 10.2, 10.3, 10.42, 10.52, 10.66, 10.76].forEach((t, i) => sumar(sfx, t, tic(2600 + (i % 3) * 200), 0.05, 0.2)); // tipeo
[[11.6, N.G5], [11.75, N.A5], [11.9, N.C6]].forEach(([t, f]) => sumar(sfx, t, pop(f), 0.18, 0.3));          // ✓ de Orbi
sumar(sfx, 12.1, whoosh(0.3, 1500, 5000, 2500), 0.16);                           // cartas a la tienda
[14.3, 14.64, 15.0].forEach((t, i) => sumar(sfx, t, pop([N.D5, N.E5, N.G5][i]), 0.16, -0.2));                 // pedidos
sumar(sfx, 15.42, campana(N.C6, 0.9), 0.14);                                     // cobro aprobado
sumar(sfx, 16.92, whoosh(0.7, 3000, 7000, 4000), 0.12, 0.3);                     // la planilla se desarma
sumar(sfx, 18.48, whoosh(0.5, 4000, 900, 300), 0.18);                            // "Juntá todo"
[19.7, 19.86, 20.02, 20.18, 20.34, 20.5].forEach((t, i) => sumar(sfx, t, tic(3000 + i * 150), 0.06, 0.2));    // uní los puntos
sumar(sfx, 21.5, campana(N.E6, 1.0), 0.14);                                      // la barra que brilla

// ---------- voz y sidechain ----------
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', VOZ, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 256 * 1024 * 1024 });
const voz = new Float32Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 4));
// envolvente de la voz (ataque 15 ms, relajación 250 ms) → la música baja hasta 7 dB cuando habla
const env = new Float32Array(largo);
let e = 0;
const aA = Math.exp(-1 / (0.015 * SR)), aR = Math.exp(-1 / (0.25 * SR));
for (let i = 0; i < largo; i++) {
  const v = Math.abs(i < voz.length ? voz[i] : 0);
  e = v > e ? aA * e + (1 - aA) * v : aR * e + (1 - aR) * v;
  env[i] = e;
}
const umbral = 0.02;
const L = new Float32Array(largo), R = new Float32Array(largo);
for (let i = 0; i < largo; i++) {
  const duck = Math.pow(10, (-7 * Math.min(1, env[i] / umbral)) / 20);
  const v = i < voz.length ? voz[i] * 1.0 : 0;
  L[i] = v + (musica.L[i] * 0.55 + sfx.L[i]) * duck;
  R[i] = v + (musica.R[i] * 0.55 + sfx.R[i]) * duck;
}
// cola: fundido del último medio segundo
for (let k = 0, n = Math.round(0.5 * SR); k < n; k++) { const g = (1 - k / n) ** 2; L[largo - n + k] *= g; R[largo - n + k] *= g; }

// ---------- escribir (y normalizar a −14 LUFS con ffmpeg) ----------
let pico = 0;
for (let i = 0; i < largo; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.9 / pico;
const datos = Buffer.alloc(largo * 4);
for (let i = 0; i < largo; i++) {
  datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
  datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
}
const cab = Buffer.alloc(44);
cab.write('RIFF', 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write('WAVE', 8);
cab.write('fmt ', 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(2, 22);
cab.writeUInt32LE(SR, 24); cab.writeUInt32LE(SR * 4, 28); cab.writeUInt16LE(4, 32); cab.writeUInt16LE(16, 34);
cab.write('data', 36); cab.writeUInt32LE(datos.length, 40);
mkdirSync('assets/audio', { recursive: true });
writeFileSync('assets/audio/mezcla-cruda.wav', Buffer.concat([cab, datos]));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'assets/audio/mezcla-cruda.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', String(SR), SALIDA]);
console.log(`${SALIDA}: ${DURACION} s · drop en ${DROP} s · resolución en ${FIN} s`);
