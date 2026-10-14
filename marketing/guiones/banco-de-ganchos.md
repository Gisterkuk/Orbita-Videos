# Banco de ganchos: el patrón de "Una foto"

De dónde sale: los dos ganchos aprobados del video "Una foto" (2026-10-09,
[`2026-10-09_youtube-4k-guion-de-edicion.md`](2026-10-09_youtube-4k-guion-de-edicion.md)).

- **A:** "Así se carga un producto… y así se carga en Órbita."
- **D:** "Si cargar un producto te lleva más que venderlo… mirá esto."

## Por qué funcionan (lo que tienen en común)

1. **Una tarea concreta y repetida**, no una categoría. "Cargar un producto", no "gestionar tu negocio". El
   dueño la reconoce porque la hizo ayer.
2. **El contraste viene armado.** Son dos mundos (la forma de siempre / Órbita) o una proporción absurda
   (preparar algo cuesta más que venderlo). Nunca dicen "es lento" ni "es un garrón": **el espectador
   llega solo a la conclusión.** Eso lo vuelve creíble.
3. **Dos mitades con una pausa (…).** Primero la situación, después el giro. La pausa es donde el cerebro
   completa la idea, y ahí entra el *clic* visual.
4. **Prometen una prueba, no un beneficio.** "Y así se carga en Órbita" o "mirá esto" abren una puerta que
   la imagen cierra en los próximos 2 segundos. No hay adjetivos ("fácil", "rápido", "increíble").
5. **El villano es un hábito, no una marca.** "La forma de siempre". Nunca se nombra a nadie.
6. **Cortos y en voseo:** 8–12 palabras, verbos del día a día.

**La fórmula:** `[tarea concreta que el dueño repite]` + `[contraste: dos mundos o proporción absurda]` +
`… (pausa)` + `[promesa de mostrar]`.

## Cinco moldes para variarlo

| Molde | Plantilla | Viene de |
|---|---|---|
| **Espejo** | "Así se *[tarea]*… y así se *[tarea]* en Órbita." | A |
| **Proporción absurda** | "Si *[tarea de apoyo]* te lleva más que *[lo que da plata]*… mirá esto." | D |
| **X antes que Y** | "*[lo mínimo]*, antes que *[el trámite]*." | B ("Una foto, antes que veinte campos") |
| **Quién se entera primero** | "Que te avise *[el sistema]*, antes que *[el problema]*." | A + B |
| **La misma cosa, dos veces** | "El mismo *[cosa]*. Dos formas de *[tarea]*." | A, en versión pantalla partida |

## 20 ganchos

✦ = función del **Paquete Avanzado** (se marca en pantalla). Lo demás es del plan base. Todo está
verificado en el manual del panel o en la landing (`Comparativa.tsx`, `Modulos.tsx`).

| # | Molde | Gancho | Qué muestra el video | Función |
|---|---|---|---|---|
| 1 | Espejo | "Así se escribe la descripción de un producto… y así la escribe Orbi." | Cursor que borra y reescribe → botón "Redactar con Orbi" | Redactar con Orbi |
| 2 | Espejo | "Así se carga un catálogo entero… y así se carga en Órbita." | Copiar y pegar fila por fila → "Importar Excel" | Importar Excel |
| 3 | Espejo | "Así se anota un pedido que llega por WhatsApp… y así llega en Órbita." | Captura de chat a un cuaderno → pedido con estado en el panel | Pedidos |
| 4 | Espejo | "Así se sabe cuánto stock queda… y así lo sabe Órbita." | Contar cajas en el depósito → el stock baja solo con cada venta | Inventario |
| 5 | Espejo | "Así queda la foto de un producto sacada en casa… y así queda en Órbita." | Foto con la mesa de fondo → fondo quitado | ✦ Quitar fondo |
| 6 | Proporción | "Si contestar '¿precio?' te lleva más que vender… mirá esto." | Diez chats iguales → link a la tienda con precios | Tienda propia |
| 7 | Proporción | "Si cobrar te lleva más que vender… mirá esto." | Pedir comprobante, buscarlo, anotarlo → cobro online que queda registrado | Cobro online |
| 8 | Proporción | "Si encontrar un pedido te lleva más que prepararlo… mirá esto." | Scroll infinito de chats → lista de pedidos por estado | Pedidos |
| 9 | Proporción | "Si describir lo que hacés te lleva más que hacerlo… mirá esto." | Artesano con la pieza terminada frente a un campo vacío → Orbi | Redactar con Orbi |
| 10 | Proporción | "Si saber cuánto vendiste te lleva más que vender… mirá esto." | Calculadora y planilla → preguntarle a Orbi por tus números | Orbi AI + métricas |
| 11 | Proporción | "Si sacarle el fondo a una foto te lleva más que sacarla… mirá esto." | Recorte a mano en un editor → un toque | ✦ Quitar fondo |
| 12 | X antes que Y | "Una foto, antes que veinte campos." | Clic de cámara → producto completo | ✦ Escaneo con foto |
| 13 | X antes que Y | "Un link, antes que cien capturas." | Mandar fotos una por una por chat → el link de tu tienda | Tienda propia |
| 14 | X antes que Y | "Un panel, antes que cinco apps." | Saltar entre chat, planilla, notas y calculadora → todo en un panel | Panel |
| 15 | X antes que Y | "Preguntale a tus números, antes que a tu memoria." | "¿Cuánto vendí este mes?" pensando → Orbi responde con datos | Orbi AI |
| 16 | Quién se entera | "Que te avise el stock, antes que el cliente." | Cliente: "¿no te queda?" → alerta de stock bajo antes | Alertas de stock |
| 17 | Quién se entera | "Que te avise el pedido, antes que el cliente pregunte dónde está." | "¿Ya salió?" → pedido con su estado | Pedidos |
| 18 | La misma cosa | "La misma zapatilla. Dos formas de cargarla." | Pantalla partida: formulario eterno / una foto | ✦ Escaneo con foto |
| 19 | La misma cosa | "El mismo pedido. Dos formas de cobrarlo." | Transferencia, captura y anotación / cobro online | Cobro online |
| 20 | La misma cosa | "La misma venta. Dos formas de enterarte." | Revisar el cuaderno a la noche / el panel en el momento | Pedidos + métricas |

## Cómo probar un gancho nuevo (antes de gastar voz)

- ¿Nombra **una tarea** que el dueño hizo esta semana? Si dice "gestión", "organización" o "negocio", es
  genérico.
- ¿El contraste se entiende **sin adjetivos**? Si necesita "fácil" o "rápido", está flojo.
- ¿Se puede **mostrar** en 2 segundos lo que promete? Si no hay imagen para la segunda mitad, no sirve.
- ¿Tiene **dos mitades con pausa**? Leelo en voz alta: el giro tiene que caer después del "…".
- ¿Menos de 12 palabras? ¿Voseo? ¿Sin competidores, sin cifras inventadas, sin "este mes"?
- Si la función es ✦, ¿está marcada en pantalla?
