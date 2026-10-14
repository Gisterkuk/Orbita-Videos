"""Tiempos de cada palabra y cada pausa de una narración, para sincronizar el video con la voz.

    python marketing/referencias/tiempos.py <audio> <salida.json>

Escribe {duracion, palabras:[{p, ini, fin}], pausas:[{despues_de, ini, dura}]} y lo imprime legible.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

src, salida = Path(sys.argv[1]), Path(sys.argv[2])
tmp = salida.with_suffix(".16k.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "16000", str(tmp)], check=True)
with wave.open(str(tmp)) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
dur = len(x) / 16000
tmp.unlink()

segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(x, word_timestamps=True, beam_size=5, language="es")
palabras = [{"p": w.word.strip(), "ini": round(w.start, 2), "fin": round(w.end, 2)} for s in segs for w in (s.words or [])]
pausas = [
    {"despues_de": a["p"], "ini": a["fin"], "dura": round(b["ini"] - a["fin"], 2)}
    for a, b in zip(palabras, palabras[1:])
    if b["ini"] - a["fin"] >= 0.2
]
salida.write_text(json.dumps({"duracion": round(dur, 2), "palabras": palabras, "pausas": pausas}, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"duración {dur:.2f} s")
linea, ini = [], None
for i, w in enumerate(palabras):
    ini = w["ini"] if ini is None else ini
    linea.append(w["p"])
    corte = next((p for p in pausas if p["ini"] == w["fin"]), None)
    if corte or i == len(palabras) - 1:
        print(f"{ini:6.2f}–{w['fin']:6.2f}  {' '.join(linea)}" + (f"   ‖ {corte['dura']} s" if corte else ""))
        linea, ini = [], None
