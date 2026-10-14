# Control de calidad (antes de entregar)

Revisar con evidencia, no "a ojo" sobre el video en movimiento: no se puede mirar ni
escuchar el video, así que se miden cuadros, curvas y niveles.

| Qué | Cómo | Umbral |
|---|---|---|
| Cada escena en orden, nada tapado | `node herramientas/hoja.mjs out/<video>.mp4 4` → mirar `out/hoja.jpg`; zonas dudosas: `hoja.mjs <video> 0.5 <desde> <hasta>` | Sin pantallas de error, sin cartel sobre un clic, sin datos sensibles (otros negocios, emails de clientes) |
| Cuadros clave a tamaño completo | `TL=compose/tl.json node herramientas/preview.mjs <t1> <t2> …` (antes de renderizar) | Texto nítido con zoom; resaltado sobre el bloque correcto |
| Temblor de cámara | `node herramientas/qa/temblor.mjs <video> <inicio_zoom> <fin_zoom> 700` (una fila que cruce el borde izquierdo de la ventana sobre el fondo) | RMS < 0,5 px (suave ≈ 0,25) |
| Scroll | Renderizar el tramo con cámara quieta (copiar tl.json con `cam: []`) y `node herramientas/qa/scroll.mjs <video> <desde> <hasta> 700` | Campana suave; salto entre cuadros vecinos ≤ ~2–4 px |
| Medición de scrolls | salida de `scrolls.mjs` | "medido" ≈ "Y" (sin ⚠) |
| Audio | `node herramientas/qa/audio.mjs <video>` | Con voz: −14 a −16 LUFS; pico ≤ −1 dBFS siempre |
| Voz | salida de `tts.mjs` (⚠ si una frase dura de más) y `editar.mjs --voz` (⚠ si dos frases se pisan) | Sin ⚠; pedir a la persona que escuche acento y pronunciación (marcas, siglas) |
| Archivo | `ffprobe`/`ffmpeg -i` | 1920×1080, 60 fps, h264 bt709, aac |

Entregar en una carpeta del proyecto (`marketing/videos/<tipo>/`, sin commitear) y avisar:
- qué datos quedaron creados/borrados en producción (con ids) y cuánta IA se consumió;
- que el diálogo "Abrir" (si aparece) es una recreación;
- si el archivo supera 30 MB, que solo se ve en la app de escritorio (ofrecer una versión liviana: `ffmpeg -i in.mp4 -c:v libx264 -crf 26 -preset slow -c:a copy out.mp4`);
- las fotos o datos de terceros que aparezcan (derechos).

## Revisión del supervisor (tutoriales con agentes, desde 2026-10-12)

Antes de mirar: `node herramientas/revision/escaneos.mjs <borrador> --voz out/voz-tiempos.json --nitidez > produccion/revision-auto.json`
y `node herramientas/revision/cuadros.mjs <borrador> <carpeta-hf> produccion/revision-vN/` (hoja de
cuadros por paso a 2/s, cuadro de cada palabra clave de la voz y el texto de la voz del tramo).

### Checklist y rúbrica (por tramo; el puntaje del criterio es el peor tramo)

| # | Criterio | 1 | 0,5 | 0 |
|---|---|---|---|---|
| 1 | **Lo que se dice, se ve** | Cada cosa que nombra la voz aparece en pantalla mientras se nombra (cuadro de la palabra clave como evidencia), y **cada acción se ve completa**: si se usa una caja de texto, un menú o un botón, se ven la caja, lo que se escribe o elige, y el botón que lo confirma | Aparece pero tarde (> 1 s después) o muy chica, sin confundir | Se nombra algo que no aparece, aparece otra cosa, o una acción se ve a medias (p. ej. se elige una pregunta y la caja donde queda escrita o el Enviar quedan fuera de cuadro) |
| 2 | **Se lee** | El texto relevante se lee nítido en el cuadro y nada lo tapa; nitidez sin caídas en `revision-auto.json` | Un tramo menor algo blando, o tapado parcialmente sin perder la idea | Texto borroso o tapado donde hace falta leerlo |
| 3 | **Encuadre** | Lo importante dentro del cuadro y centrado, nada cortado en el borde | Un tramo menor descentrado | Lo importante fuera de cuadro o cortado |
| 4 | **Ritmo** | Sin silencios > 0,6 s fuera de tramos protegidos, sin esperas visibles, nada demasiado rápido para entenderlo | Un silencio o una espera menor | Silencio largo, espera de carga visible, o algo que pasa sin que se pueda leer |
| 5 | **Continuidad** | Sin saltos de cursor, paneles que quedan abiertos ni cortes bruscos | Un salto menor | Un panel que queda abierto, un corte que desorienta |
| 6 | **Contenido** | Sin datos de prueba visibles, material con derechos ni nombres no aprobados | — | Cualquiera de esos (siempre bloqueante) |
| 7 | **Audio** | Voz clara, música de fondo, -14 LUFS ±1, pico ≤ -1 dBFS | Fuera de rango por < 2 LU | Voz tapada por la música o saturación |
| 8 | **Coherencia** | Plan correcto (Avanzado marcado) y coincide con el manual y el código | — | Muestra o dice algo falso o de otro plan sin marcar |

**Aprobado solo si:** 0 bloqueantes, los criterios **1, 2, 3, 6 y 8 valen 1**, y ninguno vale menos
de 0,5. El espectador mudo (solo cuadros) tiene que contar el objetivo del guion. Cada punto se
justifica con evidencia (segundo + cuadro); sin evidencia vale 0.

**Escaneos automáticos → bloqueante si:** cuadros negros fuera de la apertura y el cierre;
congelamiento ≥ 1,5 s sin voz (`conVoz: false`) fuera de tramos protegidos; flash en el medio de
un paso; silencio ≥ 1 s donde debería sonar la voz (`conVoz: true`: **voz cortada**, siempre) o sin voz fuera de
tramos protegidos, la apertura y el cierre; saturación; LUFS fuera de -15/-13 en la entrega. Una caída de
`nitidez` a menos de la mitad del plano general en un tramo con texto que hay que leer → criterio 2.

## Promos (reel / YouTube)
- `qa/huecos.mjs compose/tl-<nombre>.json` sin saltos antes de renderizar.
- Audio: `qa/audio.mjs out/audio-<nombre>.wav` → -14 LUFS ±1, pico ≤ -1,5 dBFS (Instagram, TikTok y YouTube normalizan a ~-14).
- Hoja de cuadros vertical: `ffmpeg -i out/<nombre>.mp4 -vf "fps=1/1.4,scale=216:384,tile=10x2" out/hoja.jpg`: revisar ganchos, textos (que no tapen el dispositivo), carteles de Avanzado y cierre.
- Reportar: duración de cada corte, tema de música (autor, link, licencia, Content ID revisado), ganchos y qué se mostró de la demo.
