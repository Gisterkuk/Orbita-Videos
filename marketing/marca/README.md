# Marca

Resumen de la identidad para piezas de marketing. La especificación visual completa de los
videos (escena, intro, cierre, cursor, carteles) está en
`.claude/skills/videos-tutoriales/referencia/estilo.md`.

## Colores

| Uso | Valor |
|---|---|
| Fondo de marca (degradé 158°) | `#0C1A3D` → `#0A1432` → `#060B1E` |
| Azul principal | `#2563EB` |
| Azul claro (acentos, arco del logo) | `#3B82F6` |
| Texto oscuro / centro del logo | `#0F172A` |
| Píldora (fondo / texto) | `#EFF6FF` / `#1D4ED8` |

## Tipografías

- **Geist** — texto de interfaz y cuerpo.
- **Sora** — títulos de video.

Los archivos `.woff2` están en `apps/web/public/fonts/`. Para edición de video, copiar a
[`../recursos/tipografias/`](../recursos/tipografias/) si hace falta instalarlas.

## Logo

El logo del loader está definido en código en `apps/web/src/components/PageLoader.tsx` y hay un
`logo.svg` en `apps/web/public/`. Guardar acá, en [`logos/`](logos/), las versiones listas para
usar en piezas (fondo claro, fondo oscuro, solo ícono).

## Tono de voz

- Español rioplatense, voseo, frases cortas.
- Cercano y directo; hablarle al dueño del comercio, no a un técnico.
- Mostrar el resultado concreto ("tu tienda lista para vender") antes que la función.
- Sin superlativos vacíos ni promesas que no se puedan sostener.
- Detalle de qué decir y qué evitar: [`../CONTEXTO.md`](../CONTEXTO.md).
