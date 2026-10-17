---
name: monitor-agentes
description: Usar cuando la persona quiera ver en vivo cómo trabajan el director y los agentes de un video de Órbita (guionista, analista, jueces, editor, supervisores): quién habló con quién, qué recibió y devolvió cada uno, qué rechazó y por qué, el estado de la producción. Abre una página local que se actualiza sola. Palabras clave: monitor, panel de agentes, logs de agentes, ver el estado, en vivo, qué hacen los agentes, quién rechazó.
---

# Monitor de agentes (visor local en vivo)

Una página local que muestra **la conversación** entre el director y los agentes del flujo
`videos-multiagente`, con los veredictos y bloqueantes de cada uno. Funciona sola: los agentes y el director
no gastan tokens para alimentarla.

**Qué junta**
- **Hook** (`herramientas/registrar-evento.mjs`): cada vez que el director lanza un agente (`Agent`), le escribe
  (`SendMessage`) o un agente termina (`SubagentStop`), guarda una línea en
  `~/orbita-videos/<slug>/produccion/eventos.jsonl` (fuera del repo, que es público). Detecta el video por la ruta
  que aparece en el pedido, saca claves y tokens, y nunca frena el trabajo (siempre sale con código 0).
- **Archivos de la producción** (`guion.md`, `analisis*.md`, `veredicto-*.md`, `revision-*.md`, `estado.md`,
  `informe.md`…): se muestran como hitos, con el agente que los escribió y su veredicto (RECHAZADO / APROBADO) y
  los bloqueantes citados (B1, J2…). Esto anda aunque el hook no esté prendido, y sirve para videos ya hechos.

## Cómo se usa
```
node .claude/skills/monitor-agentes/herramientas/servidor.mjs          # http://127.0.0.1:4177
node .claude/skills/monitor-agentes/herramientas/servidor.mjs --puerto 4180
```
Abrir la dirección en el navegador (o en el panel de navegador de la app). Todo se actualiza solo (SSE con reconexión).

**Sala de control 3D** (`/`, `pagina/sala/`, Three.js copiado en `pagina/vendor/`, sin internet):
- **Constelación**: todos los videos a la vez. Órbita en el centro, un anillo por etapa (más afuera = más avanzado),
  un planeta por video con sus agentes como lunas. Color: azul trabajando, ámbar pide cambios, rojo trabado
  (3 rechazos seguidos del mismo revisor), verde listo, gris en pausa. Pasar el mouse: quién rechazó y por qué.
  Abajo a la izquierda, la actividad de todos los videos.
- **Oficina** (clic en un planeta, `#/v/<slug>`): el director en el centro y cada agente en su puesto, por zonas
  (escritura, revisión, edición, control). Los mensajes viajan como partículas por la línea director↔agente
  (rojo = pidió cambios, verde = aprobó) con un globito; el que trabaja late. Arriba, la etapa y "por qué no avanza".
- **Ficha** (clic en un agente, `#/v/<slug>/<agente>`): todo lo que recibió, devolvió y rechazó, con el motivo,
  qué pasó después y el texto o documento completo.
- El modelo (rol de cada evento, estado del video, motivos) se arma en `herramientas/lib/modelo.mjs`; la página
  solo dibuja. Endpoints: `/api/resumen` (todos los videos) y `/api/video?slug=` (uno).

**Vista clásica** (`/clasica`): la lista de antes. Elegir el video arriba; izquierda, cada agente con sus rechazos y
aprobaciones; centro, la conversación en orden; derecha, los archivos de la producción, con visor.

## Prender el registro automático (hook)
Está declarado en `.claude/settings.json` (PostToolUse con filtro `Agent|SendMessage`, y SubagentStop). Si no está
prendido, el visor igual muestra los archivos; solo faltan los mensajes entre el director y los agentes.
Para probarlo a mano:
```
echo '{"hook_event_name":"PostToolUse","tool_name":"SendMessage","tool_input":{"to":"guionista","message":"prueba"}}' | node .claude/skills/monitor-agentes/herramientas/registrar-evento.mjs
```

## Consumo de tokens (medido, no estimado)
Cuando un agente termina, el hook lee su transcrito (`agent_transcript_path`) y suma su uso real: **entrada + salida +
caché nuevo** (el contexto que se vuelve a leer desde caché va aparte, porque cuesta mucho menos). Cada mensaje aparece
repetido en varios bloques del transcrito, así que se cuenta una sola vez por id. El uso del transcrito es **acumulado**:
si se retoma a un agente con `SendMessage`, cada corrida muestra solo lo que gastó (el acumulado menos lo anterior).
La página lo muestra en cada respuesta, en "El equipo" y en las cifras de arriba. Por línea de comandos:
```
node .claude/skills/monitor-agentes/herramientas/tokens.mjs <slug>
```
Comprobado el 2026-10-14: un agente de prueba midió 77.469 tokens contra 77.169 que reportó el sistema.
**Ojo:** los números que da el sistema al terminar un agente retomado son acumulados, no por corrida: no se suman.

## Cómo se sabe quién es cada agente y de qué video
- Al lanzar un agente (`Agent`) se guarda su id con su nombre y su video en `~/orbita-videos/_monitor/agentes.json`.
  Después, cuando ese id termina o le escriben, el evento sale con el nombre correcto y en el video correcto.
- **No hay "último video" de respaldo**: un agente que no cita ningún video queda en `_monitor/eventos.jsonl` y no se
  le asigna a otro (con dos videos en paralelo, adivinar mezclaba los historiales).
- Los eventos de antes de esta versión pueden mostrar "Ayudante" (se registraron sin el id).
- `_monitor/muestra-<hook>.json` guarda el último payload de cada tipo de hook, recortado, para ver qué trae.
  El cierre de un agente **no trae el texto de su informe**: se lee del transcrito. Y puede dispararse dos veces seguidas
  (el primero con el transcrito incompleto): la página descarta el repetido.

## Límites y cuidados
- Solo escucha en `127.0.0.1`: no se publica nada ni se manda a ningún servicio.
- Los logs traen datos del negocio (alias, direcciones, estados): viven en `~/orbita-videos`, **nunca** en este repo.
- El hook guarda hasta 6000 caracteres por mensaje y borra claves (`sk_…`, `Bearer …`, `api_key: …`).
- Un agente que corre en segundo plano aparece "lanzado" al instante y "devolvió" cuando termina.
- Tests: `cd .claude/skills/monitor-agentes && node --test "herramientas/test/*.test.mjs"`.
