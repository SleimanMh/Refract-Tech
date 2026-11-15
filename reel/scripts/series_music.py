# Soundtrack for the "Meet Refract Tech" reels: a calm, confident 100 BPM track (soft keys,
# warm pad, light beat) in a different key per episode, and one subtle sound per moment.
#   python3 scripts/series_music.py out/series/discover     reads events.json there, writes music.wav there
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rnd = np.random.default_rng(3 + int(EV.get('key', 0)))
BEAT = 60 / 100
KEY = [0, 2, 4, 5, 7, -3, -1][int(EV.get('key', 0)) % 7]   # C, D, E, F, G, A, B major

def hz(m): return 440.0 * 2 ** ((m + KEY - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def add(sig, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); s = sig[:j - i] * g
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414
def lp(x, a):
    n = min(len(x), int(np.log(1e-4) / np.log(1 - a)) + 1); k = a * (1 - a) ** np.arange(n)
    m = len(x) + n - 1; F = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(k, F), F)[:len(x)]
def hp(x, a): return x - lp(x, a)
def sine(f, t): return np.sin(2 * np.pi * f * t)

# I – V – vi – IV, one chord per bar
CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
ROOT = [48, 43, 45, 41]
BAR = 4 * BEAT

def keys(m, d=.9):
    t = tt(d); f = hz(m)   # a soft electric-piano tone
    return (sine(f, t) + .22 * sine(f * 2, t) * np.exp(-t * 6) + .06 * sine(f * 3.01, t) * np.exp(-t * 12)) * np.exp(-t * 3.2) * np.minimum(1, t / .006)
def pad(notes, d):
    t = tt(d); s = sum(sine(hz(m), t) + .3 * sine(hz(m) * 2.001, t) for m in notes) / len(notes)
    e = np.minimum(1, t / .25) * np.minimum(1, (d - t) / .4); return s * e
def kick():
    t = tt(.3); return sine(50 + 90 * np.exp(-t * 35), t) * np.exp(-t * 11)
def shaker():
    t = tt(.08); return hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 60) * .3
def snap():
    t = tt(.12); return hp(rnd.standard_normal(len(t)), .35) * np.exp(-t * 45) * .5

# ---- the music, from the first beat to the end
start = .15
bar = 0
while start + bar * BAR < DUR:
    t0 = start + bar * BAR; c = bar % 4
    add(lp(pad(CH[c], BAR + .1), .08), t0, .12)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= DUR: break
        if b % 2 == 0: add(kick(), tb, .42)
        if b % 2 == 1: add(snap(), tb, .16, .1)
        add(shaker(), tb + BEAT / 2, .3, .3)
        add(sine(hz(ROOT[c]), tt(.3)) * np.exp(-tt(.3) * 7), tb, .22)
    # a gentle broken chord on the keys
    pat = [0, 2, 1, 2]
    for k in range(4):
        tb = t0 + k * BEAT
        if tb < DUR: add(keys(CH[c][pat[k]] + 12), tb, .17, -.3 if k % 2 else .3)
    bar += 1
d = int(.32 * SR); L2, R2 = L.copy(), R.copy(); L2[d:] += R[:-d] * .14; R2[d:] += L[:-d] * .14; L[:], R[:] = L2, R2   # echo: music only

# ---- one sound per moment
def tick():
    t = tt(.5); return (sine(hz(96), t) * .6 + sine(hz(103), t) * .25) * np.exp(-t * 9) * np.minimum(1, t / .003)
def whoosh(d=.5):
    t = tt(d); n = rnd.standard_normal(len(t)); return lp(n * np.sin(np.pi * t / d) ** 2, .12) * .9
def chime():
    out = np.zeros(int(1.6 * SR))
    for i, m in enumerate([84, 88, 91, 96]):
        t = tt(1.6 - i * .07); s = (sine(hz(m), t) + .25 * sine(hz(m) * 2.76, t) * np.exp(-t * 6)) * np.exp(-t * 3)
        o = int(i * .07 * SR); out[o:o + len(s)] += s * .5
    return out
for s in EV.get('tick', []): add(tick(), s, .14)
for s in EV.get('whoosh', []): add(whoosh(), s - .2, .22)
for s in EV.get('chime', []): add(chime(), s, .24)

mix = np.vstack([L, R])
mix *= np.clip(np.arange(N) / SR / .05, 0, 1) * (1 - np.clip((np.arange(N) / SR - (DUR - .5)) / .5, 0, 1))
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix /= np.max(np.abs(mix)) / .9
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's', 'key', KEY)
