# Calibración de los críticos

Un crítico que se ablanda no sirve. Cada vez que se toca un agente crítico (`supervisor-video`,
`espectador-mudo`, `juez-guion`, `analista-video`) se corre esta calibración; el cambio **no se
acepta** si deja pasar alguno de los casos.

## Casos
1. **Caso malo etiquetado:** `conoce-tu-panel-v1.md` (B1–B4).
2. **Defectos sembrados** sobre un video que ya aprobó (o sobre v1 en tramos sin defectos), con
   `herramientas/revision/sembrar.mjs`:
   - `--defecto silencio --en <s>` (3 s sin audio),
   - `--defecto congelado --en <s>` (3 s de imagen quieta),
   - `--defecto panel-abierto --en <s> --desde <s2>` (4 s de un recorte de otro momento encima: un
     panel que "queda abierto").

## Procedimiento (lo corre el director)
1. Para cada video del caso: `node herramientas/revision/escaneos.mjs <video> --voz <voz-tiempos> --nitidez > <dir>/revision-auto.json`
   y `node herramientas/revision/cuadros.mjs <video> <carpeta-hf> <dir>`.
2. Disparar `supervisor-video` (modo fidelidad) con: el video, el guion de ese video (para v1:
   `~/orbita-videos/conoce-tu-panel/guion.json`), `revision-auto.json`, `tramos.json` y las hojas.
3. Disparar `espectador-mudo` con solo las hojas de cuadros.
4. **Criterio de aprobación de la calibración:**
   - v1 → RECHAZADO con B1, B2 y B3 como bloqueantes (segundo ±1,5 s);
   - cada sembrado → su defecto como bloqueante (segundo ±1 s), ya sea desde los escaneos o desde la mirada;
   - el espectador mudo de v1 no puede decir que entendió cómo lo ve un Empleado.
5. Anotar el resultado abajo, con fecha. Si falla, ajustar el prompt del agente y repetir.

## Resultados
### 2026-10-12 — primera calibración (supervisor y espectador en `sonnet`)
- **Espectador mudo sobre v1:** PASA. No entendió los numeritos ni la vista de Empleado y marcó el
  texto ilegible; concluye que no podría hacer nada después de verlo.
- **Supervisor sobre "silencio" sembrado (0:20):** PASA. Bloqueante "voz cortada" en 0:20,0–0:23,0,
  más los problemas reales de v1.
- **Supervisor sobre "panel abierto" sembrado (0:09):** PASA. Bloqueante en 0:09,0–0:13,0.
- **Supervisor sobre v1:** RECHAZADO con B1 (numeritos, 0:28,2) ✓, B2 (Empleado, 0:39,9) ✓ y B4
  (texto blando, 0:17–0:41) ✓, más cinco que no estaban etiquetados (la tienda nombrada sin verse,
  el buscador que promete pedidos y clientes, la campana con datos que no coinciden, la espera de
  Orbi, datos de personas legibles). **B3 parcial:** marcó el tramo de Orbi por la espera, pero no
  que la caja de texto y el Enviar quedan fuera de cuadro.
  → Ajuste: criterio 1 con "acciones completas" (calidad.md) y sección "Qué buscás en cada tramo"
  en `supervisor-video.md`. Se repite la calibración de v1.
- **Recalibración del supervisor sobre v1 (con "acciones completas"):** PASA. RECHAZADO con los
  numeritos (0:28,2), el Empleado (0:39,9), **la caja de texto de Orbi cortada (1:01,7) y el Enviar a
  medias (1:07,6)**, el texto blando (0:17–0:41), más la tienda nombrada sin verse, el selector del
  menú a medias, el buscador, la campana, la espera de Orbi y datos personales legibles (10 bloqueantes).
  Criterios 1, 2, 3, 6 y 8 lejos de 1. Calibración completa: los críticos actuales quedan aprobados.
