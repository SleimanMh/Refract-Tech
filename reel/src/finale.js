// The finale, on its own clock (0 = 18.5 s in V2's timing; main.js shifts it): the real website
// scrolling in a large browser down to its contact form, which shatters and gathers into the logo.
import { bump, box, clamp, ease, h, lerp, live, look, prog, spring, track, tw } from './lib.js';
import { C, ICON } from './ui.js';

// ---------------------------------------------------------------- the real website
const STRIP = ['hero', 'stage', 'work', 'work2', 'contact'];
const SW = 900, SH = 1948;   // a 1170 × 2532 still shown 900 wide
const BROWSER = [90, 300, 900, 1270], BAR = 96;
const browserBar = () => `<span class="dots"><i></i><i></i><i></i></span><span class="url big">${ICON.lock}refract-tech.com</span><span class="reload">${ICON.refresh}</span>`;

export function Site(world) {
  const root = h('div', 'layer', world);
  const win = h('div', 'window site-win', root); box(win, ...BROWSER);
  h('div', 'win-bar', win, browserBar());
  const view = h('div', 'site-view', win); box(view, 0, BAR, SW, BROWSER[3] - BAR);
  const strip = h('div', 'strip', view, STRIP.map(s => `<img src="assets/site/${s}.png">`).join(''));
  h('img', 'site-head', view).src = 'assets/site/header.png';
  const glare = h('div', 'glare', win);
  return {
    scrollAt: t => track(t, [[18.5, 2 * SH], [18.95, 2 * SH], [19.75, 4 * SH, ease.inOutQuint]]),
    update(t) {
      if (!live(root, t, 18.35, 20.02)) return;
      const k = ease.outExpo(prog(t, 18.38, 18.9));
      const fl = Math.sin((t - 18.4) * 1.6);
      look(win, prog(t, 18.38, 18.5), { x: (1 - k) * 1150, ry: (1 - k) * -38 + 4 * fl * k, rx: 3 * k, rz: (1 - k) * 6, s: .96 + .04 * k });
      win.style.transformOrigin = '50% 50%';
      strip.style.transform = `translateY(${(-this.scrollAt(t)).toFixed(1)}px)`;
      look(glare, .5 + .5 * k, `translateX(${(-700 + prog(t, 18.6, 19.9) * 1500).toFixed(1)}px) rotate(18deg)`);
    },
  };
}

// ---------------------------------------------------------------- the close
export function Close(world) {
  const root = h('div', 'layer', world);
  const COLS = 5, ROWS = 7, tw_ = BROWSER[2] / COLS, th = BROWSER[3] / ROWS;
  // a still of the browser as it stands when the scroll ends, cut into tiles
  const snap = `<div class="window site-win" style="left:0;top:0;width:${BROWSER[2]}px;height:${BROWSER[3]}px"><div class="win-bar">${browserBar()}</div>
    <div class="site-view" style="left:0;top:${BAR}px;width:${SW}px;height:${BROWSER[3] - BAR}px"><img src="assets/site/contact.png" style="width:${SW}px;display:block"><img class="site-head" src="assets/site/header.png"></div></div>`;
  const LOGO = [540, 720];
  const tiles = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const el = h('div', 'tile', root, `<div style="position:absolute;left:${-c * tw_}px;top:${-r * th}px;width:${BROWSER[2]}px;height:${BROWSER[3]}px">${snap}</div>`);
    box(el, 0, 0, tw_ + .5, th + .5);
    const x = BROWSER[0] + c * tw_ + tw_ / 2, y = BROWSER[1] + r * th + th / 2;
    const d = Math.hypot(x - LOGO[0], y - LOGO[1]);
    tiles.push({ el, x, y, d, delay: d / 900 * .3, rot: ((r * 7 + c * 3) % 5 - 2) * 25 });
  }
  const glow = h('div', 'logo-glow', root);
  const ring = h('div', 'logo-ring', root, `<svg viewBox="0 0 420 420" width="420" height="420"><defs><linearGradient id="lr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#713DE8"/><stop offset=".5" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs>
    <circle id="lrc" cx="210" cy="210" r="196" stroke="url(#lr)" stroke-width="8" fill="none" stroke-linecap="round" transform="rotate(-90 210 210)" stroke-dasharray="1231.5"/></svg>`);
  const lrc = ring.querySelector('#lrc');
  const mark = h('img', 'logo-mark', root); mark.src = 'assets/r-mark.png';
  const word = h('div', 'close-word', root, `<span>Refract <b>Tech</b></span>`);
  const line = h('div', 'close-line', root, `<span>Let's build <em class="grad-text">what's next.</em></span>`);
  const pill = h('div', 'domain', root, `<span class="sheen2"></span><span class="d-t">refract-tech.com</span><i>${ICON.out}</i>`);
  const sheen = pill.querySelector('.sheen2');
  const hint = h('div', 'close-hint', root, `Tap the link in our bio`);
  return {
    LOGO,
    sky: t => 1 + .3 * tw(t, 20.4, 21.4),
    focus: t => (t > 20.0 ? { x: LOGO[0], y: LOGO[1] + 120, r: 900, a: .3 + .45 * tw(t, 20.4, 21.2) + .25 * bump(t, 20.55, 21.0) } : null),
    update(t) {
      if (!live(root, t, 19.99, 99)) return;
      for (const p of tiles) {
        const k = clamp((t - 20.0 - p.delay) / .62);
        const e = ease.inOutCubic(k);
        const vx = p.x - LOGO[0], vy = p.y - LOGO[1];
        const ang = e * 1.3, rad = 1 - e;
        const x = LOGO[0] + (vx * Math.cos(ang) - vy * Math.sin(ang)) * rad, y = LOGO[1] + (vx * Math.sin(ang) + vy * Math.cos(ang)) * rad;
        const lift = Math.sin(Math.PI * Math.min(1, k * 1.4)) * 140;
        look(p.el, 1 - prog(k, .72, 1), `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) translateZ(${lift.toFixed(1)}px) rotate(${(p.rot * e).toFixed(2)}deg) scale(${(1 - .9 * e).toFixed(3)})`, e * 3);
        p.el.style.filter += ` brightness(${(1 + e * .8).toFixed(2)})`;
      }
      const L = (x, y) => `translate(${x}px,${y}px) translate(-50%,-50%)`;
      const m = spring(t, 20.58, 1.25, .6);
      look(mark, prog(t, 20.55, 20.7), `${L(...LOGO)} scale(${(.35 + .65 * m).toFixed(4)})`, (1 - clamp(m)) * 14);
      look(glow, prog(t, 20.3, 20.7) * (.85 + .15 * Math.sin(t * 2.6)), `${L(...LOGO)} scale(${(.6 + .4 * ease.outCubic(prog(t, 20.4, 21.0)) + .25 * bump(t, 20.58, 21.0)).toFixed(3)})`);
      look(ring, prog(t, 20.6, 20.7), `${L(...LOGO)} rotate(${(-40 * (1 - tw(t, 20.6, 21.3, ease.outCubic))).toFixed(2)}deg)`);
      lrc.style.strokeDashoffset = (1231.5 * (1 - tw(t, 20.62, 21.3, ease.outExpo))).toFixed(1);
      const rev = (el, a) => { const k = ease.outExpo(prog(t, a, a + .7)); look(el.firstChild, Math.min(1, k * 1.5), `translateY(${((1 - k) * 105).toFixed(2)}%)`, (1 - k) * 8); el.style.display = t > a - .05 ? '' : 'none'; };
      rev(word, 20.95); rev(line, 21.2);
      const pk = spring(t, 21.45, 1.4, .6), press = bump(t, 22.12, 22.32);
      look(pill, clamp(pk * 2), `${L(540, 1290)} scale(${((.8 + .2 * pk) * (1 - .05 * press)).toFixed(4)})`);
      pill.style.boxShadow = `0 0 0 3px rgba(182,108,250,${(.7 + .3 * press).toFixed(2)}), 0 24px 80px -12px rgba(113,61,232,${(.65 + .35 * press).toFixed(2)}), 0 0 ${(60 * press).toFixed(0)}px rgba(255,144,107,.6)`;
      sheen.style.transform = `translateX(${(-160 + (((t - 21.7) % 1.6 + 1.6) % 1.6) / 1.6 * 520).toFixed(1)}%)`;
      look(hint, prog(t, 22.35, 22.6), `${L(540, 1398)} translateY(${((1 - ease.outCubic(prog(t, 22.35, 22.7))) * 16).toFixed(1)}px)`);
    },
  };
}
