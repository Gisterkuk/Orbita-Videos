# "Una foto" — promo YouTube 16:9 4K — guion v2

- **Estado:** v2 APROBADO en el repaso (2026-10-09): ganchos **A y D en dos versiones (A/B)**, se suma
  **quitar el fondo** como momento "wow", Paquete Avanzado **solo en pantalla**, producto: **zapatilla en 3D**.
- **Zapatilla 3D:** "Materials Variants Shoe" (Khronos glTF Sample Assets, © 2021 Shopify, **CC-BY 4.0**:
  el crédito va en la descripción de YouTube). Trae 3 colores como variantes reales (Beach, Midnight,
  Street): las variantes se ven cambiando en vivo. Se renderiza con Three.js dentro de HyperFrames.
- **Por qué cambió:** el v1 ("Demasiados chats, planillas, notas…") era genérico. Este va a **un
  dolor concreto**: cargar productos en una tienda online es un trámite eterno (nombre, descripción,
  categoría, variantes, etiquetas… por cada producto). Y a la función que más lo resuelve: **con una
  foto, Orbi completa el producto**.
- **Función verificada en el código** (`products.controller.ts`, `POST /products/ai-scan`): de una foto
  completa **nombre, categoría, descripción y variantes** y sugiere etiquetas. Es del **Paquete
  Avanzado**: se marca en pantalla con "✦ Paquete Avanzado" mientras se ve y en la placa final.
- **Sin competidores:** no se nombra ninguna plataforma. "La forma de siempre" es el villano.
- **Sin cifras inventadas:** no se dice "en 5 segundos" ni "ahorrás X horas" (no está medido).
- **Estilo visual:** el del análisis de la referencia (`referencias/fichas/Dcn6EINyzaa-analisis-visual.md`):
  un protagonista de luz, transiciones por transformación, de la oscuridad a la luz, producto mínimo
  con zoom de cámara al botón, un "wow" por bloque.
- **Formato:** 3840×2160 · 60 fps · ~32 s · −14 LUFS.

## El gancho (elegir uno)

Todos son de contraste. La imagen de los primeros 3 s es la misma: **pantalla partida**: a la
izquierda un formulario de alta interminable en gris (la cámara baja y los campos no se terminan
nunca); a la derecha, negro, con un solo punto de luz.

| | Voz (0–4 s) | Tipo | Por qué |
|---|---|---|---|
| **A** ⭐ | "Así se carga un producto… ‖ y así se carga en Órbita." | Antes/después sin comentario | No juzga: muestra. A la derecha, *clic*: flash, foto, producto listo. La diferencia se ve sola. |
| **B** | "Una foto, antes que veinte campos." | "X antes que Y" | Corta, memorable, nombra el contraste exacto. |
| **C** | "Dejá de escribir descripciones. ‖ Sacale una foto." | Orden + alternativa | Directo al hábito que duele; la segunda frase es la solución. |
| **D** | "Si cargar un producto te lleva más que venderlo, ‖ mirá esto." | Si te pasa X, hacé Y | Identifica a quien sufre el problema y promete la salida. |

## Guion (con el gancho A; con B, C o D cambia solo la primera línea)

Ritmo: ~2,2 palabras/s (un poco más ágil que la referencia, que sonó lenta en TTS), silencios solo
en los giros. 66 palabras.

| Fase | Voz | Imagen | Texto en pantalla |
|---|---|---|---|
| **1. Gancho** (0–4 s) | "Así se carga un producto… ‖ y así se carga en Órbita." | Pantalla partida. Izquierda: formulario gris que no termina (cursor que titila, campos que se apilan). Derecha: negro → *clic* de obturador → flash → una foto de producto → el producto completo, publicado. La izquierda sigue escribiendo. | — |
| **2. El problema** (4–11 s) | "Nombre. ‖ Descripción. ‖ Categoría. ‖ Talles, colores, etiquetas. ‖ Y eso, por cada producto." | La pantalla entera es la izquierda: oscuro. Cada palabra de la voz es un campo vacío que cae en perspectiva, con su cursor. En "por cada producto" la cámara se aleja y los formularios se multiplican en un túnel infinito. | **[Nombre]** · **[Descripción]** · **[Categoría]**… (la palabra dentro de una caja, como la mira de HUD del original) |
| **3. El giro** (11–13,5 s) | "¿Y si alcanzara con una foto?" ‖ | Del túnel queda un solo punto de luz: el **satélite**. Su órbita se cierra como el **anillo de un lente**; *clic* de obturador y **flash blanco**: pasamos de la oscuridad a la luz. | — |
| **4. La solución** (13,5–26 s) | "Le sacás una foto, ‖ y Orbi completa el resto: ‖ el nombre, la categoría, la descripción, ‖ y hasta las variantes. ‖ Le quita el fondo a la foto, ‖ vos revisás, ‖ y publicás." | Mundo luminoso (foto de fondo). Una foto casera de la zapatilla (sobre un piso, luz dura) cae sobre la tarjeta de alta en vidrio; una **línea de escaneo celeste** la recorre; de la foto salen **ramas de luz** hacia cada campo y cada uno se completa cuando la voz lo nombra (nombre, categoría, descripción que se tipea sola). En "variantes": chips de color y la zapatilla cambia de color. **"Le quita el fondo": el fondo se disuelve y la zapatilla se despega de la foto y sale en 3D, girando, con luz de estudio** (el wow). Zoom de cámara al botón **Publicar**: clic con anillo. | ✦ Paquete Avanzado (pequeño, arriba de la tarjeta) |
| **5. El resultado** (26–30 s) | "Tu tienda, lista para vender. ‖ Sin comisión por venta." | El producto vuela a la tienda y **estalla un abanico de productos** ya cargados alrededor: el catálogo lleno. Se aclara y quedan las palabras. | **Sin comisión por venta.** |
| **6. Cierre** (30–34 s) | "Una foto. ‖ Un producto listo. ‖ Tu negocio, en órbita." | Cielo con flores. El satélite da su vuelta y arma el **logo real** en blanco. | Una foto. Un producto **[listo.]** → logo · `orbita.site` · ✦ Escaneo con foto: Paquete Avanzado |

### Versión para ElevenLabs (El Faraón, sin etiquetas de "lento")

```
[confident] [warmly] Así se carga un producto… [pause] y así se carga en Órbita. [pause] Nombre. Descripción. Categoría. Talles, colores, etiquetas. Y eso, por cada producto. [pause] ¿Y si alcanzara con una foto. [pause] Le sacás una foto, y Orbi completa el resto: el nombre, la categoría, la descripción, y hasta las variantes. Le quita el fondo a la foto, vos revisás, y publicás. [short pause] Tu tienda, lista para vender. Sin comisión por venta. [pause] Una foto. Un producto listo. [short pause] Tu negocio, en órbita.
```

Versión D (mismo cuerpo, cambia solo la primera frase):

```
[confident] [warmly] Si cargar un producto te lleva más que venderlo… [pause] mirá esto. [pause] Nombre. Descripción. Categoría. …
```

(La pregunta va con punto final a propósito, para que caiga como idea y no como duda.)

## Sonido

Voz arriba (−16 LUFS). Izquierda del gancho: tipeo de teclado seco y continuo, un poco molesto.
Derecha: silencio → *clic* de obturador → campana. En el problema, un golpe grave por campo. En el
giro, subida de ruido que corta en seco con el flash. En la solución, un tic afinado por cada campo
que se completa (sube la escala), clic del botón, *whoosh* del abanico. Colchón sintetizado: oscuro
y tenso hasta el flash, abierto y luminoso después. Master −14 LUFS, pico −1 dBTP.

## Créditos (van en la descripción de YouTube)

- Modelo 3D "Materials Variants Shoe" © 2021 Shopify, CC-BY 4.0 (Khronos glTF Sample Assets).
- Fotos de fondo: Unsplash (licencia Unsplash, sin atribución obligatoria; se registran en
  `recursos/imagenes/LICENCIAS.md`).

## Producción (2026-10-09)

- **Proyecto:** `marketing/hyperframes-youtube-4k/` (HyperFrames 0.8.143). `fuente/plantilla.html` + `escenas.js`
  (coreografía, todos los tiempos salen de la voz) + `zapatilla.js` (3D, Three.js) → `node construir.mjs A|D` genera
  `index.html`. Render: `npx hyperframes render . --resolution 4k --fps 60 --quality delivery`.
- **Voz:** `audio/voz.py` empalma tomas: A1 (pausada) hasta "¿Y si alcanzara con una foto?", A2 (ágil) desde
  "Le sacás una foto…"; la versión D usa el gancho de D1 y el mismo cuerpo. Marcas exactas por palabra en
  `audio/marcas-A.json` / `-D.json`.
- **Mezcla:** `node audio/mezcla.mjs A|D`: música sintetizada al cuadro (oscura → groove de 101,4 BPM calculado para
  resolver en "Tu negocio, en órbita"), efectos en cada evento, voz con cadena de estudio, sidechain, sala, máster
  −14 LUFS / −1 dBTP, 48 kHz 24 bit.
- **Fotos de fondo usadas:** lago (solución) y flores (cierre). El bosque quedó sin usar.

## Descripción para YouTube (borrador)

```
Cargar un producto no tendría que llevarte más que venderlo.
Con Órbita le sacás una foto y Orbi completa el resto: nombre, categoría, descripción y variantes. Le quita el fondo, vos revisás y publicás.
Tu tienda online, lista para vender, sin comisión por venta.

✦ Escanear con foto y quitar fondo son parte del Paquete Avanzado.

orbita.site

Créditos: Modelo 3D "Materials Variants Shoe" © 2021 Shopify, CC-BY 4.0 (Khronos glTF Sample Assets). Fotos: Unsplash (Neil Thomas, Linh Pham).
```
