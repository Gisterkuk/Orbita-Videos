# Autonomía del director: autorización permanente y decisiones por defecto

Decidido por la persona el **2026-10-14**: quiere salir del asiento del piloto, ver los **resultados** y juzgar
desde ahí. El director (la conversación con el skill) **no pregunta**: decide con esta página, lo deja anotado
en el **informe de decisiones** y entrega un solo mensaje por video. Esta página vale para todos los videos,
salvo que el pedido diga otra cosa (el pedido de un video siempre le gana).

## 1. Autorización permanente (ya dada: no se pide de nuevo)
Dentro de estos topes el director actúa sin preguntar:
1. **Escrituras en el negocio de demo:** solo **configuración reversible** (p. ej. cobros con `herramientas/demo-datos/pagos.mjs`).
   Antes de escribir se guarda la copia del estado original y **al terminar el video se revierte** (queda anotado en el informe).
   Sin crear ni borrar productos, pedidos ni clientes (eso sigue necesitando permiso explícito del pedido).
2. **Voz:** hasta **US$ 5 por video** en ElevenLabs, voz `8mBRP99B2Ng2QwsJMFQl` (ver `preferencias.md`). Si hace falta pasar el tope
   (rehacer la voz muchas veces), se frena y se avisa en el informe.
3. **Toma real:** **una por video**, y solo después de un **ensayo limpio** (`ENSAYO=1`) y con el guion aprobado por los críticos
   (o cerrado según §4). Una toma corta de cierre o una repetición por falla técnica no cuenta como segunda.

## 2. Lo que SIGUE siendo de la persona (el director frena y lo cuenta, no lo hace)
- **Contraseñas y logins:** nunca se escriben; el login lo hace la persona (`herramientas/login.mjs`).
- **Cualquier escritura fuera de §1**, y **todo lo irreversible** (borrar, publicar, mandar mails o mensajes reales, gastar cupo de Orbi, cobros reales).
- **Claves** (ElevenLabs en `ELEVEN_KEY`, u otras): las pasa la persona; no se buscan por cuenta propia ni se imprimen.
- **Lo que no se puede deshacer o toca a terceros** (conectar cuentas reales de Mercado Pago, comprar dominios, etc.).
Cuando el director choca con una de estas, **no pregunta y se queda esperando**: resuelve por otro camino (recreación marcada, recorte del
alcance) o deja el video listo hasta ahí y lo declara en el informe como "pendiente de la persona", con el comando exacto.

## 3. Decisiones por defecto (el director decide solo)
| Situación | Decisión |
|---|---|
| Un paso necesita una cuenta real o el login real de un tercero (Mercado Pago, Google…) | **No se conecta.** En vivo hasta el clic que inicia el flujo (si no escribe nada: se verifica en el código) y **recreación marcada** del resultado ("Así se ve cuando…") interceptando la respuesta en el navegador, sin escribir nada. |
| Falta un dato de ejemplo (producto, alias, titular, entidad, cliente) | **Producto:** el primero del demo con foto y precio normal. **Datos inventados genéricos**, sin "demo/ejemplo/prueba/test", sin nombres de personas ni empresas reales, y declarados "inventados para el video" (sin afirmar que "no existen"). |
| El estado actual del demo tiene datos de prueba (p. ej. "asdad") | Se reemplaza por datos ficticios con la autorización de §1, y se revierte al final. |
| Dos nombres para lo mismo en la UI (interruptor, sección, cartel) | La voz usa **un solo nombre**, el del cartel/pantalla en ese instante, y lo repite en vez de usar pronombres. Sin contrastes tipo "es distinto de…". |
| Tiempos justos (tipeo vs. voz, cartel quieto < 2 s) | Se alarga la frase, se acorta el tipeo o se reparte en dos frases; nunca se acorta el tramo protegido. |
| Un cobro/pago/guardado que cambiaría producción | Se dice como **instrucción** (cursor sobre el botón activo, sin clic) o se recrea; no se hace clic. |
| Datos reales a la vista (campana, direcciones, miembros) | Se **desenfocan**; si no alcanza, se encuadra fuera. |
| Duración | Dentro del rango del pedido; si el pedido no dice, lo de la hoja de ruta. |
| El pedido no aclara algo que no afecta a producción ni a terceros | El director elige lo más simple y fiel al manual y lo anota. |

## 4. Rondas de críticos (cómo se cierran sin preguntarte)
Los bloqueantes tienen **severidad** (la pone el crítico):
- **A, frena:** algo falso o sin respaldo en el código, un riesgo de contenido (datos de prueba, derechos, nombres reales, Avanzado sin marcar),
  una preferencia de la persona contradicha, o un paso que lleva al comerciante a hacer o creer algo equivocado.
- **B, ajuste:** redacción, tiempos justos, nombres repetidos, ambigüedad menor, mejoras de claridad.
Reglas:
1. **Ronda 1:** pasada completa de cada crítico. **Rondas 2 y 3:** el crítico verifica solo los bloqueantes A abiertos y **lo que cambió** en el diff;
   no vuelve a hacer una pasada abierta (así no inventa problemas nuevos ni se contradice con la vuelta anterior).
2. Solo los **A** impiden aprobar. Los **B** el director los aplica él mismo, sin ronda nueva, y los lista en el informe.
3. **Tope de 3 rondas con A abierto:** el director **no pregunta**: aplica una última corrección de esos A y la verifica un crítico nuevo
   que solo mira esos puntos. Si todavía no cierra, el video **no se entrega como aprobado**: se entrega como "con bloqueantes abiertos"
   con la lista, para que la persona juzgue. **Nunca se aprueba igual.**
4. Un crítico nuevo por ronda, que solo ve lo que su agente dice que lee (sin puntajes ni justificaciones previas): se mantiene.

## 5. Informe de decisiones (lo único que ve la persona, junto con el video)
El director escribe `produccion/informe.md` y lo resume en **un solo mensaje** al terminar (o al quedar bloqueado por §2):
1. **Resultado:** ruta del video (`marketing/videos/…`), versión liviana, duración, SendUserFile.
2. **Qué se decidió solo y por qué** (cada fila de §3 que se aplicó, con la alternativa descartada).
3. **Qué se escribió en producción** y su estado: ids/campos tocados, **copia previa** y **comando para revertir**, y si ya se revirtió.
4. **Costos:** voz US$, cupo de Orbi, minutos de render.
5. **Bloqueantes B aplicados** y **A abiertos** (si quedó alguno), con la evidencia de los críticos.
6. **Pendiente de la persona** (§2), con el comando exacto.
7. **Hallazgos del producto** que no son del video (p. ej. bugs vistos en el panel).
Corregir algo del resultado va a `preferencias.md` § Historial al terminar (etapa 12).
