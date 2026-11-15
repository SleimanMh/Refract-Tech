// The reel's scenes, all made of the website itself: its cards (drawn by the site's own card art),
// its hero, its service cards and its expertise chain.
import { ART_KEYS, CARD_H, CARD_W, loadCardAssets, paintCard } from '../assets/cardArt.js';
import { bump, box, clamp, ease, h, lerp, live, look, prog, rng, spring, T, tw } from './lib.js';
import { C, ICON } from './ui.js';

const FINAL = ART_KEYS.length - 1;
const RES = 2;   // cards are painted at twice their shown size, so camera push-ins stay sharp

/** paint every card once, at high resolution */
export async function paintCards() {
  const logo = await loadCardAssets();
  return ART_KEYS.map(key => {
    const cv = document.createElement('canvas');
    cv.width = CARD_W * RES; cv.height = CARD_H * RES;
    const g = cv.getContext('2d'); g.setTransform(RES, 0, 0, RES, 0, 0);
    paintCard(g, key, logo);
    return cv;
  });
}

// ================================================================ hook: a spark becomes the site's card
export function Hook(world, cards) {
  const root = h('div', 'layer', world);
  const glow = h('div', 'spark-glow', root), spark = h('div', 'spark', root);
  const flare = h('div', 'flare', root), flareV = h('div', 'flare flare-v', root);
  const card = h('div', 'hook-card', root);
  const W = 760, H = 1140, X = 540 - W / 2, Y = 1000 - H / 2, COLS = 5, ROWS = 8, tw_ = W / COLS, th = H / ROWS;
  box(card, X, Y, W, H);
  const R = rng(9), src = cards[FINAL];
  const tiles = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cv = h('canvas', 'tile-cv', card);
    cv.width = Math.ceil(tw_ * 1.5); cv.height = Math.ceil(th * 1.5);
    cv.getContext('2d').drawImage(src, c * src.width / COLS, r * src.height / ROWS, src.width / COLS, src.height / ROWS, 0, 0, cv.width, cv.height);
    box(cv, c * tw_, r * th, tw_ + .6, th + .6);
    const cx = c * tw_ + tw_ / 2, cy = r * th + th / 2;
    const d = Math.hypot(cx - W / 2, cy - H / 2);
    tiles.push({ el: cv, cx, cy, at: .5 + d / 700 * .42 + R() * .06, rz: (R() - .5) * 160, z: 300 + R() * 700, side: R() > .5 ? 1 : -1 });
  }
  const rim = h('div', 'hook-rim', card);
  const sheen = h('div', 'hook-sheen', card);
  return {
    arrivals: tiles.map(p => +(p.at + .22).toFixed(3)).sort((a, b) => a - b).filter((_, i) => i % 3 === 0),
    focus(t) { return t < 2.3 ? { x: 540, y: 1000, r: 520 + 320 * tw(t, .3, 1.2), a: Math.max(tw(t, 0, .45) * .9 * (1 - tw(t, 1.5, 2.3)), .1) } : null; },
    update(t) {
      if (!live(root, t, 0, 2.35)) return;
      const g = ease.outExpo(prog(t, 0, .45)), fl = bump(t, .4, .75), sOut = 1 - tw(t, .6, 1.0);
      const at = s => `translate(540px,1000px) translate(-50%,-50%) ${s}`;
      look(spark, (g * .9 + fl * .1) * sOut, at(`scale(${(.06 + g * .55 + fl * 1.1).toFixed(3)})`));
      look(glow, (g * .7 + fl * .3) * (1 - tw(t, .9, 1.6)), at(`scale(${(.3 + g * .7 + fl * .6).toFixed(3)})`));
      look(flare, (g * .7 + fl) * sOut, at(`scaleX(${(.1 + g * .6 + fl * 1.6).toFixed(3)})`));
      look(flareV, (g * .5 + fl * .6) * sOut, at(`scaleY(${(.1 + g * .5 + fl).toFixed(3)})`));
      // the pieces fly out of the light and lock into the card; then the camera drives through it
      const tilt = 1 - tw(t, .5, 1.3, ease.outCubic), push = ease.inCubic(prog(t, 1.1, 1.95));
      card.style.transformOrigin = `${W / 2}px ${H * .42}px`;
      look(card, 1 - tw(t, 1.3, 1.62), { rx: 14 * tilt, ry: -12 * tilt, s: 1 + push * 7.5 }, prog(t, 1.18, 1.55) * 18);
      for (const p of tiles) {
        const k = spring(t, p.at, 1.6, .64), u = clamp(k);
        const sw = Math.sin(Math.PI * u) * 120 * p.side;
        look(p.el, clamp((t - p.at) * 8), { x: (W / 2 - p.cx) * (1 - k) + sw * .4, y: (H / 2 - p.cy) * (1 - k) - sw * .5, z: p.z * (1 - k), rz: p.rz * (1 - u), s: .08 + .92 * u });
      }
      look(rim, prog(t, .95, 1.15));
      look(sheen, bump(t, .98, 1.4), `translateX(${(-120 + prog(t, .98, 1.4) * 260).toFixed(1)}%) rotate(18deg)`);
    },
  };
}

// ================================================================ the site's hero, large
export function Hero(world) {
  const root = h('div', 'layer', world);
  const scr = h('div', 'screen', root); box(scr, 110, 330, 860, 1330);
  const page = h('div', 'screen-page', scr);
  h('img', '', page).src = 'assets/site/hero.png';
  h('img', 'screen-head', scr).src = 'assets/site/header.png';
  const glare = h('div', 'glare', scr);
  const DECK = [428, 688];   // where the site's own card deck sits in the hero
  return {
    DECK,
    update(t) {
      if (!live(root, t, 2.1, 4.45)) return;
      const k = ease.outExpo(prog(t, 2.15, 2.85));
      const dive = ease.inCubic(prog(t, 3.7, 4.35));
      root.style.transformOrigin = `${DECK[0]}px ${DECK[1]}px`;
      look(root, prog(t, 2.12, 2.4) * (1 - prog(t, 4.0, 4.35)), { s: 1 + dive * 2.6 }, dive * 10);
      look(scr, 1, { y: (1 - k) * 420, z: (1 - k) * -600, rx: (1 - k) * 22 + 3 * Math.sin((t - 2.2) * 1.5) * k, ry: -4 * Math.sin((t - 2.2) * 1.1) * k });
      page.style.transform = `translateY(${(-60 * tw(t, 2.6, 3.7, ease.inOutSine)).toFixed(1)}px)`;
      look(glare, .7, `translateX(${(-600 + prog(t, 2.4, 3.9) * 1500).toFixed(1)}px) rotate(18deg)`);
    },
  };
}

// ================================================================ the deck of six stage cards
// The same choreography as the site: closed, the deck rests at an angle; open, the active card
// faces the viewer, the cards to come wait behind it and the finished ones turn away like pages;
// at the end the cards gather under the finished product.
const SC = 1140 / 520;
const stacked = d => ({ x: d * 10 * SC, y: -d * 9 * SC, z: -d * 26 * SC, ry: -24, rx: 10, rz: -5 + d * 2.4, o: d > 6 ? 0 : 1, shade: Math.min(.55, d * .11) });
function flowing(k) {
  if (k >= 0) return { x: k * 40 * SC, y: -k * 16 * SC, z: -k * 110 * SC, ry: 6 - k * 9, rx: 2, rz: k * 1.2, o: 1 - clamp((k - 3.2) / 1.2), shade: Math.min(.6, k * .2) };
  const t = -k;
  return { x: -t * 300 * SC, y: t * 10 * SC, z: -t * 170 * SC, ry: 6 + t * 56, rx: 2, rz: -t * 2, o: 1 - clamp((t - .7) / 1), shade: Math.min(.7, t * .5) };
}
export const STAGE_AT = i => 5.0 + 1.5 * i;      // when stage i faces the viewer
const ANCHOR = [540, 1080];

export function Deck(world, cards) {
  const root = h('div', 'layer', world);
  const anchor = h('div', 'deck-anchor', root);
  const glow = h('div', 'deck-glow', anchor);
  const els = cards.map((cv, i) => {
    const el = h('div', 'dcard', anchor);
    el.appendChild(cv);
    const shade = h('span', 'dcard-shade', el);
    const clip = h('span', 'dcard-sheen-clip', el), sheen = h('span', 'dcard-sheen', clip);
    const fx = h('div', 'dcard-fx', el, `<svg viewBox="0 0 800 1200" width="760" height="1140"><circle class="fp-g" r="22" fill="${C.stages[Math.min(i, 5)]}"/><circle class="fp" r="9" fill="#F7F5FF"/><circle class="tr" cx="706" cy="474" r="30" fill="none" stroke="${C.stages[Math.min(i, 5)]}" stroke-width="4"/></svg>`);
    return { el, shade, sheen, fp: fx.querySelector('.fp'), fpg: fx.querySelector('.fp-g'), tr: fx.querySelector('.tr') };
  });
  const flowY = x => (x > 386 && x < 600 ? 474 + 34 * Math.sin(Math.PI * (x - 386) / 214) : 474);
  return {
    stageF: t => [1, 2, 3, 4, 5].reduce((s, i) => s + tw(t, STAGE_AT(i) - .5, STAGE_AT(i)), 0),
    update(t, from) {
      if (!live(root, t, 3.95, 14.15)) return;
      // the deck rises out of the hero's own deck, opens, runs the six stages, gathers, then leaves
      const e = ease.outExpo(prog(t, 3.95, 4.7));
      const gather = tw(t, 13.15, 13.7), open = tw(t, 4.35, 5.0) * (1 - gather), opening = t < 9;
      const stageF = this.stageF(t);
      let push = 0;
      for (let i = 0; i < 6; i++) { const c = STAGE_AT(i); push += tw(t, c - .1, c + 1.0, ease.inOutSine) * (1 - tw(t, c + 1.0, c + 1.5)); }
      const leave = ease.inExpo(prog(t, 13.7, 14.1));
      const ax = lerp(from[0], ANCHOR[0], e) - leave * 1300, ay = lerp(from[1], ANCHOR[1], e);
      const as = lerp(.3, 1, e) * (1 + .05 * push);
      look(root, prog(t, 3.95, 4.12));
      anchor.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) scale(${as.toFixed(4)}) rotateY(${(-leave * 40).toFixed(2)}deg)`;
      world.style.perspectiveOrigin = `${ax.toFixed(0)}px ${ay.toFixed(0)}px`;
      const split = clamp((open - .02) / .98);
      els.forEach((c, i) => {
        const depth = opening ? i : i === FINAL ? 0 : FINAL - i;
        const tt = ease.inOutCubic(clamp(split * 1.7 - depth * .11));
        const k = i - stageF;
        const A = stacked(depth), B = i === FINAL ? { ...flowing(Math.max(k, 1)), o: 0 } : flowing(k);
        const p = {}; for (const key of Object.keys(A)) p[key] = lerp(A[key], B[key], tt);
        const arc = Math.sin(Math.PI * tt), side = depth % 2 ? 1 : -.7;
        p.y -= arc * 70 * SC * side; p.z += arc * 90; p.rz += arc * 9 * side;
        if (i === FINAL && opening) p.o = 0;
        // a gentle float, as on the site
        p.y += Math.sin(t * 1.3 + i * .9) * 6; p.rx += Math.sin(t * .9 + i) * 1.2;
        look(c.el, p.o, `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,${p.z.toFixed(1)}px) rotateY(${p.ry.toFixed(2)}deg) rotateX(${p.rx.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg)`);
        c.shade.style.opacity = p.shade.toFixed(3);
        // a band of light passes over each card as it becomes the active one
        const q = 1 - k;
        if (split > .5 && q > 0 && q < 1) { c.sheen.style.opacity = '1'; c.sheen.style.transform = `translateX(${(-150 + q * 300).toFixed(1)}%)`; } else c.sheen.style.opacity = '0';
        // and a pulse runs along its flow line to the target
        const u = i < 6 ? prog(t, STAGE_AT(i) + .05, STAGE_AT(i) + .85) : 0;
        const x = 74 + ease.inOutSine(u) * 632, show = u > 0 && u < 1 && Math.abs(k) < .2 ? Math.sin(Math.PI * u) : 0;
        for (const el of [c.fp, c.fpg]) { el.setAttribute('cx', x.toFixed(1)); el.setAttribute('cy', flowY(x).toFixed(1)); }
        c.fp.style.opacity = show.toFixed(3); c.fpg.style.opacity = (show * .55).toFixed(3);
        const r = i < 6 ? prog(t, STAGE_AT(i) + .8, STAGE_AT(i) + 1.25) : 0;
        c.tr.setAttribute('r', (30 + r * 40).toFixed(1)); c.tr.style.opacity = (r > 0 && r < 1 && Math.abs(k) < .2 ? 1 - r : 0).toFixed(3);
      });
      look(glow, .6 + .4 * open);
    },
  };
}

// ================================================================ what we build: the site's three service cards
export function Work(world) {
  const root = h('div', 'layer', world);
  const cards = [1, 2, 3].map(i => {
    const el = h('div', 'wcard', root, `<img src="assets/site/work-card-${i}.png"><span class="wcard-sheen"></span>`);
    box(el, 90, 610, 900, 831);
    return { el, sheen: el.querySelector('.wcard-sheen') };
  });
  const pos = t => spring(t, 14.85, 1.3, .62) + spring(t, 15.95, 1.3, .62) + ease.inExpo(prog(t, 16.6, 17.0)) * 1.6;
  return {
    update(t) {
      if (!live(root, t, 13.65, 17.05)) return;
      const c = pos(t), enter = 1 - spring(t, 13.72, 1.1, .74);
      cards.forEach(({ el, sheen }, i) => {
        const d = i - c + enter * 2.2, a = Math.abs(d);
        const o = prog(t, 13.7, 13.9) * (1 - clamp(a - 1.7)) * (1 - prog(t, 16.88, 17.02));
        const tilt = Math.sin(t * 1.1 + i) * 3;
        look(el, o, { x: d * 650, z: -a * 520, ry: -d * 36 + tilt * (1 - Math.min(a, 1)), rx: 2 * Math.sin(t * .8 + i) }, Math.min(a, 1.4) * 6 + bump(t, 16.6, 17.0) * 8);
        el.style.zIndex = String(100 - Math.round(a * 10));
        const s = prog(t, 13.95 + i * 1.1, 14.55 + i * 1.1);
        look(sheen, bump(t, 13.95 + i * 1.1, 14.55 + i * 1.1), `translateX(${(-130 + s * 260).toFixed(1)}%) rotate(16deg)`);
      });
    },
  };
}

// ================================================================ expertise: every discipline, as one chain
const CHAIN = [
  ['01', 'Discover', 'Product strategy'], ['02', 'Design', 'UI and UX design'], ['03', 'Build', 'Web development · Custom software'],
  ['04', 'Connect', 'Integrations · Automation · AI'], ['05', 'Launch', 'Deployment and DevOps'], ['06', 'Evolve', 'Monitoring and maintenance'],
];
export function Chain(world) {
  const root = h('div', 'layer', world);
  const rail = h('div', 'chain-rail', root);
  const pulse = h('div', 'chain-pulse', root);
  const rows = CHAIN.map(([n, name, caps], i) => {
    const el = h('div', 'crow', root, `<span class="cdot"><i></i></span><div><p class="cstep">${n} · ${name}</p><p class="ccaps">${caps}</p></div>`);
    el.style.top = (600 + i * 150) + 'px'; el.style.setProperty('--c', C.stages[i]);
    return el;
  });
  return {
    update(t) {
      if (!live(root, t, 16.85, 19.1)) return;
      const lv = prog(t, 18.75, 19.0);
      rail.style.height = (ease.inOutCubic(prog(t, 17.15, 18.0)) * 760 * (1 - lv)).toFixed(1) + 'px';
      rows.forEach((r, i) => {
        const s = 17.15 + i * .14, x = ease.outExpo(prog(t, s, s + .55));
        look(r, x * (1 - lv), { x: (1 - x) * 160 - lv * 120 });
        r.classList.toggle('lit', t > 17.9 + i * .1);
      });
      const u = prog(t, 17.9, 18.6);
      look(pulse, u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0, `translate(136px, ${(632 + ease.inOutSine(u) * 750).toFixed(1)}px) translate(-50%,-50%)`);
    },
  };
}
