# Herramientas open source de redes: qué nos sirve (relevado 2026-10-10)

Relevamiento de los repos más populares de "social media" en GitHub, pensando en el marketing de
Órbita **hoy**: ya abierto al público (ver `../CONTEXTO.md`; el plan de piloto de agosto ya no rige),
un pipeline propio de video (HyperFrames + ElevenLabs) y la idea de producir contenido en lote.

## Resumen

| Repo | Qué es | ¿Nos sirve? |
|---|---|---|
| [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) (37k ★, AGPL-3.0) | Programador de publicaciones para 14 redes (Instagram, TikTok, Facebook, LinkedIn, X, YouTube, Threads, Pinterest…), con IA, **API, MCP, n8n, Make y Zapier** | **Sí, el más útil.** Programar y publicar desde un solo lugar, y que Claude programe por MCP |
| [apify/apify-mcp-server](https://github.com/apify/apify-mcp-server) (10,4k ★, de la búsqueda) | MCP para que un agente extraiga datos de redes, buscadores y sitios | **Sí, para referencias:** trae vistas, likes y comentarios de reels que `yt-dlp` no expone sin sesión |
| [enescingoz/awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates) (25,9k ★, de la búsqueda) | 280+ plantillas de automatizaciones n8n | **Quizás**, si se arma un flujo con n8n (avisos, respuestas, reportes) |
| [langchain-ai/social-media-agent](https://github.com/langchain-ai/social-media-agent) (2,8k ★, MIT) | Agente que lee una URL, redacta posts para **X y LinkedIn** y espera aprobación humana antes de programarlos | **Como idea, no como herramienta:** sus redes no son las nuestras y pide muchas claves (Anthropic, LangSmith, FireCrawl, Arcade, Supabase). El patrón URL → borrador → aprobación → programar lo armamos con Claude + Postiz |
| [sherlock-project/sherlock](https://github.com/sherlock-project/sherlock) (93,8k ★, MIT) | Busca un nombre de usuario en 400+ redes | **Uso puntual:** ver dónde está libre el usuario de la marca (`orbita.site`, `orbitasite`…) para reservarlo igual en todas. Solo para nuestra marca, no para investigar personas |
| [StevenBlack/hosts](https://github.com/StevenBlack/hosts) (31,2k ★, MIT) | Lista de bloqueo de publicidad y rastreadores a nivel DNS | **No es para marketing.** Solo recuerda que una parte del público bloquea píxeles: medir también con UTMs y datos propios del panel |
| [slymnoyann/hey.xyz](https://github.com/slymnoyann/hey.xyz) (29,3k ★, AGPL/GPL) | Red social descentralizada sobre Lens (web3); copia histórica, ya no se mantiene abierta | **No.** Nuestro público (comercios) no está ahí |

Otros de la búsqueda que no aplican: `qeeqbox/social-analyzer` (perfilar personas en 1.000 sitios: no
lo usamos), `krillinai/OpenCreator` (traducción y voz de videos: ya lo cubrimos con ElevenLabs),
`cjhutto/vaderSentiment` (sentimiento solo en inglés).

## Postiz en detalle

- **Redes:** Instagram, YouTube, LinkedIn, Facebook, TikTok, X, Threads, Pinterest, Reddit, Bluesky,
  Mastodon, Dribbble, Slack, Discord.
- **Integraciones:** API pública con webhooks, **endpoint MCP**, CLI, SDK de Node, nodo de n8n, Make y
  Zapier. Con el MCP, Claude podría dejar programado un reel o un carrusel apenas se renderiza.
- **Equipo:** invitar miembros, comentar y programar en conjunto (no describe un flujo formal de
  aprobación).
- **Dos formas de usarlo:**
  - **Postiz Cloud:** suscripción por plan, prueba de 7 días; ya trae resueltas las conexiones con
    cada red y las estadísticas. **La recomendada para empezar.**
  - **Autoalojado:** gratis (AGPL-3.0), pero hay que levantar Next.js + NestJS + PostgreSQL + Redis +
    Temporal + almacenamiento, y **crear y hacer aprobar apps propias en Meta y TikTok** para publicar,
    que es lo más trabajoso.
- **Encaje:** sirve también para programar carruseles y otras piezas estáticas,
  no solo reels.

## Qué haría

1. **Probar Postiz Cloud** (prueba de 7 días) con `@orbita.site`: programar el primer carrusel del plan
   y conectar su MCP para que Claude pueda programar desde acá.
2. **Apify para las referencias:** sumar vistas y estadísticas reales a `referencias/catalogo.md`, que
   hoy salen vacías en Instagram. Es de pago por uso: probar primero con pocas URLs.
3. **Sherlock una vez**, para elegir un usuario de marca libre en todas las redes donde vayamos a estar.
4. El agente de LangChain no hace falta: el mismo flujo (contenido → borrador → aprobación →
   programación) sale con Claude + Postiz, en nuestras redes y en castellano.

> **Nota (2026-10-14):** la publicación ya no depende de una herramienta externa: Órbita tiene su propia cola de
> aprobación y las integraciones de TikTok e Instagram en el superadmin. Ver `docs/marketing/FLUJO-PROSPECCION-Y-VIDEOS.md` del repo de Órbita.
