# The Padel Lounge × Refract Tech, v2: sunny Latin house at 118 BPM in A major (A – E – F#m – D).
# A plucked nylon guitar (Karplus–Strong) strums the chords, congas and shakers carry the groove,
# padel-ball "pocks" play in the rhythm, a marimba sings the hook; the ending matches the other
# case studies: the beat stops, guitar and piano rise and settle on a warm, open chord.
#   python3 scripts/padel_music2.py out/series/padel2
import json, os, sys, wave
import numpy as np

DIR = sys.argv[1]
EV = json.load(open(os.path.join(DIR, 'events.json')))
SR = 48000; DUR = float(EV['duration']); N = int(SR * DUR)
rnd = np.random.default_rng(118)
BPM = 118; BEAT = 60 / BPM; BAR = 4 * BEAT
SEC = EV.get('sections', {})
GROOVE, BOOK, ADMIN, FEAT, BUILT, END = (SEC.get(k, d) for k, d in (('groove', 2.9), ('book', 9.55), ('admin', 14.1), ('feat', 20.5), ('built', 25.3), ('end', 27.1)))
M = np.zeros((2, N)); FX = np.zeros((2, N)); EB = np.zeros((2, N))

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

_ks = {}
def guitar(m, d=1.2, bright=.5):
    """a nylon-string pluck: Karplus–Strong, cached per pitch"""
    key = (m, round(d, 2), bright)
    if key in _ks: return _ks[key]
    f = hz(m); p = max(2, int(SR / f)); n = int(d * SR)
    buf = lp(rnd.standard_normal(p), .25 + .5 * bright); out = np.empty(n)
    # block-wise recurrence: each period is the running average of the previous one
    pos = 0; damp = .996
    while pos < n:
        k = min(p, n - pos); out[pos:pos + k] = buf[:k]
        nxt = damp * .5 * (buf + np.roll(buf, -1)); buf = nxt; pos += k
    out *= np.minimum(1, np.arange(n) / 30); _ks[key] = out
    return out
def conga(hi=False):
    t = tt(.3); f = (330 if hi else 220) * (1 + .4 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (14 if hi else 10)) + hp(rnd.standard_normal(len(t)), .5) * np.exp(-t * 90) * .2
def kick():
    t = tt(.4); return sine(46 + 110 * np.exp(-t * 34), t) * np.exp(-t * 7.5)
def rim():
    t = tt(.08); return (sine(1700, t) * .5 + hp(rnd.standard_normal(len(t)), .4) * .5) * np.exp(-t * 70)
def shaker(acc=False):
    t = tt(.08); return hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * (45 if acc else 70)) * (.26 if acc else .17)
def pock(g=1.0):
    t = tt(.16); return (sine(1250 * (1 - .15 * t / .16), t) * .6 + sine(620, t) * .5 + hp(rnd.standard_normal(len(t)), .5) * .22) * np.exp(-t * 40) * g
def marimba(m, d=.5):
    t = tt(d); f = hz(m); return (sine(f, t) + .4 * sine(f * 4, t) * np.exp(-t * 28) + .15 * sine(f * 10, t) * np.exp(-t * 60)) * np.exp(-t * 6) * np.minimum(1, t / .002)
def bass(m, d):
    t = tt(d); return (sine(hz(m), t) + .3 * sine(hz(m) * 2, t)) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .03) * np.exp(-t * 1.5)
def pad(notes, d, cut=.025, attack=.5):
    t = tt(d); s = sum(saw(hz(m), t, .006) for m in notes) / len(notes)
    return lp(s, cut) * np.minimum(1, t / attack) * np.minimum(1, (d - t) / .5)
def piano(m, d=2.6, vel=1.0):
    t = tt(d); f = hz(m)
    s = sum(a * sine(f * k * (1 + .0007 * k * k), t) * np.exp(-t * (1.6 + k * .9)) for k, a in ((1, 1), (2, .45), (3, .2), (4, .1)))
    return s * np.minimum(1, t / .004) * vel
def bell(m, d=1.4):
    t = tt(d); f = hz(m); return (sine(f, t) + .3 * sine(f * 2.76, t) * np.exp(-t * 4)) * np.exp(-t * 2.6)

CH = [[57, 61, 64, 69], [52, 56, 59, 64], [54, 57, 61, 66], [50, 54, 57, 62]]    # A E F#m D (guitar voicings)
ROOT = [45, 40, 42, 38]
HOOK = [[76, None, 73, 76, None, 78, 76, None], [76, None, 71, 76, None, 80, 78, None], [78, None, 73, 76, None, 78, 81, None], [78, None, 74, 76, None, 74, 73, None]]

def sec(t):
    if t < GROOVE: return 'open'
    if t < BOOK: return 'light'
    if t < FEAT: return 'full'
    if t < BUILT: return 'full2'
    if t < END: return 'break'
    return 'end'

KICKS = []
for bar in range(int(np.ceil(DUR / BAR)) + 1):
    t0 = bar * BAR; c = bar % 4
    s0 = sec(t0 + .01)
    if s0 == 'end': break
    # the strum: a quick down-stroke on 1 and the "and" of 2 and 4, Latin style
    if s0 != 'open':
        for off, g in ((0, .9), (1.5, .7), (2.5, .6), (3.5, .7)):
            tb = t0 + off * BEAT
            if tb >= END: continue
            for k, m in enumerate(CH[c]): add(M, guitar(m, 1.1, .55), tb + k * .012, .16 * g, -.3 + k * .2)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= END: break
        s = sec(tb)
        if s in ('full', 'full2'): add(M, kick(), tb, .85); KICKS.append(tb)
        elif s == 'light' and b in (0, 2): add(M, kick(), tb, .6); KICKS.append(tb)
        elif s == 'break' and b == 0: add(M, kick(), tb, .45); KICKS.append(tb)
        if s in ('light', 'full', 'full2', 'break'):
            for s16 in range(4): add(M, shaker(s16 == 2), tb + s16 * BEAT / 4, 1, .35 if s16 % 2 else -.35)
        if s in ('full', 'full2'):
            add(M, conga(False), tb + BEAT * .5, .32, -.4); add(M, conga(True), tb + BEAT * .75, .26, .4)
            if b % 2 == 1: add(M, rim(), tb, .35, .2)
            # the ball in the groove: a soft pock on the last sixteenth of beats 2 and 4
            if b % 2 == 1: add(M, pock(.3), tb + BEAT * .75, 1, .5)
        if s in ('light', 'full', 'full2', 'break'):
            add(M, bass(ROOT[c], BEAT * .9), tb, .36 if s != 'break' else .2)
    # the marimba hook from the booking on
    for k in range(8):
        tk = t0 + k * BEAT / 2; m = HOOK[c][k]
        if m is None or tk >= END: continue
        if sec(tk) in ('full', 'full2'): add(M, marimba(m), tk, .17, -.3 if k % 2 else .3)
    if s0 in ('light', 'full', 'full2', 'break'): add(M, pad(CH[c], BAR + .05), t0, .07 if s0 != 'break' else .14)

# the opening: a bright shimmer that the bounce lands into
t = tt(GROOVE + .3); add(M, pad([57, 64, 69, 73, 76], len(t) / SR, .03) * np.minimum(1, t / 1.2), 0, .22)

# the ending: guitar arpeggio and piano over a soft pad, settling on A major add9
e0 = END
add(EB, pad([45, 57, 64, 69, 71], DUR - e0 + .2, .03, 1.2), e0 - .2, .24)
for i, m in enumerate([57, 61, 64, 69, 71, 73, 76]):
    add(EB, guitar(m, 2.6, .45), e0 + .1 + i * .26, .26, -.45 + i * .15)
fin = e0 + .1 + 7 * .26 + .15
for m in [45, 57, 64, 69, 71, 76]: add(EB, piano(m, DUR - fin + .1, .9), fin, .14)
add(EB, bell(88, 2.2), fin + .05, .06, .4)

duck = np.ones(N)
for k in KICKS:
    i = int(k * SR); n = min(N - i, int(BEAT * SR))
    if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - .4 * np.exp(-np.arange(n) / SR * 11))
M *= duck
d = int(BEAT * .75 * SR); E = M.copy(); E[0, d:] += M[1, :-d] * .1; E[1, d:] += M[0, :-d] * .1; M = E
d2 = int(.42 * SR); E = EB.copy(); E[0, d2:] += EB[1, :-d2] * .2; E[1, d2:] += EB[0, :-d2] * .2; EB = E

# ---- one sound per moment
def whoosh(dd):
    t = tt(dd); n = rnd.standard_normal(len(t)); return lp(n * np.sin(np.pi * t / dd) ** 2, .12) * .9
def tick():
    t = tt(.5); return (sine(hz(93), t) * .6 + sine(hz(100), t) * .25) * np.exp(-t * 9) * np.minimum(1, t / .003)
def tap():
    t = tt(.06); return (sine(1800, t) * .5 + hp(rnd.standard_normal(len(t)), .5) * .4) * np.exp(-t * 120)
for s in EV.get('pock', []): add(FX, pock(1.0), s, .5)
for s in EV.get('x', []): add(FX, guitar(69, 1.6, .7), s, .3); add(FX, guitar(76, 1.6, .7), s + .03, .25)   # the ×: a bright strum
for s in EV.get('tick', []): add(FX, tick(), s, .13)
for s in EV.get('whoosh', []): add(FX, whoosh(.5), s - .25, .24)
for s in EV.get('tap', []): add(FX, tap(), s, .32)
for s in EV.get('bell', []): add(FX, bell(81, 1.2), s, .24); add(FX, bell(88, 1.0), s + .14, .18)
for s in EV.get('notify', []): add(FX, marimba(88, .4), s, .2); add(FX, marimba(93, .4), s + .09, .18)
for i, s in enumerate(EV.get('slots', [])): add(FX, marimba([69, 73, 76, 81, 85, 88, 93][i % 7], .35), s, .12, -.4 + i * .13)
for s in EV.get('tab', []): add(FX, tap(), s, .25)
for s in EV.get('unlock', []):
    for i, m in enumerate([81, 85, 88, 93]): add(FX, bell(m, 1.0), s + i * .07, .1)
for i, s in enumerate(EV.get('item', [])): add(FX, bell([81, 85, 88][i % 3], 1.0), s + .1, .18)
for s in EV.get('rise', []):
    for i, m in enumerate([88, 93, 97, 100]): add(FX, bell(m, 1.4), s + i * .12, .05, -.4 + i * .27)

mix = M + FX + EB
tsec = np.arange(N) / SR
mix *= np.clip(tsec / .03, 0, 1) * (1 - np.clip((tsec - (DUR - 1.1)) / 1.1, 0, 1) ** 1.6)
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix /= np.max(np.abs(mix)) / .88
with wave.open(os.path.join(DIR, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('music.wav', DUR, 's')
