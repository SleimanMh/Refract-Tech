# The Padel Lounge × Refract Tech reel: a sporty, sunny 124 BPM track in E minor (Em – C – G – D).
#   intro    0 – 2.6     shimmer under the Refract logo, a hit as the R locks
#   meet     2.6 – 7.0   the collaboration: a big stab on the ×, then a light beat
#   site     7.0 – 10    the full groove arrives with the website: bouncy bass, marimba-like lead
#   booking  10 – 12.85  the lead drops out, the beat tightens, a riser climbs to the confirmation
#   drop     12.85 – 18.4 booking confirmed: everything back, louder, the hook an octave up
#   break    18.4 – 20.4 "designed and built by": chords and air
#   outro    20.4 – end  the contact card: a final chord and bells
# One sound per moment from the cue sheet, padel-ball "pock"s between scenes.
#   python3 scripts/padel_music.py out/series/padel
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(34)
BPM = 124; BEAT = 60 / BPM; BAR = 4 * BEAT
M = np.zeros((2, N)); FX = np.zeros((2, N))

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

CH = [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]]       # Em C G D
ROOT = [40, 36, 43, 38]
HOOK = [[76, None, 79, 76, None, 74, 76, None, 71, None, 74, None, 76, None, 79, None],
        [76, None, 79, 76, None, 74, 72, None, 67, None, 72, None, 76, None, 74, None],
        [74, None, 79, 74, None, 71, 74, None, 79, None, 81, None, 79, None, 74, None],
        [74, None, 78, 74, None, 69, 74, None, 78, None, 81, None, 83, None, 81, None]]

LOCK = (EV.get('lock') or [1.12])[0]; MEET = 2.6; SITE = 7.0; BOOK = 10.0
CONF = (EV.get('bell') or [12.85])[0]; BREAK = 18.4; END = (EV.get('end') or [20.4])[0]
def section(t):
    return ('intro' if t < MEET else 'meet' if t < SITE else 'site' if t < BOOK else 'book' if t < CONF
            else 'drop' if t < BREAK else 'break' if t < END else 'outro')

def kick():
    t = tt(.4); return sine(48 + 125 * np.exp(-t * 38), t) * np.exp(-t * 7.5) + hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 150) * .14
def clap():
    t = tt(.28); n = rnd.standard_normal(len(t)); return hp(n, .15) * (np.exp(-t * 22) + .5 * (t > .011) * np.exp(-np.maximum(0, t - .011) * 28)) * .5
def shaker(acc=False):
    t = tt(.07); return hp(rnd.standard_normal(len(t)), .55) * np.exp(-t * (50 if acc else 75)) * (.3 if acc else .2)
def mallet(m, d=.38):
    # a bright, wooden lead: like a marimba with a little bite
    t = tt(d); f = hz(m)
    return (sine(f, t) + .45 * sine(f * 4, t) * np.exp(-t * 26) + .2 * sine(f * 2, t) + .12 * np.sign(sine(f, t)) * np.exp(-t * 18)) * np.exp(-t * 7.5) * np.minimum(1, t / .002)
def bass(m, d):
    t = tt(d); f = hz(m) * (1 + .03 * np.exp(-t * 40))
    ph = np.cumsum(f) / SR
    return (np.sin(2 * np.pi * ph) + .4 * lp(np.sign(np.sin(2 * np.pi * ph)), .08)) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .02) * np.exp(-t * 2)
def stab(notes, d=.35, cut=.3):
    t = tt(d); s = sum(saw(hz(m), t, .008) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / .003) * np.exp(-t * 5)
def pad(notes, d, cut=.03):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4)
def bell(m, d=1.6):
    t = tt(d); f = hz(m); return (sine(f, t) + .3 * sine(f * 2.76, t) * np.exp(-t * 4)) * np.exp(-t * 2.6)

KICKS = []
for bar in range(int(np.ceil(DUR / BAR)) + 1):
    t0 = bar * BAR; c = bar % 4
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= DUR: break
        sec = section(tb)
        full = sec in ('site', 'drop', 'outro')
        if sec in ('meet', 'site', 'book', 'drop', 'outro') or (sec == 'break' and b == 0):
            if sec != 'meet' or b % 2 == 0: add(M, kick(), tb, 1.0 if sec == 'drop' else .8); KICKS.append(tb)
        if full and b % 2 == 1: add(M, clap(), tb, .5)
        if sec in ('meet', 'site', 'book', 'drop', 'outro'):
            for s16 in range(4): add(M, shaker(s16 == 2), tb + s16 * BEAT / 4, 1, .3 if s16 % 2 else -.3)
        if sec in ('site', 'book', 'drop', 'outro'):
            add(M, bass(ROOT[c], BEAT * .45), tb + BEAT / 2, .42 if sec == 'drop' else .34)
            if sec == 'drop': add(M, bass(ROOT[c] + 12, BEAT * .2), tb + BEAT * .75, .2)
    for k in range(16):
        tk = t0 + k * BEAT / 4; m = HOOK[c][k]
        if m is None or tk >= DUR: continue
        sec = section(tk)
        if sec == 'site': add(M, mallet(m), tk, .2, -.3 if k % 2 else .3)
        elif sec == 'drop': add(M, mallet(m + 12, .32), tk, .17, -.35 if k % 2 else .35); add(M, mallet(m), tk, .14)
        elif sec == 'outro' and tk < END + 2.2: add(M, mallet(m), tk, .14, -.3 if k % 2 else .3)
    sec = section(t0 + .01)
    if sec in ('meet', 'site', 'book', 'drop', 'break'): add(M, pad(CH[c], BAR + .05, .025), t0, .1 if sec != 'break' else .2)
    if sec in ('site', 'drop'):
        for b in (0, 2): add(M, stab(CH[c] + [CH[c][0] + 12]), t0 + b * BEAT + BEAT / 2, .1, .2)

# intro and outro colour
t = tt(MEET + .3); add(M, pad([40, 52, 59, 64, 71], len(t) / SR) * np.minimum(1, t / 1.4), 0, .22)
for i, m in enumerate([83, 86, 90, 95, 90, 86]): add(M, bell(m, 1.3), .3 + i * .17, .05, -.5 + i * .2)
fin = END + 2.6
add(M, pad([40, 52, 59, 64, 67, 71], DUR - fin + .2, .05), fin, .25)
for i, m in enumerate([76, 79, 83, 88, 91]): add(M, bell(m), fin + .1 + i * .2, .1, -.5 + i * .25)

duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); n = min(N - i, int(BEAT * SR))
    if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - .5 * np.exp(-np.arange(n) / SR * 11))
M *= duck
d = int(BEAT * .75 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .12; E[1, d:] += M[0, :-d] * .12; M = E

# ---- one sound per moment
def whoosh(d):
    t = tt(d); n = rnd.standard_normal(len(t)); return lp(n * np.sin(np.pi * t / d) ** 2, .12) * .9
def impact(g=1.0, low=38):
    t = tt(1.3); return (sine(low + 75 * np.exp(-t * 16), t) * np.exp(-t * 3.8) + hp(rnd.standard_normal(len(t)), .4) * np.exp(-t * 14) * .2) * g
def tick():
    t = tt(.5); return (sine(hz(95), t) * .6 + sine(hz(102), t) * .25) * np.exp(-t * 9) * np.minimum(1, t / .003)
def pock():
    # a padel ball off the racket: a hollow, bright knock
    t = tt(.18); return (sine(1250 * (1 - .15 * t / .18), t) * .6 + sine(620, t) * .5 + hp(rnd.standard_normal(len(t)), .5) * .25) * np.exp(-t * 38)
def tap():
    t = tt(.06); return (sine(1800, t) * .5 + hp(rnd.standard_normal(len(t)), .5) * .4) * np.exp(-t * 120)
for s in EV.get('lock', []): add(FX, impact(.7, 36), s); add(FX, bell(83, 1.2), s, .28)
for s in EV.get('collab', []): add(FX, impact(.8, 40), s); add(FX, stab([52, 59, 64, 71, 76], .9, .4), s, .25)
for s in EV.get('tick', []): add(FX, tick(), s, .14)
for s in EV.get('ball', []): add(FX, pock(), s, .45)   # one padel-ball pock per scene change
for s in EV.get('tap', []): add(FX, tap(), s, .35)
riser_t = tt(CONF - (BOOK + 1.2)); add(FX, lp(hp(rnd.standard_normal(len(riser_t)), .3) * (riser_t / riser_t[-1]) ** 3, .3), BOOK + 1.2, .35)
for s in EV.get('bell', []): add(FX, impact(1.0, 34), s); add(FX, bell(88, 1.2), s, .26); add(FX, bell(95, 1.0), s + .14, .18)
for i, s in enumerate(EV.get('item', [])): add(FX, bell([88, 91, 95][i % 3], 1.0), s + .1, .2)
for s in EV.get('end', []): add(FX, impact(.9, 34), s); add(FX, bell(83, 1.4), s, .2)

mix = M + FX
mix *= np.clip(np.arange(N) / SR / .03, 0, 1) * (1 - np.clip((np.arange(N) / SR - (DUR - .7)) / .7, 0, 1))
mix = np.tanh(mix * 1.2) / np.tanh(1.2); mix /= np.max(np.abs(mix)) / .88
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's')
