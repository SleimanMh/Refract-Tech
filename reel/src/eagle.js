// Eagle Strength — 60 Days Challenge. A 25 s reel for Eagle Strength to post themselves: no Refract
// branding. Motivation and calisthenics first (animated athletes doing pushups, pull-ups, a plank and
// a run), consistency as a 60-day streak, then the app that keeps the squad accountable, the two
// levels, and the call to join. Cuts land on a 140 BPM beat (one beat = 3/7 s).
import { bump, clamp, ease, h, lerp, look, prog, rng, spring, track, tw } from './lib.js';

const B = 60 / 140;                       // one beat
const at = beats => +(beats * B).toFixed(3);
const T = { hook: 0, comfort: at(6), mont: at(11), cons: at(21), app: at(27), tap: at(33), board: at(37), lvl: at(41), cta: at(48), end: 25.0 };
const TILES = [T.mont, at(13.5), at(16), at(18.5)];
const TAP = at(34.5);

// ------------------------------------------------------------------ background: black, glows, dust, grain
function Background(cv) {
  const g = cv.getContext('2d'), R = rng(7);
  const dust = Array.from({ length: 70 }, () => ({ x: R() * 1080, y: R() * 1920, s: .8 + R() * 2.4, v: 20 + R() * 60, p: R() * 6.28 }));
  const grain = Array.from({ length: 4 }, () => { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const x = c.getContext('2d'), im = x.createImageData(540, 960); for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; });
  return {
    draw(t, heat = 1) {
      g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, 1080, 1920);
      const glow = (x, y, r, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920); };
      glow(200 + 80 * Math.sin(t * .4), 1700, 1000, '227,38,28', .32 * heat);
      glow(900 + 60 * Math.cos(t * .3), 260, 900, '246,185,18', .2 * heat);
      glow(540, 960, 700, '40,30,10', .5);
      g.fillStyle = '#FFD34D';
      for (const d of dust) { const y = ((d.y - t * d.v) % 1920 + 1920) % 1920; g.globalAlpha = (.25 + .35 * Math.sin(t * 2 + d.p)) * heat; g.beginPath(); g.arc(d.x + Math.sin(t + d.p) * 20, y, d.s, 0, 6.283); g.fill(); }
      g.globalAlpha = .07; g.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, 1080, 1920);
      g.globalAlpha = 1;
    },
  };
}

// ------------------------------------------------------------------ type
/** Lines that slam in (scale down onto the screen) one after another. Lines are HTML strings. */
function Slam(parent, lines, { y, size, gap = 1, cls = 'disp' }) {
  const el = h('div', 'big ' + cls, parent); el.style.top = y + 'px';
  const rows = lines.map(l => { const r = h('div', 'row', el); r.style.fontSize = size + 'px'; r.style.lineHeight = gap; return h('span', '', r, l); });
  return {
    update(t, tins, tout) {
      const on = t > tins[0] - .05 && t < tout + .3; el.style.display = on ? '' : 'none'; if (!on) return;
      rows.forEach((s, i) => {
        const a = tins[i] ?? tins[tins.length - 1], k = ease.outExpo(prog(t, a, a + .28)), e = ease.inCubic(prog(t, tout - .18, tout + .1));
        look(s, clamp(k * 3) * (1 - e), `scale(${(1 + (1 - k) * .9 + e * .25).toFixed(4)})`, (1 - k) * 14 + e * 10);
      });
    },
  };
}

// ------------------------------------------------------------------ the athletes (side and front views, drawn as strong strokes)
const P = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const seg = (...pts) => 'M' + pts.map(([x, y]) => P(x, y)).join('L');
const elbow = (s, hnd, a, sideX) => {   // two-bone joint between s and hnd, bending toward sideX
  const dx = hnd[0] - s[0], dy = hnd[1] - s[1], d = Math.min(Math.hypot(dx, dy), 2 * a - .01), m = [(s[0] + hnd[0]) / 2, (s[1] + hnd[1]) / 2];
  let n = [-dy / d, dx / d]; if (Math.sign(n[0]) !== Math.sign(sideX)) n = [-n[0], -n[1]];
  const o = Math.sqrt(a * a - (d / 2) ** 2); return [m[0] + n[0] * o, m[1] + n[1] * o];
};
// Muscular bodies built from shaped limbs: each limb is an outline with a muscle profile along it
// (deltoid, biceps, forearm, quad, calf, a V-tapered back), smoothed into one curve. The body is a
// near-black silhouette, edged in gold by a light from the upper left, with a red backlight behind.
const V = (x, y) => [x, y], add2 = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
/** a smooth closed path through points (Catmull–Rom) */
function smooth(pts) {
  const n = pts.length; let d = `M${P(...pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(...c1)} ${P(...c2)} ${P(...p2)}`;
  }
  return d + 'Z';
}
/** a limb from a to b; prof = [[t, left, right], ...] half-widths along it ("left" = normal turned +90°) */
function limb(a, b, prof) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, u = [dx / L, dy / L], n = [-u[1], u[0]];
  const w = (t, side) => { for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) { const [t0, ...w0] = prof[i - 1], [t1, ...w1] = prof[i], k = (t - t0) / (t1 - t0), e = k * k * (3 - 2 * k); return w0[side] + (w1[side] - w0[side]) * e; } return prof[prof.length - 1][side + 1]; };
  const S = 9, L1 = [], R1 = [];
  for (let i = 0; i <= S; i++) { const t = i / S, c = add2(a, mul(u, L * t)); L1.push(add2(c, mul(n, w(t, 0)))); R1.push(add2(c, mul(n, -w(t, 1)))); }
  const r0 = (w(0, 0) + w(0, 1)) / 2, r1 = (w(1, 0) + w(1, 1)) / 2;
  const cap = (c, r, dir) => [-.6, 0, .6].map(k => add2(c, add2(mul(dir, r * Math.cos(k) * .9), mul(n, r * Math.sin(k) * .9 * (dir === u ? 1 : -1)))));
  return smooth([...cap(a, r0, mul(u, -1)).reverse().map((p, i, arr) => arr[arr.length - 1 - i]), ...L1, ...cap(b, r1, u), ...R1.reverse()]);
}
const ellipse = (c, rx, ry, rot = 0) => { const pts = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry, cr = Math.cos(rot), sr = Math.sin(rot); pts.push([c[0] + x * cr - y * sr, c[1] + x * sr + y * cr]); } return smooth(pts); };
const PROF = {
  thigh: [[0, 25, 23], [.45, 38, 35], [1, 42, 40]], shin: [[0, 15, 15], [.45, 25, 21], [1, 25, 23]],
  upper: [[0, 38, 38], [.32, 42, 39], [.75, 31, 30], [1, 24, 24]], fore: [[0, 26, 26], [.25, 30, 28], [1, 17, 17]],
  neck: [[0, 34, 34], [1, 26, 26]], foot: [[0, 14, 12], [1, 9, 9]], hand: [[0, 15, 15], [1, 13, 13]],
};
function Figure(parent, kind) {
  const el = h('div', 't-fig', parent, `<svg class="fig2" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs><linearGradient id="skin-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a221a"/><stop offset=".45" stop-color="#110e0b"/><stop offset="1" stop-color="#050404"/></linearGradient>
      <filter id="soft-${kind}"><feGaussianBlur stdDeviation="3"/></filter><filter id="halo-${kind}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="40"/></filter>
      <g id="body-${kind}"><path class="pb pb0"/><path class="pb pb1"/><path class="pb pb2"/><path class="pb pb3"/><path class="pb pb4"/><path class="pb pb5"/><path class="pb pb6"/><path class="pb pb7"/><path class="pb pb8"/><path class="pb pb9"/><path class="pb pb10"/><path class="pb pb11"/><path class="pb pb12"/><path class="pb pb13"/></g></defs>
    <ellipse class="floor" cx="540" cy="1190" rx="430" ry="34" fill="#E3261C" opacity=".22" filter="url(#halo-${kind})"/>
    <path class="ground" stroke="#F6B912" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/><path class="bar" stroke="#9b978d" stroke-width="20" fill="none" stroke-linecap="round"/>
    <g fill="#E3261C" opacity=".35" filter="url(#halo-${kind})"><use href="#body-${kind}"/></g>
    <g fill="#FFD34D" transform="translate(-7 -8)" filter="url(#soft-${kind})" opacity=".95"><use href="#body-${kind}"/></g>
    <g fill="#F6B912" transform="translate(-4 -5)"><use href="#body-${kind}"/></g>
    <g fill="url(#skin-${kind})"><use href="#body-${kind}"/></g>
    <g class="detail" fill="none" stroke="#F6B912" stroke-width="3" stroke-linecap="round" opacity=".28"><path class="dt"/></g>
    <g class="speed">${[0, 1, 2, 3].map(() => `<line class="sl" stroke="#F6B912" stroke-width="5" opacity=".45" stroke-linecap="round"/>`).join('')}</g></svg>`);
  const parts = [...el.querySelectorAll('.pb')], ground = el.querySelector('.ground'), bar = el.querySelector('.bar'), dt = el.querySelector('.dt'), sls = [...el.querySelectorAll('.sl')], floor = el.querySelector('.floor');
  const set = list => parts.forEach((p, i) => p.setAttribute('d', list[i] || ''));
  return {
    el,
    update(t, t0) {
      const x = t - t0;
      if (kind === 'push' || kind === 'plank') {
        // side view, facing right: feet on the floor, a straight body from heels to shoulders
        const G = 1150, fx = 190, L = 600;
        let hs, sh, hand, elbowP;
        if (kind === 'push') {
          const u = .5 + .5 * Math.cos(2 * Math.PI * x / (2 * B));
          hs = lerp(112, 250, ease.inOutSine(u));
          sh = [fx + Math.sqrt(L * L - hs * hs), G - hs]; hand = [sh[0] + 22, G - 14]; elbowP = elbow(sh, hand, 140, -1);
        } else {
          const tr = Math.sin(x * 47) * 2.4; hs = 150 + tr; sh = [fx + Math.sqrt(L * L - hs * hs), G - hs]; elbowP = [sh[0] + 6, G - 22]; hand = [sh[0] + 150, G - 18];
        }
        const dir = [(sh[0] - fx) / L, (sh[1] - G) / L], at = k => [fx + (sh[0] - fx) * k, G + (sh[1] - G) * k];
        const ankle = at(.03), knee = at(.29), hip = at(.5), neckTop = add2(sh, mul(dir, 62)), headC = add2(add2(sh, mul(dir, 112)), [6, -22]);
        set([
          limb(ankle, add2(ankle, [-28, 18]), PROF.foot),
          limb(ankle, knee, [[0, 15, 15], [.45, 23, 26], [1, 24, 25]]),                       // calf on top
          limb(knee, hip, [[0, 25, 23], [.5, 37, 39], [1, 42, 42]]),
          limb(hip, sh, [[0, 44, 42], [.45, 50, 44], [.78, 66, 54], [1, 50, 48]]),            // chest below, back above
          limb(sh, neckTop, PROF.neck),
          ellipse(headC, 38, 46, Math.atan2(dir[1], dir[0])),
          limb(sh, elbowP, PROF.upper), limb(elbowP, hand, PROF.fore), limb(hand, add2(hand, [30, 2]), PROF.hand),
        ]);
        ground.setAttribute('d', seg([90, G + 22], [990, G + 22])); bar.setAttribute('d', '');
        dt.setAttribute('d', seg(at(.62), at(.8)));
        floor.setAttribute('cy', G + 30);
      } else if (kind === 'pull') {
        // from behind: the V-tapered back doing the work
        const by = 610, u = .5 - .5 * Math.cos(2 * Math.PI * x / (2.5 * B)), cx = 540, K = .8;
        const sy = lerp(by + 205, by + 55, ease.inOutSine(u)), f = (dx, dy) => [cx + dx * K, sy + dy * K];
        const flare = 1 + .05 * u;
        const back = [f(0, -26), f(30 * flare, -30), f(118 * flare, -6), f(160 * flare, 26), f(156 * flare, 70), f(136 * flare, 112), f(104, 200), f(76, 262), f(84, 318), f(66, 362), f(0, 352),
          f(-66, 362), f(-84, 318), f(-76, 262), f(-104, 200), f(-136 * flare, 112), f(-156 * flare, 70), f(-160 * flare, 26), f(-118 * flare, -6), f(-30 * flare, -30)];
        const hands = [[cx - 150, by + 4], [cx + 150, by + 4]], shs = [f(-138, 30), f(138, 30)];
        const els = [elbow(shs[0], hands[0], 132, -1), elbow(shs[1], hands[1], 132, 1)];
        const hips = [f(-44, 330), f(44, 330)], knees = [f(-46, 510), f(46, 510)], ankles = [f(22, 640), f(-22, 650)];   // knees bent, ankles crossed
        set([
          smooth(back), limb(f(0, -20), f(0, -70), PROF.neck), ellipse(f(0, -104), 40 * K, 50 * K),
          limb(shs[0], els[0], [[0, 40, 40], [.35, 44, 40], [1, 25, 25]]), limb(els[0], hands[0], PROF.fore),
          limb(shs[1], els[1], [[0, 40, 40], [.35, 40, 44], [1, 25, 25]]), limb(els[1], hands[1], PROF.fore),
          limb(hips[0], knees[0], PROF.thigh.map(([a, l, r]) => [a, l * K, r * K])), limb(knees[0], ankles[0], PROF.shin.map(([a, l, r]) => [a, l * K, r * K])),
          limb(hips[1], knees[1], PROF.thigh.map(([a, l, r]) => [a, r * K, l * K])), limb(knees[1], ankles[1], PROF.shin.map(([a, l, r]) => [a, r * K, l * K])),
        ]);
        bar.setAttribute('d', seg([200, by], [880, by])); ground.setAttribute('d', '');
        // the spine, the shoulder blades, the lats
        dt.setAttribute('d', seg(f(0, 10), f(0, 300)) + `M${P(...f(-70, 40))}Q${P(...f(-40, 90))} ${P(...f(-20, 130))}M${P(...f(70, 40))}Q${P(...f(40, 90))} ${P(...f(20, 130))}M${P(...f(-120, 100))}Q${P(...f(-90, 180))} ${P(...f(-70, 240))}M${P(...f(120, 100))}Q${P(...f(90, 180))} ${P(...f(70, 240))}`);
        floor.setAttribute('cy', 1260);
      } else if (kind === 'run') {
        const ph = 2 * Math.PI * x / (1.5 * B), bob = Math.abs(Math.sin(ph)) * -12, hip = [520, 930 + bob], sh = [566, 712 + bob];
        const leg = (p, s) => { const th = .6 * Math.sin(p), kn = [hip[0] + 148 * Math.sin(th), hip[1] + 148 * Math.cos(th)], bend = .25 + 1.15 * Math.max(0, -Math.sin(p - .6)), a2 = th - bend, an = [kn[0] + 150 * Math.sin(a2), kn[1] + 150 * Math.cos(a2)];
          return [limb(hip, kn, PROF.thigh), limb(kn, an, PROF.shin.map(([a, l, r]) => [a, r, l])), limb(an, add2(an, [36 * Math.cos(a2 - 1.4), 36 * Math.sin(a2 - 1.4) * -1]), PROF.foot)]; };
        const arm = p => { const al = -.75 * Math.sin(p), e1 = [sh[0] + 108 * Math.sin(al), sh[1] + 108 * Math.cos(al)], a2 = al + 1.75, hd = [e1[0] + 96 * Math.sin(a2), e1[1] + 96 * Math.cos(a2)]; return [limb(sh, e1, PROF.upper), limb(e1, hd, PROF.fore)]; };
        const back = leg(ph + Math.PI), front = leg(ph), aB = arm(ph), aF = arm(ph + Math.PI);
        set([...back, ...aB, limb(hip, sh, [[0, 44, 42], [.45, 42, 48], [.8, 52, 58], [1, 46, 46]]), limb(sh, [sh[0] + 14, sh[1] - 56], PROF.neck), ellipse([sh[0] + 26, sh[1] - 96], 36, 44, .2), ...front, ...aF]);
        ground.setAttribute('d', seg([90, 1220], [990, 1220])); bar.setAttribute('d', ''); dt.setAttribute('d', '');
        floor.setAttribute('cy', 1225);
        sls.forEach((l, i) => { const xx = ((900 - (x * 1700 + i * 260)) % 1100 + 1100) % 1100; l.setAttribute('x1', xx.toFixed(0)); l.setAttribute('x2', (xx + 150).toFixed(0)); l.setAttribute('y1', 660 + i * 140); l.setAttribute('y2', 660 + i * 140); });
      }
    },
  };
}

// ------------------------------------------------------------------ the reel
const hud = document.getElementById('hud');
const bg = Background(document.getElementById('bg'));

// 1 · hook
const slash = h('div', 'slash', hud); slash.style.top = '820px';
const six = h('div', 'stamp brush gold', hud, '60'); six.style.fontSize = '470px';
const days = h('div', 'stamp disp', hud, 'DAYS'); days.style.fontSize = '250px';
const chal = h('div', 'stamp brush', hud, 'CHALLENGE'); chal.style.fontSize = '120px'; chal.style.color = '#0B0B0C';
const noEx = Slam(hud, ['NO <span class="red">EXCUSES.</span>'], { y: 1390, size: 120 });
const eagleTop = h('div', 'eagle', hud, '<img src="assets/challenge/eagle.png">'); eagleTop.style.width = '300px';

// 2 · comfort zone
const comfort = Slam(hud, ['YOUR COMFORT', 'ZONE WILL', '<span class="red">KILL</span> YOU.'], { y: 620, size: 190, gap: .95 });

// 3 · the work
const TILE = [
  ['push', 'PUSHUPS', 'Day after day', 40, 'reps', v => Math.round(v)],
  ['pull', 'PULL-UPS', 'Pull your weight', 12, 'reps', v => Math.round(v)],
  ['plank', 'PLANK', 'Hold the line', 105, 'seconds', v => `${Math.floor(v / 60)}:${String(Math.round(v) % 60).padStart(2, '0')}`],
  ['run', 'RUN', '+100 m every run', 5.5, 'km', v => v.toFixed(1)],
].map(([kind, label, sub, to, unit, f], i) => {
  const el = h('div', 'tile', hud);
  const lab = h('div', 't-label disp', el, label), sb = h('div', 't-sub', el, sub);
  const fig = Figure(el, kind);
  const cnt = h('div', 't-count disp', el, '0'), un = h('div', 't-unit', el, unit);
  cnt.style.top = '1290px'; un.style.top = '1530px';
  return { el, lab, sb, fig, cnt, un, to, f, from: kind === 'run' ? 3.0 : 0, i };
});

// 4 · consistency
const cons = Slam(hud, ['<span class="gold">CONSISTENCY</span>', 'BEATS INTENSITY.'], { y: 330, size: 140 });
const streak = h('div', 'streak', hud, Array.from({ length: 60 }, () => '<i></i>').join(''));
const dots = [...streak.children];
const dayNum = h('div', 'daynum disp', hud, 'DAY 01');

// 5 · the app
const appH = Slam(hud, ['ONE PLAN.', '<span class="gold">ONE SQUAD.</span>'], { y: 230, size: 130 });
const phone = h('div', 'phone', hud, `<div class="scr"><img src="assets/challenge/full.png"></div><span class="notch"></span>`);
const page = phone.querySelector('img');
const tapH = Slam(hud, ['TICK YOUR DAY.'], { y: 300, size: 140 });
const mission = h('div', 'card', hud, `<img src="assets/challenge/mission.png"><img class="m1" src="assets/challenge/mission-done.png">`); mission.style.top = '600px';
const m1 = mission.querySelector('.m1');
const sparks = Array.from({ length: 18 }, () => h('div', 'spark', hud));
const sees = h('div', 'chip', hud, '<b></b>The whole squad sees it');
const touch = h('div', 'touch', hud);
const boardH = Slam(hud, ['EVERYONE SEES', '<span class="gold">EVERYONE\'S PROGRESS.</span>'], { y: 260, size: 92 });
const board = h('div', 'card', hud, `<img src="assets/challenge/board.png">`); board.style.top = '560px'; board.style.height = '980px';
const boardImg = board.querySelector('img');

// 6 · two levels
const lvlH = Slam(hud, ['PICK YOUR', '<span class="gold">LEVEL.</span>'], { y: 270, size: 150 });
const beg = h('div', 'lvl', hud, `<div class="lh disp gold">BEGINNER</div><div class="lb"><strong>40 pushups</strong> + core. Plank from 1:00 up to <strong>3:05</strong>.</div><div class="stat"><b class="disp gold">1,040</b><span>pushups</span></div>`);
const adv = h('div', 'lvl adv', hud, `<div class="lh disp red">ADVANCED</div><div class="lb"><strong>50 Eagles pushups</strong> + dragon flags, 20 up to <strong>45</strong>.</div><div class="stat"><b class="disp red">1,300</b><span>pushups</span></div>`);
beg.style.left = '60px'; adv.style.left = '550px';
const both = h('div', 'chip', hud, '<b></b>26 runs · 110.5 km · 8 hikes');
const coach = h('div', 'tagline', hud, 'Your coach sets your level'); coach.style.top = '1470px';

// 7 · the call
const eagle = h('div', 'eagle', hud, '<img src="assets/challenge/eagle.png">'); eagle.style.width = '560px';
const day1 = h('div', 'stamp brush gold', hud, 'DAY 1'); day1.style.fontSize = '250px';
const now = Slam(hud, ['STARTS NOW.'], { y: 1010, size: 170 });
const join = h('div', 'chip', hud, '<b></b>Join the 60 Days Challenge');
const link = h('div', 'link', hud, 'Link in bio');
const tag = h('div', 'tagline', hud, 'Train harder · Go further · Be stronger'); tag.style.top = '1530px';
const flash = h('div', 'flash', hud), veil = h('div', 'veil', hud);

const HITS = [.28, .55, T.comfort, at(7), at(8), ...TILES, T.cons, TAP, T.lvl, T.cta];
const C = (x, y) => `translate(${x}px,${y}px) translate(-50%,-50%)`;

window.DURATION = T.end;
window.EVENTS = {
  duration: T.end, beat: B, sections: T, tiles: TILES, tap: TAP,
  hits: HITS, stamp: [.28, .55, .9], streak: [at(22), at(25.5)], whoosh: [T.app - .05, T.board - .05], cta: [T.cta],
};

window.render = t => {
  const heat = 1 + .25 * Math.max(0, ...HITS.map(a => bump(t, a, a + .3)));
  bg.draw(t, heat);
  // a short camera shake on every hit
  let sh = 0; for (const a of HITS) sh = Math.max(sh, (1 - prog(t, a, a + .22)) * (t >= a ? 1 : 0));
  hud.style.transform = sh > 0 ? `translate(${(Math.sin(t * 90) * 10 * sh).toFixed(1)}px,${(Math.cos(t * 77) * 8 * sh).toFixed(1)}px)` : '';

  // ---- 1 · hook: 60 / DAYS / CHALLENGE, NO EXCUSES, the eagle
  const hout = ease.inCubic(prog(t, T.comfort - .25, T.comfort));
  look(slash, prog(t, .12, .2) * (1 - hout), `scaleX(${ease.outExpo(prog(t, .12, .45)).toFixed(3)}) skewY(-6deg)`);
  const sk = ease.outExpo(prog(t, .28, .5)); look(six, clamp(sk * 3) * (1 - hout), `${C(540, 620)} rotate(-6deg) scale(${(1 + (1 - sk) * 1.2 + hout * .4).toFixed(3)})`, (1 - sk) * 16);
  const dk = ease.outExpo(prog(t, .55, .75)); look(days, clamp(dk * 3) * (1 - hout), `${C(540, 930)} scale(${(1 + (1 - dk) * 1.2 + hout * .4).toFixed(3)})`, (1 - dk) * 16);
  const ck = ease.outExpo(prog(t, .9, 1.1)); look(chal, clamp(ck * 3) * (1 - hout), `${C(540, 1140)} rotate(-4deg) scale(${(1 + (1 - ck) * .8).toFixed(3)})`);
  chal.style.background = 'linear-gradient(90deg,#F6B912,#FFD34D)'; chal.style.padding = '0 40px';
  noEx.update(t, [1.35], T.comfort - .05);
  look(eagleTop, prog(t, 1.7, 1.9) * (1 - hout), `${C(540, 300)} scale(${(.9 + .1 * ease.outBack(prog(t, 1.7, 2.0))).toFixed(3)})`);

  // ---- 2 · comfort zone
  comfort.update(t, [T.comfort, at(7), at(8)], T.mont - .02);

  // ---- 3 · the work, one move per cut
  TILE.forEach((tl, i) => {
    const a = TILES[i], b = i < 3 ? TILES[i + 1] : T.cons;
    const on = t >= a - .02 && t < b; tl.el.style.display = on ? '' : 'none'; if (!on) return;
    const k = ease.outExpo(prog(t, a, a + .25));
    look(tl.lab, clamp(k * 3), `scale(${(1 + (1 - k) * .8).toFixed(3)})`, (1 - k) * 12);
    look(tl.sb, prog(t, a + .15, a + .35));
    look(tl.fig.el, prog(t, a, a + .12), `scale(${(1.06 - .06 * k).toFixed(3)})`);
    tl.fig.update(t, a);
    const v = lerp(tl.from, tl.to, ease.outCubic(prog(t, a + .1, b - .15)));
    tl.cnt.textContent = tl.f(v);
    look(tl.cnt, prog(t, a + .1, a + .25), `scale(${(1 + .06 * Math.max(0, Math.sin((t - a) * 2 * Math.PI / (2 * B)))).toFixed(3)})`);
    look(tl.un, prog(t, a + .2, a + .35));
  });

  // ---- 4 · consistency: sixty days light up, one by one
  cons.update(t, [T.cons, at(22)], T.app - .05);
  const sOn = t > T.cons - .05 && t < T.app; streak.style.display = dayNum.style.display = sOn ? '' : 'none';
  if (sOn) {
    look(streak, prog(t, T.cons + .1, T.cons + .35));
    const n = Math.floor(lerp(0, 60, ease.inOutSine(prog(t, at(22.5), T.app - .35))));
    dots.forEach((d, i) => { d.className = i < n - 1 ? 'on' : i === n - 1 ? 'now' : ''; });
    dayNum.innerHTML = `DAY <span class="${n >= 60 ? 'gold' : 'red'}">${String(Math.max(1, n)).padStart(2, '0')}</span>`;
    look(dayNum, prog(t, T.cons + .3, T.cons + .5), `scale(${(1 + (n >= 60 ? .12 * bump(t, T.app - .35, T.app - .05) : 0)).toFixed(3)})`);
  }

  // ---- 5 · the app: one plan, one squad; tick your day; everyone sees it
  appH.update(t, [T.app, at(28)], T.tap - .05);
  const pk = spring(t, T.app, 1.1, .78), po = ease.inCubic(prog(t, T.tap - .3, T.tap));
  look(phone, clamp(pk * 2) * (1 - po), { y: (1 - pk) * 500 - po * 80, rx: (1 - clamp(pk)) * 18, ry: Math.sin(t * 1.2) * 4, s: (.9 + .1 * clamp(pk)) * (1 - .05 * po) });
  page.style.transform = `translateY(${(-track(t, [[at(28.5), 0], [at(31.5), 1250, ease.inOutCubic]])).toFixed(1)}px)`;
  phone.style.display = t > T.app - .05 && t < T.tap + .1 ? '' : 'none';

  tapH.update(t, [T.tap], T.board - .05);
  const mk = spring(t, T.tap, 1.2, .78), mo = ease.inCubic(prog(t, T.board - .3, T.board));
  mission.style.display = t > T.tap - .05 && t < T.board + .1 ? '' : 'none';
  look(mission, clamp(mk * 2) * (1 - mo), { y: (1 - mk) * 400 - mo * 80, s: (.92 + .08 * clamp(mk)) * (1 + .03 * bump(t, TAP, TAP + .4)) });
  look(m1, prog(t, TAP + .02, TAP + .14));
  sparks.forEach((s, i) => { const a = (i / sparks.length) * Math.PI * 2, u = prog(t, TAP, TAP + .8), r = ease.outCubic(u) * (190 + (i % 4) * 50); look(s, u > 0 && u < 1 ? 1 - u : 0, `${C(333 + Math.cos(a) * r * 1.4, 1040 + Math.sin(a) * r)} scale(${(1 - u * .6).toFixed(3)})`); });
  const tp = track(t, [[TAP - .45, [980, 1700]], [TAP - .05, [333, 1040], ease.outCubic], [TAP + .3, [333, 1040]], [TAP + .7, [780, 1680]]]);
  look(touch, prog(t, TAP - .45, TAP - .3) * (1 - prog(t, TAP + .45, TAP + .7)), `${C(...tp)} scale(${(1 - .22 * bump(t, TAP - .06, TAP + .14)).toFixed(3)})`);
  const sv = spring(t, TAP + .4, 1.5, .62);
  look(sees, clamp(sv * 2) * (1 - mo), `${C(540, 1430)} scale(${(.8 + .2 * sv).toFixed(3)})`);

  boardH.update(t, [T.board, at(38)], T.lvl - .05);
  const bk = spring(t, T.board, 1.1, .8), bo = ease.inCubic(prog(t, T.lvl - .3, T.lvl));
  board.style.display = t > T.board - .05 && t < T.lvl + .1 ? '' : 'none';
  look(board, clamp(bk * 2) * (1 - bo), { y: (1 - bk) * 400 - bo * 80, s: .93 + .07 * clamp(bk) });
  boardImg.style.transform = `translateY(${(-track(t, [[T.board + .5, 0], [T.lvl - .2, 520, ease.inOutSine]])).toFixed(1)}px)`;

  // ---- 6 · two levels
  lvlH.update(t, [T.lvl, at(42)], T.cta - .05);
  [beg, adv].forEach((c, i) => {
    const k = spring(t, T.lvl + .25 + i * .15, 1.3, .7), e = ease.inCubic(prog(t, T.cta - .3, T.cta));
    c.style.display = t > T.lvl && t < T.cta + .1 ? '' : 'none';
    look(c, clamp(k * 2) * (1 - e), { x: (1 - k) * (i ? 500 : -500), ry: (1 - k) * (i ? -30 : 30), y: -e * 60 });
  });
  const bth = spring(t, at(44), 1.5, .62);
  look(both, clamp(bth * 2) * (1 - prog(t, T.cta - .3, T.cta)), `${C(540, 1330)} scale(${(.8 + .2 * bth).toFixed(3)})`);
  look(coach, prog(t, at(45), at(45) + .25) * (1 - prog(t, T.cta - .3, T.cta)));

  // ---- 7 · the call: the eagle, DAY 1 STARTS NOW, join, link in bio
  const ek = spring(t, T.cta, 1.3, .62);
  look(eagle, clamp(ek * 2) * 1, `${C(540, 470)} scale(${(.6 + .4 * ek).toFixed(3)})`);
  const d1 = ease.outExpo(prog(t, T.cta + .45, T.cta + .65));
  look(day1, clamp(d1 * 3), `${C(540, 790)} rotate(-5deg) scale(${(1 + (1 - d1) * 1.1).toFixed(3)})`, (1 - d1) * 14);
  now.update(t, [T.cta + .85], 99);
  const jk = spring(t, T.cta + 1.4, 1.5, .62);
  look(join, clamp(jk * 2), `${C(540, 1270)} scale(${(.8 + .2 * jk).toFixed(3)})`);
  const lk = spring(t, T.cta + 1.75, 1.5, .55);
  look(link, clamp(lk * 2), `${C(540, 1410)} scale(${((.7 + .3 * lk) * (1 + .04 * Math.sin(t * 6) * prog(t, T.cta + 2.3, T.cta + 2.5))).toFixed(3)})`);
  look(tag, prog(t, T.cta + 2.1, T.cta + 2.4));
  look(flash, Math.max(bump(t, .26, .55) * .8, bump(t, T.cta, T.cta + .4) * .9, bump(t, TAP, TAP + .35) * .4));
  look(veil, tw(t, T.end - .45, T.end));
};

window.ready = (async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => (i.complete ? i.decode() : new Promise(r => { i.onload = r; i.onerror = r; }).then(() => i.decode())).catch(() => {})));
  window.render(0);
})();
