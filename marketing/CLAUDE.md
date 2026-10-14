# Marketing — instrucciones para Claude

Esta carpeta es el área de marketing de Órbita (video, reels, anuncios, contenido). El
`CLAUDE.md` de la raíz del repo se carga igual: tiene el contexto técnico del producto.
Para marketing, el resumen comercial está en [`CONTEXTO.md`](CONTEXTO.md): **leelo antes de
escribir cualquier guion o texto**.

## Fuentes de verdad (verificá ahí, no de memoria)

- Qué hace el producto hoy: `apps/web/src/modules/ventas/panel/manual/contenido.ts` (el manual
  del panel) y el código de cada pantalla en `apps/web/src/modules/`.
- Precios y qué incluye cada plan: `apps/web/src/modules/landing/components/v2/planesDatos.ts`.
  Qué es de pago se verifica en el código (`.claude/skills/videos-tutoriales/referencia/planes.md`).
- Cómo se comunica Órbita hoy: la landing (`apps/web/src/modules/landing/`), en especial
  `Comparativa.tsx`.
- Demo pública sin login ni datos reales: `demo.orbita.site`.

## Reglas del área

1. **Español rioplatense, voseo** ("cargá", "vendé", "tenés"). Tono cercano y claro, sin jerga
   técnica ni promesas infladas.
2. **No nombrar competidores** en ninguna pieza. Hablar de lo que Órbita hace ("sin comisión por
   venta"), no de lo que otros cobran.
3. **No mostrar ni prometer funciones que no existen** (por ejemplo turnos, mientras no esté
   lanzado). Antes de mostrar una función, confirmarla en el código o en la demo.
4. **Lo de pago se marca como pago** ("Paquete Avanzado"); el precio "desde" es el del plan Base.
   Nada de "este mes" ni vencimientos: el video queda viejo.
5. **Música**: solo con licencia clara y sin Content ID (Pixabay). Claude no puede escuchar:
   propone 3 opciones y la persona elige. Registrar la fuente en `recursos/musica/LICENCIAS.md`.
6. **Producción de video**: usar la skill `videos-tutoriales` (`.claude/skills/videos-tutoriales/`)
   con todas sus reglas (contraseñas, perfil persistente único, ensayo antes de grabar, aprobación
   del guion antes de la toma real). No reinventar herramientas.
7. **Nunca commitear** videos ni audio (ya están en `.gitignore`). Ni subirlos a ningún lado
   sin que lo pida la persona.
8. **Antes de grabar**, confirmar con la persona: formato, guion, datos de ejemplo y música.
9. Las entregas finales van a `videos/<tipo>/` con el nombre `AAAA-MM-DD_slug_formato.mp4`;
   la producción intermedia, a `~/orbita-videos/<slug>/` (fuera del repo).

## Skills útiles para esta área

Ya disponibles en el repo o en la cuenta: `videos-tutoriales` (video con pantallas reales,
reels, promos), `brand` (voz y consistencia de marca), `banner-design` (banners y piezas
estáticas), `design` (logos, identidad, fotos para redes), `slides` (presentaciones),
`ui-ux-pro-max` (si la pieza es una página o un componente). Detalle en
[`skills/README.md`](skills/README.md).
