# Videos tutoriales de Órbita: calidad profesional y producción con 5 agentes

**Fecha:** 2026-10-12 · **Estado:** aprobado por la persona (2026-10-12: "sumalo todo y ya empezá")
**Skill afectado:** `.claude/skills/videos-tutoriales/`

## 1. Intención

Los tutoriales del panel tienen que verse **profesionales y nítidos** y no dejar momentos
confusos, y su producción tiene que poder repetirse sin que la persona revise cada paso.

Lo que pidió la persona (2026-10-12), a partir de "Conocé tu panel" v1:
- La edición no parece profesional: **movimientos de cámara**, **ritmo y cortes**, **gráficos y carteles**.
- La grabación del panel se ve mal (la interfaz de alrededor sí se ve bien): todo en alta calidad.
- La voz dice cosas que no se ven ("los números te avisan…" sin ningún número en pantalla; "un
  empleado ve menos módulos" sin mostrarlo; Orbi sin que se vea la caja donde se escribe).
- Un sistema de agentes: guionista según sus preferencias, analista que valida la idea y los
  ganchos junto con el guionista, **un juez que aprueba el guion por su cuenta** (en lugar de la
  persona), un editor y un supervisor que revisa el video parte por parte y manda a corregir.
- Vara de estilo: **demos de producto tipo Stripe/Linear**.

Supuestos (confirmados en la conversación): el supervisor es quien atrapa "la voz nombra algo que
no aparece"; las preferencias quedan escritas para que el guionista las use siempre; la persona
solo interviene en lo que toca producción o cuesta plata.

**Criterios de éxito:** el supervisor cierra sin bloqueantes en ≤ 3 rondas; el texto del panel se
lee nítido en la entrega 1440p con el zoom máximo; la persona no encuentra ninguno de los
problemas que marcó en v1.

## 2. Calidad de imagen

**Diagnóstico.** El navegador se abre con `deviceScaleFactor: 2`, pero `Page.startScreencast`
(CDP) entrega cuadros de 1440×900 (JPEG 88). La cámara hace zoom de hasta 1,7× sobre esa imagen
→ texto agrandado y borroso. Además hay compresiones en cadena (JPEG de captura → JPEG del
render de la placa → H.264 de 1,5 Mbps → H.264 final) y la versión liviana va a 1,6 Mbps.

| Etapa | Hoy | Nuevo |
|---|---|---|
| Captura | screencast 1440×900, JPEG 88 | **2880×1800** reales, JPEG 97 o PNG |
| Placa intermedia | capturas JPEG 96 → H.264 crf 15 (~1,5 Mbps) | capturas PNG → H.264 crf 8, yuv420p, a 2880×1800 |
| Zoom máximo | 1,7× sobre 1440 px | **tope 1,6×** sobre 2880 px: nunca se agranda por encima de la resolución capturada |
| Render | HyperFrames 1080p | HyperFrames **4K** (`--resolution landscape-4k`: no hay preset 1440p) |
| Entrega | 1080p ~3 Mbps + liviana 1,6 Mbps | **1440p** (4K reescalado con lanczos) alta calidad para YouTube; liviana para chat que prioriza el texto (30 fps antes que bajar nitidez) |

**Método de captura: se elige con una prueba corta** (solo lectura, sobre el Inicio). Candidatos:
(a) screencast forzando las métricas del dispositivo (`Emulation.setDeviceMetricsOverride`);
(b) `Page.captureScreenshot` cuadro por cuadro; (c) ventana de 2880×1800 con la página al 200%.
Gana el que dé 2880×1800 nítido a ≥ 25 cuadros/s. Criterio medible: nitidez del texto
(varianza del laplaciano) en un recorte fijo, antes/después.

**Control objetivo:** una herramienta mide la nitidez por tramo del borrador y el factor de
agrandamiento efectivo de la cámara; el supervisor la recibe junto con los cuadros.

**Costo:** el render final en 4K tarda ~4× (un tutorial de 1:20 pasa de ~7 a ~25–30 min) y la
captura es más pesada. Por eso el supervisor revisa **borradores en 1080p** y solo la versión
aprobada se rinde en 4K. Siguen en la RTX (`--gpu`, `--browser-gpu`, Chrome en "Alto
rendimiento") y con prioridad baja.

## 3. Los 5 agentes

Definidos en `.claude/agents/` (commiteados: los tiene todo el equipo). Cada uno arranca **sin el
contexto de los otros**. Se comunican con archivos en `~/orbita-videos/<video>/produccion/`.

| # | Agente (`.claude/agents/…`) | Lee | Produce | Producción |
|---|---|---|---|---|
| 1 | Guionista (`guionista-video.md`) | pedido, `preferencias.md`, manual del panel, código de la pantalla, recon de solo lectura | `guion.md`: objetivo, gancho, pasos y, **por cada frase de la voz, su "prueba en pantalla"** (qué se ve mientras se dice: real, del negocio demo, o recreación marcada) | solo lectura |
| 2 | Analista (`analista-video.md`) | `guion.md`, `marketing/referencias/`, el código del repo | `analisis.md`: gancho, claridad, "lo que se nombra se puede mostrar", riesgos (datos de prueba, derechos, plan Avanzado) y **lista de afirmaciones verificables contrastadas con el código** (`archivo:línea`): si una afirmación no tiene respaldo, la frase se cae. 1–2 vueltas con el guionista | no |
| 3 | Juez del guion (`juez-guion.md`), **dos instancias independientes**: claridad/pedagogía y adversarial/red-team | **solo** el guion final y `preferencias.md` (no ve el análisis ni la conversación) | `veredicto-claridad.md` + `veredicto-adversarial.md`: rechazan por defecto (ver Principios). **Se aprueba solo si aprueban las dos.** Modelo distinto al del guionista (`model:` en el frontmatter), igual de capaz. Si rechaza → guionista (≤ 3 rondas) | no |
| 4 | Editor (`editor-video.md`) | guion aprobado, `estilo.md` (guía nueva) | ensayo, toma, `editar.mjs`, voz, armado HyperFrames, borradores | **sí**, a través del director |
| 5 | Supervisor (`supervisor-video.md`) | borrador renderizado, guion aprobado, checklist (**no** ve el código del editor) | `revision.md`: rechaza por defecto (ver Principios); problemas con segundo exacto, severidad y propuesta, más la rúbrica de §4. Aprueba solo con **0 bloqueantes, todos los criterios críticos = 1 y ninguno < 0,5**. ≤ 3 rondas con el editor; cada borrador queda versionado (`v1`, `v2`…). En el **corte final**, dos instancias independientes (fidelidad/claridad y adversarial); aprueba solo si aprueban las dos | no |
| 5b | Espectador mudo (sub-tarea del supervisor) | **solo** los cuadros del borrador, sin audio ni guion | Cuenta qué enseña el video. Si no coincide con el objetivo del guion, es bloqueante (la imagen no se sostiene sola) | no |

**Director:** la conversación principal con el skill. Encadena los agentes, hace las preguntas que
le corresponden a la persona y lleva `produccion/estado.md` (etapa, rondas, decisiones y
**costos**: voz, cupo de Orbi, renders) para retomar si la sesión se corta.

**Lo que toca producción no cambia:** la persona escribe su contraseña (`login.mjs`), un solo
navegador con el perfil persistente, ensayo con escrituras bloqueadas antes de la toma real,
permiso explícito para crear/borrar datos, gastar cupo de Orbi o pagar voz. El editor no graba
por su cuenta: las tomas y la voz las dispara el director con esos permisos.

**Si no se llega a "aprobado"** en las rondas máximas, el director le escala a la persona los
bloqueantes abiertos y decide ella. **Nunca se aprueba igual.**

### Principios de los críticos (analista, juez, supervisor, espectador mudo)

La persona los quiere **críticos objetivos y duros**: si el camino es malo, lo dicen y rechazan; no
buscan la vuelta para que suene bien ni para darle la razón.

1. **Rechazo por defecto con evidencia obligatoria.** El veredicto arranca en RECHAZADO. Cada
   criterio se aprueba solo citando evidencia (frase del guion, o segundo exacto + cuadro). Sin
   evidencia, el criterio vale 0. Prohibido "en general está bien".
2. **Rúbrica con anclas 0 / 0,5 / 1**, con la descripción concreta de cada nivel por criterio. Se
   puntúa cada criterio por separado **antes** del veredicto; el global es el **mínimo** de los
   criterios críticos (no el promedio: un 1 no compensa un 0).
3. **Abogado del diablo obligatorio** antes de puntuar: argumentar en qué paso se confundiría o
   abandonaría un comerciante no técnico.
4. **Ciegos al autor.** Ven solo el artefacto (guion final, borrador), nunca notas, justificaciones
   ni la conversación del guionista o del editor.
5. **Un crítico nuevo por ronda.** Sin contexto previo: recibe el artefacto nuevo y la lista de
   bloqueantes abiertos de la ronda anterior para verificar si se cerraron, **no** los puntajes
   previos (anclaje). **Solo un crítico cierra un bloqueante**; el autor no puede marcarlo resuelto
   ni "aceptar el riesgo".
6. **Umbrales fijos** que no bajan entre rondas ni se negocian.
7. **Independientes, sin debate:** donde hay dos instancias, no se leen entre sí; se aplica la
   regla de la más estricta.
8. **Nada de "encontrá al menos N problemas"** (genera quejas inventadas): la dureza sale del
   rechazo por defecto y la evidencia, no de una cuota.

Fuentes: los repos de §4c y la literatura sobre sesgos de jueces LLM (autopreferencia,
arXiv 2410.21819; anclaje en evaluaciones iterativas, arXiv 2608.25869; rúbricas con evidencia,
arXiv 2601.08654).

## 4. Guía de estilo y checklist

### Guía del editor (`referencia/estilo.md`, sección nueva "Edición estilo demo de producto")

**Cámara:** un movimiento por idea (va, se queda quieta mientras se explica, vuelve); dos niveles
de zoom (plano general y primer plano 1,35–1,6×); si el próximo foco está lejos, **corte** en vez
de paneo; curvas largas y suaves (0,8–1,1 s); la cámara llega antes del clic.

**Ritmo:** cada paso arranca con la acción; silencios entre frases ≤ 0,6 s salvo tramos protegidos
para leer (modo ágil con `proteger`); las cargas de la app se cortan o aceleran; medio segundo de
aire al cerrar cada sección.

**Gráficos:** un solo lenguaje visual — **llamada** chica junto al elemento en lugar de la tarjeta
grande a la izquierda; la lista de pasos de la derecha pasa a barra de progreso fina; resaltados
como foco (oscurece el resto); subtítulos más chicos, abajo, sin pisar lo que se muestra.
**Recreación marcada** cuando la voz habla de algo que la pantalla real no muestra (como el
diálogo "Abrir"): etiqueta "Así se ve si…", mismo marco, se nota que es ilustrativa.

### Checklist del supervisor (por tramo)

1. **Lo que se dice, se ve** — cada cosa nombrada aparece en pantalla mientras se nombra.
2. **Se lee** — texto relevante nítido (medida objetiva + mirada) y sin tapar.
3. **Encuadre** — lo importante dentro y centrado; nada cortado en el borde.
4. **Ritmo** — sin silencios largos, esperas visibles ni cosas demasiado rápidas para entender.
5. **Continuidad** — sin saltos de cursor, paneles que quedan abiertos ni cortes bruscos.
6. **Contenido** — sin datos de prueba visibles, material con derechos ni nombres de personas no aprobados.
7. **Audio** — voz clara, música de fondo, -14 LUFS.
8. **Coherencia** — plan correcto (Avanzado marcado) y coincide con el manual.

**Rúbrica (anclas):** cada criterio vale 1 (cumple en todo el video, con evidencia), 0,5 (falla en
un tramo menor que no confunde) o 0 (falla en un tramo que confunde o se ve mal). Criterios
críticos: 1, 2, 3, 6 y 8 — tienen que valer 1. Ninguno puede valer menos de 0,5.

Severidad: **bloqueante** (se corrige sí o sí) o **mejora** (decide el editor). Método: cuadros
por paso (≥ 2/s, más el cuadro de cada palabra clave de la voz), la transcripción alineada del
tramo y la medida de nitidez.

**Escaneos automáticos** (antes de que mire el supervisor, porque mirando ~1–2 cuadros/s se
escapan): cuadros negros o en blanco, flashes y saltos bruscos entre cuadros consecutivos,
congelamientos largos sin voz, saltos del cursor, silencios y saturación del audio, LUFS, y
nitidez/agrandamiento efectivo por tramo. Salen en `revision-auto.json` y el supervisor los
confirma o descarta.

**Revisión anti-IA del guion** (la aplica el juez): frases que explican lo que la imagen ya
muestra, construcciones "no es X, es Y", listas de negaciones, vocabulario de IA, adjetivos de
relleno.

## 4b. Negocio de demo

Los tutoriales se graban en un **negocio de demo propio en producción** (decidido 2026-10-12), no
en el negocio de prueba: así no aparecen "prueba 2", productos de $1, fotos con derechos (el
Fortnite) ni nombres de clientes reales.

- **Alta:** la hace la persona (crear la cuenta y la contraseña son suyas). Nombre y rubro
  creíbles (p. ej. una remería), plan con **paquete Avanzado activo** para poder mostrarlo.
- **Datos:** un script de carga (`demo-datos/`) crea por el panel o la API, con la sesión de la
  persona y su permiso, categorías, productos con fotos con licencia, clientes y pedidos
  ficticios pero creíbles, mensajes y avisos. Deja un **manifiesto** de todo lo creado para poder
  limpiarlo o restaurarlo entre videos.
- **Antes de cada toma:** el director restaura el estado conocido del manifiesto (p. ej. que haya
  un mensaje sin leer si el guion lo necesita).
- Las grabaciones de "Cargar un producto" y "Conocé tu panel" v1 quedan como están; el piloto v2
  ya se graba en el negocio de demo.

## 4c. Ideas tomadas de proyectos existentes

Búsqueda del 2026-10-12. Ninguno hace exactamente esto (tutoriales de un panel real con login),
pero se adoptan estas piezas:

| Idea | De dónde | Licencia |
|---|---|---|
| Cada frase del guion con su prueba visible en pantalla; datos de demo sintéticos con manifiesto de limpieza; voz cacheada por frase; reporte voz + acciones en una línea de tiempo | [patrikherak/ai-demo-studio](https://github.com/patrikherak/ai-demo-studio) | MIT |
| Críticos de solo lectura que rechazan por defecto; espectador mudo que cuenta el mensaje desde los cuadros; revisión anti-IA del guion; escaneos de saltos/flashes/congelamientos | [salomonMuriel/media-production-skills](https://github.com/salomonMuriel/media-production-skills) | MIT |
| Revisor con puntajes 0–1 por dimensión, umbral y reintentos; versiones `v1…vN` | [poseljacob/agentic-video-editor](https://github.com/poseljacob/agentic-video-editor) | MIT |
| Corte de revisión 1080p y master 4K recién al aprobar (también usa HyperFrames) | [hub-ki/video-generation](https://github.com/hub-ki/video-generation) | MIT |
| "Lint" que predice esperas y congelamientos antes de grabar | [tandryukha/aidemo](https://github.com/tandryukha/aidemo) | MIT |
| Estado retomable con registro de decisiones y costos; chequeos de cuadros negros, overlays rotos, silencio y saturación | [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | AGPL-3.0: **solo ideas, no se copia código** |

Del código MIT se puede adaptar lo que sirva citando el origen; de OpenMontage, nada de código.

## 5. Preferencias de la persona

`.claude/skills/videos-tutoriales/referencia/preferencias.md` (commiteado). Lo leen guionista,
analista y juez siempre; editor y supervisor, la parte de estilo. Contenido inicial:

- **Voz:** ElevenLabs `8mBRP99B2Ng2QwsJMFQl`, tono original, sin indicaciones de tono exageradas; voseo rioplatense.
- **Música:** de fondo y baja (volumen 0,15), sin Content ID y con licencia guardada.
- **Ritmo:** sin silencios largos entre frases; ágil pero que se llegue a leer lo importante.
- **Lo que se nombra, se muestra** (real o recreación marcada); si no se puede, no se dice.
- **Alternativas antes del resultado:** primero los caminos (manual / con Orbi), al final "así queda" para ambos.
- **Paquete Avanzado** marcado y explicado; dejar claro qué hace Orbi y qué elige la persona (talles, precio, stock).
- **Contenido:** sin datos de prueba visibles ni material con derechos; si aparece, avisar antes de grabar.
- **Calidad:** nítido, 1440p, estilo Stripe/Linear.
- **Entrega:** `marketing/videos/<tipo>/`, versión completa + liviana para chat; render en la RTX con prioridad baja.

**Cómo crece:** cada corrección de la persona sobre un video se agrega al terminar, con fecha y
motivo; el juez la exige desde el video siguiente.

## 6. Piloto: "Conocé tu panel" v2

**Orden de trabajo:** (1) calidad de imagen → (2) agentes, guía y herramientas de revisión →
(3) negocio de demo (alta por la persona + carga de datos) → (4) piloto. El piloto no arranca sin
el negocio de demo cargado.

Corre el sistema completo, **en el negocio de demo**, y tiene que resolver:
1. **Los numeritos:** caso real (cámara al punto rojo y al número de Mensajes) o recreación marcada; la regla 1 del supervisor lo exige.
2. **El empleado:** recreación marcada "Así lo ve un Empleado" (menú real sin los módulos que no ve) + que el dueño los maneja desde Configuración → Equipo. **Antes**, verificar en el código qué módulos ve de verdad un Empleado y si el dueño puede habilitarlos uno por uno, para no afirmar algo falso.
3. **Orbi:** la cámara muestra el panel entero mientras se elige la pregunta, cómo queda escrita en la caja y el toque en Enviar; después la respuesta (tramo protegido).

## 7. Fuera de alcance

- Promos (reels/YouTube de marketing): siguen con `referencia/promo.md`; pueden adoptar los agentes después.
- Rehacer los tutoriales anteriores ("Cargar un producto"): solo si la persona lo pide.
- Workflows automáticos (`Workflow`): descartado por los pasos interactivos (login, permisos).

## 8. Piezas a construir o cambiar

- `herramientas/lib/grabador.mjs` (+ `sesion.mjs` si hace falta): captura 2880×1800 según la prueba.
- Placa intermedia de alta calidad (`compose/plate.html` + `render-promo.mjs`) y `placa-tramos.sh` (render en tramos con reintentos) al skill.
- `herramientas/lib/edicion.mjs`: modo ágil con `proteger` y tope de zoom según la resolución capturada.
- Proyecto HyperFrames de plantilla (hoy copiado a mano desde `cargar-producto-hf`): `armar.mjs` con `video.json`, gráficos nuevos (llamadas, barra de progreso, foco, subtítulos), soporte de recreaciones marcadas, borrador 1080p y final 4K → 1440p.
- Herramienta de revisión para el supervisor: cuadros por paso + transcripción alineada + nitidez, y los escaneos automáticos (`revision-auto.json`).
- Negocio de demo: guía de alta para la persona y `demo-datos/` (carga, manifiesto, restaurar, limpiar).
- `.claude/agents/` × 5, `referencia/preferencias.md`, sección nueva en `referencia/estilo.md`, checklist en `referencia/calidad.md`, flujo nuevo en `SKILL.md`.
- **Calibración de críticos** (`referencia/calibracion/`): "Conocé tu panel" v1 como **caso malo
  etiquetado** (numeritos sin mostrar, empleado sin mostrar, Orbi sin la caja, "prueba 2", Fortnite)
  + **defectos sembrados** (un zoom que falta, un silencio de 3 s, una frase sin prueba en
  pantalla, un panel que queda abierto). Un cambio a un agente crítico no se acepta si deja pasar
  alguno. Se corre cada vez que se toca un agente crítico.
