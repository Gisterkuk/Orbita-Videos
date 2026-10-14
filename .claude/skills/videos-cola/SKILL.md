---
name: videos-cola
description: "Usar cuando la persona pida que le generes N videos para la cola de aprobación de Órbita: 'generame 3 videos', 'reels para la cola', 'videos automáticos', 'llená la cola'. Produce reels de promo con la demo pública (sin login, sin tocar nada real), los renderiza en la computadora de la persona y los sube y registra por el conector de Órbita para que alguien los apruebe en Superadmin → Marketing → Videos. Nunca publica. Para tutoriales del panel real o videos a medida está videos-multiagente. Palabras clave: cola, generame videos, reels automáticos, aprobar, Marketing → Videos, conector, videos_registrar."
---

# Videos para la cola de aprobación (automatizados)

La persona dice **«generame 3 videos»**. Vos producís los videos en **su computadora**, los subís por el conector de
Órbita y quedan en **Superadmin → Marketing → Videos** para que una persona los apruebe o los rechace. Después se
descargan o se pasan como **borrador** a TikTok o Instagram. **Nada se publica solo y vos nunca publicás.**
El panorama completo (propósito, costos, controles) está en `docs/marketing/FLUJO-PROSPECCION-Y-VIDEOS.md` del repo de Órbita.

> Es la versión **sin supervisión paso a paso** de `videos-multiagente`: la puerta humana está al final (la aprobación
> de la cola), no antes de grabar. Por eso es más estricta con lo que se puede producir (solo la demo pública) y con
> los controles automáticos. Para un tutorial del panel real, un video a medida o algo que necesite música elegida a
> oído, usá `videos-multiagente`.

## Antes de empezar
1. **El conector.** Tienen que estar las herramientas `videos_listar`, `videos_pedir_subida` y `videos_registrar`
   (el conector «Órbita», el mismo de la prospección). Si no están, decile a la persona cómo agregarlo (Claude →
   Configuración → Conectores → «Agregar conector personalizado», dirección `https://api.orbita.site/api/v1/mcp/prospeccion`,
   y autorizar con su cuenta de la organización) y **frená**: no hay forma de seguir sin él.
2. **Leé** `marketing/CONTEXTO.md` y `marketing/CLAUDE.md` (qué se puede decir, qué no) y `marketing/guiones/banco-de-ganchos.md`.
3. **Mirá la cola** con `videos_listar`: títulos y ganchos ya hechos (no repetir) y cuántos esperan revisión. La cola
   admite 20 entre subiendo y pendientes; si está llena, avisá y no sigas.
4. **Confirmá UNA vez, en un solo mensaje, y después trabajá sin interrumpir:**
   - cuántos (de 1 a 5 por tanda; si piden más, de a 5);
   - tema o ángulo (o «proponé vos»: variá rubro, gancho y función entre videos);
   - la voz (la que elija la persona; `referencia/voz-y-musica.md`) y el costo estimado de la voz de la tanda;
   - la música: solo una pista ya aprobada en `marketing/recursos/musica/LICENCIAS.md`. Vos no podés escuchar: si
     no hay ninguna aprobada, **hacé el video sin música**, no elijas una por tu cuenta.
   Esa confirmación es el permiso para gastar voz de esta tanda y para subir a la cola; no gastes más que lo confirmado.

## Qué se produce (y qué no)
- **Reel de promo 9:16, 25–35 s**, con la estructura de `marketing/guiones/plantilla-reel.md` (gancho, problema,
  solución, cierre «Tu negocio, en órbita.» + `orbita.site`), armado con `videos-multiagente/referencia/promo.md` y su
  `ejemplo-promo/` (compositor `promo.html`, `lib/promo.mjs`, voz primero, HyperFrames en `marketing/hyperframes-reel/`).
- **Pantallas: solo la demo pública** (`demo.orbita.site`): sin login, sin datos reales, sin escrituras. Nada de
  panel real, perfil de sesión ni contraseñas.
- **Solo funciones que existen hoy**, verificadas en `apps/web/src/modules/ventas/panel/manual/contenido.ts` o en la
  demo (el código de Órbita está en `orbita.config.json` → `codigoOrbita`). Lo de pago va marcado («Paquete Avanzado»).
- **Sin nombrar competidores. Sin cifras, clientes, casos ni testimonios inventados.** Sin «este mes» ni vencimientos.
  Casos de clientes reales, solo con permiso expreso.
- **Guion con jueces.** Antes de gastar voz ni render, el guion pasa por los agentes `juez-guion` (claridad y
  adversarial, como en `videos-multiagente/referencia/produccion.md`). Si lo rechazan, corregilo (hasta 2 rondas);
  si sigue rechazado, descartá ese video y decilo en el informe.

## Por cada video
1. **Idea y guion** (con el molde de gancho que toque; que no repita lo que ya está en la cola) → jueces.
2. **Voz** (`tts.mjs` + `limpiar-voz.mjs` + `tramos-voz.mjs`, como en `promo.md`) con la voz confirmada.
3. **Edición y render** del reel (`editar-reel.mjs` del ejemplo, `qa/huecos.mjs`, `mezclar-promo.mjs`, `render.mjs`).
4. **Dejarlo en el formato de la cola:**
   ```
   node .claude/skills/videos-cola/herramientas/preparar.mjs <render.mp4> <listo.mp4> --max-mb 45
   ```
   (H.264 + AAC, índice al principio y menos de 45 MB; si ya cumple, no lo recomprime.)
5. **Controles de calidad:**
   ```
   node .claude/skills/videos-cola/herramientas/controles.mjs <listo.mp4> --formato REEL_9_16
   ```
   Devuelve `[{ nombre, ok, detalle }]`: formato, duración, peso, volumen (−17,5 a −12,5 LUFS, pico ≤ −1 dBFS),
   silencios, tramos en negro e imagen congelada. Si falla **formato, duración o peso**, arreglalo (hasta 2 intentos) y
   si no se puede, **no lo subas**: descartalo y contalo. Si falla otro control, arreglalo si podés; si no, subilo igual
   **con el control fallado a la vista**: el panel lo marca para que la persona lo mire con atención.
6. **Subir y registrar:**
   1. `videos_pedir_subida` con `bytes` = el tamaño exacto del `listo.mp4` → devuelve `videoId` y `uploadUrl`.
   2. `node .claude/skills/videos-cola/herramientas/subir.mjs <listo.mp4> "<uploadUrl>"` (la dirección es una
      credencial de 10 minutos: no la pegues en ningún archivo ni la repitas en el informe).
   3. `videos_registrar` con `video` (el videoId), `titulo` (≤ 120, corto y descriptivo), `formato`, `guion` (la voz,
      una frase por línea), `caption` (el texto para la publicación, con 3–5 hashtags, ≤ 2200, voseo, sin competidores),
      `duracionSeg` y `controles` (lo que devolvió `controles.mjs`).
   Si el almacenamiento rechaza la subida (venció la dirección), pedí una nueva; la reserva vieja se borra sola.
   Si el conector dice que **la cola está llena**, frená y avisá: hay que revisar la cola antes de generar más.

## Cuando termina la tanda
Informá en un solo mensaje, corto: cuántos subiste y cuántos descartaste (con el motivo), el título y el id de cada uno,
qué controles fallaron, **lo que gastaste en voz** y cuánto queda por revisar. Recordá dónde se aprueban:
**Superadmin → Marketing → Videos** (`orbita.site/superadmin?seccion=marketing`). **No digas que está publicado**:
quedó en la cola, esperando a una persona.

## Reglas que no se negocian
1. **No publicar, no contactar, no borrar de la cola.** El conector no tiene esas herramientas y no hay que buscarles la vuelta.
2. **Nada de claves ni de direcciones de subida en el repo** (es **público**). Las claves de voz las pasa la persona por
   variable de entorno; no las busques en `.env` ni las guardes.
3. **Los videos no se commitean** (ya están en `.gitignore`); trabajá en `~/orbita-videos/cola/<fecha>_<slug>/`.
4. **No gastar voz ni cupo sin lo confirmado** al inicio de la tanda.
5. **Si dudás de que algo sea verdad** (una función, un precio, un dato), no lo digas en el video: sacalo.

## Herramientas y tests
`herramientas/preparar.mjs`, `controles.mjs`, `subir.mjs` y `ffmpeg.mjs` (necesitan ffmpeg: el del kit de
`~/orbita-videos/kit` o el del sistema, o la variable `FFMPEG`). Tests: `cd .claude/skills/videos-cola && node --test herramientas/test/cola.test.mjs`
(en Node 20 hay que pasar el archivo; el patrón con `*` anda desde Node 21).

## Referencias
- `referencia/voz-y-musica.md` — qué decidir de voz y música, y qué no hacer sin la persona.
- `docs/marketing/FLUJO-PROSPECCION-Y-VIDEOS.md` del repo de Órbita — para qué existe todo esto, cómo funciona, costos y controles.
- `videos-multiagente/referencia/promo.md`, `calidad.md`, `produccion.md` — la producción de promos y sus criterios.
