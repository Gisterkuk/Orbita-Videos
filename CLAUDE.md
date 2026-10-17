# Órbita — videos (repo aparte del código)

Este repo tiene la producción de videos de Órbita (tutoriales del panel y promos) con el flujo
**multiagente**: el skill `.claude/skills/videos-multiagente/` (el director) y los agentes de
`.claude/agents/` (guionista, analista, jueces, editor, supervisores, espectador mudo).

- **El código de Órbita no está acá.** Vive en otro repo; su ruta está en `orbita.config.json`
  (`codigoOrbita`, o la variable `ORBITA_REPO`). Para leer código de la app o correr
  `graphify query`, usá esa carpeta como cwd. Nunca edites el repo de Órbita desde acá.
- **Los proyectos de cada video** (tomas, renders, voz) viven en `~/orbita-videos/<slug>` (fuera
  del repo: pesan GB). Acá van solo herramientas, agentes, referencias, specs y planes.
- **Reglas que no se negocian** (detalle en el SKILL.md): nunca escribir contraseñas; sesión solo
  con el perfil persistente `~/orbita-videos/perfil`; ensayo antes de la toma real; nada se
  escribe en producción, ni se gasta voz o cupo de Orbi, **fuera de la autorización permanente**
  (`.claude/skills/videos-multiagente/referencia/decisiones.md`: el director decide solo dentro de esos
  topes y entrega un informe por video); claves y datos personales nunca entran a este repo (es **público**).
- **Videos automáticos para la cola de aprobación de Órbita:** skill `.claude/skills/videos-cola/` («generame N videos»:
  reels con la demo pública, renderizados acá y subidos por el conector de Órbita; los aprueba una persona en el superadmin y
  nunca se publican solos). Para qué sirve todo el sistema (prospección + videos), cómo funciona, costos y controles:
  `docs/marketing/FLUJO-PROSPECCION-Y-VIDEOS.md` del repo de Órbita.
- Tests de las herramientas: `cd .claude/skills/videos-multiagente && node --test "herramientas/test/*.test.mjs"` (y los de la cola, en `.claude/skills/videos-cola`, con `node --test herramientas/test/cola.test.mjs`; en Node 20 el patrón con `*` no se expande).
- `marketing/`: el área de marketing (contexto de marca, guiones, ideas, laboratorios de HyperFrames y
  entregas en `marketing/videos/`, que no se versionan). Leé `marketing/CLAUDE.md` antes de trabajar ahí.
- El skill simple (`videos-tutoriales`, un solo agente) sigue en el repo de Órbita.
