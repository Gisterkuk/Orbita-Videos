---
name: videos-multiagente
description: "Usar cuando la persona pida un video de Órbita (tutorial del panel o de la tienda, o promo) hecho con agentes: guionista, analista, jueces del guion, editor y supervisores críticos que rechazan; o cuando pida calidad profesional (captura 2880×1800, render 4K, entrega 1440p, estilo demo de producto Stripe/Linear), el negocio de demo, o diga /videos-multiagente, 'multiagente', 'con agentes', 'con críticos'. Para un video rápido sin agentes está el skill videos-tutoriales. Palabras clave: multiagente, agentes, guionista, supervisor, juez, crítico, espectador mudo, calidad 4K, HyperFrames, desenfoque, negocio de demo."
---

# Videos de Órbita con agentes (multiagente)

> Versión multiagente del skill `videos-tutoriales` (que sigue existiendo tal cual para videos rápidos sin agentes).
> Este skill tiene sus propias herramientas (`herramientas/`, con tests) y referencias; los agentes viven en `.claude/agents/`.
> Vive en el repo **Orbita-Videos**, aparte del código: el código de Órbita está en `orbita.config.json` → `codigoOrbita`
> (las rutas `apps/...` de este skill son relativas a esa carpeta, y `graphify query` se corre ahí).

Videos de 1080p60 que muestran una operación **real** del panel: el panel aparece dentro
de una **ventana de navegador simulada que flota como en un escritorio** sobre el fondo
azul de marca con anillos orbitales; arranca y cierra con el **logo del loader**; la
cámara hace **zoom suave** a cada campo; un **cursor** dibujado con anillo en cada clic;
**carteles numerados** por paso que no tapan los clics; **resaltados** para explicar
bloques; **efectos de sonido** sintetizados; y opcionalmente **voz en off rioplatense**
(Gemini TTS). La especificación completa está en `referencia/estilo.md`; todo ya está
implementado en `herramientas/` y en el ejemplo `ejemplo-cargar-producto/`.

**Principio:** no reinventar. Copiar el ejemplo, adaptarlo a la nueva operación y usar
las herramientas tal cual: cada una resuelve un problema que ya falló (ver
`referencia/tecnica.md`). No usar Remotion, `gdigrab`, `recordVideo` de Playwright,
transformaciones CSS para el zoom ni `mouse.wheel` para el scroll.

## Reglas que no se negocian
1. **Contraseñas**: nunca escribirlas en producción, aunque las pasen. `herramientas/login.mjs` abre una ventana visible y **la persona** entra.
2. **Sesión**: solo el perfil persistente `~/orbita-videos/perfil` (lo maneja `lib/sesion.mjs`). Nunca `storageState` ni copias de cookies (el refresh token rota y se revocan TODAS las sesiones). Un solo navegador con el perfil a la vez.
3. **Datos de producción**: primero `ENSAYO=1` (bloquea escrituras). La toma real crea solo lo que la persona aprobó; borrar algo, solo con su permiso explícito y por el panel. Informar ids creados/borrados y la IA consumida.
4. **Claves** (Gemini u otras): pedir dónde están; no buscarlas en `.env` por tu cuenta.
5. **Flujo real**: solo pantallas capturadas en vivo. Única excepción: el diálogo "Abrir" de Windows 11 (el headless no muestra el nativo) — avisarlo.
6. **Aprobación antes de grabar**: estilo, guion de pasos y datos de ejemplo confirmados.

## Preguntas antes de empezar (una ronda, con opciones)
- Operación exacta y punto de partida/final (¿termina mostrando la tienda?).
- Datos de ejemplo (nombres, precios, archivos a subir: ¿los pasa la persona? ¿derechos?).
- Qué queda creado en producción y qué hacer después (dejar, despublicar, borrar) — o grabar en local.
- ¿Explicar campos opcionales con resaltados? ¿Pasos extra (p. ej. crear la categoría antes)?
- ¿Hay funciones de un paquete pago en el flujo (ver `referencia/planes.md`)? El tutorial enseña el plan base completo; lo pago va al final como bonus marcado con llamado a la acción, y opcionalmente un corte corto aparte para marketing (`E.escribir({ nombre })`).
- ¿Hay más de una forma de hacerlo dentro del mismo plan? Mostrar primero la rápida y separar con placas de capítulo (`E.capitulo`).
- Versión sin voz, con voz o ambas; voz de hombre o mujer; dónde está la clave de Gemini.
El resto ya está decidido por `referencia/estilo.md` (formato, colores, cámara, sonido, ritmo): no volver a preguntarlo salvo que la persona quiera cambiarlo.

## Producción con agentes (tutoriales: el camino por defecto desde 2026-10-12)
Los tutoriales se producen con 5 roles (6 agentes) de `.claude/agents/`: **guionista** → **analista**
→ **dos jueces independientes** (claridad y adversarial) → **editor** → **supervisor** + **espectador
mudo** (y dos supervisores en el corte final). Los críticos son duros a propósito: rechazan por
defecto, exigen evidencia y no ven el razonamiento del autor. Vos sos el **director**: encadenás,
pedís permiso a la persona para lo que toca producción o cuesta plata, y llevás
`produccion/estado.md`. Etapas, rondas y qué lee cada uno: `referencia/produccion.md`.

Calidad que exige el sistema: captura 2880×1800 (`abrirSesion({ dpr: 2 })` fuerza la densidad),
placa casi sin pérdida (`render-placa.mjs` / `placa-tramos.sh`), zoom ≤ 1,6, borradores 1080p y
final 4K entregado en 1440p (`<slug>-hf`: `npm run render-borrador | render-final | entregar`).
Gráficos: llamadas, foco, barra de progreso y recreaciones marcadas (`referencia/estilo.md` §
Edición estilo demo de producto). Preferencias de la persona: `referencia/preferencias.md`.
Si se toca un agente crítico, correr la calibración (`referencia/calibracion/`).

## Flujo de trabajo (herramientas paso a paso; el editor y el director lo usan por dentro)
Rutas relativas a la carpeta del video (`cd ~/orbita-videos/<slug>`), salvo `preparar`.
1. `node .claude/skills/videos-multiagente/herramientas/preparar.mjs <slug>` → crea la carpeta con herramientas, compositor y la plantilla del ejemplo (la primera vez instala el kit).
2. `node herramientas/login.mjs` en segundo plano y pedirle a la persona que entre (si la sesión ya está activa, `recon.mjs` lo confirma).
3. Reconocimiento: leer el código de la pantalla (`apps/web/src/modules/…`) y su tema en `manual/contenido.ts`; `MSYS_NO_PATHCONV=1 node herramientas/recon.mjs <ruta> <nombre> --clic "Texto"`.
4. Proponer guion: pasos, carteles, qué se resalta, qué se crea. Esperar el ok.
5. Adaptar `grabar.mjs` (marcas `mark()` por paso, `foco()` en lo que la cámara mira, `hl()` en bloques a explicar, `esperar()` en esperas a la app, `scrollHasta()` para scroll). `ENSAYO=1 node grabar.mjs ensayo1` y revisar con `node herramientas/cuadro.mjs ensayo1 <t…>` hasta que salga limpio.
6. Toma real: `node grabar.mjs toma1` (+ toma corta de cierre si algo termina en segundo plano: `grabar-lista.mjs`).
7. `node herramientas/scrolls.mjs toma1` → adaptar `editar.mjs` (clips, cámara, carteles, resaltados, sonidos propios) → `node editar.mjs` → `node herramientas/preview.mjs <t…>` hasta que cada cuadro clave esté bien.
8. `node herramientas/sfx.mjs` → `node herramientas/render.mjs out/<slug>-sin-voz.mp4` → control de calidad (`referencia/calidad.md`).
9. Voz: adaptar `guion.json` (una frase por paso, voseo, sin instrucciones de estilo) → `GEMINI_KEY_FILE=<ruta> node herramientas/tts.mjs` → `node herramientas/limpiar-voz.mjs` → `node editar.mjs --voz voz.json` → `node herramientas/sfx.mjs out/sfx-voz.json` → `node herramientas/mezclar-voz.mjs` → `TL=compose/tl-voz.json WAV=out/audio-voz.wav node herramientas/render.mjs out/<slug>-con-voz.mp4` → calidad.
10. Copiar a `marketing/videos/<tipo>/` del repo (tutoriales, reels, youtube o anuncios; nombre `AAAA-MM-DD_slug_formato.mp4`; sin commitear, ya está en `.gitignore`), mandarlo con SendUserFile y reportar según `referencia/calidad.md`.
11. Si el video es un TUTORIAL de la lista (o la persona pide dejarlo en la cola), subirlo por el conector de Órbita como tipo `TUTORIAL` con el campo `tutorial` del ítem de la lista y marcar antes el ítem como EN_PROCESO: ver `videos-cola` § Tutoriales (`tutoriales_listar`, `tutoriales_actualizar`, `videos_pedir_subida`, `videos_registrar`, `videos_avisar`). Es interno: no se publica en redes.

Renders largos (~5 min) y tomas: en segundo plano. Nunca cortar con `| head` un script que escribe al final.

## Promos (reel / YouTube / anuncio)
Si el video es para **vender** (mostrar en 30–70 s todo lo que hace Órbita) y no para
enseñar una operación: seguí `referencia/promo.md` y el ejemplo `ejemplo-promo/`
(montaje de planos de la demo pública, voz primero, ganchos A/B, música elegida por la
persona y sin Content ID, compositor `compose/promo.html`, `lib/promo.mjs`,
`beats.mjs`, `mezclar-promo.mjs`, `qa/huecos.mjs`). Las reglas de arriba valen igual.
Pedido tipo:
```
/videos-multiagente Hacé un reel (9:16, ~30 s) y un video para YouTube (16:9, ~1 min)
para atraer clientes, con el estilo de la promo de Órbita, mostrando <qué>. Usá la demo
pública. Gancho: <idea o "proponeme 2–3">. Música: proponeme 3 de Pixabay sin Content ID.
Preguntame lo que necesites antes de grabar.
```

## Cómo pedirlo (para las personas del equipo)
```
/videos-multiagente Hacé un video tutorial de cómo <operación> en el panel de Órbita,
con el mismo estilo que el de "cargar producto". Empezá en <pantalla inicial> y terminá
en <resultado / cómo lo ve el cliente>. Datos de ejemplo: <…>. En producción puede
quedar creado <…> (o: grabalo en local). Explicá con resaltados <campos opcionales>.
Quiero versión sin voz y con voz (hombre). La clave de Gemini está en <ruta>.
Preguntame lo que necesites antes de grabar.
```

## Errores comunes
- Arrancar a grabar sin ensayo, o publicar en el ensayo → duplicados en producción.
- Cambiar textos de carteles largos (> 30/55 caracteres) → la píldora tapa contenido.
- Olvidar `scrolls.mjs` después de una toma nueva → el scroll vuelve a verse trabado.
- Mandar "estilo" en el texto del TTS → lo lee en voz alta.
- Entregar sin medir temblor/scroll/audio.
Detalle de causas y arreglos: `referencia/tecnica.md`.

## Referencias
- `referencia/estilo.md` — especificación visual y sonora completa (escena, intro, cámara, cursor, carteles, resaltados, diálogo, ritmo, efectos, voz).
- `referencia/tecnica.md` — cómo funciona la cadena, problemas conocidos y arreglos, datos de producción, estructura de carpetas.
- `referencia/calidad.md` — controles con umbrales y qué reportar.
- `referencia/produccion.md` — producción con agentes: etapas, rondas, qué lee cada agente, `estado.md`.
- `referencia/preferencias.md` — preferencias de la persona (las exige el juez) y su historial.
- `referencia/calibracion/` — caso malo etiquetado (v1 de "Conocé tu panel") y defectos sembrados para probar a los críticos.
- `referencia/planes.md` — qué es del plan base y qué del paquete Avanzado, y cómo armar el video según eso.
- `ejemplo-cargar-producto/` — el video "Cómo cargar un producto" completo (grabar, lista, editar, guion): la plantilla.
- `referencia/promo.md` + `ejemplo-promo/` — promos: reel 9:16 con ganchos A/B y versión 16:9 sobre la demo pública.
