# Contexto de Órbita para marketing

Resumen comercial para escribir guiones y textos sin tener que leer el código. **Puede quedar
viejo**: ante la duda, verificá en las fuentes que se listan abajo y actualizá este archivo.

_Última revisión: 2026-10-07._

## Qué es Órbita

Plataforma (SaaS multi-tenant) para que comercios vendan por su cuenta: **tienda online propia,
punto de venta (POS) y panel de gestión** en un solo lugar. Cada negocio tiene su propio sitio,
sus clientes y su panel, completamente aislados de los demás.

- Sitio: `orbita.site` · Demo pública (sin login, datos de muestra): `demo.orbita.site`.
- **Orbi**: el asistente con IA de Órbita. Dentro del panel redacta descripciones, completa
  datos, sugiere variantes y responde en un chat. Es uno de los diferenciales más fáciles de
  mostrar en video.
- Plantillas de home: el dueño elige el diseño de la portada de su tienda.

## A quién le vendemos

Dueños de comercios chicos y medianos que hoy venden por redes, WhatsApp o en el local, y
quieren una tienda propia sin depender de un tercero ni pagar comisión por cada venta. Rubros
que aparecen en la landing y la demo: ferretería, pet shop, indumentaria, bodega, papelería,
entre otros (ver `RubrosCarousel.tsx`).

## Propuesta de valor (lo que sí se puede decir)

- Tu tienda propia, lista para vender, **sin comisión por venta** (Órbita no se queda con nada
  de lo que vendés).
- Un solo panel para tienda online, caja y pedidos.
- **Orbi** te ayuda a cargar y describir productos más rápido.
- Desde el plan **Base**, por menos de $20.000 al mes. Lo del **Paquete Avanzado** (escanear
  una foto con Orbi, quitar fondo, fondos con IA, fotos oficiales) se presenta siempre con su
  etiqueta, para que el precio no confunda.

## Qué NO decir ni mostrar

- Nada de nombres de competidores ni "ellos te cobran…".
- Nada de "este mes" ni ofertas con vencimiento.
- Funciones que todavía no existen (p. ej. turnos) no se muestran ni se prometen.
- No usar datos reales de clientes/negocios: para pantallas usar la demo pública o un negocio
  de prueba, y con permiso.

## Etapa actual: piloto en mercado cerrado (plan de marketing, agosto 2026)

Fuente: "PLAN INSTAGRAM ORBITA" de marketing (agosto 2026).

- **Hasta fin de 2026 Órbita está en prueba piloto** con los primeros negocios (Indecisas Clothes, Te
  Falta Calle, GV Store y los que se sumen). El plan dice que **no hay campaña activa en redes**: el
  Instagram (`@orbita.site`) se arma como "mini landing" para los candidatos que reciben la tarjeta, con
  **carruseles, no reels**, para generar **confianza, no alcance**. Publicar reels o TikToks ahora es una
  decisión del equipo que se aparta de ese plan: acordarla con marketing.
- **Transparencia de etapa:** no aparentar comunidad, cifras, clientes ni casos que todavía no existen.
  "Estamos construyendo Órbita" es parte de la identidad, no algo que se esconde.
- **Firma:** "Tu negocio, en órbita." · "Hecho por emprendedores, para emprendedores." · "Mostrá,
  organizá y entendé tu negocio". Nombre visible del perfil: "Órbita | Gestión para negocios".
- **Narrativa aprobada:** tu negocio está disperso (WhatsApp, Instagram, Excel, notas) → perdés tiempo,
  cometés errores, decidís con información incompleta → ¿y si todo estuviera en un solo lugar? → Órbita.
- **Equipo:** Mateo Rojas (CEO), Alan Vega (CTO), Alexander Ibarra (CPO).
- **Sistema visual del plan:** azul oscuro de base, blanco para respirar, **celeste como acento**, órbitas
  sutiles. (Los videos del hook usan coral para el satélite: a decidir si se alinea.)

## Identidad visual (resumen — detalle en [`marca/README.md`](marca/README.md))

Fondo azul marino con anillos orbitales, azules de marca (`#2563EB`, `#3B82F6`), tipografías
**Geist** (texto y wordmark "Órbita" en 900) y **Sora** (títulos). Logo: el `OrbitaLogo` de la web
(anillo fino completo, planeta azul con brillo, satélite celeste que gira), en
`apps/web/src/design-system/components/OrbitaLogo.tsx`.

## Fuentes de verdad

| Tema | Dónde mirar |
|---|---|
| Qué hace el panel hoy | `apps/web/src/modules/ventas/panel/manual/contenido.ts` |
| Planes y precios | `apps/web/src/modules/landing/components/v2/planesDatos.ts` |
| Qué es de pago | `.claude/skills/videos-tutoriales/referencia/planes.md` + código (`@RequiresAddon`) |
| Mensaje actual de la landing | `apps/web/src/modules/landing/components/` |
| Producción de video | `.claude/skills/videos-tutoriales/` |
| Arquitectura (si hace falta) | `CLAUDE.md` de la raíz, `ESTRUCTURA.md` |
