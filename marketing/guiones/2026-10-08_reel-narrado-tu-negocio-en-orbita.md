# Reel narrado: "Tu negocio, en órbita"

- **Estado:** BORRADOR v1, para aprobar antes de producir.
- **Formato:** 9:16, ~31 s, 60 fps · Instagram Reels / TikTok (zonas seguras de TikTok).
- **Referencia principal:** "Too many signals" (`referencias/fichas/Dcn6EINyzaa.md`): la voz lenta, el
  texto que sigue a la narración, el caos que se ramifica y converge.
- **Copy base:** el plan de Instagram de marketing ("Hoy tu negocio está disperso" → "¿Qué pasaría si
  todo pudiera estar en un solo lugar?" → "Tu negocio, en órbita.").
- **Estructura en 4 fases:** gancho · problema · solución · cierre con logo.
- **Voz:** ~55 palabras en 31 s (1,8 palabras/s), silencios largos en los giros. Ver "Dirección de voz" en
  `referencias/patrones.md`.

## Guion

Los tiempos copian el ritmo medido en la referencia. `‖` = pausa (entre paréntesis, cuánto).

| Fase | Tiempo | Voz | Texto en pantalla | Imagen |
|---|---|---|---|---|
| **1. Gancho** | 0,0–2,4 | "Pedidos, ‖(0,35) clientes, ‖(0,35) stock." ‖(1,1) | demasiados **[pedidos]** → **[clientes]** → **[stock]** (la palabra cambia dentro de una caja azul) | Fondo noche. Fragmentos flotando: burbujas de chat genéricas, celdas de planilla, un papelito, una calculadora. |
| | 3,4–5,0 | "Todo repartido en mil lugares." ‖(1,8) | — | Aparece el satélite con brillo. Una línea sale de él y **se ramifica** hacia íconos dispersos: Pedidos ("12 sin responder"), Clientes, Catálogo, Stock, Descuentos. |
| **2. Problema** | 6,8–8,3 | "¿Y si estuviera todo conectado?" ‖(1,4) | **conectado.** | Las ramas se repliegan hacia el centro, los íconos caen en órbita alrededor del satélite y se cierran en un anillo. |
| **3. Solución** | 9,7–10,5 | "Conocé Órbita." ‖(0,9) | — | Corte a blanco: **el logo real** (`OrbitaLogo`) + "Órbita". |
| | 11,4–15,3 | "Cargá un producto ‖ y Orbi te escribe la descripción." ‖(0,5) | **Orbi** te ayuda a **[cargar]** tus productos | La caja de "nombre del producto" se escribe sola ("Taza de cerámica") y Orbi completa Descripción / Categoría / Etiquetas; después el estallido de cartas de productos. |
| | 15,8–20,4 | "Recibí pedidos, ‖(0,5) cobrá online ‖(0,3) y seguí cada venta." ‖(0,7) | pedidos · **cobros** · ventas | Notificaciones de pedidos que se apilan → tarjeta que gira con el ✓ de cobro. |
| | 21,1–25,9 | "Juntá tus clientes, ‖(0,5) mirá tus números ‖(0,3) y entendé qué funciona." ‖(0,5) | clientes · **métricas** · decisiones | Las ramas vuelven pero ahora ordenadas (como el árbol de la referencia): clientes, ventas, productos más vendidos, que florecen. |
| **4. Cierre** | 26,0–29,5 | "Un solo lugar para mostrar, ‖(0,4) vender ‖(0,4) y entender tu negocio." ‖(0,5) | Un solo lugar para **[mostrar]** → **[vender]** → **[entender]** | Fondo luminoso (cielo azul o degradé de marca). La palabra cambia como en "One place to imagine / build / discover". |
| | 30,0–31,0 | "Tu negocio, ‖ en órbita." | logo + **Órbita** + `orbita.site` | Logo real; el satélite da su vuelta. |

**Palabras:** 56. **Funciones mencionadas** (todas confirmadas en el manual del panel): carga de
productos con Orbi (redacta la descripción desde el nombre: plan base), pedidos, cobro online, clientes,
métricas. Sin precios, sin cifras de clientes, sin competidores.

## Sonido

- Voz arriba de todo; golpes y *whoosh* afinados como en el hook, pero 6–8 dB más bajos y **solo en los
  silencios** de la voz (nunca encima de una palabra).
- Colchón suave que se abre (de grave a brillante) cuando entra "Conocé Órbita".

## Decisiones tomadas (2026-10-08)

- **Voz:** hombre, **grave, cálida y lenta**, estilo locutor. No la del dueño. Opciones en evaluación (ver abajo).
- **Acento de color:** **celeste** (el coral no es parte del branding). El satélite y los acentos van en
  celeste (`#93c5fd` / `#60a5fa`), como el satélite del `OrbitaLogo`.
- **Cierre:** siempre "**Tu negocio, en órbita.**" + logo.

## Voz: candidatas

| Opción | Voz | Por qué | Costo |
|---|---|---|---|
| Gemini TTS | Charon (informativa), Algenib (grave, áspera), Orus y Alnilam (firmes), Schedar (pareja) | Ya integrado; pausas con `[long pause]` | Centavos por video |
| ElevenLabs | Voces de la biblioteca: español, hombre, "deep / warm / narrative", acento argentino o latino | La más natural de las sintéticas; sirve para los 100 videos | Plan pago (ver precio vigente en su web) |
| Locutor humano | Locutor rioplatense de voz grave (Workana, Fiverr, Voice123) | Lo más natural; se le pasa la "dirección de voz" | Por presupuesto (pedir que incluya derechos de uso en redes y anuncios) |

### Prueba con ElevenLabs (2026-10-08)

Conector de ElevenLabs conectado. Misma frase para comparar: "Pedidos... clientes... stock. Todo
repartido en mil lugares. ¿Y si estuviera todo conectado? Conocé Órbita. Tu negocio, en órbita."
Modelo `eleven_v4`, 130 créditos por muestra (~US$0,026). Flow:
https://elevenlabs.io/app/flows/3TR3hmbyMmMh24LCz9xc

| Voz | voice_id | Acento | Descripción de la biblioteca |
|---|---|---|---|
| Octavio - Calm Narrator | `YmwwQQdY9i3i0hBWn1SD` | argentino | cálida y grave, cercana, "suena a una persona real" |
| Jesús - Dark Mystery Narrator | `DWrVftdnFieVgzNH3uzf` | argentino | profunda, cinematográfica, tono noir |
| Andres - deep and resonant | `kaiddX0QvoiyhiiPCNCg` | latino | profunda, cálida, estable |
| Fran ("Emotional, Rich and Deep") | `0bu1GUsOfNJYyXbmSTxD` | argentino (leve) | emotiva y profunda, cercana y cálida · pedida por el usuario |
| (link del usuario) | `gSYqSbtMajxq5LUT0bNl` | — | https://elevenlabs.io/voices/gSYqSbtMajxq5LUT0bNl · pedida por el usuario |
| (link del usuario) | `htFfPSZGJwjBv1CL0aMD` | — | https://elevenlabs.io/voices/htFfPSZGJwjBv1CL0aMD · pedida por el usuario |

Otras para probar si ninguna convence: Gabriel Narrador Neutral (`Y4A7VD8bsOlWNzF8WIRV`, mexicano, calmo y
cálido), Adriel – Deep Storyteller (`TNuNcwk4LzbPpi1XEANc`, mexicano, pausado), Alex C (`HJZsH9Tm3FtUeJzIjWVE`,
neutro, ritmo pausado y sobrio).

### El problema es la interpretación, no el timbre (2026-10-08)

Ninguna de las 6 voces convenció: el usuario busca el estilo de **narrador publicitario argentino clásico**
(grave, cálido, pausado, épico y cercano, del estilo de los spots de cerveza), y lo que falla es la
**tonalidad**, no la voz. Las primeras muestras salieron sin dirección. Dos caminos:

1. **TTS dirigido:** etiquetas de interpretación de `eleven_v4` (`[warmly]`, `[slowly]`, `[softly]`,
   `[short pause]`, `[long pause]`) + puntuación. Prueba: Octavio, 2 tomas (238 créditos c/u):
   `[warmly] [slowly] Pedidos. [short pause] Clientes. [short pause] Stock. [long pause] Todo… repartido en mil lugares. [long pause] [softly] ¿Y si estuviera todo conectado? [long pause] [warmly] Conocé Órbita. [pause] Tu negocio… en órbita.`
2. **Cambiador de voz (speech-to-speech):** una persona graba la frase con la entonación exacta (el celular
   alcanza) y ElevenLabs le pone la voz grave conservando entonación y tiempos. Control total del tono.
   No se imita a un locutor real concreto: se toma el estilo, no la identidad.

Créditos usados hasta acá: ~1.256.

## Guion v2: con la construcción y la tonada del original (2026-10-09)

Basado en el audio de la referencia ("Too many signals…", `referencias/fichas/Dcn6EINyzaa.md`) y su
entonación medida (`referencias/fichas/Dcn6EINyzaa-entonacion.md`).

### Qué lo hace bueno y cómo lo trasladamos

| Original | Nuestro | Recurso |
|---|---|---|
| Too many signals, tabs, thoughts | **Demasiados** chats, planillas, notas, | El caos en 3 sustantivos, parejos, como quien enumera. Acento en la primera palabra. |
| spread between countless systems. | repartidos en mil lugares. | La consecuencia, cayendo. |
| What if it all connected? | ¿Y si **todo** se conectara? | **La pregunta baja al final** (−7,8 semitonos): se dice como idea, no como duda. |
| Meet OpenAI. | **Conocé** Órbita. | Dos palabras; el acento en el verbo, no en la marca. |
| Describe what you imagine… in seconds. | **Escribí** el nombre de un producto, dejá que Orbi lo describa, y mostralo en tu tienda. | Verbos en imperativo: lo que hacés **vos**, y la herramienta te acompaña. |
| Write code…, find what's broken, and let OpenAI make it work. | **Recibí** pedidos, cobrá online, y llevá la cuenta sin planillas. | Tríada: dos acciones tuyas y la tercera es el alivio. "Sin planillas" vuelve al problema del gancho. |
| Bring scattered information together, connect the dots, and uncover what matters. | **Juntá** todo, uní los puntos, y entendé qué funciona. | Tríada que cierra el problema ("repartidos" → "juntá todo"; "conectara" → "uní los puntos"). |
| One place to imagine, build, and discover. | **Un solo lugar** para mostrar, vender y entender. | Cada verbo resume un bloque: mostrar (5), vender (6), entender (7). Estructura circular. |
| OpenAI. | Tu negocio, en órbita. | La marca al final, sola. La firma del plan de marketing. |

La marca aparece 3 veces, como en el original: al revelarse ("Conocé Órbita"), en el medio (Orbi) y al
cerrar ("en órbita"). 60 palabras (el original: 58 en 31 s).

### Personalidad

Calma, segura, sin vender. Invita, no grita. Frases de una idea, palabras simples, verbos al
principio, cero adjetivos de publicidad ("increíble", "revolucionario"). Asombro tranquilo.

### Para el locutor (`/` pausa corta · `//` pausa larga · **negrita** = acento · ↘ la frase cae)

> **Demasiados** chats, / planillas, / notas, /
> repartidos en mil lugares. ↘ //
> ¿Y si **todo** se conectara? ↘ //
> **Conocé** Órbita. ↘ //
> **Escribí** el nombre de un producto, / dejá que Orbi lo describa, / y mostralo en tu tienda. ↘ /
> **Recibí** pedidos, / cobrá online, / y llevá la cuenta sin planillas. ↘ /
> **Juntá** todo, / uní los puntos, / y entendé qué funciona. ↘ //
> **Un solo lugar** para mostrar, / vender / y entender. ↘ /
> Tu negocio, / en órbita.

### Versión para ElevenLabs (etiquetas de interpretación)

```
[warmly] [slowly] DEMASIADOS chats, planillas, notas… repartidos en mil lugares. [long pause] [softly] ¿Y si TODO se conectara. [long pause] [warmly] CONOCÉ Órbita. [pause] Escribí el nombre de un producto, dejá que Orbi lo describa… y mostralo en tu tienda. [short pause] Recibí pedidos, cobrá online… y llevá la cuenta sin planillas. [short pause] Juntá todo, uní los puntos… y entendé qué funciona. [long pause] Un solo lugar para mostrar, vender y entender. [pause] Tu negocio… en órbita.
```

(La pregunta va con punto final a propósito, para que el modelo la diga cayendo, como el original.)

### Dirección de voz: lo que NO funciona (2026-10-09)

- `[slowly]`, `[softly]`, puntos suspensivos y pausas largas por todos lados hacen que la voz suene **con
  pereza**, arrastrada. El usuario lo calificó de "horrible". **No usar.** La calma del original viene de
  frases cortas y finales que caen, no de hablar lento.
- Dirección vigente: `[confident] [warmly]` al principio y `[pause]` / `[short pause]` solo en los giros.
- Voz en prueba: **El Faraón** (`8mBRP99B2Ng2QwsJMFQl`, "Full, Clear, Mellow"), pedida por el usuario.
- "dejá que Orbi lo describa" se pegaba ("órbilo") → "Orbi te lo describe".

```
[confident] [warmly] Demasiados chats, planillas, notas, repartidos en mil lugares. [pause] ¿Y si todo se conectara. [pause] Conocé Órbita. [short pause] Escribí el nombre de un producto, Orbi te lo describe, y mostralo en tu tienda. Recibí pedidos, cobrá online, y llevá la cuenta sin planillas. Juntá todo, uní los puntos, y entendé qué funciona. [pause] Un solo lugar para mostrar, vender y entender. [short pause] Tu negocio, en órbita.
```
