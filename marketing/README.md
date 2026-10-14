# Marketing de Órbita

Área de trabajo para todo lo que sea **video, reels, anuncios y contenido** de Órbita. Desde el
2026-10-13 vive en el repo **Orbita-Videos**, aparte del código del producto (que está en la ruta
`codigoOrbita` de `orbita.config.json`, en la raíz de este repo).

> Si sos nuevo en esto: empezá por [`CONTEXTO.md`](CONTEXTO.md) (qué vendemos y a quién) y
> después mirá "Cómo trabajar" más abajo. No hace falta saber editar video: las herramientas
> hacen el trabajo pesado.

## Mapa de carpetas

| Carpeta | Para qué sirve |
|---|---|
| [`CONTEXTO.md`](CONTEXTO.md) | Qué es Órbita, para quién, propuesta de valor, planes, qué se puede y qué no se puede decir. |
| [`CLAUDE.md`](CLAUDE.md) | Reglas para Claude cuando trabaja acá (se carga solo). |
| [`marca/`](marca/) | Identidad: colores, tipografías, tono de voz, logos. |
| [`recursos/`](recursos/) | Materia prima: música, efectos de sonido, imágenes, capturas, tipografías. |
| [`guiones/`](guiones/) | Plantillas y guiones de cada pieza (reel, tutorial, anuncio). |
| [`referencias/`](referencias/) | Videos ajenos que funcionan: pegás URLs en `urls.txt`, se descargan y se analizan para encontrar patrones. |
| [`ideas/`](ideas/) | Banco de ideas y calendario de contenido. |
| [`skills/`](skills/) | Notas sobre las skills de Claude que se usan para marketing (y borradores de skills nuevas). |
| [`hyperframes-lab/`](hyperframes-lab/) | Laboratorio de **HyperFrames** (video a partir de HTML + GSAP). Ver su `CLAUDE.md`. `npm run dev` / `check` / `render`. |
| [`hyperframes-reel/`](hyperframes-reel/) | Versión **9:16** del hook (reel), con los mismos tiempos y el mismo `sfx.wav` que `hyperframes-lab/`. El gancho de arriba es el `<div id="gancho">`. |
| [`videos/`](videos/) | **Entregas finales** ya renderizadas, ordenadas por tipo. |
| `_trabajo/` | Borradores y archivos temporales. No se versiona. |

## Cómo trabajar

1. **Idea** → anotala en [`ideas/banco-de-ideas.md`](ideas/banco-de-ideas.md).
2. **Guion** → copiá una plantilla de [`guiones/`](guiones/) y completala (o pedile a Claude que proponga).
3. **Producción** → pedile a Claude que use la skill `videos-tutoriales` (tutoriales con pantallas
   reales y promos/reels). Trabaja en `~/orbita-videos/<slug>/` (fuera del repo, por el tamaño de
   las grabaciones y porque ahí vive el perfil de sesión del panel).
4. **Entrega** → el `.mp4` final se copia a `videos/<tipo>/` con el nombre `AAAA-MM-DD_slug_formato.mp4`
   (por ejemplo `2026-10-07_cargar-producto_16x9.mp4`).
5. **Publicación** → registrala en [`ideas/calendario.md`](ideas/calendario.md).

Pedido tipo para Claude (ver más ejemplos en el `SKILL.md` de `videos-tutoriales`):

```
/videos-tutoriales Hacé un reel (9:16, ~30 s) para atraer clientes, mostrando <qué>.
Usá la demo pública. Gancho: proponeme 2–3. Música: proponeme 3 de Pixabay sin Content ID.
Preguntame lo que necesites antes de grabar.
```

## Qué se versiona y qué no

- **Sí**: documentos, guiones, plantillas, logos y fuentes pequeñas.
- **No** (`.gitignore`): videos (`.mp4`, `.mov`, `.webm`…), audio (`.wav`, `.mp3`…) y `_trabajo/`.
  Pesan mucho y la música tiene licencia propia. Los videos finales se comparten por Drive u otro
  lugar; en `ideas/calendario.md` queda el link.
