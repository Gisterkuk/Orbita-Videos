# Skills para marketing

Las skills de Claude que se usan en esta área. Las que están en `.claude/skills/` (raíz del repo)
son compartidas por todo el equipo y Claude las descubre solo.

## Disponibles hoy

| Skill | Para qué |
|---|---|
| `videos-tutoriales` (`.claude/skills/`) | Tutoriales con pantallas reales, reels y promos con voz en off, música y efectos. **La principal.** |
| `brand` | Voz de marca, mensajes, consistencia. |
| `banner-design` | Banners y piezas estáticas para redes, anuncios y web. |
| `design` | Logos, identidad, fotos para redes, presentaciones. |
| `slides` | Presentaciones HTML. |
| `ui-ux-pro-max` | Si la pieza es una página (landing, plantilla de home). Obligatoria en tareas de UI de `apps/web/`. |

## Cómo sumar una skill nueva de marketing

1. Borrador acá: `marketing/skills/<nombre>/SKILL.md` (con `name` y `description` en el encabezado).
2. Probarla pidiéndole a Claude que la lea y la siga.
3. Cuando funcione bien, **moverla** a `.claude/skills/<nombre>/` para que Claude la detecte sola.

Ideas de skills que podrían salir de este trabajo: calendario de contenido semanal, adaptación de
un guion a varios formatos (reel / short / story), checklist de revisión antes de publicar,
generación de textos para anuncios (títulos y descripciones con variantes A/B).
