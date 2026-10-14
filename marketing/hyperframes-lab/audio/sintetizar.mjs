// Sintetiza los efectos de sonido del hook de Órbita a un WAV (48 kHz, estéreo, 16 bits).
// Todo es generado por código: no hay muestras de terceros ni licencias.
// Los golpes están afinados en la pentatónica de Do mayor, así que forman una melodía.
//
//   node audio/sintetizar.mjs                 -> assets/audio/sfx.wav
//
// Para cambiar el sonido, editá EVENTOS (tiempo en segundos, sincronizado con index.html).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SR = 48000;
const DURACION = 15;
const SALIDA = 'assets/audio/sfx.wav';

// Notas (Hz)
const N = {
  C4: 261.63, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880.0,
  C6: 1046.5, E6: 1318.51,
};

// Ruido determinístico (mismo WAV en cada corrida)
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

const L = new Float32Array(Math.ceil(SR * DURACION));
const R = new Float32Array(L.length);

function sumar(t0, muestras, amp = 1, pan = 0) {
  const i0 = Math.round(t0 * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < muestras.length; k++) {
    const i = i0 + k;
    if (i < 0 || i >= L.length) continue;
    L[i] += muestras[k] * amp * gl;
    R[i] += muestras[k] * amp * gr;
  }
}

const buf = (seg) => new Float32Array(Math.round(seg * SR));

// Marimba: fundamental + parcial ~3,93x que se apaga rápido + un clic de ataque.
function marimba(f, seg = 1.1) {
  const b = buf(seg);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    b[k] =
      Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.32) +
      0.35 * Math.sin(2 * Math.PI * f * 3.93 * t) * Math.exp(-t / 0.05) +
      (t < 0.003 ? ruido() * 0.25 * (1 - t / 0.003) : 0);
  }
  return b;
}

// Golpe sordo: seno que cae de 150 a 50 Hz (el "peso" del impacto).
function golpe(seg = 0.35, fIni = 150, fFin = 50) {
  const b = buf(seg);
  let fase = 0;
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const f = fFin + (fIni - fFin) * Math.exp(-t / 0.04);
    fase += (2 * Math.PI * f) / SR;
    b[k] = Math.sin(fase) * Math.exp(-t / 0.11) + (t < 0.004 ? ruido() * 0.4 : 0);
  }
  return b;
}

// Pop: burbuja, el tono baja de 2f a f en 30 ms.
function pop(f, seg = 0.25) {
  const b = buf(seg);
  let fase = 0;
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const fi = f * (1 + Math.exp(-t / 0.012));
    fase += (2 * Math.PI * fi) / SR;
    b[k] = Math.sin(fase) * Math.exp(-t / 0.07);
  }
  return b;
}

// Tic: clic muy corto y agudo.
function tic(f = 2400, seg = 0.03) {
  const b = buf(seg);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    b[k] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.006);
  }
  return b;
}

// Campana suave: parciales inarmónicos con cola larga.
function campana(f, seg = 1.4) {
  const b = buf(seg);
  const parciales = [[1, 1, 0.9], [2.76, 0.45, 0.35], [5.4, 0.2, 0.15]];
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    let s = 0;
    for (const [m, a, d] of parciales) s += a * Math.sin(2 * Math.PI * f * m * t) * Math.exp(-t / d);
    b[k] = s * Math.min(1, t / 0.002);
  }
  return b;
}

// Whoosh: ruido por un filtro pasabanda (SVF) que barre de fIni a fPico y vuelve, con envolvente suave.
function whoosh(seg, fIni = 300, fPico = 2800, fFin = 700) {
  const b = buf(seg);
  let low = 0, band = 0;
  for (let k = 0; k < b.length; k++) {
    const x = k / b.length;
    const fc = x < 0.6 ? fIni + (fPico - fIni) * (x / 0.6) : fPico + (fFin - fPico) * ((x - 0.6) / 0.4);
    const F = 2 * Math.sin((Math.PI * fc) / SR);
    const q = 0.6;
    const high = ruido() - low - q * band;
    band += F * high;
    low += F * band;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(x, 0.8)), 2);
    b[k] = band * env * 1.6;
  }
  return b;
}

// Colchón grave: Do2 + Sol2, con un pulso suave a 120 BPM.
function colchon(seg) {
  const b = buf(seg);
  for (let k = 0; k < b.length; k++) {
    const t = k / SR;
    const ent = Math.min(1, t / 0.4);
    const sal = Math.min(1, (seg - t) / 1.4);
    const pulso = 0.82 + 0.18 * Math.pow(Math.cos(Math.PI * ((t * 2) % 1)), 2);
    b[k] = (Math.sin(2 * Math.PI * 65.41 * t) + 0.5 * Math.sin(2 * Math.PI * 98.0 * t)) * ent * sal * pulso;
  }
  return b;
}

// [tiempo, sonido, amplitud, paneo]
const EVENTOS = [
  // 01 · Lanzamiento: el satélite rebota (Do, Re, Mi, Sol) y sale disparado
  [0.40, marimba(N.C5), 0.45, -0.1], [0.40, golpe(), 0.35, 0],
  [0.78, marimba(N.D5), 0.42, 0.0], [0.78, golpe(), 0.25, 0],
  [1.06, marimba(N.E5), 0.48, 0.1], [1.06, golpe(0.45, 120, 42), 0.6, 0],
  [1.26, marimba(N.G5), 0.22, 0.15], [1.26, golpe(), 0.12, 0],
  [1.32, whoosh(0.22, 400, 3200, 1500), 0.32, 0.1],
  // 02 · Tu tienda: dos golpes de texto (Mi, Sol), el punto cae (La), whip de salida
  [1.58, golpe(0.4), 0.75, -0.2], [1.58, marimba(N.E4), 0.5, -0.2],
  [1.86, golpe(0.4), 0.75, 0.2], [1.86, marimba(N.G4), 0.5, 0.2],
  [2.26, pop(N.A5), 0.5, 0.3], [2.26, marimba(N.A5), 0.28, 0.3],
  [2.38, tic(1800), 0.12, 0.3],
  [2.70, whoosh(0.32), 0.5, -0.3],
  // 03 · Productos: aparece el satélite (La), guías, morph, contenido (Do), contador y campana (Mi)
  [3.03, pop(N.A4, 0.3), 0.55, 0], [3.03, marimba(N.C5), 0.3, 0],
  [3.16, tic(3000), 0.12, -0.2],
  [3.48, whoosh(0.26, 900, 4200, 2000), 0.28, 0.1],
  [3.78, marimba(N.C5), 0.38, 0],
  ...[3.86, 3.9, 3.94, 3.98, 4.03, 4.08, 4.14, 4.2, 4.27].map((t, i) => [t, tic(2600 + i * 60), 0.08, 0.15]),
  [4.32, campana(N.E6), 0.3, 0.1], [4.32, marimba(N.C6), 0.18, 0.1],
  // 03 · el abanico se abre: un "flick" y una nota por carta (Sol, La, Do, Re)
  [3.86, whoosh(0.3, 1200, 5200, 2600), 0.24, 0],
  [3.88, marimba(N.G4), 0.3, -0.25], [3.93, marimba(N.A4), 0.3, 0.25],
  [3.98, marimba(N.C5), 0.3, -0.45], [4.03, marimba(N.D5), 0.3, 0.45],
  ...[3.88, 3.93, 3.98, 4.03].map((t, k) => [t, tic(2000 + k * 200, 0.025), 0.12, k % 2 ? 0.4 : -0.4]),
  // 04 · Cobros: las cartas salen volando, giro de la tarjeta, ✓ (campana) y texto
  [4.48, whoosh(0.36, 1800, 600, 200), 0.34, 0],
  [4.58, whoosh(0.42, 500, 3600, 900), 0.36, -0.2],
  [4.98, pop(N.G5), 0.4, 0], [5.04, campana(N.C6), 0.32, 0], [5.12, marimba(N.E5), 0.3, 0.1],
  // el círculo del ✓ se expande y llena la pantalla de coral
  [5.7, whoosh(0.32, 300, 4500, 3500), 0.4, 0],
  // 05 · Pedidos: onda de la grilla y tres notificaciones (Re, Mi, Sol)
  [6.0, golpe(0.5, 110, 40), 0.55, 0], [6.0, marimba(N.C4), 0.35, 0],
  [6.2, pop(N.D5), 0.42, -0.2], [6.2, marimba(N.D5), 0.32, -0.2],
  [6.56, pop(N.E5), 0.42, 0], [6.56, marimba(N.E5), 0.32, 0],
  [6.92, pop(N.G5), 0.42, 0.2], [6.92, marimba(N.G5), 0.32, 0.2],
  // 06 · Orbi: el satélite dibuja la línea, se abre en tres ramas (Sol, La, Do), tipeo, caja y destello
  [7.48, whoosh(0.55, 300, 2400, 1200), 0.34, -0.5],
  [7.56, pop(N.A4), 0.28, 0],
  ...Array.from({ length: 13 }, (_, i) => [7.62 + i * 0.045, tic(3200 - (i % 3) * 300, 0.02), 0.07, ((i % 5) - 2) * 0.1]),
  [8.0, pop(N.E5), 0.4, 0.1], [8.0, campana(N.A5, 0.8), 0.16, 0.1], [8.0, whoosh(0.3, 800, 3600, 2000), 0.22, 0.4],
  [8.22, whoosh(0.18, 1500, 4200, 3000), 0.16, -0.1],
  [8.27, marimba(N.G5), 0.32, 0.4], [8.31, marimba(N.A5), 0.32, 0.45], [8.35, marimba(N.C6), 0.32, 0.5],
  ...[8.33, 8.37, 8.41].map((t) => [t, tic(2800, 0.02), 0.1, 0.45]),
  [8.5, campana(N.E6), 0.16, 0],
  // 07 · Panel: clic, interruptor y barras que suben (arpegio)
  [9.0, golpe(0.3, 130, 60), 0.3, 0],
  [9.32, tic(1500, 0.04), 0.3, -0.3], [9.34, pop(N.G5), 0.4, -0.3],
  ...[N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.E6].map((f, k) => [9.56 + k * 0.075, marimba(f), 0.3 + k * 0.015, 0.1 + k * 0.04]),
  [10.06, campana(N.E6, 1.0), 0.22, 0.4], ...[0, 1, 2, 3].map((k) => [10.07 + k * 0.03, tic(3400 + k * 250, 0.02), 0.07, 0.45]),
  // 08 · Tu rubro: un golpe por palabra, subiendo, y la subida hacia el cierre
  ...[N.C5, N.D5, N.E5, N.G5, N.A5].map((f, k) => [10.5 + k * 0.3, marimba(f), 0.38, k % 2 ? 0.25 : -0.25]),
  ...[0, 1, 2, 3, 4].map((k) => [10.5 + k * 0.3, golpe(0.3), 0.5, 0]),
  ...[0, 1, 2, 3, 4].map((k) => [10.5 + k * 0.3, whoosh(0.16, 2000, 5200, 3000), 0.12, -0.3]),
  ...[1, 2, 3, 4].map((k) => [10.62 + k * 0.3, pop(N.A5, 0.15), 0.16, 0.3]),
  [11.0, subida(1.05), 0.42, 0],
  // 09 · Órbita: la pelota cae sobre el núcleo, entra en órbita, el logo resuelve en Do mayor
  [12.3, golpe(0.45, 120, 42), 0.65, 0], [12.3, marimba(N.C5), 0.42, 0],
  [12.5, whoosh(0.62, 600, 3000, 1200), 0.36, 0],
  [13.12, golpe(0.6, 100, 36), 0.8, 0],
  ...[N.C4, N.E4, N.G4, N.C5].map((f) => [13.12, campana(f, 2.2), 0.2, 0]),
  [13.12, marimba(N.C6), 0.25, 0],
  [13.2, whoosh(0.36, 700, 3000, 900), 0.3, 0.3],
  [13.76, pop(N.C6), 0.3, 0], [13.76, campana(N.G5, 1.6), 0.16, 0],
];

// Subida: ruido que se abre y un tono que sube una octava (Do4 -> Do5), hacia el cierre.
function subida(seg) {
  const b = buf(seg);
  let low = 0, band = 0, fase = 0;
  for (let k = 0; k < b.length; k++) {
    const x = k / b.length;
    const fc = 300 + 5000 * x * x;
    const F = 2 * Math.sin((Math.PI * fc) / SR);
    const high = ruido() - low - 0.7 * band;
    band += F * high;
    low += F * band;
    fase += (2 * Math.PI * N.C4 * Math.pow(2, x)) / SR;
    b[k] = (band * 0.9 + 0.35 * Math.sin(fase)) * x * x * Math.min(1, (1 - x) / 0.04);
  }
  return b;
}

sumar(1.5, colchon(DURACION - 1.5), 0.11, 0);
for (const [t, s, a, p] of EVENTOS) sumar(t, s, a, p);

// Fundido final de medio segundo para que la cola no se corte en seco
const fin = Math.round(0.5 * SR);
for (let k = 0; k < fin; k++) {
  const i = L.length - fin + k;
  const g = Math.pow(1 - k / fin, 2);
  L[i] *= g; R[i] *= g;
}

// Saturación suave + normalización a -1 dBFS de pico
let pico = 0;
for (let i = 0; i < L.length; i++) {
  L[i] = Math.tanh(L[i] * 1.2);
  R[i] = Math.tanh(R[i] * 1.2);
  pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
}
const g = Math.pow(10, -1 / 20) / pico;

const datos = Buffer.alloc(L.length * 4);
for (let i = 0; i < L.length; i++) {
  datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
  datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
}
const cab = Buffer.alloc(44);
cab.write('RIFF', 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write('WAVE', 8);
cab.write('fmt ', 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(2, 22);
cab.writeUInt32LE(SR, 24); cab.writeUInt32LE(SR * 4, 28); cab.writeUInt16LE(4, 32); cab.writeUInt16LE(16, 34);
cab.write('data', 36); cab.writeUInt32LE(datos.length, 40);

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(SALIDA, Buffer.concat([cab, datos]));
console.log(`${SALIDA}: ${DURACION} s, ${EVENTOS.length} eventos`);
