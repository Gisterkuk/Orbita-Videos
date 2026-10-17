# Monitor de agentes en 3D: constelación + oficinas

## Por qué
El monitor actual es una página por video: hay que elegir cada video en un selector y no se siente la actividad
en vivo. Con varios videos en paralelo se pierde el control. La persona quiere una vista panorámica de todos los
videos a la vez, en 3D, profesional, con la comunicación entre agentes como líneas con partículas, y poder entrar
a cada video y a cada agente para ver qué hizo y, sobre todo, **por qué rechazó** algo.

## Qué se acordó (palabras de la persona)
- **Constelación** de afuera: todos los videos dentro de un ciclo más grande.
- **Oficina** de adentro: clic en un video → zoom → su equipo independiente, con el director en el centro.
- **Ficha del agente**: historial legible de todo lo que recibió, devolvió y rechazó.
- **Por qué se rechazó**: visible cada vez que un juez, analista o supervisor rechaza.
- Solo los **mensajes entre agentes** (no se registran pasos internos de cada agente).
- Que se pueda **ir sumando cosas** más adelante sin rehacer todo.

## Decisiones de diseño (propuestas por Claude, aceptadas en el chat)
- Constelación: Órbita en el centro; cada anillo es una etapa (Preparación → Entrega); cuanto más afuera, más
  avanzado. Color por estado: azul trabajando, ámbar pide cambios, rojo trabado (≥3 rechazos seguidos del mismo
  revisor), verde listo, gris en pausa. Hover sobre un planeta: quién rechazó, cuántas veces y el último motivo.
- Oficina: zonas Escritura / Revisión / Edición / Control; cada agente un personaje en su puesto. El agente que
  trabaja (lanzado y todavía sin devolver) late. Mensajes nuevos viajan como partículas por la línea
  director↔agente con un globito; los viejos quedan como líneas tenues. Los rechazos vuelven en rojo con el motivo.
- Ficha: resumen (tareas, rechazos, aprobaciones, tokens), filtros Todo / Recibió / Devolvió / Rechazos, tarjetas
  de la más nueva a la más vieja con veredicto, motivos, qué pasó después y el texto o documento completo.

## Cómo se hace (decisión de Claude)
- Three.js 0.170.0 copiado dentro del skill (`pagina/vendor/`), sin internet ni build.
- Mismo servidor y mismos datos (`eventos.jsonl` + archivos de `produccion/`). No cambian el hook ni los agentes.
- El modelo (rol de cada evento, estado de cada video, historial y motivos) se arma en el servidor
  (`herramientas/lib/modelo.mjs`, con tests) y la página solo dibuja.
- Nuevos endpoints: `/api/resumen` (todos los videos) y `/api/video?slug=` (modelo de un video);
  `/api/stream` sin slug avisa cambios de cualquier video.
- La página nueva está en `/`; la anterior queda en `/clasica`.
- Solo modo oscuro. Navegación con la dirección (`#/v/<slug>/<agente>`) para recargar sin perder el lugar.
- Partes separadas (escena, constelación, oficina, ficha, datos) para poder extender.

## Fuera de alcance
- Registrar pasos internos de los agentes.
- Escribir en producción o controlar agentes desde el monitor (es solo para mirar).
