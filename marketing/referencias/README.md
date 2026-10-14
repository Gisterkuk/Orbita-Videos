# Referencias: videos que funcionan, para aprender de ellos

Acá se juntan videos ajenos que tienen muchas vistas (startups, editores, marcas) para encontrar
los **patrones** que les dan atención y después replicarlos en el contenido de Órbita.

## Cómo agregar referencias

1. Pegá la URL en [`urls.txt`](urls.txt), una por línea. Se puede dejar una nota con ` # `:
   ```
   https://www.instagram.com/reel/ABC123xyz/  # el gancho de texto arriba, transiciones con zoom
   ```
   También sirve la ruta de un video que ya tengas descargado.
2. Pedile a Claude "procesá las referencias", o corrélo vos:
   ```
   node marketing/referencias/descargar.mjs
   ```
   Solo baja las URLs nuevas. Con `--reanalizar` vuelve a generar el análisis de todas.

## Qué genera

| Dónde | Qué | ¿Se versiona? |
|---|---|---|
| `videos/<id>/video.mp4` | El video en la mejor calidad disponible | No (pesa y no es nuestro) |
| `videos/<id>/analisis/` | `gancho.png` (primeros 3 s, 6 cuadros por segundo), `hoja_NN.png` (2 cuadros por segundo con el tiempo), `espectro.png` (sonido) | No |
| [`fichas/<id>.md`](fichas/) | Autor, vistas, likes, comentarios, descripción, hashtags, duración, cortes y ritmo | Sí |
| [`catalogo.md`](catalogo.md) | Tabla de todas las referencias | Sí |

## Si Instagram pide iniciar sesión

Algunos reels solo se bajan con sesión iniciada. El script **no** lee las cookies del navegador por su
cuenta: exportá vos un `cookies.txt` (con una extensión tipo "Get cookies.txt LOCALLY", estando
logueado en Instagram, idealmente con una cuenta secundaria) y corré:

```
REFERENCIAS_COOKIES=C:\ruta\cookies.txt node marketing/referencias/descargar.mjs
```

El `cookies.txt` da acceso a tu cuenta: guardalo fuera del repo y no lo compartas.

## Para qué es (el plan)

1. **Juntar referencias** (esto).
2. **Encontrar patrones**: Claude mira las fichas y las imágenes de análisis de todas juntas y
   escribe `patrones.md` (ganchos, estructura, ritmo, texto en pantalla, sonido, cierre), con
   ejemplos de cada uno.
3. **Skill**: con los patrones confirmados, una skill que los aplique a videos de Órbita.
4. **Ideas en lote**: un `ideas.txt` con 100 ideas, producir los videos, filtrar los mejores y publicar.

Los videos ajenos son solo **referencia interna**: no se republican ni se usan sus partes.
