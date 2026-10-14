"""Analiza la voz en off de una referencia: transcripción con tiempos por palabra, ritmo, pausas y tono.

    python marketing/referencias/voz.py <id>      (id = carpeta en referencias/videos/)

Escribe videos/<id>/analisis/voz.json y agrega la sección "Voz" a fichas/<id>.md.
Todo corre local (faster-whisper); no se manda audio a ningún servicio.
Ojo: si hay música de fondo, el tono medido es aproximado.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

RAIZ = Path(__file__).resolve().parent
vid = sys.argv[1]
dir_v = RAIZ / "videos" / vid
an = dir_v / "analisis"
an.mkdir(parents=True, exist_ok=True)
wav = an / "voz-16k.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(dir_v / "video.mp4"), "-ac", "1", "-ar", "16000", str(wav)], check=True)

# ---------- transcripción ----------
with wave.open(str(wav)) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
modelo = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = modelo.transcribe(x, word_timestamps=True, vad_filter=False, beam_size=5)
palabras, frases = [], []
for s in segs:
    frases.append({"ini": round(s.start, 2), "fin": round(s.end, 2), "texto": s.text.strip()})
    for w in s.words or []:
        palabras.append({"ini": round(w.start, 2), "fin": round(w.end, 2), "p": w.word.strip(), "conf": round(w.probability, 2)})

# ---------- ritmo y pausas ----------
habla = sum(w["fin"] - w["ini"] for w in palabras)
pausas = []
for a, b in zip(palabras, palabras[1:]):
    gap = round(b["ini"] - a["fin"], 2)
    if gap >= 0.25:
        pausas.append({"despues_de": a["p"], "en": a["fin"], "dura": gap})
inicio = palabras[0]["ini"] if palabras else None
fin = palabras[-1]["fin"] if palabras else None
tramo = (fin - inicio) if palabras else 0

# ---------- tono (F0 por autocorrelación, 40 ms) ----------
sr, n, hop = 16000, 640, 320
f0 = []
for w_ in palabras:
    a, b = int(w_["ini"] * sr), int(w_["fin"] * sr)
    for i in range(a, max(a + 1, b - n), hop):
        fr = x[i:i + n]
        if len(fr) < n or np.sqrt(np.mean(fr ** 2)) < 0.01:
            continue
        fr = fr - fr.mean()
        ac = np.correlate(fr, fr, "full")[n - 1:]
        lo, hi = int(sr / 400), int(sr / 70)
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.35 * ac[0]:
            f0.append(sr / k)
f0 = np.array(f0)
tono = None
if len(f0) > 20:
    med = float(np.median(f0))
    st = 12 * np.log2(f0 / med)
    tono = {
        "f0_mediana_hz": round(med, 1),
        "rango_p10_p90_semitonos": round(float(np.percentile(st, 90) - np.percentile(st, 10)), 1),
        "registro": "grave" if med < 140 else "medio" if med < 200 else "agudo",
        "melodia": "plana / calma" if np.percentile(st, 90) - np.percentile(st, 10) < 4 else "expresiva" if np.percentile(st, 90) - np.percentile(st, 10) < 8 else "muy melódica",
    }

res = {
    "idioma": info.language,
    "palabras": len(palabras),
    "inicio_voz": inicio,
    "palabras_por_segundo_en_habla": round(len(palabras) / tramo, 2) if tramo else None,
    "porcentaje_hablando": round(100 * habla / tramo, 0) if tramo else None,
    "pausas": pausas,
    "pausa_promedio": round(float(np.mean([p["dura"] for p in pausas])), 2) if pausas else None,
    "tono": tono,
    "frases": frases,
    "palabras_detalle": palabras,
}
(an / "voz.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------- sección en la ficha ----------
ficha = RAIZ / "fichas" / f"{vid}.md"
if ficha.exists():
    t = ficha.read_text(encoding="utf-8")
    t = t.split("\n## Voz\n")[0].rstrip() + "\n"
    if "## Patrones observados" in t:
        cuerpo, resto = t.split("## Patrones observados", 1)
    else:
        cuerpo, resto = t, "\n"
    lineas = [
        "## Voz",
        "",
        f"- **Idioma:** {info.language} · **Palabras:** {len(palabras)} · **Arranca a los** {inicio} s",
        f"- **Ritmo:** {res['palabras_por_segundo_en_habla']} palabras/s · hablando el {res['porcentaje_hablando']} % del tramo · pausa promedio {res['pausa_promedio']} s",
    ]
    if tono:
        lineas.append(f"- **Tono:** registro {tono['registro']} (~{tono['f0_mediana_hz']} Hz), melodía {tono['melodia']} ({tono['rango_p10_p90_semitonos']} semitonos entre p10 y p90) · aproximado si hay música")
    lineas += ["", "**Transcripción** (pausas ≥ 0,25 s marcadas con ‖):", ""]
    pausa_en = {round(p["en"], 2): p["dura"] for p in pausas}
    for f in frases:
        txt = []
        for w_ in palabras:
            if f["ini"] - 0.01 <= w_["ini"] <= f["fin"] + 0.01:
                txt.append(w_["p"] + (f" ‖{pausa_en[w_['fin']]}s" if w_["fin"] in pausa_en else ""))
        lineas.append(f"- `{f['ini']:>5}–{f['fin']:<5}` {' '.join(txt) or f['texto']}")
    ficha.write_text(cuerpo.rstrip() + "\n\n" + "\n".join(lineas) + "\n\n## Patrones observados" + resto, encoding="utf-8")

print(json.dumps({k: res[k] for k in ("idioma", "palabras", "inicio_voz", "palabras_por_segundo_en_habla", "porcentaje_hablando", "pausa_promedio", "tono")}, ensure_ascii=False))
print("\n".join(f"{f['ini']:>5}-{f['fin']:<5} {f['texto']}" for f in frases))
