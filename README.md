# Órbita · Videos

Herramientas y agentes para producir los videos tutoriales y promos de [Órbita](https://www.orbita.site)
con pantallas reales del panel: captura a 2880×1800, edición con cámara y carteles, voz en off,
render en 4K con HyperFrames y entrega en 1440p.

El flujo es **multiagente** (Claude Code): un guionista escribe el guion, un analista y dos jueces lo
critican, un editor arma el video y supervisores independientes lo rechazan hasta que cumple la
rúbrica. Ver `.claude/skills/videos-multiagente/SKILL.md` y el diseño en `docs/superpowers/specs/`.

## Uso
1. Abrí este repo con Claude Code.
2. Revisá `orbita.config.json`: `codigoOrbita` apunta al repo del código de Órbita.
3. Pedí: `/videos-multiagente Hacé un video tutorial de cómo <operación> en el panel de Órbita…`

Los proyectos de cada video se crean en `~/orbita-videos/<slug>` (fuera del repo).

## Tests
```bash
cd .claude/skills/videos-multiagente && node --test "herramientas/test/*.test.mjs"
```

Fotos de demo: Unsplash (ver `herramientas/demo-datos/fotos/LICENCIAS.md`). Fuentes Geist y Sora (OFL).
