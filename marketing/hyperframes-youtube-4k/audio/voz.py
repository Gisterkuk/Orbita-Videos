"""Arma la voz final del video combinando frases de varias tomas de ElevenLabs (El Faraón).

    python -I audio/voz.py            -> assets/audio/voz-A.wav y assets/audio/voz-D.wav (48 kHz, 24 bit)

Decisión del usuario (2026-10-09): el principio pausado (tomas 1) y, desde que aparece Orbi
("Le sacás una foto…"), el ritmo más ágil de la toma A2. Los silencios de la enumeración se van
acortando para que el ritmo suba de a poco. La versión D es igual a la A salvo el gancho (para A/B).

Cada frase se corta donde de verdad empieza y termina el sonido (energía, no solo lo que dice
Whisper), se iguala el volumen de cada toma y entre frases va silencio con fundidos de 8 ms.
Después: python -I ../referencias/tiempos.py assets/audio/voz-A.wav audio/tiempos-A.json
"""
import json
import subprocess
from pathlib import Path

import numpy as np

SR = 48000
RAIZ = Path(__file__).resolve().parent.parent
VOCES = RAIZ.parent / "recursos" / "voces"
TIEMPOS = RAIZ.parent / "_trabajo" / "tiempos"
SALIDA = RAIZ / "assets" / "audio"


def leer(nombre):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(VOCES / f"2026-10-09_una-foto-{nombre}.mp3"),
         "-ac", "1", "-ar", str(SR), "-af", "aresample=resampler=soxr", "-f", "f32le", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


TOMAS = {n: leer(n) for n in ["A-toma1", "A-toma2", "D-toma1"]}
PALABRAS = {n: json.loads((TIEMPOS / f"{n}.json").read_text(encoding="utf-8"))["palabras"] for n in TOMAS}


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


def envolvente(x, ventana=0.01):
    n = int(SR * ventana)
    e = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, mode="same"))
    return 20 * np.log10(e + 1e-9)


# Volumen de habla de cada toma (solo donde hay voz), para igualarlas a la A1
def nivel_habla(x):
    e = envolvente(x)
    return rms_db(x[e > -40])


REF = nivel_habla(TOMAS["A-toma1"])
GANANCIA = {n: 10 ** ((REF - nivel_habla(x)) / 20) for n, x in TOMAS.items()}


def frase(toma, desde, hasta):
    """Frase entre la palabra que empieza en `desde` y la que termina en `hasta` (segundos de Whisper),
    con los bordes ajustados al sonido real: hacia atrás hasta 0,15 s y hacia adelante hasta el silencio."""
    x, e = TOMAS[toma], envolvente(TOMAS[toma])
    ws = PALABRAS[toma]
    ini = next(w["ini"] for w in ws if abs(w["ini"] - desde) < 0.02)
    fin = next(w["fin"] for w in ws if abs(w["fin"] - hasta) < 0.02)
    prev_fin = max([w["fin"] for w in ws if w["fin"] <= ini + 0.01] or [0.0])
    sig_ini = min([w["ini"] for w in ws if w["ini"] >= fin - 0.01] or [len(x) / SR])
    umbral = -45
    a = int(ini * SR)
    lim_a = int(max(prev_fin, ini - 0.15) * SR)
    while a > lim_a and e[a] > umbral:
        a -= 1
    b = int(fin * SR)
    lim_b = int(min(sig_ini - 0.04, fin + 0.45) * SR)
    quieto = 0
    while b < lim_b:
        quieto = quieto + 1 if e[b] < umbral else 0
        if quieto > int(0.06 * SR):
            b -= quieto - int(0.03 * SR)
            break
        b += 1
    y = x[a:b] * GANANCIA[toma]
    frase.ultima = [{"p": w["p"], "ini": w["ini"] - a / SR, "fin": w["fin"] - a / SR} for w in ws if ini - 0.01 <= w["ini"] and w["fin"] <= fin + 0.01]
    f = int(0.008 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def silencio(seg):
    return np.zeros(int(seg * SR), dtype=np.float32)


# (toma, ini de la primera palabra, fin de la última, silencio después)
GANCHO = {
    "A": [("A-toma1", 0.00, 1.64, 0.55), ("A-toma1", 2.24, 4.14, 0.70)],
    "D": [("D-toma1", 0.00, 2.72, 0.45), ("D-toma1", 3.22, 3.84, 0.80)],
}
# El problema, pausado y acelerando: los silencios de la lista bajan de 0,46 a 0,32 s
CUERPO = [
    ("A-toma1", 4.86, 5.32, 0.46),    # Nombre.
    ("A-toma1", 5.80, 6.44, 0.42),    # Descripción.
    ("A-toma1", 6.90, 7.58, 0.38),    # Categoría.
    ("A-toma1", 8.12, 9.22, 0.20),    # Talles, colores,
    ("A-toma1", 9.44, 10.04, 0.34),   # etiquetas.
    ("A-toma1", 10.54, 12.38, 0.78),  # Y eso, por cada producto.   (giro: silencio de verdad)
    ("A-toma1", 13.18, 14.88, 0.80),  # ¿Y si alcanzara con una foto?
    # Desde Orbi, la toma A2 corrida de punta a punta, con sus pausas naturales (más ágil)
    ("A-toma2", 14.24, 34.12, 1.60),  # Le sacás una foto … Tu negocio, en órbita.  + cola para el logo
]

SALIDA.mkdir(parents=True, exist_ok=True)
for version, gancho in GANCHO.items():
    partes, marcas, t = [silencio(0.15)], [], 0.15
    for toma, a, b, pausa in gancho + CUERPO:
        y = frase(toma, a, b)
        marcas += [{"p": w["p"], "ini": round(t + w["ini"], 3), "fin": round(t + w["fin"], 3)} for w in frase.ultima]
        partes += [y, silencio(pausa)]
        t += len(y) / SR + pausa
    voz = np.concatenate(partes)
    (RAIZ / "audio" / f"marcas-{version}.json").write_text(json.dumps({"duracion": round(len(voz) / SR, 3), "palabras": marcas}, ensure_ascii=False, indent=1), encoding="utf-8")
    pico = np.max(np.abs(voz))
    voz *= min(1.0, 0.89 / pico)  # −1 dBFS de pico; el máster final va a −14 LUFS
    destino = SALIDA / f"voz-{version}.wav"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
         "-c:a", "pcm_s24le", str(destino)],
        input=voz.astype(np.float32).tobytes(), check=True)
    print(f"{destino.name}: {len(voz) / SR:.2f} s · ganancias {', '.join(f'{k} {20*np.log10(v):+.1f} dB' for k, v in GANANCIA.items())}")
