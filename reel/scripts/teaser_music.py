# The teaser's own soundtrack: a catchy 120 BPM track in A minor (Am – F – C – G) with a pluck hook,
# built like a short song: a glittering intro under the logo, a light verse under the questions,
# a riser into a full drop for "What we build", a lighter section, and a big final chord on the
# contact card. Plus one sound per moment from the cue sheet.
#   python3 scripts/teaser_music.py out/series/teaser
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(12)
BEAT = .5; BAR = 2.0
M = np.zeros((2, N)); FX = np.zeros((2, N))        # music bus (echo, sidechain) and effects bus (dry)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def sine(f, t): return np.sin(2 * np.pi * f * t)
def saw(f, t, det=0.0): return sum(2 * ((f * (1 + d) * t) % 1.0) - 1 for d in (-det, 0, det)) / 3
def lp(x, a):
    n = min(len(x), int(np.log(1e-4) / np.log(1 - a)) + 1); k = a * (1 - a) ** np.arange(n)
    m = len(x) + n - 1; F = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(k, F), F)[:len(x)]
def hp(x, a): return x - lp(x, a)
def add(bus, sig, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); s = sig[:j - i] * g
    bus[0, i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; bus[1, i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]     # Am F C G
ROOT = [45, 41, 36, 43]
HOOK = [[76, 72, 69, 72, 76, 79, 76, 72], [77, 72, 69, 72, 77, 81, 77, 72], [76, 72, 67, 72, 76, 79, 81, 79], [74, 71, 67, 71, 74, 79, 74, 71]]

DROP = (EV.get('drop') or [9.05])[0]; END = (EV.get('end') or [DUR - 3])[0]; LOCK = (EV.get('lock') or [1.1])[0]
VERSE = 2.55

def section(t):
    if t < VERSE: return 'intro'
    if t < DROP - .7: return 'verse'
    if t < DROP: return 'rise'
    if t < 14.0: return 'drop'
    if t < END: return 'verse2'
    return 'outro'

# ---- instruments
def kick():
    t = tt(.4); return sine(46 + 120 * np.exp(-t * 34), t) * np.exp(-t * 7.5) + hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 120) * .12
def clap():
    t = tt(.28); n = rnd.standard_normal(len(t)); return hp(n, .15) * (np.exp(-t * 22) + .5 * (t > .012) * np.exp(-np.maximum(0, t - .012) * 30)) * .5
def hat(op=False):
    t = tt(.2 if op else .045); return hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * (14 if op else 90)) * .22
def pluck(m, d=.42):
    t = tt(d); f = hz(m); s = saw(f, t, .004) * .55 + sine(f, t) * .6 + .18 * sine(2 * f, t)
    return lp(s, .33) * np.exp(-t * 7) * np.minimum(1, t / .003)
def bass(m, d=.24):
    t = tt(d); f = hz(m); return (lp(saw(f, t, .002), .06) * .7 + sine(f, t)) * np.minimum(1, t / .004) * np.exp(-t * 3) * np.minimum(1, (d - t) / .02)
def pad(notes, d):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    return lp(s, .03) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)
def bell(m, d=1.8):
    t = tt(d); f = hz(m); return (sine(f, t) + .3 * sine(f * 2.76, t) * np.exp(-t * 4) + .15 * sine(f * 5.4, t) * np.exp(-t * 9)) * np.exp(-t * 2.4)

KICKS = []
bar = 0
while bar * BAR < DUR:
    t0 = bar * BAR - .0; c = bar % 4
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= DUR: break
        sec = section(tb)
        if sec == 'intro':
            continue
        if sec in ('verse', 'verse2', 'outro'):
            if b % 2 == 0 or sec == 'verse2': add(M, kick(), tb, .8); KICKS.append(tb)
            if b % 2 == 1: add(M, clap(), tb, .35)
            add(M, hat(), tb + BEAT / 2, .5, .3)
        elif sec == 'drop':
            add(M, kick(), tb, 1.0); KICKS.append(tb)
            if b % 2 == 1: add(M, clap(), tb, .55)
            for s16 in range(4): add(M, hat(s16 == 2), tb + s16 * BEAT / 4, .45 if s16 == 2 else .3, .35 if s16 % 2 else -.35)
        # bass in eighths from the verse on
        if sec != 'rise':
            for e in range(2):
                te = tb + e * BEAT / 2
                if te < DUR: add(M, bass(ROOT[c] + (12 if (sec == 'drop' and e == 1) else 0)), te, .34 if sec == 'drop' else .26)
    # the hook: soft in the verse, full and an octave up in the drop, sparse in the outro
    for k in range(8):
        tk = t0 + k * BEAT / 2
        if tk >= DUR: break
        sec = section(tk)
        if sec in ('verse', 'verse2'): add(M, pluck(HOOK[c][k]), tk, .14, -.35 if k % 2 else .35)
        elif sec == 'drop': add(M, pluck(HOOK[c][k] + 12, .5), tk, .17, -.4 if k % 2 else .4); add(M, pluck(HOOK[c][k]), tk, .1)
    if section(t0) in ('verse', 'drop', 'verse2', 'rise'): add(M, pad(CH[c], BAR + .05), t0, .13 if section(t0) == 'drop' else .09)
    bar += 1

# intro: a glittering swell under the logo
t = tt(VERSE + .3); add(M, pad([45, 57, 64, 69], len(t) / SR) * np.minimum(1, t / 1.2), 0, .2)
for i, m in enumerate([81, 84, 88, 93, 88, 84]): add(M, bell(m, 1.4), .3 + i * .18, .06, -.5 + i * .2)

# the outro: a held chord and bells ringing out
t = tt(DUR - END); add(M, pad([45, 57, 60, 64, 69], DUR - END), END, .22)
for i, m in enumerate([76, 81, 84, 88, 93]): add(M, bell(m), END + .25 + i * .22, .1, -.5 + i * .25)

# sidechain: the pads and bass duck under each kick
duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); n = min(N - i, int(.3 * SR))
    if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - .45 * np.exp(-np.arange(n) / SR * 14))
M *= duck
d = int(.375 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .14; E[1, d:] += M[0, :-d] * .14; M = E

# ---- one sound per moment
def whoosh(d):
    t = tt(d); n = rnd.standard_normal(len(t)); return lp(n * (t / d) ** 2.5, .1) * .9
def impact(g=1.0, low=40):
    t = tt(1.2); return (sine(low + 70 * np.exp(-t * 16), t) * np.exp(-t * 4) + hp(rnd.standard_normal(len(t)), .4) * np.exp(-t * 16) * .18) * g
def tick():
    t = tt(.5); return (sine(hz(93), t) * .6 + sine(hz(100), t) * .25) * np.exp(-t * 9) * np.minimum(1, t / .003)
for s in EV.get('lock', []): add(FX, impact(.7, 36), s); add(FX, bell(88, 1.2), s, .3)   # the R locks: one bright hit
for s in EV.get('tick', []): add(FX, tick(), s, .14)
for a, b in EV.get('riser', []):
    t = tt(b - a); add(FX, whoosh(b - a), a, .3); add(FX, saw(hz(57) * (1 + 1.2 * (t / t[-1]) ** 2), t) * (t / t[-1]) ** 2 * .05, a)
for s in EV.get('drop', []): add(FX, impact(1.0, 34), s)
for i, s in enumerate(EV.get('item', [])): add(FX, bell([81, 84, 88][i % 3], 1.0), s + .1, .2)     # each offer rings its own note, rising
for s in EV.get('hit', []): add(FX, impact(.55, 44), s)
for s in EV.get('ding', []): add(FX, bell(93, 1.2), s, .16)
for s in EV.get('end', []): add(FX, impact(.9, 34), s)

mix = M + FX
mix *= np.clip(np.arange(N) / SR / .03, 0, 1) * (1 - np.clip((np.arange(N) / SR - (DUR - .6)) / .6, 0, 1))
mix = np.tanh(mix * 1.15) / np.tanh(1.15); mix /= np.max(np.abs(mix)) / .9
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's')
