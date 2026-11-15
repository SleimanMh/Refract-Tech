# The reel's original soundtrack: a 120 BPM track in F minor plus interface sound design,
# placed on the cue sheet the renderer exports (out/events.json). numpy only.
#   python3 scripts/music.py   ->  out/music.wav  (48 kHz stereo)
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
EV = json.load(open(os.path.join(OUT, 'events.json')))
SR = 48000
DUR = float(EV.get('duration', 23.5))
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rnd = np.random.default_rng(7)
BEAT = .5

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def add(sig, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); s = sig[:j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

def lp(x, a):
    """one-pole low-pass; a may be a constant (fast, by FFT) or a per-sample array"""
    if np.isscalar(a):
        n = min(len(x), int(np.log(1e-4) / np.log(1 - a)) + 1)
        k = a * (1 - a) ** np.arange(n)
        m = len(x) + n - 1; F = 1 << (m - 1).bit_length()
        return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(k, F), F)[:len(x)]
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a[i] * (x[i] - acc); y[i] = acc
    return y
def hp(x, a): return x - lp(x, a)
def env(n, a, d, s, r):
    e = np.full(n, float(s)); A = min(n, int(a * SR)); D = min(n - A, int(d * SR)); Rr = min(n, int(r * SR))
    e[:A] = np.linspace(0, 1, A, endpoint=False); e[A:A + D] = np.linspace(1, s, D)
    if Rr: e[-Rr:] *= np.linspace(1, 0, Rr)
    return e
def saw(f, t, det=0.0):
    return sum(2 * ((f * (1 + d) * t) % 1.0) - 1 for d in (-det, 0, det)) / 3
def sine(f, t): return np.sin(2 * np.pi * f * t)
def ev(k): return [x for x in EV.get(k, []) if not isinstance(x, list)]
def spans(k): return [x for x in EV.get(k, []) if isinstance(x, list)]

CH = [[53, 56, 60, 65], [49, 53, 56, 61], [56, 60, 63, 68], [51, 55, 58, 63]]   # Fm Db Ab Eb
BASS = [41, 37, 44, 39]
def chord_at(t): return int(max(0, t - 2.5) // 2) % 4

# ------------------------------------------------------------------ bed
def pad(t0, dur, notes, g, cut=.03):
    t = tt(dur); s = sum(saw(hz(m), t, .005) for m in notes) / len(notes)
    s = lp(s, cut) * env(len(t), min(.6, dur / 3), .2, .9, min(.8, dur / 3))
    add(s, t0, g, -.35); add(s, t0 + .011, g, .35)

pad(0.0, 2.6, [41, 53, 56, 60], .16, .02)                       # the dark before the spark
for bar in range(8):                                             # under the story
    t0 = 2.5 + bar * 2.0; pad(t0, 2.25, CH[bar % 4], .08)
pad(18.5, 2.2, [49, 56, 61, 65], .14, .025)                      # the website: held, expectant
pad(20.6, 2.95, [41, 53, 56, 60, 65, 72], .2, .04)               # the logo

# ------------------------------------------------------------------ drums + groove, 2.5 – 18.5
def kick():
    t = tt(.45); return sine(44 + 120 * np.exp(-t * 32), t) * np.exp(-t * 7) + hp(rnd.standard_normal(len(t)), .6) * np.exp(-t * 90) * .15
def clap():
    t = tt(.32); n = rnd.standard_normal(len(t))
    e = np.exp(-t * 20) + .5 * (t > .011) * np.exp(-np.maximum(0, t - .011) * 30)
    return hp(n, .12) * e * .5
def hat(open_=False):
    t = tt(.22 if open_ else .05); return hp(rnd.standard_normal(len(t)), .55) * np.exp(-t * (16 if open_ else 80)) * .25
K, CL = kick(), clap()
t = 2.5
while t < 18.5 - 1e-6:
    b = round((t - 2.5) / BEAT)
    add(K, t, .9)
    if b % 2 == 1: add(CL, t, .5, .05)
    lift = t >= 8.5
    add(hat(lift and b % 2 == 0), t + BEAT / 2, .55 if not lift else .5, .3)
    add(hat(), t + BEAT / 4, .28, -.35); add(hat(), t + 3 * BEAT / 4, .28, -.35)
    t += BEAT
t = 2.5
while t < 18.5 - 1e-6:                                            # bass in eighths
    c = chord_at(t); m = BASS[c] + (12 if round((t - 2.5) / .25) % 4 == 2 else 0)
    tb = tt(.24); s = lp(saw(hz(m), tb, .003), .07) * env(len(tb), .004, .08, .6, .05) + sine(hz(m), tb) * env(len(tb), .004, .1, .75, .05) * .9
    add(s, t, .3); t += .25
t = 2.5; k = 0; PAT = [0, 1, 2, 3, 2, 1, 3, 2]
while t < 18.5 - 1e-6:                                            # pluck arpeggio in sixteenths
    c = chord_at(t); m = CH[c][PAT[k % 8]] + (24 if t >= 14.0 else 12)
    tb = tt(.3); s = lp(saw(hz(m), tb) * .4 + sine(hz(m), tb), .3) * np.exp(-tb * 13)
    add(s, t, .11, .5 if k % 2 else -.5); t += .25; k += 1

# website section: a half-time pulse, filtered, building to the shatter
for i, tb0 in enumerate(np.arange(18.5, 20.0, .5)):
    add(K, tb0, .55 if i % 2 == 0 else .3)
t = tt(1.5); rise = hp(rnd.standard_normal(len(t)), .3) * (t / 1.5) ** 2.5
add(lp(rise, .25), 18.5, .22)

# ------------------------------------------------------------------ sound design
def whoosh(d=.55):
    t = tt(d); n = rnd.standard_normal(len(t)); e = np.sin(np.pi * t / d) ** 2
    return lp(n * e, np.linspace(.03, .3, len(t))) * .9
def impact(g=1.0, low=40):
    t = tt(1.3); boom = sine(low + 70 * np.exp(-t * 16), t) * np.exp(-t * 4)
    air = hp(rnd.standard_normal(len(t)), .4) * np.exp(-t * 14) * .2
    return (boom + air) * g
def shimmer(notes, d=1.6, decay=2.4):
    t = tt(d); return sum(sine(hz(m), t) * np.exp(-t * decay) + .3 * sine(hz(m) * 2.76, t) * np.exp(-t * decay * 2) for m in notes) / len(notes)
def click(pitch=2400):
    t = tt(.05); return (sine(pitch, t) * .6 + hp(rnd.standard_normal(len(t)), .5) * .5) * np.exp(-t * 140)
def plink(m):
    t = tt(.25); return (sine(hz(m), t) + .25 * sine(hz(m) * 3, t)) * np.exp(-t * 22)
def pop():
    t = tt(.12); return sine(500 + 900 * np.exp(-t * 40), t) * np.exp(-t * 30)
def chime(a, b):
    out = np.zeros(int(.9 * SR)); s1 = shimmer([a], .9, 5); out += s1
    s2 = shimmer([b], .9 - .09, 5); out[int(.09 * SR):int(.09 * SR) + len(s2)] += s2; return out

# the spark: a rising sparkle into the flash
t = tt(.5); add(lp(hp(rnd.standard_normal(len(t)), .5) * (t / .5) ** 3, .4), 0.0, .25)
add(sine(hz(89), tt(.5)) * (tt(.5) / .5) ** 2 * .3, 0.0, .5)
for s in ev('flash'): add(impact(.9, 34), s); add(shimmer([77, 84, 89, 96], 2.0, 1.8), s, .22, -.3); add(shimmer([80, 87, 92], 2.0, 1.8), s + .01, .2, .3)
for i, s in enumerate(ev('frag')): add(plink(84 + [0, 3, 7, 10, 12, 15, 19][i % 7]), s, .07, -.6 + (i % 5) * .3)
for s in ev('whoosh'): add(whoosh(), s - .3, .32, -.2); add(whoosh()[::-1] * .6, s - .3, .2, .3)
for s in ev('hit'): add(impact(.55), s)
for s in ev('boom'): add(impact(1.2, 30), s); add(shimmer([72, 79, 84, 91], 2.5, 1.5), s, .2)
for s in ev('tick'): add(click(3200), s, .22, .2)
for s in ev('click') + ev('tap'): add(click(1800), s, .35); add(click(900), s + .012, .2)
for s in ev('pop'): add(pop(), s, .2, .2)
for s in ev('snap'): add(impact(.6, 60), s); add(click(1200), s, .4)
for s in ev('success'): add(chime(84, 91), s, .2)
for s in ev('ping'): add(chime(88, 95), s, .22, .3)
for s in ev('swipe'): add(whoosh(.3), s - .05, .2, -.4)
for s in ev('sweep'): add(lp(whoosh(.6), .2), s - .05, .3, .4)
for a, b in spans('type'):                                         # key clicks while code or text streams
    for x in np.arange(a, b, .055): add(click(2600 + rnd.random() * 900), x + rnd.random() * .02, .09, rnd.random() - .5)
for a, b in spans('count'):
    for x in np.arange(a, b, .08): add(click(4200), x, .04)
for a, b in spans('riser'):                                        # the speed ramp into the website
    t = tt(b - a); n = hp(rnd.standard_normal(len(t)), .25) * (t / t[-1]) ** 3
    add(lp(n, np.linspace(.05, .5, len(t))), a, .3)
    add(saw(hz(53) * (1 + 1.5 * (t / t[-1]) ** 2), t) * (t / t[-1]) ** 2 * .08, a, 1)
for s in ev('shatter'):                                            # glass
    t = tt(.9); add(hp(rnd.standard_normal(len(t)), .7) * np.exp(-t * 6) * .4, s, .5)
    for j in range(14): add(plink(91 + int(rnd.random() * 12)), s + rnd.random() * .5, .06, rnd.random() * 2 - 1)
for s in ev('logo'):                                               # the reveal: impact, chord, bells ringing out
    add(impact(1.25, 32), s)
    t = tt(2.9); big = sum(saw(hz(m), t, .006) for m in [41, 53, 56, 60, 65, 68]) / 6
    big = lp(big, .05) * env(len(t), .01, .6, .5, 1.6)
    add(big, s, .5, -.2); add(big, s + .012, .5, .2)
    for i, m in enumerate([77, 80, 84, 89, 84, 92]): add(shimmer([m], 2.6, 2.2), s + .2 + i * .25, .14, -.6 + i * .24)

# ------------------------------------------------------------------ mix
d = int(.375 * SR)                                                  # a dotted-eighth echo, crossed
L2, R2 = L.copy(), R.copy(); L2[d:] += R[:-d] * .16; R2[d:] += L[:-d] * .16
mix = np.vstack([L2, R2])
mix *= np.clip(np.arange(N) / SR / .03, 0, 1) * (1 - np.clip((np.arange(N) / SR - (DUR - .6)) / .6, 0, 1))
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix /= np.max(np.abs(mix)) / .9
pcm = (mix.T * 32767).astype('<i2')
with wave.open(os.path.join(OUT, 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music.wav', DUR, 's')
