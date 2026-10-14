# Voz y música en los videos de la cola

Vos no podés escuchar: no sabés si una voz suena natural ni si una pista es pegadiza o está bien mezclada. Por eso las
dos decisiones **las toma una persona**, una sola vez, y después se reutilizan.

## Voz
- Se elige **antes de la primera tanda**: mandá 3–4 muestras cortas (la misma frase con distintas voces, en mp3) y que la
  persona elija. Lo elegido se anota en `~/orbita-videos/cola/preferencias.json` (fuera del repo) para no preguntarlo de nuevo:
  `{ "voz": "<id o nombre>", "motor": "gemini | elevenlabs", "tempo": 1.08 }`.
- Tono de **anuncio**, no de guía: frases cortas, preguntas que enganchan («¿Qué se vende más? Preguntale a Orbi»).
  Voseo rioplatense. Una frase por bloque, hasta 15 palabras. Nada de instrucciones de estilo dentro del texto: el TTS las lee en voz alta.
- Las claves del motor de voz las pasa la persona por variable de entorno en esa sesión. No las busques, no las guardes.
- **Costo:** un reel de ~30 s son unas 8–10 frases. Con Gemini TTS ronda los centavos de dólar por video
  (en el repo se midieron ~US$ 0,002 por frase corta); con ElevenLabs depende del plan y de los créditos que queden.
  Decile a la persona la cifra estimada de la tanda **antes** de generar, y cortá si se pasa.
- Si usan una voz clonada, tiene que ser de una persona del equipo que dio su consentimiento. Nunca la voz de un tercero.

## Música
- Solo pistas ya aprobadas en `marketing/recursos/musica/LICENCIAS.md` (licencia clara y **sin Content ID**, por ejemplo Pixabay).
- Si la lista está vacía, **el video va sin música** (solo voz y efectos). No elijas ni descargues pistas por tu cuenta.
- Para sumar una pista: la persona la elige a oído, se registra la fuente y la licencia en ese archivo, y recién ahí se usa.
- `controles.mjs` mide el volumen final de todo el audio (voz + música + efectos): debe quedar entre −17,5 y −12,5 LUFS con pico ≤ −1 dBFS.

## Lo que no se hace sin la persona
Elegir voz o música, gastar más voz que lo confirmado, usar la voz de alguien que no lo autorizó, descargar audio de
una fuente sin licencia clara.
