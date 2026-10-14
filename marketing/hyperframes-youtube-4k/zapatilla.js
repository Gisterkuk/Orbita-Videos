// La zapatilla 3D ("Materials Variants Shoe", © 2021 Shopify, CC-BY 4.0) con Three.js.
// Un solo renderer fuera de pantalla dibuja, para cada cuadro, en los lienzos que estén a la vista:
//   #shoeHook  — el gancho (lado derecho de la pantalla partida), luz de estudio oscura
//   #fotoCv    — la "foto casera" del alta: piso y pared beige, luz dura con sombra; el fondo se borra
//   #heroCv    — la toma heroica a pantalla completa (3840×2160) cuando sale de la foto
//   .prod canvas — las tarjetas de la tienda (se dibujan una vez al cargar)
// Todo depende solo del tiempo (window.PLAN lo arma escenas.js): seek-safe.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const PLAN = window.PLAN;
const lienzo = document.createElement("canvas");
const r = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, preserveDrawingBuffer: true });
r.setPixelRatio(1);
r.outputColorSpace = THREE.SRGBColorSpace;
r.toneMapping = THREE.ACESFilmicToneMapping;
r.shadowMap.enabled = true;
r.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
const ambiente = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
escena.environment = ambiente;
const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);

// Luces de estudio (gancho, héroe, tienda)
const estudio = new THREE.Group();
const clave = new THREE.DirectionalLight(0xffffff, 2.4); clave.position.set(1.2, 1.6, 1.4);
const borde = new THREE.DirectionalLight(0x93c5fd, 4.0); borde.position.set(-1.6, 0.8, -1.2);
const relleno = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.6);
estudio.add(clave, borde, relleno);
escena.add(estudio);

// La "foto casera": pared y piso beige, luz dura de ventana con sombra
const casera = new THREE.Group();
const matPiso = new THREE.MeshStandardMaterial({ color: 0x8f7a63, roughness: 0.9, transparent: true });
const matPared = new THREE.MeshStandardMaterial({ color: 0xcdb898, roughness: 1, transparent: true });
const piso = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), matPiso); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
const pared = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), matPared); pared.position.set(0, 2.2, -1.1); pared.receiveShadow = true;
const ventana = new THREE.DirectionalLight(0xfff1dc, 3.2); ventana.position.set(-1.4, 2.2, 1.0); ventana.castShadow = true;
ventana.shadow.mapSize.set(2048, 2048); ventana.shadow.camera.left = -1.5; ventana.shadow.camera.right = 1.5; ventana.shadow.camera.top = 1.5; ventana.shadow.camera.bottom = -1.5; ventana.shadow.radius = 3;
const amb = new THREE.AmbientLight(0xfff6ea, 0.5);
casera.add(piso, pared, ventana, amb);
escena.add(casera);

const pivote = new THREE.Group();
escena.add(pivote);
let malla = null, alto = 0;
const mats = [];

const lista = new Promise((ok, mal) => {
  new GLTFLoader().load("./assets/media/MaterialsVariantsShoe.glb", async (g) => {
    const caja = new THREE.Box3().setFromObject(g.scene);
    const c = caja.getCenter(new THREE.Vector3()), s = caja.getSize(new THREE.Vector3());
    const k = 1 / Math.max(s.x, s.y, s.z); // largo de la zapatilla = 1
    g.scene.position.sub(c);
    const norm = new THREE.Group(); norm.scale.setScalar(k); norm.add(g.scene);
    pivote.add(norm);
    alto = s.y * k;
    g.scene.traverse((o) => { if (o.isMesh) { malla = o; o.castShadow = true; } });
    const maps = g.parser.json.meshes[0].primitives[0].extensions.KHR_materials_variants.mappings;
    for (const m of maps) mats[m.variants[0]] = await g.parser.getDependency("material", m.material);
    pintarTarjetas();
    ok();
  }, undefined, mal);
});
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["zapatilla"] = lista;

// ───────── utilidades ─────────
const ctx = (id) => document.getElementById(id).getContext("2d");
const destinos = { hook: ctx("shoeHook"), foto: ctx("fotoCv"), hero: ctx("heroCv") };
const vacio = { hook: true, foto: true, hero: true };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const expoInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

function modo(m) {
  estudio.visible = m !== "foto";
  casera.visible = m === "foto";
  escena.environment = ambiente;
  r.toneMappingExposure = m === "foto" ? 0.95 : 1.1;
}
function dibujar(nombre, w, h) {
  if (lienzo.width !== w || lienzo.height !== h) r.setSize(w, h, false);
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
  r.render(escena, cam);
  const c = destinos[nombre];
  c.clearRect(0, 0, w, h);
  c.drawImage(lienzo, 0, 0, w, h);
  vacio[nombre] = false;
}
function limpiar(nombre) {
  if (vacio[nombre]) return;
  const c = destinos[nombre];
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  vacio[nombre] = true;
}
// Encuadre: cámara a distancia d mirando al origen, la zapatilla ocupa `fr` del ancho
function encuadrar(aspecto, fr, alturaCam = 0.12) {
  const d = 1 / (fr * 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspecto);
  cam.position.set(0, alturaCam * d, d);
  cam.lookAt(0, 0, 0);
}
function variante(i) { if (malla && mats[i]) malla.material = mats[i]; }

// ───────── cada lienzo ─────────
function gancho(t) {
  const p = PLAN.hook;
  if (t < p.entra || t > p.sale) return limpiar("hook");
  modo("estudio");
  variante(0);
  pivote.position.set(0, 0, 0);
  pivote.scale.setScalar(1);
  const u = t - p.entra;
  pivote.rotation.set(0.1, 0.5 + u * 0.22 - 2.2 * Math.exp(-u * 4.5), -0.06);
  encuadrar(1, 0.78);
  dibujar("hook", 1520, 1520);
}

function foto(t) {
  const p = PLAN.foto;
  if (t < p.entra - 0.05 || t > p.lift + 0.03) return limpiar("foto");
  modo("foto");
  let v = 0;
  for (const [tv, iv] of p.variantes) if (t >= tv) v = iv;
  variante(v);
  // sin fondo: pared y piso se borran entre fondoIni y fondoFin
  const o = 1 - clamp((t - p.fondoIni) / (p.fondoFin - p.fondoIni));
  matPiso.opacity = o; matPared.opacity = o;
  piso.visible = pared.visible = o > 0.001;
  pivote.position.set(0, alto / 2, 0);
  pivote.scale.setScalar(1);
  pivote.rotation.set(0, 0.62, 0);
  // como una foto de celular: un poco desde arriba y apenas torcida
  const d = 1.85;
  cam.position.set(0.18, 0.62, d);
  cam.lookAt(0, alto * 0.45, 0);
  cam.rotateZ(-0.035);
  dibujar("foto", 660, 660);
}

function heroe(t) {
  const p = PLAN.hero;
  if (t < p.entra || t > p.sale) return limpiar("hero");
  modo("estudio");
  variante(0);
  const W = 3840, H = 2160, asp = W / H, d = 3;
  cam.position.set(0, 0, d);
  cam.lookAt(0, 0, 0);
  const vw = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * asp, vh = vw / asp;
  // posición en pantalla por claves [t, {x, y, w}] con expo.inOut entre cada par
  const C = p.claves;
  let k = 0;
  while (k < C.length - 2 && t >= C[k + 1][0]) k++;
  const [t0, a] = C[k], [t1, b] = C[k + 1];
  const e = expoInOut(clamp((t - t0) / (t1 - t0)));
  const x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e), w = lerp(a.w, b.w, e);
  const u = clamp((t - p.entra) / 0.85);
  const flota = Math.sin((t - p.entra) * 2.2) * 0.012 * u;
  pivote.position.set((x / 1920 - 0.5) * vw, -(y / 1080 - 0.5) * vh + flota, 0);
  pivote.scale.setScalar((w / 1920) * vw);
  const tt = t - p.entra;
  pivote.rotation.set(0.1 * u, 0.62 + u * Math.PI * 1.15 + tt * 0.45, -0.1 * u);
  dibujar("hero", W, H);
}

function pintarTarjetas() {
  const fondos = ["#dbeafe", "#fce7f3", "#e2e8f0"];
  document.querySelectorAll(".prod canvas").forEach((cv) => {
    const v = +cv.dataset.variante, a = +cv.dataset.angulo;
    modo("estudio");
    variante(v);
    pivote.position.set(0, 0, 0);
    pivote.scale.setScalar(1);
    pivote.rotation.set(0.15, 0.4 + a * 0.45, -0.05);
    encuadrar(520 / 500, 0.8);
    if (lienzo.width !== 520 || lienzo.height !== 500) r.setSize(520, 500, false);
    cam.aspect = 520 / 500; cam.updateProjectionMatrix();
    r.render(escena, cam);
    const c = cv.getContext("2d");
    const g = c.createLinearGradient(0, 0, 0, 500);
    g.addColorStop(0, fondos[v]); g.addColorStop(1, "#ffffff");
    c.fillStyle = g; c.fillRect(0, 0, 520, 500);
    c.drawImage(lienzo, 0, 0);
  });
}

function cuadro(t) {
  if (!malla) return;
  gancho(t);
  foto(t);
  heroe(t);
}
window.addEventListener("hf-seek", (e) => cuadro(e.detail.time));
lista.then(() => cuadro(window.__hfThreeTime || 0));
