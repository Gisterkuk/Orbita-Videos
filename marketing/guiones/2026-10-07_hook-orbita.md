# Hook visual de Órbita: "Una órbita, todo tu negocio"

- **Estado:** v1 16:9 producida (`hyperframes-lab/index.html`, entrega en `videos/youtube/`). Falta: ajustes y adaptación 9:16.
- **Referencia:** "Motion designing in 2026.mp4" (motion reel, 15 s, 16:9, sin voz).
- **Formato propuesto:** 15 s · 1920×1080 · 60 fps (900 cuadros). Después, una adaptación a 9:16.
- **Herramienta:** HyperFrames (`marketing/hyperframes-lab/`): HTML + GSAP, render determinístico.
- **Objetivo:** que en 15 s alguien que no conoce Órbita entienda "tienda + cobros + pedidos + panel +
  Orbi, todo junto", y que el ritmo visual y sonoro lo frene en el scroll **sin cansarlo**.

---

## 1. Por qué la referencia funciona (análisis cuadro a cuadro)

Lo medí extrayendo cuadros cada 0,25 s, los cortes de escena y el espectrograma del audio.

| # | Qué hace | Cómo lo hace |
|---|---|---|
| 1 | **Un hilo conductor** | Un **punto naranja** atraviesa todo el video: es la pelota que rebota, el punto de "MOVE.", el círculo que muta, la O de "GO", el punto de la i y, al final, el punto de "'26.". Por eso los cortes rápidos se entienden: el ojo siempre sabe a dónde mirar. |
| 2 | **Una idea por plano** | 9 capítulos de unos 1,5 s cada uno (TIMING, TYPE, FORM, DEPTH, SYSTEMS, FLOW, INTERFACE, RHYTHM, FIN). Cada plano demuestra un solo principio. |
| 3 | **Contraste por capítulo** | Cada capítulo cambia el color de fondo (negro, naranja, crema, azul, negro, crema…). El cambio de color *es* el corte. La paleta es chica (5–6 colores) y consistente. |
| 4 | **Oficio de animación** | Anticipación, estirar y aplastar en el rebote, sobrepasar y volver (overshoot), **motion blur** direccional en el texto, morphing entre formas. Hasta muestra la curva de easing en pantalla (10,25 s). |
| 5 | **Aceleración, clímax y respiro** | Planos de 1,5 s, después cortes cada ~0,2 s (10,5–11,8 s), un clímax, y **2,5 s quieto** en el título final. Esa pausa hace que el cierre se lea y se recuerde. |
| 6 | **El sonido *es* la música** | En el espectrograma, cada evento visual tiene un golpe (líneas verticales), y la mayoría son **notas afinadas** (líneas horizontales): los efectos forman una melodía. Hay un colchón grave continuo desde 1,5 s, un *whoosh* de ruido en la sección de cintas (7,5–9 s), una subida que crece (11,5–12,8 s) y una nota que resuelve y se apaga al final. Arranca casi en silencio (−48 dB) y el primer golpe llega a 0,4 s. |
| 7 | **Detalles de "sistema"** | Etiquetas mínimas en las esquinas (número y nombre de capítulo, código de tiempo, ©2026) y un pie técnico en el cierre ("15 SEC / 900 FRAMES / 60 FPS"). Dan sensación de producto pensado. |

**Lo que NO copiamos:** los cortes de pantalla completa cada 0,2 s con cambio de color fuerte. A
más de 3 destellos por segundo es molesto y puede ser un riesgo para personas fotosensibles
(WCAG 2.3.1). Nuestro tramo rápido corta como máximo cada 0,33 s y sin invertir todo el cuadro.

---

## 2. El concepto para Órbita

El logo de Órbita **ya es** el recurso de la referencia: un centro, un arco y **un satélite**. El
satélite (un punto) es nuestro hilo conductor. Recorre el negocio entero (tienda, producto, cobro,
pedido, Orbi, panel, rubros) y al final **entra en órbita** y arma el logo. El cierre no es "aparece
un logo": es la conclusión lógica de lo que viste.

**Paleta** (marca + un acento a decidir):
- Azul noche `#0A1432` · Azul eléctrico `#2563EB` · Blanco hueso `#F8FAFC` · Celeste `#BFDBFE`.
- **Acento para el satélite:** ver la pregunta 2. La referencia funciona porque el punto contrasta
  contra todo.

**Tipografía:** Sora 700–800, enorme, en los golpes de texto. Geist Mono, chica, en las etiquetas
del sistema.

---

## 3. Guion plano por plano (15 s · 120 BPM · 1 tiempo = 0,5 s)

Las notas de los efectos suben por una **escala pentatónica**, así los golpes forman una melodía
ascendente hasta el cierre. Las de abajo son orientativas y se ajustan al oído.

| Tiempo | Cap. (etiqueta) | Fondo | Qué se ve | Motion | SFX (nota) |
|---|---|---|---|---|---|
| **0,0–1,5** | `01 · LANZAMIENTO` | Azul noche | Una línea de horizonte. **Cae el satélite**, rebota 2 veces y deja una estela punteada. | Estirar y aplastar, rebote con gravedad real, la línea vibra en cada impacto. | Silencio → *tic* (do) · *tic* (re) · **tac** grave en el 3.º impacto. Golpe a los 0,4 s, como la referencia. |
| **1,5–3,0** | `02 · TU TIENDA` | Azul eléctrico | Golpe de texto: **"TU TIENDA"** entra de lado con motion blur y **"ONLINE."** sube desde abajo. **El satélite se vuelve el punto final.** | Barrido horizontal con blur, sobrepaso de 6 %, cada palabra a tiempo. | 2 golpes sordos (mi, sol) + *whoosh* corto. Empieza el colchón grave. |
| **3,0–4,5** | `03 · PRODUCTOS` | Blanco hueso | El punto **muta**: círculo → tarjeta de producto, con capas desfasadas en celeste y azul detrás (como las formas de la referencia). Se completa: foto, nombre y precio que cuenta hasta **$ 12.500**. | Morph con guías de Bézier visibles (look "herramienta de diseño"), contador que frena con easing. | *Pop* (la) + *swish* del morph + *tics* finos del contador. |
| **4,5–6,0** | `04 · COBROS` | Azul eléctrico | La tarjeta gira en 3D y del otro lado aparece **"Cobrás online"** con un ✓ que se dibuja. | Giro 3D con perspectiva, el ✓ se traza como trazo SVG. | *Shhk* del giro + *ding* suave afinado (do agudo). |
| **6,0–7,5** | `05 · PEDIDOS` | Azul noche | Una **grilla de puntos** (semitono) late desde el centro y aparece una pila de notificaciones: **"Nuevo pedido"** ×3, cada una empuja a la anterior. | Onda radial en la grilla, notificaciones con resorte. | 3 *blips* ascendentes (re-mi-sol). |
| **7,5–9,0** | `06 · ORBI` | Azul noche | **Cintas** azul y celeste con raya blanca cruzan el cuadro y "escriben": **"Orbi te ayuda a cargar tus productos"**. | Trazos que se dibujan con desplazamiento de trayectoria, el texto aparece letra por letra muy rápido. | *Whoosh* de ruido filtrado que crece y un destello brillante al terminar. |
| **9,0–10,5** | `07 · PANEL` | Blanco hueso | Un cursor activa el interruptor **"Publicar"** (existe: "Publicado o borrador") y se arma un mini tablero: barras de **"Ventas de la semana"** que suben una por una. | Clic con anillo, interruptor con rebote, barras escalonadas. | *Click* + *switch* + arpegio ascendente, una nota por barra. |
| **10,5–12,0** | `08 · TU RUBRO` | Alterna celeste / blanco (sin invertir a negro) | Corte rápido de rubros, uno cada 0,33 s: **FERRETERÍA · PET SHOP · INDUMENTARIA · BODEGA · LIBRERÍA**. El satélite cambia de lugar en cada palabra, siempre a la vista. | Cortes duros al tiempo, cada palabra con un micro zoom. | Golpe suave en cada corte, pitch subiendo + **subida** de 1 s hacia el cierre. |
| **12,0–15,0** | `09 · ÓRBITA` | Azul noche → halo | El satélite **entra en órbita** alrededor de un centro, el arco se dibuja y **se arma el logo del loader**. Golpe: **"Órbita"**. Debajo: **"Tu tienda propia. Sin comisión por venta."** Pie: `TIENDA · COBROS · PEDIDOS · PANEL · ORBI` y `orbita.site`. Quieto 2 s. | Trayectoria orbital que desacelera y encaja, el texto entra con blur y se queda. | La subida **resuelve** en un acorde (do mayor) + golpe grave suave + cola larga que se apaga a los 15 s. |

---

## 4. Diseño sonoro

- **Sin voz** (como la referencia): funciona con y sin sonido, porque el texto en pantalla
  lleva el mensaje (en Instagram la mayoría ve sin sonido).
- **Los efectos son la música:** golpes afinados en una escala, más un colchón grave suave. Sin
  canción aparte: no hay Content ID ni licencias.
- **Fuente de los sonidos:** sintetizarlos nosotros (osciladores + ruido filtrado + envolventes),
  como ya hace `herramientas/sfx.mjs` de la skill de videos, o bajarlos de Pixabay y registrarlos en
  `recursos/musica/LICENCIAS.md`. Recomiendo sintetizar: son nuestros y se afinan exacto.
- **Mezcla:** −14 LUFS integrado, pico real ≤ −1 dB, nada de graves que retumben en el celular ni
  agudos ásperos (filtro pasa-bajos ~12 kHz en los *whoosh*).

## 5. Reglas para que no moleste

1. Ningún destello de cuadro completo más rápido que 3 por segundo; nada de flashes blancos.
2. Cada texto queda legible al menos 0,6 s (el cierre, 2 s).
3. Sonidos redondos y afinados, nunca *glitch* ni ruido áspero; sin golpes de bajo exagerados.
4. Un solo foco por plano: el satélite siempre dice dónde mirar.
5. Final calmo: la subida resuelve y el video respira.

## 6. Qué se dice y qué no (verificado contra el manual del panel)

- ✅ Tienda online, productos, cobros online, pedidos, panel con ventas, publicar la tienda,
  Orbi para cargar productos, "sin comisión por venta".
- ❌ Sin precios en este video (pregunta 4), sin nombrar competidores, sin turnos.

---

## Preguntas abiertas

1. **Formato:** ¿16:9 primero (landing/YouTube) y después 9:16 (reel), o directo 9:16?
2. **Color del satélite:** (a) blanco sobre azul / azul sobre blanco, solo marca, más sobrio;
   (b) **un acento cálido** (ámbar o coral) solo para el satélite, que se destaca como el naranja
   de la referencia.
3. **Voz en off:** ¿ninguna (recomendado para este formato) o una línea al cierre?
4. **Cierre:** ¿solo `orbita.site`, invitar a la demo (`demo.orbita.site`) o con precio "desde"?
5. **Rubros del capítulo 8:** ¿esos cinco u otros?

---

## Referencia 2: "We turn your SaaS into a visual walkthrough" (9:16, 33 s)

Qué tiene y qué tomamos (v3, 2026-10-08):

| Recurso de la referencia | En el hook de Órbita |
|---|---|
| Un punto de luz azul con brillo guía todo | El satélite brilla en las escenas oscuras (01, 06, 09) |
| Una línea sale de un punto y se ramifica hacia íconos | 06 · Orbi: la línea se abre en Descripción / Categoría / Etiquetas |
| Palabra clave dentro de una caja de color ("too many [thoughts]") | "Orbi te ayuda a **[cargar]** tus productos." |
| Cámara en mano (es un celular filmando la pantalla) | Deriva suave de cámara en todo el video + acercamiento lento por capítulo |
| Escenas que se transforman unas en otras, casi sin cortes | Corte por coincidencia del abanico y wipe coral del ✓ hacia Pedidos |
| Estallido radial de tarjetas alrededor de un botón | Abanico de productos (03) |

Versión 9:16 (reel) producida el 2026-10-08 en `hyperframes-reel/`: mismos tiempos y sonido, escenas reacomodadas a vertical (estallido radial de productos, panel en columna, firma vertical), zonas seguras de Instagram respetadas y **gancho fijo arriba** en dos variantes para A/B: **A** "¿Todavía vendés solo por WhatsApp?" y **B** "Tu tienda online, sin comisión." (entregas en `videos/reels/`).

Pendiente para una próxima versión del reel:
- **Arranque problema → solución**: caos de chats, planillas y papelitos que el satélite ordena.
- **Fondos fotográficos** detrás de las pantallas (cielo, bosque): necesitan fotos con licencia.
- **Frase con palabra que cambia** ("Una sola app para [vender / cobrar / crecer]").
