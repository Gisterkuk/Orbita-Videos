// Coreografía de "Una foto" (YouTube 16:9 4K). Todos los tiempos salen de la voz real:
// window.MARCAS (audio/marcas-A.json o -D.json, lo inyecta construir.mjs) tiene cada palabra con su
// inicio y fin. Del índice 11 en adelante las dos versiones dicen lo mismo ("Nombre." … "en órbita."),
// así que solo el gancho (0–10) cambia entre A y D.
//
// Además de la línea de tiempo de GSAP, deja en window.PLAN los tiempos que usa zapatilla.js (3D).

(function () {
  const V = window.VERSION;
  const M = window.MARCAS.palabras;
  const DUR = window.MARCAS.duracion + 0.7;
  const T = (i) => M[i].ini;
  const F = (i) => M[i].fin;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const tl = gsap.timeline({ paused: true });

  // ───────── Anclas (ver la tabla del guion) ─────────
  const tP = T(11) - 0.42;          // entra el problema ("Nombre.")
  const tPorCada = T(17);           // "y eso, por cada producto"
  const tQ = T(22);                 // "¿Y si alcanzara…"
  const tFotoQ = T(27);             // "…foto?"
  const tClick = F(27) + 0.42;      // obturador: de la oscuridad a la luz
  const tFoto = T(31);              // "Le sacás una foto"
  const tOrbi = T(33);              // "y Orbi completa el resto"
  const tNom = T(38), tCat = T(40), tDesc = T(42), tHasta = T(44), tVar = T(46);
  const tFondo = T(50) - 0.05;      // "Le quita el fondo a la foto"
  const tLift = tFondo + 0.5;       // la zapatilla sale de la foto
  const tRev = T(55), tPub = T(57); // "vos revisás, y publicás"
  const tTienda = T(58), tSin = T(63);
  const tUna = T(67), tUn = T(69), tListo = T(71);
  const tTu = T(72), tEn = T(74), tOrb = T(75);

  // ───────── Utilidades ─────────
  function tipear(el, texto, t0, dur) {
    el.innerHTML = "";
    const chars = [...texto];
    chars.forEach((c, i) => {
      const s = document.createElement("span");
      s.textContent = c;
      el.appendChild(s);
      tl.set(s, { opacity: 1 }, t0 + (dur * i) / chars.length);
    });
  }
  function parpadeo(el, t0, t1, medio = 0.32) {
    const n = Math.max(1, Math.floor((t1 - t0) / medio));
    tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: medio, ease: "steps(1)", repeat: n, yoyo: true }, t0);
  }
  function escena(sel, entra, sale, fadeIn = 0.35, fadeOut = 0.35) {
    gsap.set(sel, { opacity: 0 });
    tl.to(sel, { opacity: 1, duration: fadeIn, ease: "power1.out" }, entra);
    if (sale != null) tl.to(sel, { opacity: 0, duration: fadeOut, ease: "power1.in" }, sale);
  }
  function palabras(cont, lista) {
    // lista: [[texto, clase?], …] → spans
    cont.innerHTML = "";
    return lista.map(([tx, cl]) => {
      const s = document.createElement("span");
      s.textContent = tx;
      if (cl) s.className = cl;
      cont.appendChild(s);
      cont.appendChild(document.createTextNode(" "));
      return s;
    });
  }
  const aparece = (el, t, d = 0.35, y = 18) =>
    tl.fromTo(el, { opacity: 0, y, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: d, ease: "power3.out" }, t);

  // ═════════ 1 · GANCHO ═════════
  const CAMPOS = [
    ["Nombre del producto", 1], ["Descripción", 1, "alto"], ["Categoría", 1], ["Subcategoría"], ["Marca"],
    ["Precio", 1], ["Precio promocional"], ["Costo"], ["SKU", 1], ["Código de barras"], ["Stock", 1],
    ["Peso (kg)"], ["Alto · Ancho · Profundidad"], ["Talles", 1], ["Colores", 1], ["Material"],
    ["Etiquetas"], ["Cuidados"], ["Garantía"], ["Título para Google"], ["Descripción para Google", 0, "alto"],
  ];
  const form = $("#formEterno");
  form.innerHTML = "<h4>Agregar producto</h4>" + CAMPOS.map(([n, req, alto], i) =>
    `<div class="campo"><b>${n}${req ? "<em>*</em>" : ""}</b><div class="input ${alto || ""}">${i === 0 ? '<span class="tipeo" id="txEterno"></span><i class="caret" id="caretEterno"></i>' : '<span class="ph">—</span>'}</div></div>`).join("");

  const finGancho = tP + 0.6;
  escena("#s1", 0, tP + 0.15, 0.01, 0.5);
  tl.fromTo("#camIzq", { y: 0 }, { y: -560, duration: finGancho, ease: "none" }, 0);
  tipear($("#txEterno"), "Zapatilla urbana de mal", 0.35, tP - 0.6);
  parpadeo($("#caretEterno"), 0.2, tP + 0.5);

  // lado derecho: el satélite → lente → clic → la zapatilla, completa
  const tSplit = V === "A" ? 0 : T(9) + 0.12;     // en D la pantalla partida aparece en "mirá esto"
  const tAro = V === "A" ? T(5) : tSplit + 0.05;   // en A, en "y así se carga…"
  const tObt = V === "A" ? T(8) + 0.02 : tSplit + 0.42;
  gsap.set("#satHook", { scale: 1 });
  tl.fromTo("#satHook", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "expo.out" }, tSplit + 0.1);
  tl.to("#lenteAro", { attr: { "stroke-dashoffset": 0 }, duration: tObt - tAro - 0.05, ease: "power2.inOut" }, tAro);
  tl.fromTo("#lenteAro2", { rotation: 0, svgOrigin: "0 0", opacity: 0 }, { rotation: 90, svgOrigin: "0 0", opacity: 1, duration: tObt - tAro, ease: "power1.inOut" }, tAro);
  tl.to("#lente", { scale: 0.7, duration: 0.12, ease: "power2.in" }, tObt - 0.12);
  tl.to("#lente", { opacity: 0, duration: 0.05 }, tObt);
  tl.fromTo("#flashDer", { opacity: 0 }, { opacity: 1, duration: 0.04 }, tObt);
  tl.to("#flashDer", { opacity: 0, duration: 0.55, ease: "power2.out" }, tObt + 0.05);
  tl.fromTo("#shoeHookWrap", { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.7, ease: "expo.out" }, tObt + 0.03);
  const chips = ["#ch1", "#ch2", "#ch3", "#ch4"];
  const tChips = tObt + 0.3, finChips = (V === "A" ? F(10) : tP) - 0.05;
  chips.forEach((c, i) => tl.fromTo(c, { opacity: 0, scale: 0.6, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, tChips + (i * (finChips - tChips - 0.35)) / 3));
  tl.fromTo("#publicadoHook", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }, finChips);
  tl.fromTo(["#rotIzq", "#rotDer", "#divisoria"], { opacity: 0 }, { opacity: 1, duration: 0.4 }, tSplit + 0.15);

  if (V === "D") {
    // "Si cargar un producto ‖ te lleva más que venderlo… ‖ mirá esto."
    const gd = $("#gDtexto");
    gd.innerHTML = '<div id="gDl1"></div><div id="gDl2"></div>';
    const l1 = palabras($("#gDl1"), [["Si"], ["cargar"], ["un"], ["producto"]]);
    const l2 = palabras($("#gDl2"), [["te"], ["lleva"], ["más"], ["que"], ["venderlo…", "caja"]]);
    [...l1, ...l2].forEach((s, i) => aparece(s, T(i) - 0.04, 0.3, 24));
    tl.fromTo("#gDtexto", { scale: 1 }, { scale: 1.07, duration: T(9), ease: "none" }, 0);
    tl.to("#gDtexto", { y: -40, scale: 0.92, opacity: 0, filter: "blur(10px)", duration: 0.35, ease: "power2.in" }, T(9) + 0.05);
    tl.fromTo("#gDmira", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25 }, T(9) - 0.05);
    tl.to("#gDmira", { opacity: 0, duration: 0.2 }, T(9) + 0.3);
    gsap.set(["#izq", "#der"], { opacity: 0 });
    tl.to("#izq", { opacity: 1, duration: 0.25 }, tSplit);
    tl.to("#der", { opacity: 1, duration: 0.25 }, tSplit);
  } else {
    gsap.set("#gD", { opacity: 0 });
  }

  // salida del gancho: la derecha se va, entramos en la forma de siempre
  tl.to("#der", { x: 260, opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power2.in" }, tP - 0.05);
  tl.to(["#divisoria", "#rotIzq", "#rotDer"], { opacity: 0, duration: 0.3 }, tP - 0.05);
  tl.to("#camIzq", { scale: 1.7, transformOrigin: "50% 30%", duration: 0.6, ease: "power2.in" }, tP);

  // ═════════ 2 · EL PROBLEMA ═════════
  const TARJ = [
    { meta: "Campo obligatorio", t: "Nombre", cuerpo: '<div class="input"><i class="caret"></i><span class="ph">Ej.: Zapatilla urbana</span></div>' },
    { meta: "Campo obligatorio", t: "Descripción", cuerpo: '<div class="input"><i class="caret"></i><span class="ph">Contá cómo es, de qué está hecho, para qué sirve…</span></div>' },
    { meta: "Campo obligatorio", t: "Categoría", cuerpo: '<div class="input"><span class="ph">Elegí una categoría</span><span class="ph" style="margin-left:auto">▾</span></div>' },
    { meta: "Variantes", t: "Talles", cuerpo: '<div class="chips-vacios"><i>+ 38</i><i>+ 39</i><i>+ 40</i><i>+ 41</i><i>+ 42</i><i>+ Talle</i></div>' },
    { meta: "Variantes", t: "Colores", cuerpo: '<div class="chips-vacios"><i class="color"></i><i class="color"></i><i class="color"></i><i class="color"></i><i>+ Color</i></div>' },
    { meta: "Para que te encuentren", t: "Etiquetas", cuerpo: '<div class="input"><span class="ph">+ Agregá etiquetas</span></div>' },
  ];
  const tunel = $("#tunel");
  tunel.innerHTML = TARJ.map((c, i) => `<div class="tarjeta" id="tj${i}"><div class="meta">${c.meta}</div><div class="titulo"><i class="caja"></i><span class="tx">${c.t}</span></div>${c.cuerpo}</div>`).join("");
  escena("#s2", tP + 0.15, tQ - 0.1, 0.4, 0.5);
  tl.fromTo("#grilla2", { y: 0 }, { y: 160, duration: tQ - tP, ease: "none" }, tP);
  // la cámara nunca se queda quieta: empuje lento hacia el túnel mientras se enumeran los campos
  tl.fromTo("#tunel", { scale: 1, y: 0 }, { scale: 1.09, y: 18, duration: tPorCada - 0.1 - tP, ease: "none" }, tP);
  const tiemposTj = [11, 12, 13, 14, 15, 16].map(T);
  TARJ.forEach((_, i) => {
    const el = `#tj${i}`, t = tiemposTj[i];
    gsap.set(el, { opacity: 0 });
    tl.fromTo(el, { z: 420, opacity: 0, filter: "blur(14px)" }, { z: 0, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out" }, t - 0.12);
    tl.fromTo(`${el} .caja`, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.22, ease: "power3.out" }, t - 0.02);
    $$(`${el} .caret`).forEach((c) => parpadeo(c, t, tPorCada + 0.4));
    // cada tarjeta nueva empuja a las anteriores hacia el fondo del túnel
    const sig = tiemposTj[i + 1];
    if (sig) {
      tl.to(el, { z: -320, y: -120, opacity: 0.6, filter: "blur(2px)", duration: 0.45, ease: "power3.out" }, sig - 0.12);
      tl.to(`${el} .caja`, { opacity: 0, duration: 0.2 }, sig - 0.12);
      for (let k = i + 2; k < TARJ.length; k++) {
        tl.to(el, { z: -320 * (k - i), y: -120 * (k - i), opacity: Math.max(0, 0.6 - 0.16 * (k - i - 1)), duration: 0.45, ease: "power3.out" }, tiemposTj[k] - 0.12);
      }
    }
  });
  // "y eso, por cada producto": el túnel se aleja y aparece un mar de formularios iguales
  tl.to("#tunel", { opacity: 0, scale: 0.35, filter: "blur(6px)", duration: 0.6, ease: "power3.in" }, tPorCada - 0.1);
  const mar = $("#marPlano");
  let minis = "";
  for (let f = 0; f < 10; f++) for (let c = 0; c < 14; c++) minis += `<div class="mini" style="left:${c * 340}px;top:${f * 250}px"><i></i><i></i><i></i><u></u></div>`;
  mar.innerHTML = minis;
  gsap.set("#marPlano", { rotationX: 68, transformOrigin: "50% 100%" });
  tl.to("#mar", { opacity: 1, duration: 0.6, ease: "power1.out" }, tPorCada + 0.05);
  tl.fromTo("#marPlano", { y: -250 }, { y: 500, duration: tQ - tPorCada + 0.6, ease: "none" }, tPorCada);
  parpadeo($$("#marPlano u"), tPorCada, tQ + 0.4);
  aparece("#porCada", T(19) - 0.08, 0.35, 20);
  tl.fromTo("#porCada .caja", { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.25, ease: "power3.out" }, T(20));

  // ═════════ 3 · EL GIRO ═════════
  escena("#s3", tQ - 0.35, tClick + 0.05, 0.45, 0.01);
  // los formularios se vuelven puntos y se juntan en un anillo alrededor del satélite
  const P3 = $("#puntos3");
  const N = 30;
  const semillas = [0.13, 0.71, 0.42, 0.88, 0.27, 0.56, 0.93, 0.05, 0.64, 0.36, 0.81, 0.19, 0.47, 0.75, 0.31, 0.6, 0.09, 0.84, 0.52, 0.23, 0.68, 0.4, 0.97, 0.15, 0.78, 0.33, 0.58, 0.02, 0.9, 0.45];
  for (let i = 0; i < N; i++) {
    const p = document.createElement("i");
    P3.appendChild(p);
    const x0 = 120 + semillas[i] * 1680, y0 = 120 + semillas[(i * 7) % N] * 840;
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    gsap.set(p, { x: x0, y: y0, opacity: 0, scale: 0.6 });
    tl.to(p, { opacity: 1, scale: 1, duration: 0.3 }, tQ - 0.2 + semillas[i] * 0.3);
    tl.to(p, { x: 960 + Math.cos(a) * 214, y: 540 + Math.sin(a) * 214, duration: 1.1, ease: "expo.inOut" }, tQ + 0.1 + semillas[i] * 0.25);
    tl.to(p, { opacity: 0, scale: 0.4, duration: 0.25 }, tFotoQ - 0.1);
  }
  tl.fromTo("#sat3", { scale: 0, opacity: 0 }, { scale: 1.4, opacity: 1, duration: 0.6, ease: "expo.out" }, tQ);
  // el anillo de puntos se vuelve el diafragma de una cámara
  const aspas = $("#aspas");
  aspas.innerHTML = [0, 1, 2, 3, 4, 5].map((k) => `<g transform="rotate(${k * 60})"><rect class="aspa" x="230" y="-520" width="700" height="1040" fill="#1a2232" stroke="#2c3a55" stroke-width="3" /></g>`).join("");
  tl.to("#irisAro", { opacity: 1, duration: 0.25 }, tFotoQ - 0.15);
  tl.to("#aspas", { opacity: 1, duration: 0.2 }, tFotoQ - 0.1);
  tl.fromTo(".aspa", { attr: { x: 230 } }, { attr: { x: 120 }, duration: 0.5, ease: "power3.out" }, tFotoQ - 0.05);
  tl.fromTo("#aspas", { rotation: 0, svgOrigin: "0 0" }, { rotation: 18, svgOrigin: "0 0", duration: 0.5, ease: "power3.out" }, tFotoQ - 0.05);
  tl.to(".aspa", { attr: { x: 0 }, duration: 0.16, ease: "power3.in" }, tClick - 0.16);
  tl.to("#aspas", { rotation: 34, svgOrigin: "0 0", duration: 0.16, ease: "power3.in" }, tClick - 0.16);
  tl.to("#sat3", { scale: 0.3, duration: 0.16, ease: "power3.in" }, tClick - 0.16);
  const preg = palabras($("#pregunta"), [["¿Y"], ["si"], ["alcanzara"], ["con"], ["una"], ["foto?", "azul"]]);
  preg.forEach((s, i) => aparece(s, T(22 + i) - 0.04, 0.3, 12));
  // el clic: flash blanco y de la oscuridad a la luz
  tl.fromTo("#flash", { opacity: 0 }, { opacity: 1, duration: 0.05 }, tClick);
  tl.to("#flash", { opacity: 0, duration: 0.8, ease: "power2.out" }, tClick + 0.12);

  // ═════════ 4 · LA SOLUCIÓN ═════════
  escena("#s4", tClick + 0.04, tTienda - 0.2, 0.01, 0.4);
  tl.fromTo("#lago", { scale: 1.08, x: 30 }, { scale: 1, x: -30, duration: tTienda - tClick, ease: "none" }, tClick);
  tl.fromTo("#tarjeta4", { y: 50, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "expo.out" }, tClick + 0.2);
  tl.fromTo("#cam4", { scale: 1.02 }, { scale: 1, duration: 2, ease: "power2.out" }, tClick);
  // la foto
  tl.fromTo("#flashFoto", { opacity: 0 }, { opacity: 1, duration: 0.04 }, T(31));
  tl.to("#flashFoto", { opacity: 0, duration: 0.4 }, T(31) + 0.06);
  tl.fromTo("#fotoCv", { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, T(31) + 0.02);
  tl.to("#slotFoto", { borderColor: "rgba(255,255,255,0)", duration: 0.2 }, T(31));
  tl.to("#slotRotulo", { opacity: 0, duration: 0.2 }, T(31));
  // Orbi la mira: línea de escaneo con el satélite
  const fx = 36, fy = 96; // esquina del slot en la tarjeta
  gsap.set("#satScan", { x: fx + 165, y: fy, opacity: 0 });
  tl.to(["#scan", "#satScan"], { opacity: 1, duration: 0.15 }, tOrbi - 0.1);
  tl.fromTo("#scan", { y: 0 }, { y: 327, duration: 0.85, ease: "power1.inOut" }, tOrbi - 0.05);
  tl.fromTo("#satScan", { y: fy }, { y: fy + 327, duration: 0.85, ease: "power1.inOut" }, tOrbi - 0.05);
  tl.to("#scan", { opacity: 0, duration: 0.2 }, tOrbi + 0.8);
  tl.to("#satScan", { x: fx + 330, y: fy + 165, duration: 0.35, ease: "power2.inOut" }, tOrbi + 0.82);
  // ramas de luz desde la foto a cada campo
  const destinos = [[398, 142], [398, 232], [398, 358], [398, 479]];
  $("#ramas4").innerHTML = destinos.map(([x, y], i) => `<path id="rm${i}" d="M ${fx + 330} ${fy + 165} C ${fx + 352} ${fy + 165}, ${x - 26} ${y}, ${x} ${y}" />`).join("");
  destinos.forEach((_, i) => {
    const p = $(`#rm${i}`), L = p.getTotalLength();
    gsap.set(p, { attr: { "stroke-dasharray": L, "stroke-dashoffset": L } });
    tl.to(p, { attr: { "stroke-dashoffset": 0 }, duration: 0.4, ease: "power2.out" }, tOrbi + 1.0 + i * 0.12);
    tl.to(p, { opacity: 0.25, duration: 0.6 }, [tNom, tCat, tDesc, tVar][i] + 0.5);
  });
  tl.to("#satScan", { opacity: 0, scale: 0.4, duration: 0.3 }, tOrbi + 1.5);
  // cada campo se completa cuando la voz lo nombra
  const llenar = (campo, tx, texto, t, dur) => {
    tl.set(`${campo} .ph`, { display: "none" }, t);
    tipear($(tx), texto, t, dur);
    tl.fromTo(`${campo} .in`, { boxShadow: "0 0 0 0 rgba(96,165,250,0)" }, { boxShadow: "0 0 0 4px rgba(96,165,250,0.45)", duration: 0.2, yoyo: true, repeat: 1 }, t);
    tl.fromTo(`${campo} .ok`, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, t + dur);
  };
  llenar("#fNombre", "#txNombre", "Zapatilla urbana de malla", tNom - 0.05, 0.45);
  llenar("#fCat", "#txCat", "Calzado › Zapatillas", tCat - 0.05, 0.3);
  llenar("#fDesc", "#txDesc", "Liviana y respirable, con capellada de malla y suela de goma. Cómoda para todo el día.", tDesc - 0.05, 1.0);
  $$("#fVar .swatches i").forEach((s, i) => tl.fromTo(s, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, tHasta + i * 0.1));
  $$("#fVar .talles i").forEach((s, i) => tl.fromTo(s, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }, tVar + i * 0.05));
  tl.fromTo("#fVar .ok", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, tVar + 0.4);
  // la zapatilla cambia de color con cada variante (zapatilla.js lee PLAN.variantes)
  const sw = $$("#fVar .swatches i");
  const variantes = [[0, 0], [tVar + 0.1, 1], [tVar + 0.42, 2], [tVar + 0.74, 0]];
  variantes.forEach(([t, v]) => sw.forEach((s, i) => tl.set(s, { className: i === v ? "sel" : "" }, Math.max(0.001, t))));
  // quitar el fondo: un barrido blanco y la zapatilla se despega de la foto
  tl.set("#scan", { background: "#ffffff", y: 0 }, tFondo - 0.01);
  tl.fromTo("#scan", { y: 0, opacity: 0 }, { y: 327, opacity: 1, duration: tLift - tFondo - 0.05, ease: "power1.inOut", immediateRender: false }, tFondo);
  tl.to("#scan", { opacity: 0, duration: 0.1 }, tLift - 0.05);
  tl.to("#tarjeta4", { x: -390, duration: 0.9, ease: "expo.inOut" }, tLift + 0.05);
  tl.fromTo("#brilloHero", { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1, duration: 1.0, ease: "expo.out" }, tLift + 0.25);
  // "vos revisás": los ✓ laten uno por uno
  $$("#tarjeta4 .ok").forEach((o, i) => tl.to(o, { scale: 1.45, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, tRev + i * 0.12));
  // "y publicás": la cámara va al botón, clic
  const bx = 550 - 390 + 820 - 36 - 100, by = 150 + 780 - 32 - 30; // centro de Publicar en pantalla
  tl.to("#cam4", { scale: 1.55, transformOrigin: `${bx}px ${by}px`, duration: 0.8, ease: "expo.inOut" }, tPub - 0.55);
  tl.fromTo("#cursor", { x: bx + 260, y: by + 160, opacity: 0 }, { x: bx + 6, y: by + 4, opacity: 1, duration: 0.55, ease: "power3.out" }, tPub - 0.45);
  tl.to("#cursor", { scale: 0.85, duration: 0.07, yoyo: true, repeat: 1 }, tPub + 0.15);
  tl.fromTo("#onda", { x: bx, y: by, scale: 0.4, opacity: 1 }, { scale: 2.6, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, tPub + 0.17);
  tl.to("#publicar .b2", { opacity: 1, duration: 0.15 }, tPub + 0.2);
  tl.to("#cam4", { scale: 2.6, opacity: 0, filter: "blur(12px)", duration: 0.45, ease: "power3.in" }, tTienda - 0.45);
  tl.to("#cursor", { opacity: 0, duration: 0.2 }, tTienda - 0.45);

  // ═════════ 5 · LA TIENDA ═════════
  escena("#s5", tTienda - 0.25, tUna - 0.45, 0.35, 0.5);
  ["#ola1", "#ola2", "#ola3"].forEach((o, i) => tl.fromTo(o, { scale: 0.25, opacity: 0.9 }, { scale: 2.8, opacity: 0, duration: 1.8, ease: "power1.out", repeat: 2 }, tTienda - 0.2 + i * 0.6));
  const ab = $("#abanico");
  const NOMBRES = ["Azul", "Rosa", "Negro"];
  const NC = 14;
  ab.innerHTML = Array.from({ length: NC }, (_, i) => `<div class="prod" id="pr${i}"><canvas width="520" height="500" data-variante="${i % 3}" data-angulo="${i}"></canvas><b>Zapatilla urbana</b><small>${NOMBRES[i % 3]} · 38 al 43</small></div>`).join("");
  for (let i = 0; i < NC; i++) {
    const ang = (i * 360) / NC;
    tl.fromTo(`#pr${i}`, { rotation: ang - 140, scale: 0.2, opacity: 0, transformOrigin: "130px 380px" }, { rotation: ang, scale: 1, opacity: 1, duration: 1.0, ease: "expo.out" }, tTienda - 0.15 + i * 0.035);
  }
  tl.fromTo("#abanico", { rotation: -10 }, { rotation: 14, duration: tSin - tTienda + 0.4, ease: "power1.out" }, tTienda - 0.15);
  gsap.set("#centro5", { opacity: 0 });
  tl.fromTo("#url5", { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, tTienda + 0.1);
  // "sin comisión por venta": las tarjetas salen y quedan las palabras
  tl.to("#abanico", { scale: 2.6, opacity: 0, duration: 0.6, ease: "power3.in" }, tSin - 0.45);
  tl.to("#heroWrap", { opacity: 0, duration: 0.45, ease: "power2.in" }, tSin - 0.3);
  tl.to("#brilloHero", { opacity: 0, duration: 0.4 }, tTienda - 0.4);
  tl.to(["#centro5", "#url5"], { scale: 0.6, opacity: 0, duration: 0.35, ease: "power2.in" }, tSin - 0.35);
  const lema = palabras($("#lema5"), [["Sin"], ["comisión"], ["por"], ["venta"]]);
  lema.forEach((s, i) => aparece(s, T(63 + i) - 0.06, 0.3, 20));
  const punto = document.createElement("i");
  punto.className = "punto";
  $("#lema5").appendChild(punto);
  tl.fromTo(punto, { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }, F(66) - 0.05);

  // ═════════ 6 · CIERRE ═════════
  escena("#s6", tUna - 0.5, null, 0.5);
  tl.fromTo("#flores", { scale: 1.12, y: 30 }, { scale: 1, y: -10, duration: DUR - tUna + 0.5, ease: "power1.out" }, tUna - 0.5);
  const fr = $$("#frase6 .l > span");
  [T(67), T(68), T(69), T(70), T(71)].forEach((t, i) => aparece(fr[i], t - 0.05, 0.35, 20));
  tl.to("#frase6", { y: -50, opacity: 0, filter: "blur(10px)", duration: 0.4, ease: "power2.in" }, tTu - 0.55);
  // el logo: el satélite da la vuelta dibujando la órbita, el planeta aparece
  gsap.set("#gira6", { rotation: 0, svgOrigin: "0 0" });
  tl.fromTo("#logo6", { opacity: 0 }, { opacity: 1, duration: 0.2 }, tTu - 0.25);
  tl.to("#gira6", { rotation: 360, svgOrigin: "0 0", duration: 1.0, ease: "power2.inOut" }, tTu - 0.25);
  tl.to("#aro6", { attr: { "stroke-dashoffset": 0 }, duration: 1.0, ease: "power2.inOut" }, tTu - 0.25);
  tl.fromTo("#planeta6", { scale: 0, svgOrigin: "0 0" }, { scale: 1, svgOrigin: "0 0", duration: 0.55, ease: "back.out(2.5)" }, tTu + 0.1);
  tl.to("#gira6", { rotation: 360 + 360 * ((DUR - tTu - 0.75) / 3.2), svgOrigin: "0 0", duration: DUR - tTu - 0.75, ease: "none" }, tTu + 0.75);
  const marca = $("#marca6");
  marca.innerHTML = [..."Órbita"].map((c) => `<span>${c}</span>`).join("");
  $$("#marca6 span").forEach((s, i) => aparece(s, tTu + 0.05 + i * 0.05, 0.4, 30));
  tl.fromTo("#firma6", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tEn - 0.2);
  tl.fromTo("#web6", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, F(75) + 0.1);
  tl.to("#nota6", { opacity: 1, duration: 0.6 }, F(75) + 0.25);

  window.__timelines["unafoto"] = tl;

  // Para zapatilla.js (3D): cuándo y dónde se ve la zapatilla
  window.PLAN = {
    hook: { entra: tObt, sale: tP + 0.6 },
    foto: { entra: T(31), fondoIni: tFondo + 0.05, fondoFin: tLift - 0.05, lift: tLift, variantes },
    hero: {
      entra: tLift,
      sale: tSin + 0.2,
      claves: [
        [tLift, { x: 550 + fx + 165, y: 150 + fy + 170, w: 250 }],
        [tLift + 0.85, { x: 1430, y: 520, w: 860 }],
        [tTienda - 0.4, { x: 1450, y: 510, w: 900 }],
        [tTienda + 0.35, { x: 960, y: 520, w: 330 }],
        [tSin - 0.45, { x: 960, y: 520, w: 350 }],
        [tSin + 0.15, { x: 960, y: 520, w: 1500 }],
      ],
    },
  };
})();
