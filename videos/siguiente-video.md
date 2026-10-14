# Prompt para el próximo video

Según la hoja de ruta, después de "Conocé tu panel" sigue el arranque para la primera venta:
**4 (cobros) → 5 (envíos) → 6 (publicar) → 11 (atender un pedido)**. Abrí una sesión de Claude Code en este
repo (Orbita-Videos) y pegá:

```
/videos-multiagente Hacé el tutorial 4 de la hoja de ruta (docs/hoja-de-ruta-tutoriales.md):
"Configurar cómo cobrás". Que el comerciante entienda las formas de cobro de su tienda y las deje
configuradas: Mercado Pago, coordinar el pago por WhatsApp, retiro en el local y el descuento por pagar
con Mercado Pago. Empezá en el Inicio del panel y terminá mostrando el checkout de la tienda con esas
opciones, como lo ve un cliente. Negocio de demo: negocio.orbita.site.

- Antes de escribir el guion, verificá en el código (orbita.config.json → codigoOrbita) qué hace cada
  opción y qué ve el cliente en el checkout.
- Mercado Pago: conectar la cuenta pasa por el login real de Mercado Pago. Preguntame antes cómo lo
  resolvemos (lo conecto yo frente a la cámara, cuenta de prueba, o mostrar hasta el botón).
- Todo lo que se cambie en la configuración del negocio de demo tiene que poder revertirse (guardá
  una copia antes, como portada.mjs).
- Mismas reglas de siempre: voz 8mBRP99B2Ng2QwsJMFQl, duración 1:30–2:00, lo que se nombra se muestra,
  datos reales desenfocados, críticos duros, agentes en Sonnet con esfuerzo medio. Pedime permiso antes
  de la toma real, de la voz y de cualquier escritura en producción.
```

Alternativa sin dependencias externas (si Mercado Pago complica): el tutorial 5, "Configurar envíos".
