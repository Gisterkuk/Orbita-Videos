---
name: analizar-reel
description: Usar cuando la persona pase el link de un reel, short o video de Instagram, TikTok o YouTube (o escriba /analizar-reel <link>) para saber por qué funciona y cómo replicarlo en Órbita. Palabras clave: analizar reel, referencia, qué tiene de bueno, por qué es tan bueno, cómo replicarlo, cosas buenas, cuadro por cuadro, segundo por segundo.
---

# Analizar un reel de referencia

Con solo el link, bajás el video, lo mirás cuadro por cuadro y entregás **todo lo bueno que tiene, ordenado
para replicarlo en Órbita**. No hace falta que la persona descargue nada.

## Pasos

1. **Link.** Tomá la URL del pedido (si falta, pedila). Instagram `/reels/<código>/` equivale a `/reel/<código>/`.
2. **Bajar y preparar.** Sumá la URL al final de `marketing/referencias/urls.txt` con una nota
   (` # por qué se analiza`) y corré desde la raíz del repo: `node marketing/referencias/descargar.mjs`.
   Solo baja lo nuevo. Si la URL ya estaba procesada, no repitas: usá lo que hay (o `--reanalizar`).
   - Si falla con "pide iniciar sesión": explicá la opción del `cookies.txt` de `marketing/referencias/README.md`
     y esperá. **Nunca** leas cookies del navegador ni uses la cuenta de la persona por tu cuenta.
   - Falta `yt-dlp` o `ffmpeg`: decile qué instalar, no lo instales sin avisar.
3. **Mirar de verdad.** Leé `marketing/referencias/fichas/<id>.md` (transcripción, pausas, cortes, ritmo) y **todas**
   las imágenes de `marketing/referencias/videos/<id>/analisis/`: `gancho.png` y cada `hoja_NN.png`.
   No resumas desde la ficha sola: lo visual sale de los cuadros.
4. **Escribir el análisis** con [`plantilla-cosas-buenas.md`](plantilla-cosas-buenas.md) en
   `marketing/referencias/cosas-buenas/<id>.md`: tabla segundo por segundo, por qué funciona y cómo replicarlo.
5. **Completar la ficha:** reemplazá "Patrones observados" de `fichas/<id>.md` con 5–8 líneas.
6. **Cerrar en el chat** con lo esencial (los 5 hallazgos más fuertes y el esqueleto para Órbita) y la ruta del archivo.

## Verdades que no se negocian

- **Decí lo que no pudiste ver.** No se oye el audio (música y efectos): escribilo así en el archivo.
  Si las vistas no están disponibles, no digas que "es viral": decí que está bien hecho y qué métricas hay.
- **Es solo referencia interna.** Se aprende el patrón; no se copian escenas, textos, fotos ni diseños.
- **Datos de demo ajenos no se copian como cifras de Órbita.** Nada de números, clientes o casos inventados.
- **Adaptar a las reglas de marketing** (`marketing/CLAUDE.md` y `marketing/CONTEXTO.md`): español rioplatense con
  voseo, sin nombrar competidores, sin prometer funciones que no existen, lo de pago rotulado, etapa piloto.
- Los videos y cuadros viven en `marketing/referencias/videos/` (no se versiona). No subas nada a ningún lado.

## Errores comunes

| Error | Corrección |
|---|---|
| Resumir solo con la transcripción | Abrir todas las hojas de cuadros |
| Listar "cosas buenas" sin el segundo en que pasan | Cada hallazgo lleva su tiempo y se puede ver en el video |
| Recetas genéricas ("usá buen ritmo") | Cada punto dice qué se hace, cuánto dura y cómo se reproduce |
| Copiar el esqueleto sin chequear la demo | Marcar cada pantalla "a confirmar en `demo.orbita.site`" |
| Olvidar el formato | Si el original es 16:9, decirlo y proponer 9:16 para el reel |
