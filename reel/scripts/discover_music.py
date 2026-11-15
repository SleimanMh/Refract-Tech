# The Discover reel's soundtrack: a bright, bouncy 122 BPM house track in D minor (Dm – Bb – F – C).
#   intro   0 – 2.6   shimmering swell under the logo, a hit as the R locks
#   verse   2.6 – 4.6 four-on-the-floor, offbeat hats, filtered chord stabs
#   build   4.6 – 7.2 the chaos: filter opening, snare roll speeding up, a riser
#   drop    7.2 – 13.6 everything: pumping chords, rolling bass, a chopped lead hook;
#                      each note snapping into the plan plays the next note of an arpeggio
#   break   13.6 – 16  the lens: chords and air
#   outro   16 – 20    the contact card: the hook returns, then a final chord rings out
#   python3 scripts/discover_music.py out/series/discover2
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(21)
BPM = 122; BEAT = 60 / BPM; BAR = 4 * BEAT
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

CH = [[62, 65, 69, 74], [58, 62, 65, 70], [57, 60, 65, 69], [60, 64, 67, 72]]   # Dm Bb F C
ROOT = [38, 34, 41, 36]
# the hook: a syncopated, singable line over each chord (sixteenth steps, None = rest)
HOOK = [[74, None, 77, None, 76, 74, None, 72, 74, None, None, 69, None, 72, 74, None],
        [74, None, 77, None, 76, 74, None, 77, 79, None, None, 77, None, 74, 72, None],
        [72, None, 74, None, 76, 77, None, 76, 74, None, None, 72, None, 69, 72, None],
        [72, None, 76, None, 79, 77, None, 76, 74, None, None, 76, None, 77, 79, None]]

LOCK = (EV.get('lock') or [1.12])[0]; VERSE = 2.6; BUILD = 4.6; DROP = (EV.get('drop') or [7.2])[0]; BREAK = 13.6; END = (EV.get('end') or [16.0])[0]
def section(t):
    return 'intro' if t < VERSE else 'verse' if t < BUILD else 'build' if t < DROP else 'drop' if t < BREAK else 'break' if t < END else 'outro'

# ---- instruments
def kick():
    t = tt(.42); return sine(44 + 130 * np.exp(-t * 36), t) * np.exp(-t * 7) + hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 140) * .15
def clap():
    t = tt(.3); n = rnd.standard_normal(len(t)); return hp(n, .14) * (np.exp(-t * 20) + .6 * (t > .01) * np.exp(-np.maximum(0, t - .01) * 26)) * .55
def snare():
    t = tt(.16); return (hp(rnd.standard_normal(len(t)), .2) * .7 + sine(190, t) * .5) * np.exp(-t * 26)
def hat(op=False):
    t = tt(.24 if op else .045); return hp(rnd.standard_normal(len(t)), .62) * np.exp(-t * (11 if op else 90)) * .24
def stab(notes, d=.22, cut=.25):
    t = tt(d); s = sum(saw(hz(m), t, .007) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / .004) * np.exp(-t * 5) * np.minimum(1, (d - t) / .02)
def chop(m, d=.2):
    # a "vocal chop" lead: a bright pulse that slides up into the note, with an 'ah'-like body
    t = tt(d); f = hz(m) * (1 - .06 * np.exp(-t * 60))
    ph = np.cumsum(f) / SR; body = np.sign(np.sin(2 * np.pi * ph)) * .35 + np.sin(2 * np.pi * ph) * .7 + .3 * np.sin(4 * np.pi * ph)
    return lp(body, .22) * np.minimum(1, t / .005) * np.exp(-t * 6) * np.minimum(1, (d - t) / .015)
def sub(m, d):
    t = tt(d); return (sine(hz(m), t) + .35 * lp(saw(hz(m), t), .05)) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .02)
def pad(notes, d, cut=.03):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4)
def bell(m, d=1.6):
    t = tt(d); f = hz(m); return (sine(f, t) + .3 * sine(f * 2.76, t) * np.exp(-t * 4)) * np.exp(-t * 2.6)

KICKS = []
nbar = int(np.ceil(DUR / BAR)) + 1
for bar in range(nbar):
    t0 = bar * BAR; c = bar % 4
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= DUR: break
        sec = section(tb)
        if sec in ('verse', 'drop', 'outro') or (sec == 'break' and b == 0):
            add(M, kick(), tb, .95 if sec == 'drop' else .75); KICKS.append(tb)
        if sec in ('drop', 'outro') and b % 2 == 1: add(M, clap(), tb, .5)
        if sec in ('verse', 'drop', 'outro'): add(M, hat(True), tb + BEAT / 2, .5 if sec == 'drop' else .35, .25)
        if sec == 'drop':
            for s16 in (1, 3): add(M, hat(), tb + s16 * BEAT / 4, .3, -.3)
        # rolling offbeat bass
        if sec in ('verse', 'drop', 'outro'):
            add(M, sub(ROOT[c], BEAT / 2 - .02), tb + BEAT / 2, .5 if sec == 'drop' else .38)
            if sec == 'drop': add(M, sub(ROOT[c] + 12, BEAT / 4 - .02), tb + 3 * BEAT / 4, .25)
        # chord stabs on the offbeats, brighter in the drop
        if sec in ('verse', 'drop', 'outro'):
            cut = .08 if sec == 'verse' else .3
            add(M, stab(CH[c], cut=cut), tb + BEAT / 2, .24 if sec == 'drop' else .16, .15)
        if sec == 'build':
            cut = .05 + .25 * (tb - BUILD) / (DROP - BUILD)
            add(M, stab(CH[c], .18, cut), tb, .14); add(M, stab(CH[c], .18, cut), tb + BEAT / 2, .12)
    # the hook in the drop and the outro
    for k in range(16):
        tk = t0 + k * BEAT / 4; m = HOOK[c][k]
        if m is None or tk >= DUR: continue
        sec = section(tk)
        if sec == 'drop' and tk > DROP + BAR * .5: add(M, chop(m), tk, .2, -.25 if k % 2 else .25)
        elif sec == 'outro' and tk < END + 2.4: add(M, chop(m), tk, .15, -.25 if k % 2 else .25)
    sec = section(t0 + .01)
    if sec in ('verse', 'build', 'drop', 'break'): add(M, pad(CH[c], BAR + .05, .02 if sec != 'drop' else .03), t0, .1 if sec != 'break' else .2)

# the build: a snare roll that speeds up, and the filter opening
t = BUILD + BAR
step = BEAT
while t < DROP - .02:
    add(M, snare(), t, .15 + .35 * (t - BUILD) / (DROP - BUILD), .1)
    step = BEAT / 2 if t > DROP - 2 * BEAT * 2 else BEAT
    if t > DROP - BEAT * 2: step = BEAT / 4
    t += step
# intro and outro colour
t = tt(VERSE + .3); add(M, pad([50, 62, 65, 69, 74], len(t) / SR) * np.minimum(1, t / 1.4), 0, .22)
for i, m in enumerate([86, 89, 93, 98, 93, 89]): add(M, bell(m, 1.3), .3 + i * .17, .05, -.5 + i * .2)
fin = END + 2.6
add(M, pad([50, 62, 65, 69, 74, 77], DUR - fin + .2, .05), fin, .25)
for i, m in enumerate([74, 77, 81, 86, 89]): add(M, bell(m), fin + .1 + i * .2, .1, -.5 + i * .25)

# sidechain pump and an echo on the music bus
duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); n = min(N - i, int(BEAT * SR))
    if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - .55 * np.exp(-np.arange(n) / SR * 10))
M *= duck
d = int(BEAT * .75 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .13; E[1, d:] += M[0, :-d] * .13; M = E

# ---- one sound per moment
def whoosh(d):
    t = tt(d); n = rnd.standard_normal(len(t)); return lp(n * np.sin(np.pi * t / d) ** 2, .12) * .9
def riser(d):
    t = tt(d); return lp(hp(rnd.standard_normal(len(t)), .3) * (t / d) ** 3, .3)
def impact(g=1.0, low=38):
    t = tt(1.3); return (sine(low + 75 * np.exp(-t * 16), t) * np.exp(-t * 3.8) + hp(rnd.standard_normal(len(t)), .4) * np.exp(-t * 14) * .2) * g
def tick():
    t = tt(.5); return (sine(hz(98), t) * .6 + sine(hz(105), t) * .25) * np.exp(-t * 9) * np.minimum(1, t / .003)
for s in EV.get('lock', []): add(FX, impact(.7, 36), s); add(FX, bell(86, 1.2), s, .28)
for s in EV.get('tick', []): add(FX, tick(), s, .14)
for s in EV.get('swirl', []): add(FX, whoosh(.9), s - .2, .3)
for a, b in EV.get('riser', []): add(FX, riser(b - a), a, .45)
for s in EV.get('drop', []): add(FX, impact(1.1, 34), s)
for i, s in enumerate(EV.get('snaps', [])): add(FX, bell([74, 77, 81, 86, 89, 93][i % 6], .7), s + .3, .13, -.4 + i * .16)   # each answer rings the next note
for s in EV.get('whoosh', []): add(FX, whoosh(.5), s - .25, .25)
for s in EV.get('shimmer', []):
    for i, m in enumerate([93, 98, 101, 105]): add(FX, bell(m, 1.1), s + .15 + i * .28, .06, -.5 + i * .33)
for s in EV.get('end', []): add(FX, impact(.9, 34), s); add(FX, bell(86, 1.4), s, .2)

mix = M + FX
mix *= np.clip(np.arange(N) / SR / .03, 0, 1) * (1 - np.clip((np.arange(N) / SR - (DUR - .7)) / .7, 0, 1))
mix = np.tanh(mix * 1.2) / np.tanh(1.2); mix /= np.max(np.abs(mix)) / .9
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's')
