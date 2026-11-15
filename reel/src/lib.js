// Timing and DOM helpers shared by every scene. Nothing in the reel animates on its own clock:
// each scene's update(t) sets every style for time t, so any frame can be rendered on its own.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** 0 before a, 1 after b, linear in between */
export const prog = (t, a, b) => clamp((t - a) / (b - a));
/** a smooth 0 → 1 → 0 bump over [a, b] */
export const bump = (t, a, b) => { const x = prog(t, a, b); return Math.sin(Math.PI * x); };

export const ease = {
  linear: x => x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuint: x => 1 - Math.pow(1 - x, 5),
  inQuint: x => x ** 5,
  inOutQuint: x => (x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  outBack: x => { const s = 1.4; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); },
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
};

/** eased progress of t through [a, b] */
export const tw = (t, a, b, fn = ease.inOutCubic) => fn(prog(t, a, b));

/**
 * A damped spring released at time `at`: 0 before, settling on 1 with a little overshoot.
 * freq is in oscillations per second, damp is the damping ratio (1 = no overshoot).
 */
export function spring(t, at, freq = 1.6, damp = .55) {
  const x = t - at;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + (damp * w / wd) * Math.sin(wd * x));
}

/** Keyframes: [[time, value, easing?], ...]; values are numbers or arrays of numbers. */
export function track(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, fn = ease.inOutCubic] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const k = fn((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], k)) : lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}

export function h(tag, cls, parent, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  if (parent) parent.appendChild(el);
  return el;
}

/** position and size an absolutely placed element */
export function box(el, x, y, w, hh) {
  const s = el.style;
  s.left = x.toFixed(1) + 'px'; s.top = y.toFixed(1) + 'px';
  if (w != null) s.width = w.toFixed(1) + 'px';
  if (hh != null) s.height = hh.toFixed(1) + 'px';
}

/** a transform from a pose: translate, rotate (degrees), scale */
export const T = ({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1 } = {}) =>
  `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`;

/** set opacity, transform and (optionally) blur; hides the element entirely when invisible */
export function look(el, o = 1, pose, blur = 0) {
  const s = el.style;
  s.opacity = clamp(o).toFixed(3);
  s.visibility = o < .003 ? 'hidden' : 'visible';
  if (pose !== undefined) s.transform = typeof pose === 'string' ? pose : T(pose);
  s.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : 'none';
}

/** visible only inside [a, b] (keeps hidden layers out of the paint) */
export const live = (el, t, a, b) => { el.style.display = t >= a && t <= b ? '' : 'none'; return t >= a && t <= b; };

/** a deterministic random source */
export function rng(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** cubic Bézier point */
export function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [
    v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
  ];
}

/** count up a number with thousands separators */
export const fmt = (n, dec = 0) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
