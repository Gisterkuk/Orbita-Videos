# Producción con agentes (tutoriales, desde 2026-10-12)

El director es la conversación principal con el skill. Dispara a los agentes de `.claude/agents/`
con el tool `Agent` (`subagent_type` = nombre del agente; si la sesión no los ve, `general-purpose`
con "leé y seguí .claude/agents/<agente>.md", `model: sonnet` y `effort: medium`), les pasa **rutas
absolutas** y solo lo que cada uno puede leer, y lleva `produccion/estado.md`.

**Modelo y tokens (decidido por la persona el 2026-10-13):** todos los agentes corren en **Sonnet con
esfuerzo medio**, fijado en el frontmatter de cada agente (`model: sonnet`, `effort: medium`). Abriendo
este repo los agentes se ven: disparalos con `subagent_type: <agente>` y **sin** pasar `model` ni `effort`,
porque el parámetro de la invocación le gana al frontmatter. Para cambiar el modelo de un rol, se edita su
archivo en `.claude/agents/` (p. ej. el editor a `effort: high` si rompe cosas seguido). Para gastar menos:
- Los autores (guionista, editor) se **retoman** con `SendMessage` entre rondas: no vuelven a leer todo.
- Los críticos son nuevos en cada ronda, pero con un pedido corto: solo las rutas que leen y los bloqueantes abiertos.
- A todos se les pide una devolución de 3 a 5 líneas; el detalle queda en su archivo.
- El director no relee los archivos de los agentes salvo para verificar algo puntual.

Diseño completo: `docs/superpowers/specs/2026-10-12-videos-tutoriales-multiagente-design.md`.

## Etapas

| # | Etapa | Quién | Entra | Sale | Permiso de la persona |
|---|---|---|---|---|---|
| 0 | Preparar | director | slug | `~/orbita-videos/<slug>/` (+ `produccion/estado.md`) y `<slug>-hf/` | — |
| 1 | Guion | `guionista-video` | pedido, preferencias, manual, código, recon | `produccion/guion.md` | — |
| 2 | Análisis | `analista-video` | `guion.md` + código | `produccion/analisis.md` | — |
|   | (1–2 vueltas guionista ↔ analista hasta que el analista apruebe o pasen 2 vueltas) | | | | |
| 3 | Jueces | `juez-guion` ×2 en paralelo (`modo: claridad`, `modo: adversarial`) | **solo** `guion.md` + preferencias (+ bloqueantes abiertos si es ronda > 1) | `veredicto-claridad.md`, `veredicto-adversarial.md` | — |
|   | Si alguno rechaza → guionista con la unión de bloqueantes → jueces **nuevos**. Máx. 3 rondas. | | | | |
| 4 | Negocio de demo | director (+ la persona para el mensaje sin leer) | el estado que pide el guion | `node herramientas/demo-datos/cargar.mjs --confirmo` (referencia/demo.md) | **sí** (escribe datos) |
| 5 | Ensayo | `editor-video` | guion aprobado | `grabar.mjs` + `ENSAYO=1 node grabar.mjs ensayo1` revisado | — |
| 6 | Toma real | director | ensayo limpio | `tomas/toma1` | **sí** (y la persona hace el login si hace falta) |
| 7 | Voz | director | guion final | ElevenLabs `8mBRP99B2Ng2QwsJMFQl` → `partir-voz.mjs` | **sí** (costo) |
| 8 | Borrador | `editor-video` | toma + voz | `renders/borrador-vN.mp4` + `revision-auto.json` limpio | — |
| 9 | Supervisión | `supervisor-video` (fidelidad) + `espectador-mudo`, independientes | borrador, guion, `revision-auto.json`, tramos | `revision-vN.md`, `espectador-vN.md` | — |
|   | Si rechaza (o el espectador no cuenta el objetivo) → editor con los bloqueantes → supervisor **nuevo** con solo los bloqueantes abiertos. Máx. 3 rondas. | | | | |
| 10 | Corte final | `supervisor-video` ×2 (fidelidad + adversarial) | borrador aprobado | `revision-final-*.md`; aprueba solo si aprueban los dos | — |
| 11 | Final y entrega | director | aprobado | `npm run render-final` (4K) → `npm run entregar -- --slug <slug>` → SendUserFile (liviana) | — |
| 12 | Aprender | director | correcciones de la persona | `referencia/preferencias.md` § Historial | — |

**Si una etapa con tope no aprueba en sus rondas:** el director le muestra a la persona los
bloqueantes abiertos y decide ella. **Nunca se aprueba igual.**

## Reglas del director
- A cada crítico: **solo** lo que su agente dice que lee. Nunca los puntajes de rondas anteriores,
  nunca la justificación del autor, nunca lo que dijo otro crítico.
- Una ronda nueva = un agente nuevo (no se reusa el de la ronda anterior con `SendMessage`).
- Los bloqueantes los cierra un crítico, con evidencia. El autor no puede marcarlos resueltos.
- Todo costo y todo dato creado en producción va a `estado.md` y al reporte final.
- Las reglas que no se negocian de `SKILL.md` (contraseñas, perfil, ensayo, claves) siguen valiendo.

## Formato de `estado.md`
Etapa y rondas, decisiones con fecha, costos (voz US$, cupo de Orbi, minutos de render),
bloqueantes abiertos (id, quién lo abrió, segundo o frase), pedidos al director, dudas.
