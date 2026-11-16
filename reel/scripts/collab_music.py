# Soundtracks for the two collaboration reels, chosen by the cue sheet's "style":
#   jersey  (The Padel Lounge): a bouncy 140 BPM Jersey-club beat in A minor: the five-kick pattern,
#           claps, rising chirps, bright chopped chord stabs, a pluck riff, padel-ball pocks in the groove.
#   epic    (Eagle Strength): 150 BPM half-time trap with brass: sliding 808s, a hard snare, hat rolls,
#           brass stabs and a string ostinato in D minor, taiko hits.
# Both open on the clash (two whooshes closing in from left and right, a huge impact with a metal
# clang, a blade slash for the ×), hit on every wipe, and end on the logo locking with a final chord.
#   python3 scripts/collab_music.py out/v3/padel
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
STYLE = EV.get('style', 'jersey')
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(7 if STYLE == 'jersey' else 11)
BPM = 140 if STYLE == 'jersey' else 150
B = 60 / BPM; BAR = 4 * B
CLASH = EV['clash'][0]; OUT = EV['outro'][0]; LOCK = EV['lock'][0]; CTA = EV['cta'][0]
START = 1.0                                   # the beat comes in on the name slam
M = np.zeros((2, N)); FX = np.zeros((2, N))

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(max(1, int(d * SR))) / SR
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
def noise(n): return rnd.standard_normal(n)

def kick(hard=1.0):
    t = tt(.4); return np.tanh((sine(48 + 150 * np.exp(-t * 38), t) * np.exp(-t * 8)) * (1.4 + hard)) + hp(noise(len(t)), .6) * np.exp(-t * 160) * .2
def clap():
    t = tt(.3); n = noise(len(t)); return hp(n, .13) * (np.exp(-t * 20) + .6 * (t > .012) * np.exp(-np.maximum(0, t - .012) * 26)) * .6
def snare():
    t = tt(.3); return np.tanh((hp(noise(len(t)), .12) * np.exp(-t * 15) * .9 + sine(190, t) * np.exp(-t * 26) * .7) * 1.5)
def hat(d=.04, g=.22):
    t = tt(d); return hp(noise(len(t)), .65) * np.exp(-t * 2.2 / d) * g
def b808(m, d, frm=None):
    t = tt(d); f0 = hz(m); f = f0 if frm is None else hz(frm) + (f0 - hz(frm)) * np.minimum(1, t / .08)
    ph = np.cumsum(np.full(len(t), 1.0) * f) / SR
    return np.tanh((np.sin(2 * np.pi * ph) * np.exp(-t * 1.3)) * 2.6) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .03)
def stab(notes, d=.2, cut=.35, dec=7):
    t = tt(d); s = sum(saw(hz(m), t, .008) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / .003) * np.exp(-t * dec) * np.minimum(1, (d - t) / .02)
def brass(notes, d=.5):
    t = tt(d); s = sum(saw(hz(m), t, .007) for m in notes) / len(notes)
    cut = lp(s, .1) * (1 - np.exp(-t * 30)) + lp(s, .3) * np.exp(-t * 6) * .6
    return np.tanh(cut * 2) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .06)
def pluck(m, d=.3):
    t = tt(d); f = hz(m); return (sine(f, t) + .4 * sine(f * 3, t) * np.exp(-t * 30) + .3 * saw(f, t)) * np.exp(-t * 11) * np.minimum(1, t / .002)
def chirp():
    t = tt(.12); f = 500 + 2400 * (t / .12) ** 2; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .12) * .5
def pock():
    t = tt(.16); return (sine(1250 * (1 - .15 * t / .16), t) * .6 + sine(620, t) * .5 + hp(noise(len(t)), .5) * .22) * np.exp(-t * 40)
def pad(notes, d, cut=.03):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)
def bell(m, d=1.2):
    t = tt(d); f = hz(m); return (sine(f, t) + .3 * sine(f * 2.76, t) * np.exp(-t * 4)) * np.exp(-t * 3)
def impact(g=1.0, low=34):
    t = tt(1.6); return (np.tanh(sine(low + 95 * np.exp(-t * 13), t) * np.exp(-t * 2.8) * 1.8) + hp(noise(len(t)), .35) * np.exp(-t * 9) * .35) * g
def clang():
    t = tt(1.4); return sum(a * sine(f, t) * np.exp(-t * dk) for f, a, dk in ((523, .5, 4), (1443, .4, 6), (2824, .3, 9), (4660, .2, 13), (6100, .12, 18)))
def slash():
    t = tt(.3); n = hp(noise(len(t)), .5) * np.exp(-((t - .08) / .05) ** 2); return n * .9 + sine(3200 + 2500 * t / .3, t) * np.exp(-t * 18) * .25
def whoosh(d, rise=True):
    t = tt(d); e = (t / d) ** 2.2 if rise else np.sin(np.pi * t / d) ** 2; return lp(noise(len(t)) * e, .14) * .9
def tap():
    t = tt(.06); return (sine(1800, t) * .5 + hp(noise(len(t)), .5) * .4) * np.exp(-t * 120)
def taiko():
    t = tt(.7); return np.tanh(sine(70 + 60 * np.exp(-t * 20), t) * np.exp(-t * 5) * 2) + lp(noise(len(t)), .2) * np.exp(-t * 30) * .4

KICKS = []
if STYLE == 'jersey':
    CH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]        # Am7 Fmaj7 Cmaj7 G7
    ROOT = [45, 41, 36, 43]
    RIFF = [[76, 72, 69, 72, 76, 79, 76, 72], [77, 72, 69, 72, 77, 81, 79, 77], [76, 72, 67, 72, 76, 79, 84, 79], [74, 71, 67, 71, 74, 79, 77, 74]]
    KP = [0, 1, 2, 2.75, 3.5]                                                             # the Jersey five
    bar = 0
    while START + bar * BAR < DUR - .4:
        t0 = START + bar * BAR; c = bar % 4
        thin = t0 >= OUT and t0 < LOCK - .3
        late = t0 >= LOCK - .3
        for k in KP:
            tk = t0 + k * B
            if tk >= DUR - .5 or (thin and k not in (0, 2)): continue
            add(M, kick(), tk, .9); KICKS.append(tk)
            add(M, b808(ROOT[c], B * .7), tk, .32)
            if not thin: add(M, stab(CH[c], .16, .4 if not late else .5), tk, .2, .2 if k % 1 else -.2)
        for k in (1, 3):
            if t0 + k * B < DUR - .5 and not thin: add(M, clap(), t0 + k * B, .5)
        for k in range(8):
            tk = t0 + k * B / 2
            if tk >= DUR - .5: break
            add(M, hat(), tk, .7 if k % 2 else .45, .3 if k % 2 else -.3)
            if not thin and t0 >= 3.0: add(M, pluck(RIFF[c][k]), tk, .16, -.3 if k % 2 else .3)
        if not thin:
            add(M, chirp(), t0 + 1.5 * B, .16, .5); add(M, chirp(), t0 + 3.25 * B, .13, -.5)
            add(M, pock(), t0 + 2.75 * B, .16, .4)
        add(M, pad(CH[c], BAR + .05), t0, .08)
        bar += 1
    FINAL = [45, 57, 60, 64, 69, 72]
else:
    CH = [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]]                         # Dm Bb F C
    ROOT = [38, 34, 29, 36]
    OST = [74, 77, 81, 77, 74, 77, 81, 86, 74, 77, 81, 77, 86, 81, 77, 74]
    bar = 0
    while START + bar * BAR < DUR - .4:
        t0 = START + bar * BAR; c = bar % 4
        thin = t0 >= OUT and t0 < LOCK - .3
        add(M, b808(ROOT[c] + 12, B * 2.6), t0, .5); add(M, kick(1.3), t0, .9); KICKS.append(t0)
        if not thin:
            add(M, kick(1.3), t0 + 1.5 * B, .8); KICKS.append(t0 + 1.5 * B)
            add(M, b808(ROOT[c] + 19, B * .9, ROOT[c] + 12), t0 + 3 * B, .3)
            add(M, kick(1.3), t0 + 3.5 * B, .7)
        add(M, snare(), t0 + 2 * B, .55 if not thin else .3)
        for k in range(8):
            tk = t0 + k * B / 2
            if tk < DUR - .5: add(M, hat(), tk, .7, .3 if k % 2 else -.3)
        if bar % 2 == 1 and not thin:
            for k in range(6): add(M, hat(.025), t0 + 3.5 * B + k * B / 12, .5 + k * .06, .3)
        if not thin:
            add(M, brass(CH[c] + [CH[c][0] - 12], B * 1.4), t0, .34, -.1); add(M, brass(CH[c], B * .5), t0 + 2.5 * B, .22, .1)
            if t0 >= 3.0:
                for k in range(16):
                    tk = t0 + k * B / 4
                    if tk < DUR - .5: add(M, pluck(OST[k] + (0 if c != 2 else -2), .16), tk, .08, -.4 if k % 2 else .4)
        add(M, pad([m - 12 for m in CH[c]] + CH[c], BAR + .05, .025), t0, .1)
        bar += 1
    FINAL = [38, 50, 57, 62, 65, 69, 74]

# sidechain and a short echo on the music
duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); n = min(N - i, int(B * SR))
    if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - .45 * np.exp(-np.arange(n) / SR * 12))
M *= duck
d = int(B * .75 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .1; E[1, d:] += M[0, :-d] * .1; M = E

# ---- the clash: two streaks closing in from either side, the hit, the blade
w = whoosh(CLASH, True)
add(FX, w, 0, .5, -.9); add(FX, w[::1] * .9, 0, .5, .9)
add(FX, impact(1.3, 30), CLASH); add(FX, clang(), CLASH, .22)
for s in EV.get('slash', []): add(FX, slash(), s - .06, .6)
for s in EV.get('slam', []): add(FX, taiko(), s, .7)
# ---- every wipe
for s in EV.get('cuts', [])[:-1]:
    if STYLE == 'epic': add(FX, slash(), s - .14, .55); add(FX, taiko(), s, .6)
    else: add(FX, whoosh(.22, True), s - .22, .4); add(FX, pock(), s, .7)
# ---- the middle's own moments
for s in EV.get('pock', []): add(FX, pock(), s, .5)
for s in EV.get('tap', []): add(FX, tap(), s, .32)
for s in EV.get('bell', []): add(FX, bell(81, 1.2), s, .24); add(FX, bell(88, 1.0), s + .14, .18)
for s in EV.get('notify', []): add(FX, pluck(88, .4), s, .25); add(FX, pluck(93, .4), s + .09, .2)
for i, s in enumerate(EV.get('slots', [])): add(FX, pluck([69, 72, 76, 81, 84, 88, 93][i % 7], .3), s, .14, -.4 + i * .13)
for s in EV.get('tab', []): add(FX, tap(), s, .25)
for s in EV.get('unlock', []):
    for i, m in enumerate([81, 84, 88, 93]): add(FX, bell(m, 1.0), s + i * .07, .1)
for i, s in enumerate(EV.get('item', [])): add(FX, bell([81, 84, 88][i % 3], 1.0), s + .1, .18)
for s in EV.get('drop', []): add(FX, impact(1.0, 34), s)
# ---- the close: a riser into the logo locking, a big final chord, a last accent on the call
add(FX, whoosh(.7, True), OUT - .7, .35)
r = LOCK - (OUT + .5); add(FX, whoosh(r, True), OUT + .5, .45)
add(FX, impact(1.2, 32), LOCK); add(FX, clang(), LOCK, .14)
t = tt(DUR - LOCK); big = sum(saw(hz(m), t, .006) for m in FINAL) / len(FINAL)
add(FX, lp(big, .06) * np.minimum(1, t / .02) * np.exp(-t * .5), LOCK, .5)
for i, m in enumerate([FINAL[-1] + 12, FINAL[-1] + 16, FINAL[-1] + 19, FINAL[-1] + 24]): add(FX, bell(m, 1.8), LOCK + .15 + i * .14, .09, -.5 + i * .33)
add(FX, taiko(), CTA, .5)

mix = M + FX
tsec = np.arange(N) / SR
mix *= np.clip(tsec / .01, 0, 1) * (1 - np.clip((tsec - (DUR - .9)) / .9, 0, 1) ** 1.5)
mix = np.tanh(mix * 1.25) / np.tanh(1.25); mix /= np.max(np.abs(mix)) / .88
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w_:
    w_.setnchannels(2); w_.setsampwidth(2); w_.setframerate(SR); w_.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', STYLE, DUR, 's')
