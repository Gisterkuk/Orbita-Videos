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
  escribe en producción, ni se gasta voz o cupo de Orbi, sin permiso de la persona; claves y datos
  personales nunca entran a este repo (es **público**).
- Tests de las herramientas: `cd .claude/skills/videos-multiagente && node --test "herramientas/test/*.test.mjs"`.
- El skill simple (`videos-tutoriales`, un solo agente) sigue en el repo de Órbita.
