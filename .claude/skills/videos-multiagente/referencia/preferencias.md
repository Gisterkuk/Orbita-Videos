# Preferencias de la persona (videos de Órbita)

Las leen **siempre** el guionista, el analista y el juez; el editor y el supervisor, la parte de
estilo. Son exigibles: el juez rechaza un guion que las contradiga. Cuando la persona corrige
algo de un video, el director lo agrega en el **Historial** (con fecha y motivo) al terminar.

## Voz
- ElevenLabs, voz **`8mBRP99B2Ng2QwsJMFQl`**, modelo `eleven_v4`, **tono original**: sin tags de
  tono ([happy], [energetic]…) ni indicaciones de estilo en el texto.
- Voseo rioplatense. Frases cortas, una idea por frase.

## Música
- De fondo y baja: volumen **0,15** en la mezcla (carve contra la voz + fundidos).
- Sin Content ID y con la licencia guardada junto al archivo (`LICENCIA.txt`).

## Ritmo
- Sin silencios largos entre frases (≤ 0,6 s). Ágil, pero lo importante se tiene que llegar a
  leer: una respuesta en pantalla, un resultado, la tienda → tramo protegido (≥ 2 s).

## Lo que se nombra, se muestra
- Cada cosa que dice la voz se ve en pantalla mientras se dice: en el panel real, en el negocio
  de demo, o como **recreación marcada** ("Así se ve si…"). Si no se puede mostrar, no se dice.
- Las acciones se ven completas: si se usa una caja de texto, se ve la caja, lo escrito y el
  botón que lo manda.

## Estructura
- **Alternativas antes del resultado:** primero los caminos para hacerlo (manual / con Orbi) y
  al final "así queda", que vale para los dos.
- **Paquete Avanzado** marcado como tal y explicado: qué hace Orbi solo y qué elige la persona
  (talles, precio, stock). Llamado a la acción suave al final: "Activalo cuando quieras desde
  Configuración, en Suscripción".

## Contenido
- Sin datos de prueba visibles ("prueba 2", productos de $1…), sin material con derechos de
  terceros (imágenes de juegos, marcas) y sin nombres de clientes reales. Se graba en el
  **negocio de demo**. Si algo de eso aparece, se avisa **antes** de grabar.

## Calidad y estilo
- Nítido: captura 2880×1800, entrega **1440p**.
- Edición estilo **demos de producto tipo Stripe/Linear** (referencia/estilo.md § Edición estilo
  demo de producto).

## Entrega
- `marketing/videos/<tipo>/AAAA-MM-DD_<slug>_16x9.mp4` (completo) + `-liviano.mp4` (para chat).
- Render con la RTX (`--gpu --browser-gpu`) y prioridad baja: la PC no se tiene que poner lenta.

## Historial (correcciones de la persona)
- **2026-10-09** — "Cargar un producto": quedaban huecos largos sin voz → modo ágil (≤ 0,6 s).
  Música muy fuerte → volumen 0,15.
- **2026-10-10** — Tono de voz con más energía descartado: se queda con el **tono original**. Las
  categorías de prueba del negocio no se tienen que ver. Mostrar la carga con Orbi **antes** del
  resultado publicado, y aclarar que Orbi no sabe talles, precio ni stock.
- **2026-10-12** — "Conocé tu panel" v1: la voz nombraba los numeritos de aviso sin que se vieran;
  decía que un Empleado ve menos módulos sin mostrarlo (y faltaba decir que el dueño los maneja);
  Orbi se usaba sin que se viera la caja donde se escribe. La grabación se veía borrosa ("tiene
  que estar todo en alta calidad"). La edición no parecía profesional (cámara, ritmo y cortes,
  gráficos). La voz es `8mBRP99B2Ng2QwsJMFQl`.
- 2026-10-13 ("Conocé tu panel" v2): el número de mensajes sin leer y la vista de Empleado van como **recreación marcada**
  (no se escribe un mensaje real ni se invita a nadie). Guardar se dice como **instrucción** y no se hace clic (no se escribe
  en producción); un aviso que se nombra se muestra real o la frase sale. Datos reales del negocio (miembros, dueño,
  pedidos viejos) se **desenfocan** en vez de regrabar. Ante detalles de encuadre después de 3 rondas, la persona prefirió
  **cerrar y renderizar** antes que otra vuelta. Agentes en **Sonnet con esfuerzo medio** para ahorrar tokens.
- **2026-10-14** — "Configurar cómo cobrás": las preguntas del director (cuenta de Mercado Pago, producto del carrito,
  tope de rondas) y las rondas de jueces que se contradecían la frenaron varios días. La persona quiere **salir del asiento
  del piloto y juzgar solo los resultados**: autorización permanente, decisiones por defecto y rondas con severidad en
  `referencia/decisiones.md`.
- **2026-10-17** — **Logo:** en los videos va el logo **real** de Órbita (`OrbitaLogo.tsx`: planeta con su anillo **completo** y el satélite dando la vuelta), nunca el arco abierto del loader. El director lo verifica en cada borrador (cuadros de la apertura y del cierre). Regla en `estilo.md` § Intro y test en `herramientas/test/logo.test.mjs`.
