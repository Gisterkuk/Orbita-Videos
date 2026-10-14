# Estado — conoce-tu-panel-v2

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

## 2026-10-12
- Etapa 0 (preparar): listo. Pedido en `produccion/pedido.md` con hechos verificados en el código
  (Empleado por defecto: Pedidos, Clientes, Productos, Mensajes, Configuración→Equipo, Manual; permisos por rol,
  se cambian en Configuración → Equipo → Gestionar roles; números del menú solo en Mensajes y Difusión).
- Etapa 1 (guion): guionista-video disparado (opus).
- Datos de demo en producción: ver `~/orbita-videos/demo-manifiesto.json` (cargados antes, con permiso).
- Etapa 1: guion.md v1 listo (≈1:50, 6 pasos, 21 frases; 1 recreación: menú de Empleado vía respuesta de /auth/me
  interceptada en el navegador, sin escribir nada). Pedidos al director P1–P8 en guion.md.
- Etapa 2 (análisis, ronda 1): analista-video disparado (opus).
- Nota: el tema "El menú de la izquierda" del manual (contenido.ts:143-153) nombra cosas que Sidebar.tsx no tiene
  (selector de espacio, buscador del menú, ícono de colapsar). Fuera de alcance del video; avisar a la persona.
- Análisis ronda 1: RECHAZADO (B1 frase 6 "cada módulo se despliega" falso; B2 frase 12 tarjeta no clickeable + scroll del modal;
  B3 frase 20 buzo en portada sin verificar). Guionista corrigió (ronda 2).
- Decisión de la persona (2026-10-12): el número de mensajes sin leer va como RECREACIÓN marcada (no se escribe ningún mensaje).
- Decisión de la persona (2026-10-12): ocultar "Mira nuestro video" y cambiar contacto del pie. HECHO con
  `demo-datos/portada.mjs --confirmo`: showVideo=false, email contacto@orbita-corp.com, horario "Lunes a sábado de 10 a 19 h".
  Copia de lo anterior en ~/orbita-videos/demo-portada-antes.json; `--revertir --confirmo` lo vuelve atrás. Verificado en la tienda.
- Análisis ronda 2: analista nuevo disparado.
- Análisis ronda 2: RECHAZADO (preferencias 0). B1–B3 cerrados; B4 nuevo: el resultado del buscador (frase 13) dura ~1 s
  y la frase 20 depende de él. Guionista corrige (ronda 3). Tope de 2 vueltas con el analista alcanzado → B4 pasa a los jueces.
- Decisión del director: las 2 conversaciones de Orbi (ensayo + toma) quedan en el historial del negocio de demo (no se borran:
  borrar también es escribir en producción). Si la persona prefiere archivarlas, se hace por el panel con su permiso.
- Guion ronda 3 (B4 + mejoras) listo. Etapa 3 (jueces, ronda 1/3): juez claridad + juez adversarial (sonnet) en paralelo,
  sobre `guion-jueces.md` (copia del guion sin las respuestas del autor a bloqueantes ni "Cambios ronda N": ciegos al autor).
- Jueces ronda 1/3: claridad RECHAZADO (4 bloq.), adversarial RECHAZADO (4 bloq.). Unión J1–J5:
  J1 frase 7 "los números" generaliza · J2 faltan llamadas de botones (modo del menú, Gestionar roles, Ver permisos) ·
  J3 no se enseña guardar permisos / 12b no prueba nada · J4 "o la escribís" sin mostrar + campana condicional ·
  J5 tramos protegidos de 2–2,5 s sin declarar vs silencios ≤ 0,6 s. Guionista corrige → jueces nuevos ronda 2.
- juez-guion.md: umbral de aprobación explícito agregado (todos los críticos en 1, 0 bloqueantes).
- Jueces ronda 2/3: claridad RECHAZADO, adversarial RECHAZADO. J1, J2, J4, J5 cerrados. Abiertos/nuevos K1–K3:
  K1 "si sumás a alguien" sin mostrar cómo · K2 Guardar "para todo el rol" sin prueba + "Sigue igual" sin antes ni tiempo ·
  K3 "Valentina Ruiz" sin declarar ficticia. Guionista corrige → ronda 3 (última) con jueces nuevos.
- Guionista: corte de red a mitad de ronda 5 (nada se había escrito); retomado y terminado. K1–K3 corregidos, 24 frases ≈ 1:56.
  Verificado en código: "Invitar miembro" (Equipo.tsx:223) y "Guardar cambios" (ModalRol.tsx:74) existen.
- Jueces ronda 3/3 (última): claridad + adversarial nuevos, disparados.
- Jueces ronda 3/3: claridad RECHAZADO (solo preferencias: silencios), adversarial RECHAZADO. Cerrados K1, K2b, K3.
  ABIERTOS (tope alcanzado → decide la persona; NO se aprueba igual):
  · S1 (los dos jueces): tabla de tiempos suma ~8 s de acciones sin voz + "esperar 1 s" (fr. 8) + "pausa 0,8 s" (fr. 20) vs silencios ≤ 0,6 s.
  · K2a (adversarial): fr. 15 "Guardar cambios guarda lo que destildaste" afirma un resultado sin clic; fr. 16 "Esta vez" presupone un Guardar.
  · N2 (adversarial): fr. 18 "La campana junta tus avisos" con prueba vaga (solo el título "Notificaciones").
- Decisión de la persona (2026-10-12) sobre lo abierto tras 3 rondas: S1 corregir en el guion (tabla de tiempos);
  K2a decirlo como instrucción ("Para que quede, tocás Guardar cambios", sin clic, sin escribir); N2 mostrar avisos
  reales de la campana si el ensayo los tiene, si no sacar la frase. Guionista aplica; un juez nuevo verifica solo esos 3.
- Verificación (juez nuevo): K2a y N2 cerrados. S1 abierto solo por aritmética (conteo de palabras: 230, no 226 → 1:49,6).
  Nuevos: fr. 15–16 leídas como secuencia; P11 no ajusta pastilla/objetivo si sale la campana. Guionista corrige.
- Verificación final (juez nuevo): APROBADO. S1, Nuevo-1, Nuevo-2 cerrados. GUION APROBADO (1:49,6 con campana / 1:45,6 sin).
  Mejoras sin bloquear: corte D→E si sale la fr. 18; "Y" de la fr. 19 sin enganche; "Avanzado" visible en el menú sin marca.
- Etapa 5 (ensayo): editor-video.

## 2026-10-12 · Etapa 5 (ensayo) — editor-video
- `grabar.mjs` adaptado a las tomas A–G del guion en UNA captura continua (marcas por toma y por frase: sA…sG,
  a-inicio, menu-abierto, subs-pedidos, a-mensajes, a-menu-lateral, modo-lista, a-expandido, b-dueno, b-recarga,
  b-empleado, equipo, invitar, gestionar, roles, modal, modal-scroll-fin, destildado, pie-modal, guardar, cancelar,
  cancelado, d-buscador, busqueda, campana, sE, orbi, orbi-caja, orbi-respuesta, iniciales, menu-iniciales, sF,
  tienda-arriba, tienda-categorias, recien, sG; cajas `foco`/`hl`/`desenfocar` para el editor). Deja además
  `tomas/<toma>/sondeo.json` con lo verificado. En la toma real bloquea toda escritura salvo `POST /orbi/chat`.
- Ensayos: 6 (`ENSAYO=1`). 1–2 cortaron (selectores: texto en mayúsculas por CSS; "Notificaciones" duplicado en el
  menú), 3–4 completos con ajustes (modal, buscador, tienda), 5–6 limpios. Referencia: `tomas/ensayo6` (2880×1800
  verificado por grabador.mjs, 8079 cuadros). Única escritura intentada en todo el ensayo: `POST /api/v1/orbi/chat`
  (bloqueada). Cuadros revisados con `cuadro.mjs`: Inicio, menú en hover, Pedidos desplegado, popover Menú lateral,
  Expandido, Pedidos dueño/Empleado, Equipo, Roles, modal (antes/scroll/destildado), tarjeta tras Cancelar,
  buscador, campana, Orbi con la caja, menú de iniciales, tienda arriba / categorías / Recién llegados, Productos.

### Resultado de los pedidos P
- **P1** ✔ Mensajes y Difusión sin número ni punto real (el texto de las filas es solo "Mensajes" / "Difusión").
- **P2** ✔ `orbita-sidebar-mode` se pone en `hover` antes de grabar (había `hover`), el clic en Expandido lo deja en
  `expanded` (verificado), y al terminar vuelve a `hover` (verificado en sondeo: `modoRestaurado: "hover"`).
- **P3** ✔/⚠ Empleado = exactamente los 7 permisos de fábrica (Ver catálogo, Ver clientes, Ver equipo, Ver inventario,
  Responder mensajes, Ver mensajes, Ver pedidos). La tarjeta lista Ver catálogo, Ver clientes, Ver equipo, Ver
  inventario "+3 más": **"Ver clientes" sí, "Ver pedidos" NO** está entre los 4. ⚠ Hay **3 roles** (Propietario,
  Empleado y uno propio "Venta") y 3 miembros (dueño, "<miembro 1>" Empleado, "<miembro 2>" Venta) con emails de gmail: el
  guion dice 2 roles y "sin empleados". Voz intacta; tabla de Miembros entera a desenfocar. Ver pedidos.md § 4.
  Recreación: el menú de Empleado sale real con `/auth/me` reescrito en el navegador (1 respuesta interceptada):
  Pedidos, Clientes, Productos, Mensajes, Configuración, Manual; Pedidos sin "Nuevo +" (y sin los botones
  "Exportar"/"Nuevo pedido" de la pantalla). No escribió nada.
- **P4** ✔ marcas `desenfocar` con caja: tabla de Miembros (frases 11–12: 3 emails), cabecera del menú de iniciales
  (nombre, rol, email; frase 22) y **el nombre en el saludo del Inicio** ("Buenas noches, <dueño>", frases 1–4 y
  17–19, no estaba en P4). Ningún banner con email.
- **P5** ✔ "buzo" → solo PRODUCTOS · "Buzo Canguro Gris Claro" · $39.990, sin "Borrador". Desplegable ≥ 3 s abierto.
- **P6** ✔ La campana: 11 sin leer = 3 "Nuevo pedido" (#58, #57, #56), 4 "Nuevo cliente" de demo y resúmenes
  automáticos (diarios/semanal, "Stock crítico: 18 producto(s)"). Sin nombres reales. No se tocó nada adentro.
- **P7** ✗ no verificable en ensayo (POST bloqueado → "Error de conexión"). Pedido en pedidos.md § 2.
- **P8** ✔/⚠ Tienda: banner "Básicos que van con todo" (carrusel de 2 que rota cada 4 s; el mouse sobre el banner lo
  frena y la toma lo deja ahí), "Comprá por categoría" (Remeras 4, Buzos 1, Remeras oversize 1) NO entra con el
  banner a scroll 0 → la toma graba un cuadro extra `tienda-categorias` (scroll 162) con banner + fila de categorías
  para la frase 3; "Recién llegados" (y 1055) arranca con Buzo Canguro Gris Claro $39.990, Pack x2 Remeras Negras,
  Remera Verde Oliva (scroll 969, nombre y precio en cuadro); "Más vendidos" en y 1880 (no se llega). "Mira nuestro
  video" oculto ✔, pie con contacto@orbita-corp.com y "Lunes a sábado de 10 a 19 h" ✔. ⚠ Inicio: alertas de pedidos de
  prueba ("21 pedidos necesitan tu atención"…) → se ocultan en memoria antes de grabar (decisión del editor, pedidos.md
  § 3). El resto del Inicio es de demo (Ventas $91.764, Pedidos 3, Top: Remera Básica Blanca, Pack x2, Buzo).
  "Métricas avanzadas" aparece abajo del Inicio (marca `hl metricas-avanzadas`).
- **P9** ⚠ Pedidos y Clientes no entran enteros juntos (orden alfabético; juntos ~680 px vs 522 px de lista) y el plan
  sin scroll con "Ver pedidos" no sirve (grupo 8, y no está en la tarjeta). Se graba con **"Ver clientes"**, scroll
  medido de **119 px** con la rueda sobre la lista (scrollSuave, 1,0 s, sin temblor): Clientes entero abajo + pie del
  modal en cuadro; destildado verificado; Cancelar → la tarjeta sigue con "Ver clientes".
- **P10** ✔ Toma G grabada (Productos → Lista, quieta 2,5 s): primera fila = los 4 productos de demo; ⚠ el encabezado
  dice "21 productos / 15 no publicados" (hay productos de prueba más abajo, fuera de cuadro).
- **P11** ✔ **La campana TIENE avisos "Nuevo pedido"** → la frase 18 VA tal cual (tabla con campana, 1:49,6). Aviso
  para la llamada: **"Nuevo pedido #58" · "Valentina Ruiz: $28782.00"** (primer aviso, caja x 1041 y 106 338×80).
  Ojo: el monto sale sin formato ("$28782.00"), así lo escribe `notifications.service.ts`; la llamada puede decir
  "Nuevo pedido #58 · Valentina Ruiz".
- Mejora del juez ("Avanzado" sin marca): marcas `hl avanzado` (fila del menú en A y B) y `hl metricas-avanzadas`
  (Inicio) para que el editor lo marque como paquete Avanzado o lo deje fuera de foco.

### Toma real (pedido al director, pedidos.md § 1)
`cd ~/orbita-videos/conoce-tu-panel-v2 && node grabar.mjs toma1` — 1 pregunta a Orbi (1 conversación + cupo). Antes del 19/10.

## Dudas
- (editor) La "prueba en pantalla" de la frase 14 pedía Pedidos y Clientes enteros: imposible en esta pantalla; se
  graba solo Clientes entero. La de la frase 13 dice "Propietario y Empleado": hay además "Venta".
- Etapa 5 (ensayo): 6 ensayos, ensayo6 limpio (2880×1800). P11: la campana tiene "Nuevo pedido" → frase 18 va (1:49,6).
  Hallazgos: el negocio tiene 3 miembros (emails gmail reales) y 3 roles (Propietario, Empleado, "Venta") → tabla de
  Miembros entera desenfocada; saludo "Buenas noches, <nombre>" desenfocado. P9: scroll de 119 px sobre "Ver clientes".
  Ocultos sin escribir antes de las marcas: alertas del Inicio ("Limpiar todas", estado de React, Dashboard.tsx:77,468)
  y filtro "Últimos 7 días" en Pedidos. Grabar antes del 19/10.
- Pedido a la persona: permiso de toma real (1 pregunta a Orbi) y de voz ElevenLabs.
- Permiso de la persona (2026-10-12): toma real con 1 pregunta a Orbi + voz ElevenLabs (~1.400 caracteres).
- Etapa 6 (toma real): tomas/toma1 OK (7206 cuadros). 1 pregunta a Orbi gastada → 1 conversación en el historial.
  La respuesta de Orbi incluye 2 pedidos de prueba viejos con nombres reales (#50 del dueño, #49 <miembro>):
  decisión del director → desenfocar esas 2 líneas y llamada sobre #57 Martín Sosa y #56 Lucía Ferreyra (demo).
- Etapa 7 (voz): ElevenLabs 8mBRP99B2Ng2QwsJMFQl, eleven_v4, 1 generación, 94,96 s, 1.321 créditos = US$0,26.
  → conoce-tu-panel-v2-hf/assets/voz/narracion-completa.mp3; texto en conoce-tu-panel-v2/guion.json (f1–f24).
## Costos (acumulado)
- Voz: US$0,26 · Orbi: 1 pregunta (toma real) · Render: pendiente

## 2026-10-12 · Etapa 8 (borrador) — editor-video
- **borrador-v1**: `~/orbita-videos/conoce-tu-panel-v2-hf/renders/borrador-v1.mp4` (1080p60, 1:58,1, 113 MB). Primera
  versión (no hay bloqueantes de supervisor todavía). Toma real `tomas/toma1` (no se regrabó) + voz única
  `narracion-completa.mp3` partida con `hyperframes transcribe` (Parakeet, 230 palabras) + `scripts/partir-voz.mjs`
  (24 frases, 95,0 s, distancia de alineación 3). Sin voz nueva.
- Edición (`editar.mjs`): clips A–F (G no se usa: no hizo falta el plan B de la frase 23), modo ágil (hueco 0,4 s) con
  4 tramos protegidos (Sigue igual, resultado del buscador, respuesta de Orbi, Recién llegados), cámara 1 / 1,35–1,56
  (tope 1,6), 25 llamadas (≤ 30 / 45), barra de progreso de 6 pasos ("Buscador y avisos": la campana tiene avisos, P11),
  focos en "lo del día a día" y en los pedidos #57 y #56. Empuje lento de cámara en los tramos protegidos (sin
  cuadros congelados) y paso por blanco en el corte panel → tienda (sin salto de brillo).
- Extras (`-hf/scripts/extras.mjs`, corre en `npm run armar`): gancho con las 6 pastillas sobre el Inicio (frase 1),
  pantalla partida Panel / Tienda con foco que cambia en "el panel" / "la tienda" (frases 2–3), y las llamadas del aviso
  #58 y de la respuesta de Orbi a un costado (arriba tapaban lo que hay que leer).
- Recreaciones marcadas en `video.json`: el "1" de Mensajes (rótulo "Recreación · Así se ve con una conversación sin
  leer", borde punteado sobre la fila, 31,5–36,4 s) y el menú de Empleado (rótulo "Recreación · Así lo ve un Empleado
  (permisos por defecto)", desde que empieza la fusión hasta el corte, 45,9–53,5 s).
- **Desenfoques** (en la placa, ilegibles: pixelado + blur): nombre del saludo "Buenas noches, …" en todo el Inicio
  (A, D, E y la foto fija de la pantalla partida); toda la tabla de Miembros (3 emails); nombre, rol y email en el menú
  de las iniciales; renglones #50 "<dueño>" y #49 "<miembro>" de la respuesta de Orbi durante todo el tramo
  (desde que aparece hasta que se cierra Orbi). Campana revisada: solo nombres de demo (Valentina Ruiz, Martín Sosa,
  Lucía Ferreyra, Tomás Benítez) y resúmenes automáticos → nada que desenfocar.
- Placa 2880×1800 (`placa-tramos.sh`, 3 tramos; el tramo 2 falló 2 veces y salió al 3.er intento).
- Escaneos (`produccion/revision-auto.json`): negros 0, congelados sin voz 0, flashes 0, silencios 0, saturación 0
  (pico −4,7 dB, −20,9 LUFS). Nitidez mediana 601 (bajos esperables: tabla desenfocada a 59 s, fotos de la tienda y cierre).
  Un primer render (`renders/borrador-v1-descartado-escaneos.mp4`) no pasó: 3 congelados sin voz en los tramos protegidos y
  un flash en el corte a la tienda → corregidos con el empuje lento y el paso por blanco.
- `npm run check`: 0 errores (avisos: contraste 4,27:1 de un texto de la placa, pistas densas, subtítulos que se
  solapan en los cambios de frase).
- **Costos (render):** placa ≈ 32 min · HyperFrames 1080p (GPU, prioridad baja, 3 workers) 8,3 min (descartado) +
  6,6 min (v1) = **≈ 47 min**. Voz: US$ 0 nuevos (se usó la ya generada). Orbi: 0 nuevos.

## Dudas
- (editor, v1) La apertura estándar (logo 3,6 s) va antes de la frase 1, así que el gancho del Inicio con pastillas
  arranca a los 3,5 s y no en 0. El cierre usa la placa estándar del logo con "Tu negocio, en órbita." sobre el fondo
  azul (no sobre la tienda desenfocada). "Avanzado" (menú) y "Métricas avanzadas" (Inicio) siguen sin marca: no están en
  foco en ninguna frase.
- Etapa 8: borrador-v1.mp4 (1:58,1, 1080p60) con escaneos limpios y check 0 errores. Render ~47 min (placa 32 + 2 renders GPU).
- Etapa 9 (supervisión ronda 1/3): supervisor fidelidad + espectador mudo (solo las 25 hojas, sin palabras clave ni guion) en paralelo.
- Supervisión ronda 1/3: supervisor RECHAZADO (11 bloqueantes: llamada del buzo sobre las remeras, grilla tardía, llamadas
  que tapan lo nombrado, gancho con 5/6 pastillas, pantalla partida diminuta, rótulo de recreación 0,2 s tarde, encuadre
  cortado en Equipo, −20,9 LUFS). Espectador mudo: entiende la ubicación de las cosas, no el tramo de roles/permisos.
  Director: rol "Venta" y "1 miembro" = datos reales aceptados (no bloquean). Diagnóstico de "se ve mal": texto nítido
  pero ventana chica → agrandar/zoom en lectura. Editor arma borrador-v2.

## 2026-10-13 · Etapa 9 · ronda 1 → borrador-v2 — editor-video
- **borrador-v2**: `~/orbita-videos/conoce-tu-panel-v2-hf/renders/borrador-v2.mp4` (1080p60, 1:58,0, audio normalizado).
  El v1 queda intacto; renders descartados: `borrador-v2-descartado-flash.mp4` (flash en el corte a la tienda).
- B1 → la llamada "El mismo buzo del buscador" apunta al nombre de la tarjeta del buzo (posición real de la tarjeta, sobre el buzo).
- B2 → la toma F arranca con el scroll medido (scrolls.mjs: se ve empezar en 178,48, no en el evento de 177,03): la grilla entra a 1,6 s de la frase 23 y está en cuadro mientras se dice "los productos".
- B3 → todas las llamadas se ubican junto a su objetivo y del lado indicado (extras.mjs): "Pedidos" a la derecha del menú (no tapa la fila ni "Lista"), sin "Devoluciones" (texto exacto del menú o nada).
- B4 → "Guardar cambios" y "Cancelar" van debajo de cada botón; el permiso destildado queda libre. Guardar: "Así se guarda · acá no lo tocamos" (solo se apoya); Cancelar: "Clic acá: sale sin guardar" (el único clic).
- B5 → las 6 pastillas (incluida "Tu tienda") entran en 0,4–3,4 s y se van antes de la pantalla partida (sin fantasmas).
- B6 → la llamada del buscador va a la izquierda de la fila del resultado: "buzo" en la caja queda visible (y se ve entrar letra por letra: tipeo a 1,15× y tramo protegido).
- B7 → mezcla normalizada a −14,1 LUFS, pico −1,5 dBTP (`-hf/scripts/normalizar.mjs`, loudnorm en dos pasadas, video sin recodificar).
- B8 → pantalla partida a pantalla completa: dos ventanas de 900 px, cada una con su barra (…/admin y la tienda), sin la URL compartida.
- B9 → el rótulo de Empleado entra 0,4 s antes de la fusión y sale 0,2 s después del corte a C.
- B10 → Gestionar roles a 1,35 centrado: título "Equipo y permisos", Propietario y Empleado enteros (Invitar miembro en plano general).
- B11 → sin cambios ("Venta" y "1 miembro" aceptados por el director); nombres y emails siguen desenfocados.
- Espectador: "Equipo" legible antes del clic (cámara 1,5 sobre el submenú de Configuración); clic en Expandido protegido y menú que queda abierto; clic en Enviar protegido con la caja entera en cuadro; la respuesta de Orbi ya no se oscurece (sin foco): solo #50 y #49 desenfocados, #57 y #56 nítidos; corte a la tienda con fundido cruzado real (arreglo en plate.html: el fundido sigue aunque el tramo sea más corto). Más pantalla en lectura: cámara 1,35–1,56 en Inicio, menú, recreación, roles, modal, buscador, campana y Orbi.
- Mejoras tomadas: "Ventas" y "Pedidos" con llamadas separadas; "Menú lateral", "Enviar" e "Ir a la tienda" apuntan a su botón; cierre con "www.orbita.site".
- Escaneos (`revision-auto.json`): negros 0, congelados sin voz 0, flashes 0, silencios 0, saturación 0; **−14,1 LUFS**, pico −1,4 dB. `npm run check`: 0 errores.
- **Costos (render):** placa completa ≈ 25 min + 2 colas de 106,5 s al final (7 + 7 min) + 2 uniones (≈ 4 min); HyperFrames 1080p 8,5 + 8,6 min = **≈ 60 min**. Voz y Orbi: 0 nuevos.

## Dudas
- (editor, v2) La pregunta a Orbi entra de una sola vez (se toca la sugerencia, que la copia en la caja: así funciona la app y así se grabó): no hay letras que se vean entrar. Se ve la caja con la pregunta y el clic en Enviar.
- Borrador v2 (1:58,0, −14,1 LUFS, render ~60 min). Supervisión ronda 2/3: RECHAZADO. Cerrados 1,3–8; 2 parcial.
  Nuevos: B9 nombre/rol/email del dueño visibles ~0,3 s en el fundido de "Ir a la tienda" (1:46,9); B10 "queda siempre
  abierto" antes del menú abierto; B11 grilla de la tienda ~1 s tarde. Espectador mudo: rótulo de recreación tapa el título,
  letra chica en Menú lateral/campana/Orbi, Guardar vs Cancelar poco claro.
- Editor NUEVO (Sonnet medio, por pedido de la persona; el anterior tenía ~650 k tokens de contexto) arma borrador v3.

## 2026-10-13 · Etapa 9 · ronda 2 → borrador-v3 — editor-video
- **borrador-v3**: `~/orbita-videos/conoce-tu-panel-v2-hf/renders/borrador-v3.mp4` (1080p60, 1:57,7, −14,1 LUFS, pico −1,5 dBTP). v1 y v2 intactos.
- B9 → `compose/plate.html`: el cuadro saliente de un fundido cruzado ahora lleva SUS desenfoques (antes solo se aplicaban los del tramo nuevo). Verificado cuadro por cuadro 106,7–107,45 s: saludo, nombre, rol y email desenfocados durante todo el fundido.
- B10 → `editar.mjs` acelera ×3 (nuevo `E.acelerar()` en `herramientas/lib/edicion.mjs`) el tramo entre abrir la lista de modos y el clic en Expandido: el clic cae a 41,04 s (voz: "Expandido" 40,3–41,0; "queda siempre abierto" desde 41,4); llamada "Elegido: Expandido" tras el clic.
- B11 → la voz de la frase 23 arranca 0,9 s más tarde (`offset` en voz.json, sin regenerar voz): el scroll a la grilla termina a 107,54 s y "Acá están los productos" empieza a 107,62 s con "Recién llegados" ya en cuadro.
- Espectador mudo: rótulo "Recreación" movido a la barra del navegador (arriba a la derecha, no tapa contenido) y dice qué se simula ("el «1» de Mensajes no es real" / "así lo ve un Empleado (simulado)"); cartel "El menú" entra cuando el menú se abre (23,8 s); "Menú lateral" a zoom 1,6 y llamadas "Expandido" → "Elegido: Expandido"; Guardar = "Solo apoyamos el cursor, sin clic", Cancelar = "Acá hacemos el clic" (anillo de clic más grande y opaco en todos los clics); llamada "Buscador · Clic acá y escribí" antes de escribir; campana y Orbi a zoom 1,6.
- Escaneos (`revision-auto.json`): negros 0, congelados sin voz 0 (10 con voz), flashes 0, silencios 0, saturación 0; −14,1 LUFS, pico −1,4 dB. `npm run check`: 0 errores.
- **Costos (render):** placa completa ≈ 24 min + HyperFrames 1080p GPU 8,8 min = ≈ 33 min. Voz y Orbi: 0 nuevos.
- Borrador v3 (1:57,7, −14,1 LUFS; placa ~24 min + render 8,8 min). B9 desenfoque también en el cuadro saliente del fundido;
  B10 tramo acelerado ×3 (E.acelerar() agregado a herramientas/lib/edicion.mjs de ESTE video: portar al skill si sirve);
  B11 offset +0,9 s en f23. Llamadas nuevas del espectador mudo. Supervisión ronda 3/3 (última): supervisor + espectador nuevos.
- Supervisión ronda 3/3: RECHAZADO. B9, B10, B11 cerrados. Nuevo B12: scroll repetido/parpadeo ~0,4 s al entrar a la tienda
  (1:47,15–1:47,6). Menores: llamada del buscador tapa la foto, rótulo del Empleado ~1,3 s tarde, dura 1:57,7 (guion 1:49,6).
  Espectador v3: cartel "Cancelar" con el cursor aún sobre Guardar, "Enviar" cortado, "Ver clientes · tildado" tapa "Venta",
  texto chico en Menú lateral y Orbi. Tope alcanzado → decide la persona (se le manda el borrador v3).
- Decisión de la persona (2026-10-13) tras 3 rondas: corregir B12 + menores y verificar con un supervisor nuevo; después corte final. Editor (Sonnet) arma borrador v4.

## 2026-10-13 · Etapa 9 · ronda 3 → borrador-v4 — editor-video
- **borrador-v4**: `~/orbita-videos/conoce-tu-panel-v2-hf/renders/borrador-v4.mp4` (1080p60, 1:55,8, −14,1 LUFS). v1–v3 intactos.
- B12 → causa: el scroll de la tienda quedó partido en varios tramos por el modo ágil y cada tramo rehacía el scroll entero (plate.html calculaba la posición por tramo). Ahora cada tramo lleva la fracción p0–p1 del scroll (editar.mjs) y la placa la usa: un solo scroll banner → grilla, verificado a 12 cuadros/s de 105,5 a 107,5 s (sin retrocesos ni parpadeo). Mismo arreglo vale para el scroll del modal.
- Llamada del buscador movida a la izquierda del desplegable (ya no tapa la foto). Rótulo del Empleado: el tramo del menú del dueño pasa ×3, la fusión llega ~1,4 s antes y el rótulo entra con el primer cuadro recreado. "Cancelar" entra cuando el cursor llega (marca cancelar); "Guardar cambios · Guarda lo que cambiaste" / "Cancelar · Sale sin guardar" (texto del panel); anillo de clic solo en Cancelar. "Enviar" a la izquierda del botón, entera. "Ver clientes · tildado" dentro de la tarjeta Empleado (no tapa Venta).
- Zoom: "Menú lateral" y la respuesta de Orbi ya estaban en el tope 1,6; no hay más margen (el encuadre queda pegado al borde de la pantalla).
- Ritmo: modo ágil hueco 0,3 s / ×4 y cierre 4,6 s: 1:57,7 → 1:55,8 (tramos protegidos intactos). Los huecos que quedan son pausas por voz sobre pantalla quieta; bajar de ahí pide regrabar o cortar frases.
- Escaneos: negros 0, congelados sin voz 0, flashes 0, silencios 0, saturación 0; −14,1 LUFS, pico −1,4. `npm run check`: 0 errores. Render: placa ≈ 25 min + HyperFrames 8 min.
- Borrador v4 (1:55,8, −14,1 LUFS): B12 arreglado en compose/plate.html (cada tramo del modo ágil cubre solo su fracción del scroll). Duración aceptada por el director (voz real 95 s). Verificación: supervisor nuevo.
- Verificación v4: los 7 puntos cerrados, sin bloqueantes nuevos. Nombres visibles (Valentina Ruiz, Martín Sosa, Lucía Ferreyra) = clientes ficticios de demo. Etapa 10 (corte final): supervisor fidelidad + adversarial.
- Corte final ronda 1/3: fidelidad RECHAZADO (F1 modal quieto/ilegible con "destildás" a destiempo; F3 menú nombrado sobre riel
  diminuto, abre tarde) · adversarial RECHAZADO (F1; F2 "Sigue igual" no señala "Ver clientes" y tapa Venta; F4 encuadres cortados).
  Editor arma borrador v5.

## 2026-10-13 · Etapa 9 · corte final → borrador-v5 — editor-video
- **borrador-v5**: `~/orbita-videos/conoce-tu-panel-v2-hf/renders/borrador-v5.mp4` (1080p60, 1:55,3, −14,1 LUFS, pico −1,4). v1–v4 intactos.
- F1 → el modal "Editar rol" se acelera (nuevo `E.acelerar` ×3 abrir→scroll, ×1,5 hasta el clic), cámara 1,5 al abrir y 1,6 sobre el grupo Clientes; el clic en "Ver clientes" cae a 67,6 s, dentro de "destildás" (67,1–67,9; offset +0,6 en f14, sin regenerar voz) y el destildado queda legible. Pausa de 1,6 s (nuevo `E.pausar`) en el pie del modal y offsets en f15/f16 para que "Guardar" y "Cancelar" se nombren sobre su botón (clic en Cancelar a 75,3 s, voz "Cancelar" 74,5–75,8).
- F2 → "Sigue igual" apunta a la línea "Ver clientes" dentro de la tarjeta Empleado (no tapa Venta); el cursor sale de Venta y se apoya en esa línea; cámara 1,15 en ese plano.
- F3 → cámara 1,6 sobre el riel desde el inicio de la frase 5; el cursor se ve entrar al riel y el menú abre en cuadro antes de "se abre". No aceleré el vagado del mouse (el menú ya estaba abierto en la palabra; acelerar lo abría antes que la voz).
- F4 → Orbi: cámara en y=281 (cabecera completa); tienda: empuje final centrado en x=720 (tercer producto y WhatsApp enteros); Venta entera en "Sigue igual".
- Mejoras tomadas: fundido a la tienda 0,22 s; rótulo de recreación más grande (17 px, "Recreación · así lo ve un Empleado"). No tomadas: subtítulos pisados en ~0:43, corte de Orbi en 1:41, flecha de "Enviar" sobre el texto legal.
- Escaneos: negros 0, congelados sin voz 0, flashes 0, silencios 0, saturación 0. `npm run check`: 0 errores. Render: placa ≈ 26 min + HyperFrames 8 min.
- Borrador v5 (1:55,3, −14,1 LUFS): F1 modal acelerado + zoom 1,5/1,6, offsets f14–f16; F2 'Sigue igual' sobre Ver clientes; F3 zoom 1,6 al riel; F4 encuadres enteros. Corte final ronda 2/3: dos supervisores nuevos.
- Corte final ronda 2/3: fidelidad RECHAZADO (N1 FUGA: tabla de Miembros sin desenfoque ~4 cuadros en 1:01,9 — regresión por
  aceleración/offsets; N2 "Ver permisos" sin clic visible) · adversarial RECHAZADO (F2 sigue; F4 bordes; B1 Orbi sin botón ni
  cabecera; B2 campana fuera de cuadro). F1 y F3 cerrados. Editor arma v6 con verificación de TODOS los desenfoques ±0,5 s.

## 2026-10-13 · Etapa 9 · corte final ronda 2 → borrador-v6 — editor-video
- **borrador-v6**: `~/orbita-videos/conoce-tu-panel-v2-hf/renders/borrador-v6.mp4` (1080p60, 1:57,0, −14,1 LUFS, pico −1,4). v1–v5 intactos.
- N1 (privacidad) → causa real: los desenfoques SÍ pasan por el mismo mapeo de tiempo (están en tiempo de toma y la placa los aplica a la fuente de cada cuadro), pero la tabla de Miembros sigue visible en los cuadros de la toma hasta ~71,6 s y el desenfoque cortaba a 71,53 s (clic en "Gestionar roles" 71,48 s; la página de roles aparece a 71,74 s). Ahora corta a +0,3 s del clic (71,78 s). Verificación con `out/verificar-blur.mjs` sobre la placa final (`out/placa.mp4`), TODOS los cuadros a 60 fps de ±0,5 s de fuente alrededor de cada borde de cada intervalo (hojas en `out/blur-v6/`, informe en `out/blur-v6/informe.txt`): saludo (−0,19–27,14 / 27,14–27,84 / 27,84–32,59: bordes 26,6–28,3 s de fuente, 100 cuadros, nombre ilegible en todos); tabla de Miembros (61,19–71,78: borde inicial 60,7–61,6 y final 71,3–72,3 s de fuente; tabla desenfocada hasta que entran las tarjetas, ninguna legible); menú de iniciales (161,14–165,28: borde inicial 160,65–161,63, 50 cuadros; nombre/rol/email ilegibles); saludo de D y E (105,06 y 130,65: caen antes del primer cuadro del clip, solo se ve el borde cubierto por el intervalo; 130,98 revisado); renglones #50/#49 de Orbi (144,48 inicio: la respuesta aparece recién a ~150 s de fuente; fin 156,7 s cae dentro del corte de Orbi que descarta 153,1–158,8 s de fuente, ningún cuadro lo muestra); fundido a la tienda (B-layer con su propio desenfoque, verificado en v3/v4, cruce 0,22 s). Ningún cuadro legible.
- N2 → el cursor yendo a "Ver permisos" y su clic se protegen del modo ágil (≥1 s con la llamada "Ver permisos" y el anillo del clic); luego el modal abre y destilda (offsets f14 +1,5, f15 +1,7, f16 +0,3; clic en "Ver clientes" ~68,0 s dentro de "destildás").
- F2 → "Sigue igual" y "Tildado" caben dentro de la tarjeta Empleado, a la derecha de la línea "Ver clientes" (flecha sobre la línea, no tapan "Empleado" ni Venta); el cursor llega a la línea en el clic en Cancelar y se queda ahí (se descartó el movimiento grabado hacia Venta). Llamada de "Sigue igual" entra con la cámara ya quieta.
- F4 → roles y "Sigue igual" en plano general (zoom 1): Venta e "Invitar miembro" enteros; tienda en plano 1 (sin recorte de bordes); Orbi: cámara y=281.
- B1 → plano 1,35 sobre el botón "Orbi AI" desde 0,9 s antes del clic (se ve el botón y el clic) y la llamada "Orbi AI · Tu asistente" a la izquierda del botón, sin tapar el saludo. B2 → cámara (1180, 281) 1,6 desde 0,9 s antes del clic en la campana: campana con su contador y el clic en cuadro.
- Repaso del video entero (1 cuadro cada 3 s, 39 cuadros) y snapshots de los tramos tocados: sin regresiones visibles. Escaneos: negros 0, congelados sin voz 0, flashes 0, silencios 0, saturación 0. `npm run check`: 0 errores. Render: placa ≈ 26 min + 3 renders HyperFrames de ~8 min (los dos primeros descartados por ajustes de llamadas).
- Borrador v6 (1:57,0): N1 causa = desenfoque cortaba 0,07 s antes de que la tabla salga de la toma (71,53 vs 71,6); ahora 71,78; verificación de todos los desenfoques a 60 fps ±0,5 s (out/verificar-blur.mjs). N2, F2, F4, B1, B2 corregidos. Corte final ronda 3/3 (última).
- Corte final ronda 3/3: fidelidad RECHAZADO solo por encuadre (crit. 3 = 0,5; N1 y N2 cerrados; privacidad verificada a 60 fps).
  Adversarial RECHAZADO (F2, B2 cerrados; F4/B1 parciales; nuevos: "Equipo" dicho sobre Pedidos 0:56, "Invitar miembro" cortado
  0:57, llamada "Orbi AI" fuera de sitio y cabecera fuera 1:31–1:34, llamada fantasma "Ir a la tienda" 1:44). Tope → decide la persona.
- Decisión de la persona (2026-10-13): v6 aceptado tal como está → render final 4K y entrega.
- Etapa 11: final-4k.mp4 (3840×2160, 1:57,0; render 16 min con GPU) → entregar: marketing/videos/tutoriales/2026-10-13_conoce-tu-panel-v2_16x9.mp4
  (1440p, 80,1 MB, −14,8 LUFS, pico −1,1) + liviana (27,8 MB). Nitidez (recorte central, varianza del laplaciano, final bajado a 1080p vs v1):
  ver reporte final.
