"""Entonación de una narración: qué palabra se acentúa en cada frase y si la frase cae o sube al final.

    python marketing/referencias/entonacion.py <audio_o_video> [salida.md]

Transcribe con tiempos por palabra (faster-whisper, local), mide tono (F0) y energía de cada palabra y
marca: la palabra más fuerte de cada frase (★), la más aguda (↑) y la curva del final (cae / sube / plana).
Con música de fondo el tono es aproximado; la energía y las pausas son confiables.
"""
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

src = Path(sys.argv[1])
salida = Path(sys.argv[2]) if len(sys.argv) > 2 else None
tmp = Path(tempfile.gettempdir()) / "entonacion-16k.wav"
# Banda de voz (100–4000 Hz) para que la música moleste menos
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "16000", "-af", "highpass=f=90,lowpass=f=4000", str(tmp)], check=True)
with wave.open(str(tmp)) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
SR = 16000

segs, info = WhisperModel("small", device="cpu", compute_type="int8").transcribe(x, word_timestamps=True, beam_size=5)
frases = []
for s in segs:
    ws = [w for w in (s.words or [])]
    if ws:
        frases.append(ws)


def f0_de(a, b):
    n, hop, vals = 640, 160, []
    for i in range(int(a * SR), max(int(a * SR) + 1, int(b * SR) - n), hop):
        fr = x[i:i + n]
        if len(fr) < n or np.sqrt(np.mean(fr ** 2)) < 0.012:
            continue
        fr = fr - fr.mean()
        ac = np.correlate(fr, fr, "full")[n - 1:]
        lo, hi = SR // 300, SR // 65
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.45 * ac[0]:
            vals.append(SR / k)
    return float(np.median(vals)) if vals else None


def db_de(a, b):
    fr = x[int(a * SR):int(b * SR)]
    return float(20 * np.log10(np.sqrt(np.mean(fr ** 2)) + 1e-9)) if len(fr) else -90.0


lineas = ["| Frase | Palabras (★ más fuerte · ↑ más aguda) | Final | Duración |", "|---|---|---|---|"]
for ws in frases:
    datos = [(w.word.strip(), w.start, w.end, f0_de(w.start, w.end), db_de(w.start, w.end)) for w in ws]
    fuerte = max(range(len(datos)), key=lambda i: datos[i][4])
    con_f0 = [i for i, d in enumerate(datos) if d[3]]
    aguda = max(con_f0, key=lambda i: datos[i][3]) if con_f0 else None
    # Final: tono de la última palabra con F0 contra la mediana de la frase
    final = "—"
    if len(con_f0) >= 2:
        med = np.median([datos[i][3] for i in con_f0])
        ult = datos[con_f0[-1]][3]
        st = 12 * np.log2(ult / med)
        final = f"cae ({st:+.1f} st)" if st < -1 else f"sube ({st:+.1f} st)" if st > 1 else f"plana ({st:+.1f} st)"
    txt = " ".join(d[0] + ("★" if i == fuerte else "") + ("↑" if i == aguda else "") for i, d in enumerate(datos))
    lineas.append(f"| {datos[0][1]:.2f} s | {txt} | {final} | {datos[-1][2] - datos[0][1]:.2f} s |")

tabla = "\n".join(lineas)
print(tabla)
if salida:
    salida.write_text(f"# Entonación de {src.name}\n\n{tabla}\n", encoding="utf-8")
