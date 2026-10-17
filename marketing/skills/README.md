# Skills para marketing

Las skills de Claude que se usan en esta área. Las que están en `.claude/skills/` (raíz del repo)
son compartidas por todo el equipo y Claude las descubre solo.

## Disponibles hoy

| Skill | Para qué |
|---|---|
| `analizar-reel` (`.claude/skills/`) | Le pasás el link de un reel (Instagram, TikTok, YouTube) y lo baja, lo mira cuadro por cuadro y te entrega todo lo bueno para replicarlo. Uso: `/analizar-reel <link>`. |
| `videos-tutoriales` (`.claude/skills/`) | Tutoriales con pantallas reales, reels y promos con voz en off, música y efectos. **La principal.** |
| `brand` | Voz de marca, mensajes, consistencia. |
| `banner-design` | Banners y piezas estáticas para redes, anuncios y web. |
| `design` | Logos, identidad, fotos para redes, presentaciones. |
| `slides` | Presentaciones HTML. |
| `ui-ux-pro-max` | Si la pieza es una página (landing, plantilla de home). Obligatoria en tareas de UI de `apps/web/`. |

## Cómo funcionan las skills

Una skill es una **carpeta con instrucciones** que Claude lee cuando hace falta, para hacer una tarea
siempre de la misma manera. No es un programa: es un procedimiento escrito, con herramientas opcionales.

- **Qué tiene:** un `SKILL.md` con un encabezado (`name` y `description`) y el paso a paso. Puede traer
  archivos de apoyo (plantillas, scripts) que se leen solo si se necesitan.
- **Cómo se activa:**
  1. **Por nombre:** escribís `/analizar-reel <link>` y Claude carga esa skill.
  2. **Sola:** Claude ve la `description` de todas las skills y carga la que coincide con lo que pedís
     (por ejemplo, si pegás un link de Instagram y preguntás "¿por qué es tan bueno?").
- **Por qué la `description` importa:** es lo único que Claude ve de la skill antes de cargarla. Tiene que
  decir **cuándo** usarla, con las palabras que usarías vos.
- **Dónde viven:** las de `.claude/skills/` (raíz del repo) las ve todo el equipo y se detectan solas.
  Las de `~/.claude/skills/` son personales.
- **Cómo se corrigen:** si Claude hace algo distinto de lo que querés, se edita el `SKILL.md` (una regla
  más, un error común más) y la próxima vez lo sigue. Los cambios se ven en una conversación nueva.

## Cómo sumar una skill nueva de marketing

1. Borrador acá: `marketing/skills/<nombre>/SKILL.md` (con `name` y `description` en el encabezado).
2. Probarla pidiéndole a Claude que la lea y la siga.
3. Cuando funcione bien, **moverla** a `.claude/skills/<nombre>/` para que Claude la detecte sola.

Ideas de skills que podrían salir de este trabajo: calendario de contenido semanal, adaptación de
un guion a varios formatos (reel / short / story), checklist de revisión antes de publicar,
generación de textos para anuncios (títulos y descripciones con variantes A/B).
