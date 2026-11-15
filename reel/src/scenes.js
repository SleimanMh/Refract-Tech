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

// ================================================================ opening: the logo builds itself out of light
// A spark draws the ring, the R flies together from shards and locks with a flash, a glint runs
// across it, the name and tag rise in; then the camera goes through the R into the website.
export function Hook(world, mark) {
  const root = h('div', 'layer', world);
  const CX = 540, CY = 840;
  const glow = h('div', 'spark-glow', root), spark = h('div', 'spark', root);
  const flare = h('div', 'flare', root), flareV = h('div', 'flare flare-v', root);
  const logo = h('div', 'hook-logo', root);
  const halo = h('div', 'logo-glow', logo);
  const ring = h('div', 'logo-ring', logo, `<svg viewBox="0 0 420 420" width="420" height="420"><defs><linearGradient id="hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#713DE8"/><stop offset=".5" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs>
    <circle id="hrc" cx="210" cy="210" r="196" stroke="url(#hr)" stroke-width="8" fill="none" stroke-linecap="round" transform="rotate(-90 210 210)" stroke-dasharray="1231.5"/></svg>`);
  const hrc = ring.querySelector('#hrc');
  const tip = h('div', 'ring-tip', logo);
  // the R, cut into shards
  const RW = 300, RH = RW * mark.naturalHeight / mark.naturalWidth, COLS = 4, ROWS = 4, sw = RW / COLS, sh = RH / ROWS;
  const R = rng(21), shards = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cv = h('canvas', 'r-shard', logo);
    cv.width = Math.ceil(sw * 2); cv.height = Math.ceil(sh * 2);
    cv.getContext('2d').drawImage(mark, c * mark.naturalWidth / COLS, r * mark.naturalHeight / ROWS, mark.naturalWidth / COLS, mark.naturalHeight / ROWS, 0, 0, cv.width, cv.height);
    box(cv, CX - RW / 2 + c * sw, CY - RH / 2 + r * sh, sw + .5, sh + .5);
    const a = R() * Math.PI * 2, d = 520 + R() * 420;
    shards.push({ el: cv, dx: Math.cos(a) * d, dy: Math.sin(a) * d, z: 200 + R() * 600, rz: (R() - .5) * 220, at: .5 + R() * .32 });
  }
  const whole = h('img', 'r-shard', logo); whole.src = 'assets/r-mark.png'; box(whole, CX - RW / 2, CY - RH / 2, RW, RH);   // the R in one piece once locked
  const shine = h('div', 'hook-shine', logo, '<i></i>'); box(shine, CX - RW / 2, CY - RH / 2, RW, RH);
  const band = shine.firstChild;
  const word = h('div', 'hook-word', logo, '<span>Refract <b>Tech</b></span>');
  const tag = h('div', 'hook-tag', logo, '<i></i><span>Digital solutions</span><i></i>');
  const lines = tag.querySelectorAll('i'), tagText = tag.querySelector('span');
  const at = s => `translate(${CX}px,${CY}px) translate(-50%,-50%) ${s}`;
  return {
    LOCK: 1.12,
    focus(t) { return t < 2.6 ? { x: CX, y: CY, r: 560 + 300 * tw(t, .3, 1.2), a: Math.max(tw(t, 0, .45) * .8 + .3 * bump(t, 1.05, 1.6), .12) * (1 - tw(t, 2.2, 2.6)) } : null; },
    update(t) {
      if (!live(root, t, 0, 2.62)) return;
      // the spark
      const g = ease.outExpo(prog(t, 0, .45)), fl = bump(t, .4, .75), sOut = 1 - tw(t, .55, .95);
      look(spark, (g * .9 + fl * .1) * sOut, at(`scale(${(.06 + g * .55 + fl * 1.1).toFixed(3)})`));
      look(glow, (g * .7 + fl * .3) * (1 - tw(t, .9, 1.6)), at(`scale(${(.3 + g * .7 + fl * .6).toFixed(3)})`));
      look(flare, (g * .7 + fl) * sOut, at(`scaleX(${(.1 + g * .6 + fl * 1.6).toFixed(3)})`));
      look(flareV, (g * .5 + fl * .6) * sOut, at(`scaleY(${(.1 + g * .5 + fl).toFixed(3)})`));
      // the whole lockup breathes in, then the camera goes through the R
      const out = ease.inCubic(prog(t, 2.15, 2.6));
      logo.style.transformOrigin = `${CX}px ${CY}px`;
      look(logo, 1 - prog(t, 2.18, 2.42), { s: (1 + .035 * tw(t, 1.2, 2.15, ease.inOutSine)) * (1 + out * 3.2) }, out * 12);
      // the ring is drawn by a point of light
      const k = tw(t, .35, 1.05, ease.outCubic);
      hrc.style.strokeDashoffset = (1231.5 * (1 - k)).toFixed(1);
      look(ring, prog(t, .33, .4), at(`scale(1.1) rotate(${(-30 * (1 - k)).toFixed(2)}deg)`));
      const ang = (-90 - 30 * (1 - k) + 360 * k) * Math.PI / 180;
      look(tip, prog(t, .35, .42) * (1 - prog(t, 1.0, 1.15)), `translate(${(CX + Math.cos(ang) * 215.6).toFixed(1)}px,${(CY + Math.sin(ang) * 215.6).toFixed(1)}px) translate(-50%,-50%)`);
      // the shards of the R fly in and lock together
      for (const p of shards) {
        const kk = spring(t, p.at, 1.7, .66), u = clamp(kk);
        look(p.el, clamp((t - p.at) * 7) * (1 - prog(t, 1.16, 1.22)), { x: p.dx * (1 - kk), y: p.dy * (1 - kk), z: p.z * (1 - kk), rz: p.rz * (1 - u), s: .3 + .7 * u });
      }
      look(whole, prog(t, 1.1, 1.18));
      look(halo, prog(t, .8, 1.15) * (.8 + .2 * Math.sin(t * 3)), at(`scale(${(.55 + .3 * ease.outCubic(prog(t, .9, 1.4)) + .3 * bump(t, 1.1, 1.5)).toFixed(3)})`));
      // a glint runs across the finished R
      look(shine, bump(t, 1.2, 1.75));
      band.style.transform = `translateX(${(-120 + prog(t, 1.2, 1.75) * 340).toFixed(1)}%) rotate(20deg)`;
      // the name and the tag
      const w = ease.outExpo(prog(t, 1.18, 1.8));
      look(word.firstChild, Math.min(1, w * 1.5), `translateY(${((1 - w) * 105).toFixed(2)}%)`, (1 - w) * 8);
      const tg = ease.outExpo(prog(t, 1.4, 2.0));
      look(tagText, tg); tagText.style.letterSpacing = `${(.34 + (1 - tg) * .3).toFixed(3)}em`;
      lines.forEach(l => { l.style.transform = `scaleX(${tg.toFixed(3)})`; });
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
      if (!live(root, t, 2.25, 4.45)) return;
      const k = ease.outExpo(prog(t, 2.3, 3.0));
      const dive = ease.inCubic(prog(t, 3.7, 4.35));
      root.style.transformOrigin = `${DECK[0]}px ${DECK[1]}px`;
      look(root, prog(t, 2.28, 2.55) * (1 - prog(t, 4.0, 4.35)), { s: 1 + dive * 2.6 }, dive * 10);
      look(scr, 1, { y: (1 - k) * 420, z: (1 - k) * -600, rx: (1 - k) * 22 + 3 * Math.sin((t - 2.2) * 1.5) * k, ry: -4 * Math.sin((t - 2.2) * 1.1) * k });
      page.style.transform = `translateY(${(-60 * tw(t, 2.7, 3.7, ease.inOutSine)).toFixed(1)}px)`;
      look(glare, .7, `translateX(${(-600 + prog(t, 2.5, 3.9) * 1500).toFixed(1)}px) rotate(18deg)`);
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
  const SWAP = [15.9, 18.0];   // when the carousel turns to the next card
  const pos = t => spring(t, SWAP[0], 1.15, .7) + spring(t, SWAP[1], 1.15, .7) + ease.inExpo(prog(t, 19.6, 20.0)) * 1.6;
  return {
    update(t) {
      if (!live(root, t, 13.65, 20.05)) return;
      const c = pos(t), enter = 1 - spring(t, 13.72, 1.1, .74);
      cards.forEach(({ el, sheen }, i) => {
        const d = i - c + enter * 2.2, a = Math.abs(d);
        const o = prog(t, 13.7, 13.9) * (1 - clamp(a - 1.7)) * (1 - prog(t, 19.88, 20.02));
        const tilt = Math.sin(t * 1.1 + i) * 3;
        // while a card is in front the camera eases in on it
        const hold = 1 + .04 * (1 - Math.min(a, 1)) * tw(t, [13.9, SWAP[0], SWAP[1]][i] + .3, [SWAP[0], SWAP[1], 19.6][i], ease.inOutSine);
        look(el, o, { x: d * 650, z: -a * 520, ry: -d * 36 + tilt * (1 - Math.min(a, 1)), rx: 2 * Math.sin(t * .8 + i), s: hold }, Math.min(a, 1.4) * 6 + bump(t, 19.6, 20.0) * 8);
        el.style.zIndex = String(100 - Math.round(a * 10));
        const s0 = [14.0, SWAP[0] + .35, SWAP[1] + .35][i], s = prog(t, s0, s0 + .7);
        look(sheen, bump(t, s0, s0 + .7), `translateX(${(-130 + s * 260).toFixed(1)}%) rotate(16deg)`);
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
      if (!live(root, t, 19.85, 22.1)) return;
      const lv = prog(t, 21.75, 22.0);
      rail.style.height = (ease.inOutCubic(prog(t, 20.15, 21.0)) * 760 * (1 - lv)).toFixed(1) + 'px';
      rows.forEach((r, i) => {
        const s = 20.15 + i * .14, x = ease.outExpo(prog(t, s, s + .55));
        look(r, x * (1 - lv), { x: (1 - x) * 160 - lv * 120 });
        r.classList.toggle('lit', t > 20.9 + i * .1);
      });
      const u = prog(t, 20.9, 21.6);
      look(pulse, u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0, `translate(136px, ${(632 + ease.inOutSine(u) * 750).toFixed(1)}px) translate(-50%,-50%)`);
    },
  };
}
