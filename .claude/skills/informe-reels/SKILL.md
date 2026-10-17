---
name: informe-reels
description: Usar cuando la persona pida el informe de sus reels guardados, la lluvia de ideas o los patrones de los reels que le gustaron (o escriba /informe-reels), y en la rutina diaria de las 7:00. Palabras clave: informe diario, reels que me gustaron, lluvia de ideas, patrones, guiones, links guardados.
---

# Informe de los reels guardados

Lee la lista `reels-que-me-gustaron.md` (raíz del repo), analiza los reels nuevos y arma **un informe con patrones,
lluvia de ideas y guiones** para Órbita. Corre solo, sin supervisión: **no hagas preguntas**; lo que no se pueda
resolver se anota en el informe.

## Pasos

1. **Leer los links.** Sacá de `reels-que-me-gustaron.md` los links de Instagram (`/reel/`, `/reels/`, `/p/`, `/tv/`)
   con su nota. El código es lo que sigue a esas rutas. Ignorá el resto del texto.
2. **Detectar los nuevos.** Es nuevo el que no tiene `marketing/referencias/cosas-buenas/<código>.md`. Tomá hasta
   **5**, en el orden del archivo. Anotá cuántos quedan en cola.
3. **Analizar cada nuevo** con la skill `analizar-reel` (descarga, cuadros, análisis). Si uno falla (pide sesión,
   no existe, límite de Instagram), seguí con el siguiente y anotalo en "No se pudieron analizar". **No** leas
   cookies del navegador ni uses la cuenta de la persona.
4. **Releer lo acumulado:** todos los `marketing/referencias/cosas-buenas/*.md`, `marketing/referencias/patrones.md`,
   `marketing/guiones/banco-de-ganchos.md` y los últimos 3 informes de `marketing/referencias/informes/` (para no
   repetir ideas).
5. **Escribir** `marketing/referencias/informes/AAAA-MM-DD.md` con esta estructura:
   1. **Resumen** (5 líneas como máximo): qué entró hoy y la conclusión principal.
   2. **Reels nuevos:** un párrafo por reel con el link, lo más fuerte que tiene y la ruta de su análisis.
   3. **Patrones que se repiten:** cada uno con en cuántos reels aparece ("3 de 5") y cuáles. Con menos de 5
      referencias decilo: es hipótesis, no regla. Separá "se repite" de "lo hace uno solo".
   4. **Lluvia de ideas** (10–15 para Órbita): cada una con 2 variantes de gancho, formato, qué patrón de
      referencia usa y las pantallas a confirmar en `demo.orbita.site`. Numeradas, sin repetir las de informes anteriores.
   5. **3 guiones borrador** de las ideas más fuertes, con el formato de `marketing/guiones/plantilla-reel.md`.
   6. **Qué probar esta semana:** 3 prioridades, con el motivo.
   7. **Propuestas para `patrones.md`:** qué sumar o corregir. No lo edites vos.
   8. **No se pudieron analizar / en cola / preguntas abiertas.**
6. **Sin links nuevos:** informe corto: solo secciones 1, 4 (8 ideas nuevas, distintas de las anteriores) y 6.
7. **Cerrar** con la ruta del informe y las 3 mejores ideas en una línea cada una.

## Enfoque actual (a 2026-10-15; la persona lo puede cambiar)

- **Objetivo:** generar confianza, no alcance (plan de Instagram de agosto 2026, etapa piloto).
- **Rubro inicial:** indumentaria y calzado.
- **Cara:** los fundadores a cámara (Mateo, Alan, Alexander), mezclados con pantalla y motion graphics.
- **Cierre:** demo pública y tono cercano. Detalle de marca en `marketing/CONTEXTO.md`.

## Reglas que no se negocian

- Lo de `marketing/CLAUDE.md` y `marketing/CONTEXTO.md`: español rioplatense con voseo, sin nombrar competidores,
  sin prometer funciones que no existen, lo de pago rotulado, sin "este mes", sin cifras, clientes o casos
  inventados. Los datos de ejemplo van rotulados como tales.
- Las ideas y guiones se basan en **patrones**, no en copiar escenas, textos o diseños de los reels ajenos.
- **No publiques ni subas nada** a ninguna red o servicio. **No edites** `reels-que-me-gustaron.md`,
  `banco-de-ideas.md` ni `patrones.md`: solo escribís el informe y los análisis.
- Decí lo que no pudiste ver: el audio no se analiza y las vistas pueden no estar.
- Los reels bajados viven en `marketing/referencias/videos/` (no se versiona).

## Errores comunes

| Error | Corrección |
|---|---|
| Esperar una respuesta de la persona | Corre sin supervisión: anotá la duda en el informe y seguí |
| Mismas ideas todos los días | Leer los 3 últimos informes y numerar solo ideas nuevas |
| Ideas genéricas ("hacé un reel de producto") | Cada una lleva gancho, patrón de origen y pantalla concreta |
| Afirmar un patrón con 1 o 2 reels | Marcarlo como hipótesis y decir en cuántos aparece |
| Analizar más de 5 por corrida | Dejar el resto en cola |
