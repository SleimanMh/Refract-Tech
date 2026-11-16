# Eagle Strength — 60 Days Challenge: a hard 140 BPM gym track in the phonk style, in C# minor.
# A gliding, distorted 808, punchy kicks, a half-time snare, rolling hats and a cowbell hook.
#   hook      stamps for 60 / DAYS / CHALLENGE over a dark swell
#   comfort   the 808 and kick come in, a snare roll into the drop
#   work      the drop: everything, the cowbell hook, a hit on every cut
#   streak    the beat carries on under a rising sweep as the sixty days fill
#   app       drums thin out, the tap lands as a hit and the hook comes back
#   levels    full again
#   call      a big hit on DAY 1, the hook's last phrase, then it rings out
#   python3 scripts/eagle_music.py out/eagle
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(140)
B = EV['beat']; BAR = 4 * B; S = EV['sections']
M = np.zeros((2, N)); FX = np.zeros((2, N))

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def sine(f, t): return np.sin(2 * np.pi * f * t)
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

def b808(m, d, glide_from=None):
    t = tt(d); f0 = hz(m)
    f = f0 if glide_from is None else hz(glide_from) + (f0 - hz(glide_from)) * np.minimum(1, t / .09)
    ph = np.cumsum(np.full(len(t), 1.0) * f) / SR
    s = np.sin(2 * np.pi * ph) * np.exp(-t * 1.1) + .5 * np.sin(2 * np.pi * ph) * np.exp(-t * 18)
    return np.tanh(s * 2.4) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .03)
def kick():
    t = tt(.35); return np.tanh(sine(50 + 160 * np.exp(-t * 40), t) * np.exp(-t * 9) * 1.8) + hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 160) * .25
def snare():
    t = tt(.3); n = rnd.standard_normal(len(t))
    return np.tanh((hp(n, .12) * np.exp(-t * 16) * .9 + sine(185, t) * np.exp(-t * 28) * .7) * 1.4)
def hat(d=.04):
    t = tt(d); return hp(rnd.standard_normal(len(t)), .65) * np.exp(-t * (1 / d) * 2.2) * .22
def cowbell(m, d=.22):
    t = tt(d); f = hz(m)
    s = np.sign(sine(f, t)) * .5 + np.sign(sine(f * 1.48, t)) * .4
    return lp(hp(s, .08), .35) * np.exp(-t * 11) * np.minimum(1, t / .002)
def pad(notes, d, cut=.02):
    t = tt(d); s = sum(2 * ((hz(m) * (1 + dd) * t) % 1.0) - 1 for m in notes for dd in (-.006, .006)) / (2 * len(notes))
    return lp(s, cut) * np.minimum(1, t / .5) * np.minimum(1, (d - t) / .5)
def impact(g=1.0, low=34):
    t = tt(1.4); return (np.tanh(sine(low + 90 * np.exp(-t * 14), t) * np.exp(-t * 3.2) * 1.6) + hp(rnd.standard_normal(len(t)), .35) * np.exp(-t * 10) * .3) * g
def whip():
    t = tt(.35); n = rnd.standard_normal(len(t)); return hp(n, .3) * np.exp(-((t - .12) / .07) ** 2) * .8
def whoosh(d):
    t = tt(d); n = rnd.standard_normal(len(t)); return lp(n * np.sin(np.pi * t / d) ** 2, .12) * .9

# C# minor: C#m – A – E – B, roots for the 808
ROOT = [37, 33, 40, 35]
PADS = [[61, 64, 68], [57, 61, 64], [64, 68, 71], [59, 63, 66]]
HOOK = [73, 76, 73, 80, 78, 76, 73, 71, 73, 76, 78, 80, 78, 76, 73, 76]   # sixteenths over each bar

def sec(t):
    if t < S['comfort']: return 'hook'
    if t < S['mont']: return 'comfort'
    if t < S['cons']: return 'work'
    if t < S['app']: return 'streak'
    if t < S['tap'] + (EV['tap'] - S['tap']): return 'app'
    if t < S['lvl']: return 'app2'
    if t < S['cta']: return 'levels'
    return 'call'

for bar in range(int(np.ceil(DUR / BAR)) + 1):
    t0 = bar * BAR; c = bar % 4
    for b in range(4):
        tb = t0 + b * B
        if tb >= DUR - .3: break
        s = sec(tb)
        full = s in ('work', 'streak', 'app2', 'levels', 'call')
        if s == 'hook': continue
        # 808: on 1, and a slide on the "and" of 2
        if b == 0: add(M, b808(ROOT[c], B * 1.9), tb, .55 if full else .45)
        if b == 1 and full: add(M, b808(ROOT[c] + 12, B * .9, ROOT[c] + 7), tb + B / 2, .32)
        if b == 0 or (b == 1 and full): add(M, kick(), tb + (B / 2 if b == 1 else 0), .75)
        if b == 2 and s != 'comfort' or (s == 'comfort' and b == 2): add(M, snare(), tb, .5 if full else .35)
        if s in ('work', 'levels', 'call', 'app2', 'streak'):
            for k in range(2): add(M, hat(), tb + k * B / 2, .9, .3 if k else -.3)
            if b == 3 and bar % 2 == 1:
                for k in range(6): add(M, hat(.025), tb + B / 2 + k * B / 12, .6 + k * .05, .3)   # a roll
        elif s in ('comfort', 'app'):
            add(M, hat(), tb + B / 2, .7, .3)
    # the cowbell hook
    for k in range(16):
        tk = t0 + k * B / 4
        if tk >= DUR - .4: break
        s = sec(tk)
        if s in ('work', 'levels', 'app2') or (s == 'call' and tk < S['cta'] + 2 * BAR):
            if k % 2 == 0 or s in ('work', 'levels'): add(M, cowbell(HOOK[k] - 12 if c % 2 else HOOK[k]), tk, .13, -.25 if k % 2 else .25)
    if sec(t0 + .01) != 'hook': add(M, pad(PADS[c], BAR + .05), t0, .1)

# the hook: a dark swell
t = tt(S['comfort'] + .2); add(M, pad([37, 49, 56, 61], len(t) / SR, .015) * np.minimum(1, t / 1.2), 0, .3)
# the snare roll into the drop
t = S['mont'] - 2 * B; k = 0
while t < S['mont'] - .02:
    add(M, snare(), t, .15 + .3 * k / 16, .1); t += B / 4 if t < S['mont'] - B else B / 8; k += 1
# the streak: a rising sweep
d = S['app'] - S['cons'] - .1; t = tt(d); add(M, lp(hp(rnd.standard_normal(len(t)), .3) * (t / d) ** 2.5, .3), S['cons'] + .05, .3)
# the end rings out
add(M, b808(ROOT[0], DUR - S['cta'] - 2 * BAR + .2), S['cta'] + 2 * BAR, .4)
add(M, pad([37, 49, 56, 61, 64], DUR - S['cta'] - 2 * BAR + .2, .03), S['cta'] + 2 * BAR, .22)

d = int(B * .75 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .1; E[1, d:] += M[0, :-d] * .1; M = E

# ---- one sound per moment
big = {S['comfort'], S['mont'], S['cons'], EV['tap'], S['lvl'], S['cta']}
for s in EV.get('stamp', []): add(FX, impact(.75, 36), s)
for s in EV.get('hits', []):
    if s in EV.get('stamp', []): continue
    if any(abs(s - b) < .01 for b in big): add(FX, impact(1.0 if s == S['cta'] else .8), s)
    else: add(FX, whip(), s - .05, .5)
for s in EV.get('whoosh', []): add(FX, whoosh(.5), s - .25, .3)

mix = M + FX
tsec = np.arange(N) / SR
mix *= np.clip(tsec / .02, 0, 1) * (1 - np.clip((tsec - (DUR - .7)) / .7, 0, 1) ** 1.4)
mix = np.tanh(mix * 1.2) / np.tanh(1.2); mix /= np.max(np.abs(mix)) / .88
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's')
