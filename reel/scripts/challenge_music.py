# The 60 Days Challenge × Refract Tech reel: a driving 128 BPM "no excuses" track in E minor
# (Em – C – G – D) that ends somewhere new: warm and hopeful instead of a big hit.
#   intro    0 – 2.6     a dark swell under the logo, a hit as the R locks
#   meet     2.6 – 7.0   brass stab on the ×, half-time drums, pulsing bass
#   app      7.0 – 10.95 the full beat arrives with the app, a riser builds to the tap
#   drop     10.95 – 18.4 the tap is the drop: heavy kick, claps, gritty bass, brass hook
#   break    18.4 – 20.4 "designed and built by": filtered, the drums thin out
#   ending   20.4 – end  the drums stop; a warm piano rises over a soft pad and settles on a
#                        bright G major add9, ringing out as the picture fades
#   python3 scripts/challenge_music.py out/series/challenge
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(60)
BPM = 128; BEAT = 60 / BPM; BAR = 4 * BEAT
M = np.zeros((2, N)); FX = np.zeros((2, N)); END_BUS = np.zeros((2, N))

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

CH = [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]]     # Em C G D
ROOT = [40, 36, 43, 38]
HOOK = [[71, None, None, 74, None, 71, 69, None, 67, None, 69, None, 71, None, None, None],
        [72, None, None, 71, None, 69, 67, None, 64, None, 67, None, 69, None, None, None],
        [71, None, None, 74, None, 76, 74, None, 71, None, 74, None, 79, None, None, None],
        [78, None, None, 76, None, 74, 72, None, 74, None, 72, None, 69, None, None, None]]

LOCK = (EV.get('lock') or [1.12])[0]; MEET = 2.6; APP = 7.0; DROP = (EV.get('drop') or [10.95])[0]
BREAK = 18.4; END = (EV.get('finale') or [20.4])[0]
def section(t):
    return ('intro' if t < MEET else 'meet' if t < APP else 'app' if t < DROP else 'drop' if t < BREAK else 'break' if t < END else 'end')

def kick(hard=False):
    t = tt(.45); body = sine(42 + (150 if hard else 120) * np.exp(-t * 34), t) * np.exp(-t * (6 if hard else 7.5))
    return np.tanh(body * (1.6 if hard else 1.2)) + hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 150) * .18
def clap():
    t = tt(.3); n = rnd.standard_normal(len(t)); return hp(n, .13) * (np.exp(-t * 20) + .6 * (t > .012) * np.exp(-np.maximum(0, t - .012) * 26)) * .6
def hat(op=False):
    t = tt(.2 if op else .045); return hp(rnd.standard_normal(len(t)), .62) * np.exp(-t * (13 if op else 95)) * .24
def gritty(m, d):
    t = tt(d); s = saw(hz(m), t, .004) + .5 * sine(hz(m) / 2, t)
    return lp(np.tanh(s * 2.2), .09) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .02)
def brass(notes, d=.32, cut=.22):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    env = np.minimum(1, t / .015) * np.exp(-t * 3.5) * np.minimum(1, (d - t) / .03)
    return lp(s, cut) * env
def lead(m, d=.3):
    t = tt(d); f = hz(m); s = saw(f, t, .005) * .6 + np.sign(sine(f, t)) * .25 + sine(f, t) * .4
    return lp(s, .2) * np.minimum(1, t / .006) * np.exp(-t * 4) * np.minimum(1, (d - t) / .02)
def pad(notes, d, cut=.025, attack=.4):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / attack) * np.minimum(1, (d - t) / .5)
def piano(m, d=2.6, vel=1.0):
    # a soft felt-piano tone: a few gently detuned partials, a quick hammer, a long warm decay
    t = tt(d); f = hz(m)
    s = sum(a * sine(f * k * (1 + .0007 * k * k), t) * np.exp(-t * (1.6 + k * .9)) for k, a in ((1, 1), (2, .45), (3, .2), (4, .1), (5, .05)))
    return s * np.minimum(1, t / .004) * vel
def bell(m, d=1.6):
    t = tt(d); f = hz(m); return (sine(f, t) + .3 * sine(f * 2.76, t) * np.exp(-t * 4)) * np.exp(-t * 2.6)

KICKS = []
for bar in range(int(np.ceil(DUR / BAR)) + 1):
    t0 = bar * BAR; c = bar % 4
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= DUR: break
        sec = section(tb)
        if sec == 'meet':
            if b in (0,): add(M, kick(), tb, .8); KICKS.append(tb)
            if b == 2: add(M, clap(), tb, .45)
            add(M, hat(), tb + BEAT / 2, .3, .3)
        elif sec in ('app', 'drop'):
            hard = sec == 'drop'
            add(M, kick(hard), tb, 1.0 if hard else .8); KICKS.append(tb)
            if b % 2 == 1: add(M, clap(), tb, .55 if hard else .4)
            for s16 in range(4 if hard else 2):
                add(M, hat(s16 == 2 and hard), tb + s16 * BEAT / (4 if hard else 2), .3, .3 if s16 % 2 else -.3)
        elif sec == 'break' and b == 0:
            add(M, kick(), tb, .55); KICKS.append(tb)
        # bass: pulsing eighths, gritty in the drop
        if sec in ('meet', 'app', 'drop', 'break'):
            for e in range(2):
                te = tb + e * BEAT / 2
                if te < END: add(M, gritty(ROOT[c], BEAT / 2 - .02), te, (.34 if sec == 'drop' else .26) * (.6 if sec == 'break' else 1))
    # brass stabs and the hook in the drop
    sec0 = section(t0 + .01)
    if sec0 in ('app', 'drop'):
        add(M, brass(CH[c] + [CH[c][0] + 12], cut=.3 if sec0 == 'drop' else .12), t0, .3 if sec0 == 'drop' else .2, -.15)
        add(M, brass(CH[c], .2, .25), t0 + 2.5 * BEAT, .16, .15)
    for k in range(16):
        tk = t0 + k * BEAT / 4; m = HOOK[c][k]
        if m is None or tk >= DUR: continue
        if section(tk) == 'drop': add(M, lead(m + 12), tk, .14, -.25 if k % 2 else .25)
    if sec0 in ('meet', 'app', 'drop', 'break'): add(M, pad(CH[c], BAR + .05), t0, .08 if sec0 != 'break' else .16)

# the riser into the drop
t = tt(DROP - (APP + 1.5)); add(M, lp(hp(rnd.standard_normal(len(t)), .3) * (t / t[-1]) ** 3, .3), APP + 1.5, .35)
# intro: a dark swell
t = tt(MEET + .3); add(M, pad([40, 52, 59, 64], len(t) / SR, .02) * np.minimum(1, t / 1.6), 0, .26)

# ---- the ending: warm, hopeful, unhurried (its own bus, no sidechain)
e0 = END
add(END_BUS, pad([43, 55, 59, 62, 69], DUR - e0 + .2, .03, 1.2), e0 - .2, .26)            # a soft G pad swelling in
for i, m in enumerate([55, 59, 62, 66, 69, 71, 74]):                                         # the piano rises through Gmaj9
    add(END_BUS, piano(m, 3.2, .8 + .03 * i), e0 + .15 + i * .32, .2, -.45 + i * .15)
fin = e0 + .15 + 7 * .32 + .1
for m in [43, 55, 62, 66, 69, 74]:                                                            # and settles on a bright chord
    add(END_BUS, piano(m, DUR - fin + .1, .9), fin, .14)
add(END_BUS, bell(86, 2.2), fin + .05, .07, .4); add(END_BUS, bell(93, 2.0), fin + .5, .05, -.4)

# sidechain and echo on the music bus
duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); n = min(N - i, int(BEAT * SR))
    if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - .5 * np.exp(-np.arange(n) / SR * 11))
M *= duck
d = int(BEAT * .75 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .12; E[1, d:] += M[0, :-d] * .12; M = E
d2 = int(.42 * SR); E = END_BUS.copy(); E[0, d2:] += END_BUS[1, :-d2] * .22; E[1, d2:] += END_BUS[0, :-d2] * .22; END_BUS = E   # a roomy echo on the ending

# ---- one sound per moment
def whoosh(d):
    t = tt(d); n = rnd.standard_normal(len(t)); return lp(n * np.sin(np.pi * t / d) ** 2, .12) * .9
def impact(g=1.0, low=38):
    t = tt(1.3); return (np.tanh(sine(low + 80 * np.exp(-t * 16), t) * np.exp(-t * 3.6) * 1.4) + hp(rnd.standard_normal(len(t)), .4) * np.exp(-t * 14) * .22) * g
def tick():
    t = tt(.5); return (sine(hz(95), t) * .6 + sine(hz(102), t) * .25) * np.exp(-t * 9) * np.minimum(1, t / .003)
for s in EV.get('lock', []): add(FX, impact(.7, 36), s); add(FX, bell(83, 1.2), s, .26)
for s in EV.get('collab', []): add(FX, impact(.8, 40), s); add(FX, brass([52, 59, 64, 71, 76], .9, .35), s, .3)
for s in EV.get('tick', []): add(FX, tick(), s, .14)
for s in EV.get('whoosh', []): add(FX, whoosh(.5), s - .25, .26)
for s in EV.get('drop', []): add(FX, impact(1.15, 34), s)                                   # the tap lands as the drop
for i, s in enumerate(EV.get('item', [])): add(FX, bell([83, 86, 90][i % 3], 1.0), s + .1, .2)
for s in EV.get('rise', []):                                                                 # the logo rising: a soft shimmer, no hit
    for i, m in enumerate([86, 90, 93, 98]): add(FX, bell(m, 1.4), s + i * .12, .05, -.4 + i * .27)

mix = M + FX + END_BUS
tsec = np.arange(N) / SR
mix *= np.clip(tsec / .03, 0, 1) * (1 - np.clip((tsec - (DUR - 1.1)) / 1.1, 0, 1) ** 1.6)
mix = np.tanh(mix * 1.15) / np.tanh(1.15); mix /= np.max(np.abs(mix)) / .88
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's')
