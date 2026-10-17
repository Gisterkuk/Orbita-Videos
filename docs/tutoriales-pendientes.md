# Tutoriales de Órbita: lista de trabajo

Lista viva de todos los tutoriales que hay que hacer, para ir marcándolos a medida que salen. Parte de la
[hoja de ruta](hoja-de-ruta-tutoriales.md) (38 tutoriales, sacados del manual del panel) y suma lo que **la landing
([orbita.site](https://orbita.site)) promete y la hoja no cubría** (#39 en adelante). La numeración de la hoja no se
toca: "tutorial 4" sigue siendo "Configurar cómo cobrás".

**Estados:** ✅ hecho · 🔄 en curso · ⬜ pendiente · ❓ por verificar antes de guionar
**Avanzado** = función del paquete Avanzado (se marca así en el video; ver `referencia/planes.md`).
Cada video se produce con `/videos-multiagente`; los proyectos viven en `~/orbita-videos/<slug>` y el seguimiento en vivo
está en el [monitor](../.claude/skills/monitor-agentes/SKILL.md).

## Resumen
| | Cantidad |
|---|---|
| ✅ Hechos | 3 (#1, #4 y #6; más "Cargar un producto", hecho antes de la numeración con el skill simple) |
| 🔄 En curso | 2 (#3 y #5) |
| ⏸ Pospuestos | 1 (#2, por cambio de producto) |
| ⬜ Pendientes | 38 (salieron de acá el #2, pospuesto, y el #3, en curso) |
| ❓ Por verificar antes de guionar | 2 (#36 y #39) |
| **Total numerados** | **46** (38 de la hoja de ruta + 8 nuevos) |

**Siguiente en la fila (hoja de ruta: 4 → 5 → 6 → 11):** #11 Atender un pedido, cuando salgan #5 y #6.

---

## 1. Arrancar
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 1 | ✅ | Conocé tu panel | Panel y tienda son cosas distintas, el menú, la barra de arriba, ver tu tienda como cliente | 1:30 | v2 entregada el 2026-10-13. Proyecto `conoce-tu-panel-v2`. |
| 2 | ⏸ | Los 7 pasos para salir a vender | Resumen de todo el arranque, con un enlace a cada tutorial | 2:00 | **Pospuesto (2026-10-15):** el panel desplegado reemplazó la tarjeta "Primeros pasos" por el sistema de ayuda nuevo (origin/main, `ayuda/AyudaHost.tsx`) y el guion v3 (aprobado) se apoyaba en ella. Proyecto `siete-pasos`: guion v3, `grabar.mjs`/`editar.mjs` y voz generada (US$ 0,24, sin descargar) quedan reutilizables. Al retomar: releer el código nuevo, rehacer el guion y recién ahí ensayo/toma. Hacerlo **después** de 3–6. |
| 3 | 🔄 | Datos del negocio | Negocio (nombre, rubro, dirección), Contacto y Redes sociales | 1:30 | Proyecto `datos-del-negocio`. Guion aprobado, dos tomas reales hechas y demo **revertido** (2026-10-15). Voz generada (US$ 0,16). **Espera el mp3** (`datos-del-negocio-hf/assets/voz/narracion-completa.mp3`); después `node editar.mjs --voz voz.json` y borrador. Gancho sin el modal del panel: opcional `node grabar-gancho.mjs` (solo lectura). |
| 4 | ✅ | Configurar cómo cobrás | Mercado Pago, coordinar por WhatsApp, retiro en local, descuento por pagar con MP | 2:00 | Entregado el 2026-10-15 (1:39, 1440p). Proyecto `configurar-cobros`; informe en `produccion/informe.md`. Mercado Pago **no se conecta**: recreación marcada. Demo revertido (`demo-pagos-antes.json`). |
| 5 | 🔄 | Configurar envíos | Transportes, costo de cada uno, zonas, umbral de envío gratis | 1:30 | Proyecto `configurar-envios`. Guion aprobado, ensayos limpios, toma real hecha y demo revertido (2026-10-14). Voz generada (US$ 0,17). **Espera que la persona descargue el mp3**; después, borrador. |
| 6 | ✅ | Publicar tu tienda | El botón "Publicar tienda" y lo que pasa después | 0:45 | Entregado el 2026-10-17 (41 s, 1440p): `marketing/videos/tutoriales/2026-10-17_publicar-tienda_16x9.mp4` + liviano. Proyecto `publicar-tienda`. No se publicó ni despublicó nada: recreación marcada, triple candado. Voz US$ 0,09. |

## 2. Catálogo
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| — | ✅ | Cargar un producto | Categorías, carga con foto y quitar el fondo | — | Hecho antes de la numeración con el skill simple `videos-tutoriales` (repo de Órbita). Proyecto `cargar-producto`. |
| 7 | ⬜ | Importar productos desde Excel | Plantilla, carga masiva y errores comunes | 2:00 | |
| 8 | ⬜ | Variantes y stock a fondo | Talles, colores y stock por variante | 1:30 | La landing promete también serie/IMEI y venta por peso o medida: ver #39. |
| 9 | ⬜ | Mantener el catálogo al día | Stock rápido sin abrir el producto, estados de cada producto, exportar el catálogo | 1:30 | La landing promete "alertas cuando queda poco y movimientos con su historial": incluirlos acá. |
| 10 | ⬜ | Organizar categorías | Subcategorías, editar, imagen e ícono | 1:00 | |

## 3. Vender día a día
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 11 | ⬜ | Atender un pedido | Estados y pestañas, abrir un pedido, avanzarlo hasta entregado | 2:00 | Necesita pedidos reales de demo en distintos estados. |
| 12 | ⬜ | Cargar una venta a mano | Una venta por WhatsApp o en el mostrador | 1:30 | |
| 13 | ⬜ | Pedidos en lote | Varios pedidos a la vez, exportar, historial | 1:00 | |
| 14 | ⬜ | Cancelaciones y devoluciones | Reglas en Configuración, aprobar un caso, notas de crédito | 2:00 | |
| 15 | ⬜ | Responder mensajes | Bandeja, chat, plantillas de respuesta | 1:30 | Manda mensajes reales: usar casillas propias. |
| 16 | ⬜ | Tus clientes | La lista, escribirles por email, exportar la base | 1:30 | Manda emails reales: usar casillas propias. |

## 4. Vender más
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 17 | ⬜ | Descuentos | Descuento o cupón, tipos, alcance, condiciones y vigencia | 2:00 | |
| 18 | ⬜ | Crear y compartir un cupón | Código, límites, link y envío por email | 1:30 | Manda emails reales. |
| 19 | ⬜ | ¿Qué promo funcionó? | Rendimiento de descuentos y cupones | 1:00 | |
| 20 | ⬜ | Leer tus números | Inicio: período, los 5 números, alertas, ventas de la semana, top | 1:30 | |
| 21 | ⬜ | Reportes | Las cinco pestañas | 1:30 | |

## 5. Que tu tienda se vea bien
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 22 | ⬜ | Tu marca en la tienda | Logo, favicon, paleta de colores, tipografía | 2:00 | |
| 23 | ⬜ | Armar la portada | Banner con parallax, video, marcas, textos, secciones visibles, pie de página | 2:00 | |
| 24 | ⬜ | Dominio propio | Comprarlo desde el panel o vincular uno que ya tenés (DNS, verificar) | 2:00 | No comprar un dominio para el video: mostrar el flujo hasta antes de pagar. |

## 6. Equipo y cuenta
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 25 | ⬜ | Sumar a tu equipo | Invitar, propietario o empleado, por qué no ven lo mismo | 1:30 | Invitar manda un mail real: recrear o usar casilla propia. |
| 26 | ⬜ | Notificaciones y registro de actividad | Qué te avisa y quién hizo qué | 1:00 | |
| 27 | ⬜ | Tu perfil y tu cuenta | Confirmar el email, datos personales, contraseña | 1:00 | Nunca mostrar ni escribir contraseñas. |
| 28 | ⬜ | Tu suscripción | Plan, pagos y cómo activar el paquete Avanzado | 1:00 | La landing muestra precios y descuento "primeros 3 meses": verificar vigencia antes de grabar. |
| 29 | ⬜ | Si te trabás | Preguntarle a Orbi, el tutorial guiado, escribir a soporte | 1:00 | |

## 7. Paquete Avanzado
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 30 | ⬜ | Plantillas de Home | Galería, "Ver cómo queda", aplicarla, editar el contenido, volver a la apariencia clásica | 2:00 | Avanzado. La landing dice dieciséis diseños. |
| 31 | ⬜ | Juegos con premio | Elegir el juego, descuento por acierto, tope | 1:30 | Avanzado. Sin material de terceros (marcas, imágenes de juegos). |
| 32 | ⬜ | Modales de anuncios | Bienvenida con descuento, anuncio de temporada | 1:00 | Avanzado. |
| 33 | ⬜ | 2x1 y 3x2 | Promo automática en el carrito, con su cartel | 1:00 | Avanzado. |
| 34 | ⬜ | Oferta relámpago | Descuento con cuenta regresiva | 1:00 | Avanzado. |
| 35 | ⬜ | Prueba social | Avisos de compras reales | 0:45 | Avanzado. Solo pedidos reales: ver qué muestra el demo. |
| 36 | ❓ | Orbi en el panel | Pedirle cosas y que las haga | 1:30 | La hoja lo pone en Avanzado, pero **la landing lo lista como parte del panel** y `planes.md` dice que el chat de Orbi no tiene límite de plan. Verificar en el código qué es de cada plan antes de guionar. Antes, confirmar que esté prendido para todos los negocios (flags). |

## 8. Para mostrarle a tu cliente (sirven también como promo)
| # | Estado | Tutorial | Qué muestra | Dur. | Notas |
|---|---|---|---|---|---|
| 37 | ⬜ | Así compra tu cliente | Tienda, carrito, checkout y seguimiento | 1:30 | La landing ofrece "Probá la demo": coordinar con este. |
| 38 | ⬜ | Cómo pide una devolución | El lado del cliente del tutorial 14 | 1:00 | |

---

## 9. Agregados a partir de la landing y del manual (faltaban en la hoja de ruta)
Lo que promete [orbita.site](https://orbita.site) o tiene el manual del panel y no estaba en los 38. **Son propuestas:
hay que confirmarlas antes de guionar.**

| # | Estado | Tutorial | Qué muestra | Dur. | De dónde sale |
|---|---|---|---|---|---|
| 39 | ❓ | Tu rubro y sus variantes | Cómo el panel se arma según lo que vendés: talle y color, número de serie o IMEI, venta por metro, kilo o litro, lotes con vencimiento | 2:00 | Landing ("Catálogo que entiende tu rubro", "Qué vendés"). **Verificar en el código qué soporta hoy cada rubro** antes de prometerlo en el video. |
| 40 | ⬜ | Vidriera digital o tienda online completa | La diferencia, cómo pasar de una a otra y qué pasa con los pedidos | 1:00 | Landing ("Elegís vidriera digital o tienda online completa") y manual (Configuración → Zona peligrosa). Puede cambiar el estado real de la tienda: recrear. |
| 41 | ⬜ | Ficha técnica de un producto | Las características que ve el cliente en la ficha | 1:00 | Manual (Productos → Ficha técnica). |
| 42 | ⬜ | Conectar tu Instagram | Vincular la cuenta y qué se habilita | 1:30 | Manual (Difusión → Conectar tu Instagram). Es un login de un tercero: **no se conecta**, recreación marcada (misma regla que Mercado Pago). |
| 43 | ⬜ | Publicar en Instagram | Publicar desde el panel, programar, borradores, calendario y publicaciones sugeridas por Orbi | 2:00 | Manual (Difusión). Publica en una cuenta real: recrear o cuenta de prueba, con permiso. |
| 44 | ⬜ | Responder mensajes y comentarios de Instagram | La bandeja de Instagram, respuestas rápidas y comentarios | 1:30 | Manual (Difusión). Escribe a gente real: recrear. |
| 45 | ⬜ | El tablero y las estadísticas de Difusión | Qué te dice el tablero y las estadísticas de Instagram | 1:00 | Manual (Difusión). |
| 46 | ⬜ | Compartí el link de tu tienda | Dónde está el link, cómo pegarlo en Instagram y WhatsApp | 0:45 | Landing (paso 3). Si queda muy corto, **sumarlo al #6** en vez de hacerlo aparte. |

### Cruce con la landing
Qué promete cada sección de la landing y qué tutorial lo cubre:

| La landing promete | Tutorial |
|---|---|
| Catálogo que entiende tu rubro; variantes por talle, serie/IMEI, peso | #8, #39, "Cargar un producto" ✅ |
| Cobrás a tu manera (Mercado Pago, transferencia, coordinar aparte) | #4 🔄 |
| Tu dominio propio (comprar o conectar) | #24 |
| Pedidos de punta a punta, notas de crédito | #11, #13, #14 |
| Stock al día, alertas y movimientos | #9 |
| Clientes, mensajes y equipo con permisos por rol | #15, #16, #25 |
| Orbi, asistente con IA | #29, #36 ❓ |
| Reportes que se entienden | #20, #21 |
| Cupones y fotos sin fondo | #17, #18, #19, "Cargar un producto" ✅ |
| Tres pasos: rubro, productos, link, cobrar | #2, #3, #6, #46 |
| Demo como cliente y como dueño | #37, #1 ✅ |
| Paquete Avanzado (plantillas, modales, juegos, prueba social, 2x1, relámpago) | #30–#35 |
| Precio y plan | #28 |

*No hay tutorial para "Turnos y agenda" ni "Gimnasios": la landing los marca como **en camino**, no existen todavía.*

---

## Reglas que valen para todos
- Se produce con `/videos-multiagente`; la autorización y las decisiones por defecto están en
  `.claude/skills/videos-multiagente/referencia/decisiones.md`.
- Cualquier cuenta o login de un tercero (Mercado Pago, Instagram, Google) **no se conecta**: recreación marcada.
- Todo lo que se toque en el negocio de demo se revierte al terminar y se anota en el informe del video.
- Los datos del video (alias, titulares, clientes) son **inventados y genéricos**, nunca de cuentas reales.

## Registro
| Fecha | Qué pasó |
|---|---|
| 2026-10-13 | #1 "Conocé tu panel" v2 entregada. |
| 2026-10-17 | #6 "Publicar tu tienda" entregado (corte final aprobado por los dos supervisores; final 4K → 1440p). |
| 2026-10-14 | #5 y #6: ensayos limpios, tomas reales hechas (demo revertido, nada publicado) y voces generadas (US$ 0,26 en total). Esperan los mp3.
| 2026-10-14 | Guiones de #5 y #6 aprobados; los dos esperan el login de la persona para el ensayo (sesión del panel caída).
| 2026-10-14 | Arrancan #5 y #6 (guion). Las tomas reales se hacen **de a una**: hay un solo navegador con la sesión del panel. |
| 2026-10-14 | #4 "Configurar cómo cobrás": guion aprobado, toma real hecha, voz generada (US$ 0,23), borrador v1 de 1:38 listo. Se arma esta lista (#39–#46 salen de la landing y del manual). |
