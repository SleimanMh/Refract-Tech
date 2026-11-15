// Reusable pieces: the night sky, cinematic headlines, the step rail, a cursor that clicks,
// light streaks, and the icon set — all in the Refract Tech palette.
import { bump, clamp, ease, h, look, prog, rng, track } from './lib.js';

export const C = {
  navy: '#11112B', violet: '#713DE8', purple: '#B66CFA', coral: '#FF906B', white: '#F7F5FF',
  ink2: '#CFCAE8', ink3: '#9A94BF',
  stages: ['#8B5CF0', '#9D66F4', '#B66CFA', '#D17AD6', '#EB86A0', '#FF906B'],
};

// ---------------------------------------------------------------- sky
/** Aurora light and stars, redrawn for each frame. glow(t) adds light behind the focus. */
export function Sky(canvas) {
  const g = canvas.getContext('2d');
  const r = rng(11);
  const stars = Array.from({ length: 260 }, () => ({ x: r() * 1080, y: Math.pow(r(), 1.2) * 1920, s: .6 + Math.pow(r(), 3) * 2.2, p: r() * 6.28, f: .6 + r() * 1.8 }));
  const blobs = [
    { c: '113,61,232', x: .18, y: .12, r: 860, ax: .16, ay: .05, f: .09, a: .62 },
    { c: '182,108,250', x: .82, y: .24, r: 760, ax: .14, ay: .06, f: .08, a: .44 },
    { c: '255,144,107', x: .64, y: .92, r: 900, ax: .2, ay: .04, f: .06, a: .34 },
    { c: '113,61,232', x: .12, y: .76, r: 720, ax: .12, ay: .07, f: .11, a: .38 },
  ];
  return {
    draw(t, level = 1, focus = null) {
      g.globalAlpha = 1; g.fillStyle = C.navy; g.fillRect(0, 0, 1080, 1920);
      for (const b of blobs) {
        const x = (b.x + Math.sin(t * b.f * 6.28 + b.r) * b.ax) * 1080, y = (b.y + Math.cos(t * b.f * 5 + b.x * 9) * b.ay) * 1920;
        const gr = g.createRadialGradient(x, y, 0, x, y, b.r), a = b.a * level;
        gr.addColorStop(0, `rgba(${b.c},${a})`); gr.addColorStop(.55, `rgba(${b.c},${a * .3})`); gr.addColorStop(1, `rgba(${b.c},0)`);
        g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
      }
      if (focus && focus.a > .01) {
        const gr = g.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, focus.r);
        gr.addColorStop(0, `rgba(182,108,250,${.5 * focus.a})`); gr.addColorStop(.45, `rgba(113,61,232,${.22 * focus.a})`); gr.addColorStop(1, 'rgba(113,61,232,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
      }
      g.fillStyle = '#fff';
      for (const s of stars) {
        g.globalAlpha = clamp(level * 1.2) * (.2 + .55 * (.5 + .5 * Math.sin(t * s.f * 3 + s.p)));
        g.beginPath(); g.arc(s.x, s.y, s.s, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
    },
  };
}

// ---------------------------------------------------------------- typography
/**
 * A headline whose lines rise out of a mask, then lift away. Lines given as [text, accent?].
 * opts: x, y, size, align ('left' | 'center'), label, labelColor, weight
 */
export function Headline(parent, lines, opts = {}) {
  const { x = 90, y = 236, size = 96, align = 'left', label, labelColor = C.purple, weight = 400, width = 900, lh = 1.04 } = opts;
  const el = h('div', 'hl', parent);
  Object.assign(el.style, { left: (align === 'center' ? 540 - width / 2 : x) + 'px', top: y + 'px', width: width + 'px', textAlign: align });
  let lab = null;
  if (label) { lab = h('div', 'hl-label', el, label); lab.style.color = labelColor; if (align === 'center') lab.style.justifyContent = 'center'; }
  const rows = lines.map(([text, accent]) => {
    const row = h('div', 'hl-row', el);
    row.style.fontSize = size + 'px'; row.style.lineHeight = lh; row.style.fontWeight = weight;
    const span = h('span', accent ? 'grad-text' : '', row, text);
    return span;
  });
  return {
    el,
    update(t, tin, tout) {
      const on = t > tin - .05 && t < tout + .5;
      el.style.display = on ? '' : 'none';
      if (!on) return;
      if (lab) {
        const k = ease.outExpo(prog(t, tin, tin + .5)), e = ease.inCubic(prog(t, tout - .28, tout));
        look(lab, k * (1 - e), { x: (1 - k) * -30, y: -e * 20 });
        lab.style.letterSpacing = `${(.26 + (1 - k) * .3).toFixed(3)}em`;
      }
      rows.forEach((span, i) => {
        const a = tin + .06 + i * .09;
        const k = ease.outExpo(prog(t, a, a + .62));
        const e = ease.inCubic(prog(t, tout - .3 + i * .04, tout + i * .04));
        look(span, Math.min(1, k * 1.6) * (1 - e), `translateY(${((1 - k) * 105 - e * 70).toFixed(2)}%)`, (1 - k) * 10 + e * 8);
      });
    },
  };
}

/** Six segments that fill as the story moves through the steps — the process as one line. */
export function StepRail(parent) {
  const el = h('div', 'rail', parent);
  const segs = C.stages.map(c => { const s = h('i', '', el); s.style.setProperty('--c', c); return s; });
  return {
    update(t, a, b, stepAt) {
      const on = t > a - .05 && t < b + .05;
      el.style.display = on ? '' : 'none'; if (!on) return;
      look(el, Math.min(prog(t, a, a + .4), 1 - prog(t, b - .3, b)), { y: 0 });
      const p = stepAt(t);   // fractional step index
      segs.forEach((s, i) => {
        const fill = clamp(p - i + 1);
        s.style.setProperty('--f', fill.toFixed(3));
        s.style.opacity = i <= p ? '1' : '.55';
        s.style.boxShadow = Math.floor(p) === i ? `0 0 18px ${C.stages[i]}` : 'none';
      });
    },
  };
}

// ---------------------------------------------------------------- cursor
const POINTER = `<svg viewBox="0 0 40 52" width="58" height="75"><path d="M4 3 L4 40 L13.5 31.5 L20 47 L27 44 L20.5 29 L33 29 Z" fill="#F7F5FF" stroke="#11112B" stroke-width="3" stroke-linejoin="round"/></svg>`;
/**
 * A pointer gliding along keyframes [[t, x, y, opacity?, ease?]], pressing at the click times;
 * or, for touch screens, a soft finger dot.
 */
export function Cursor(parent, touch = false) {
  const el = h('div', 'cursor' + (touch ? ' is-touch' : ''), parent, touch ? '<i></i>' : POINTER);
  const ripple = h('div', 'ripple', parent);
  return {
    update(t, path, clicks = []) {
      if (!path || t < path[0][0] - .01 || t > path[path.length - 1][0] + .01) { el.style.display = ripple.style.display = 'none'; return; }
      el.style.display = '';
      const [x, y] = track(t, path.map(([tt, px, py, , fn]) => [tt, [px, py], fn || ease.inOutCubic]));
      const o = track(t, path.map(([tt, , , po = 1]) => [tt, po, ease.linear]));
      let press = 0, rip = null;
      for (const c of clicks) { press = Math.max(press, bump(t, c - .06, c + .14)); if (t >= c && t < c + .5) rip = c; }
      look(el, o, `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(1 - press * .16).toFixed(3)})`);
      if (rip !== null) {
        const [rx, ry] = track(rip, path.map(([tt, px, py, , fn]) => [tt, [px, py], fn || ease.inOutCubic]));
        const k = ease.outCubic(prog(t, rip, rip + .5));
        ripple.style.display = '';
        look(ripple, (1 - k) * o, `translate(${rx.toFixed(1)}px,${ry.toFixed(1)}px) scale(${(.2 + k * 1.4).toFixed(3)})`);
      } else ripple.style.display = 'none';
    },
  };
}

// ---------------------------------------------------------------- light
/** A band of light that sweeps the frame — used to stitch cuts together. */
export function Streak(parent) {
  const el = h('div', 'streak', parent);
  return {
    update(t, cuts) {
      let k = -1, w = .5, dir = 1;
      for (const c of cuts) { const [at, dur = .5, d = 1] = Array.isArray(c) ? c : [c]; const x = prog(t, at - dur / 2, at + dur / 2); if (x > 0 && x < 1) { k = x; w = dur; dir = d; } }
      if (k < 0) { el.style.display = 'none'; return; }
      el.style.display = '';
      const p = ease.inOutCubic(k);
      look(el, Math.sin(k * Math.PI) * .95, `translate(${(dir > 0 ? -900 + p * 2600 : 1700 - p * 2600).toFixed(1)}px, -300px) rotate(${dir > 0 ? 16 : -16}deg)`);
    },
  };
}

// ---------------------------------------------------------------- icons (24 × 24 line icons)
const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const ICON = {
  card: ic('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/>'),
  calendar: ic('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/>'),
  users: ic('<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9.5" r="2.6"/><path d="M17 14.6c2.5.2 4 1.8 4.6 4.4"/>'),
  spark: ic('<path d="M12 2.8l2.1 6.1 6.1 2.1-6.1 2.1L12 19.2l-2.1-6.1L3.8 11l6.1-2.1z"/><path d="M19 17.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
  mail: ic('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  chart: ic('<path d="M3 20.5h18"/><path d="M6 16.5v-5M11 16.5V6.5M16 16.5v-8"/>'),
  bell: ic('<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>'),
  lock: ic('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>'),
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>', 'stroke-width="2.2"'),
  out: ic('<path d="M7 17L17 7M9 7h8v8"/>', 'stroke-width="2.2"'),
  home: ic('<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/>'),
  form: ic('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  db: ic('<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>'),
  refresh: ic('<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4.5V11h-6.5"/>'),
  star: ic('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>', 'fill="currentColor" stroke="none"'),
  grid: ic('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
  phone: ic('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>'),
  globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>'),
};
