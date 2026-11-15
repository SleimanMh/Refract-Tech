// "Meet Refract Tech": short reels for Instagram that speak to business owners. A teaser, then one
// episode per stage of the process. Each asks the viewer a question about their website or their
// business, shows that stage's card from the website, and ends on the email address.
// Open series.html?ep=teaser | discover | design | build | connect | launch | evolve.
import { ART_KEYS, CARD_H, CARD_W, loadCardAssets, paintCard } from '../assets/cardArt-series.js';
import { box, bump, clamp, ease, h, lerp, look, prog, spring, track, tw } from './lib.js';
import { C, ICON, Sky } from './ui.js';
import { Hook } from './scenes.js';

const EMAIL = 'refract@refract-tech.com';

// ------------------------------------------------------------------ the scripts
// [lines, in, out]; *words* take the accent and an underline.
const STAGES = {
  discover: {
    n: 0, name: 'Discover',
    q1: [['Have a business idea', '*but no clear plan?*'], .4, 3.3], q2: [['Who are your customers?', '*What do they need first?*'], 3.4, 6.0],
    msg: ['We turn your goals into', '*a clear, scoped plan.*'],
    close: [['Clarity first.', '*Then we build.*'], 10.6, 12.05],
  },
  design: {
    n: 1, name: 'Design',
    q1: [['Do visitors leave', '*your website too fast?*'], .4, 3.3], q2: [['First impressions', '*take seconds.*'], 3.4, 6.0],
    msg: ['Websites your customers', '*find easy to use.*'],
    close: [['Design that', '*earns their trust.*'], 10.6, 12.05],
  },
  build: {
    n: 2, name: 'Build',
    q1: [['Still taking bookings', '*by phone and paper?*'], .4, 3.3], q2: [['What if one system', '*handled it all?*'], 3.4, 6.0],
    msg: ['Websites and booking systems,', '*built to last.*'],
    close: [['Software that', '*works for your business.*'], 10.6, 12.05],
  },
  connect: {
    n: 3, name: 'Connect',
    q1: [['Payments in one place,', '*calendars in another?*'], .4, 3.3], q2: [['Your tools should', '*work together.*'], 3.4, 6.0],
    msg: ['Payments, bookings and email,', '*connected in one flow.*'],
    close: [['Less admin.', '*More time for clients.*'], 10.6, 12.05],
  },
  launch: {
    n: 4, name: 'Launch',
    q1: [['Worried your new site', '*fails on launch day?*'], .4, 3.3], q2: [['Going live should feel', '*routine, not risky.*'], 3.4, 6.0],
    msg: ['Reliable hosting,', '*smooth releases.*'],
    close: [['Go live', '*with confidence.*'], 10.6, 12.05],
  },
  evolve: {
    n: 5, name: 'Evolve',
    q1: [['Is your website', '*growing with your business?*'], .4, 3.3], q2: [['Launch is', '*just the beginning.*'], 3.4, 6.0],
    msg: ['We monitor, maintain', '*and keep improving.*'],
    close: [['Built to grow', '*as you grow.*'], 10.6, 12.05],
  },
};

// ------------------------------------------------------------------ pieces
/** Lines that rise out of a mask one after another; accent words take a gradient and an underline. */
function Lines(parent, lines, { y = 700, size = 104, max = 960, weight = 500 } = {}) {
  const el = h('div', 'lines', parent); el.style.top = y + 'px';
  const rows = lines.map(line => {
    const row = h('div', 'lrow', el); row.style.fontSize = size + 'px'; row.style.fontWeight = weight;
    const inner = h('span', 'lin', row, line.replace(/\*([^*]+)\*/g, '<span class="acc">$1</span>'));
    if (inner.offsetWidth > max) row.style.fontSize = (size * max / inner.offsetWidth).toFixed(1) + 'px';
    return { inner, accs: [...inner.querySelectorAll('.acc')] };
  });
  return {
    update(t, tin, tout) {
      const on = t > tin - .05 && t < tout + .5; el.style.display = on ? '' : 'none'; if (!on) return;
      rows.forEach(({ inner, accs }, i) => {
        const a = tin + i * .12, k = ease.outExpo(prog(t, a, a + .75)), e = ease.inCubic(prog(t, tout - .3 + i * .05, tout + i * .05));
        look(inner, Math.min(1, k * 1.5) * (1 - e), `translateY(${((1 - k) * 105 - e * 60).toFixed(2)}%)`, (1 - k) * 8 + e * 6);
        accs.forEach(s => s.style.setProperty('--u', tw(t, a + .45, a + 1.0, ease.inOutCubic).toFixed(3)));
      });
    },
  };
}

/** A large outlined numeral or mark behind the words, drifting slowly. */
function Backdrop(parent, text) {
  const el = h('div', 'backdrop', parent, text);
  return { update(t, tin, tout) { look(el, tw(t, tin, tin + .8) * (1 - tw(t, tout - .4, tout)) * .9, `translate(-50%,-50%) translateY(${(-t * 8).toFixed(1)}px) scale(${(1 + t * .006).toFixed(4)})`); } };
}

/** The stage's card from the website, turning in. */
function StageCard(parent, cv, accent) {
  const el = h('div', 'scard', parent); el.appendChild(cv);
  const sheen = h('span', 'scard-sheen', el);
  el.style.boxShadow = `0 60px 120px -40px #000, 0 0 120px -20px ${accent}55`;
  return {
    update(t, tin, tout) {
      const on = t > tin - .05 && t < tout + .5; el.style.display = on ? '' : 'none'; if (!on) return;
      const k = spring(t, tin, 1.05, .8), e = ease.inCubic(prog(t, tout - .1, tout + .4));
      look(el, clamp(k * 2) * (1 - e), { y: (1 - k) * 260 - e * 120, ry: (1 - k) * -40 + Math.sin(t * 1.1) * 3, rx: (1 - clamp(k)) * 12 + Math.sin(t * .8) * 1.5, s: (.86 + .14 * k) * (1 - .06 * e) });
      const sw = prog(t, tin + .8, tin + 1.6);
      look(sheen, bump(t, tin + .8, tin + 1.6), `translateX(${(-130 + sw * 260).toFixed(1)}%) rotate(16deg)`);
    },
    /** push in on the card's goals checklist (0 = whole card, 1 = close up) */
    zoom(z) { cv.style.transformOrigin = '33% 56%'; cv.style.transform = `scale(${(1 + .75 * z).toFixed(4)})`; },
  };
}

/** The R in its ring. */
function Logo(parent, size = 300) {
  const el = h('div', 'logo', parent, `<svg viewBox="0 0 420 420" width="${size}" height="${size}"><defs><linearGradient id="lg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#713DE8"/><stop offset=".5" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs>
    <circle cx="210" cy="210" r="196" stroke="url(#lg${size})" stroke-width="9" fill="none" stroke-linecap="round" transform="rotate(-90 210 210)" stroke-dasharray="1231.5"/></svg><img src="assets/r-mark.png" style="width:${size * .6}px">`);
  el.style.width = el.style.height = size + 'px';
  const c = el.querySelector('circle'), img = el.querySelector('img');
  return {
    update(t, tin, tout, x, y) {
      const k = ease.outExpo(prog(t, tin, tin + .9)), e = ease.inCubic(prog(t, tout - .3, tout));
      look(el, Math.min(1, k * 1.5) * (1 - e), `translate(${x}px,${y}px) translate(-50%,-50%) scale(${(.85 + .15 * k).toFixed(3)})`);
      c.style.strokeDashoffset = (1231.5 * (1 - tw(t, tin, tin + .9, ease.outCubic))).toFixed(1);
      look(img, prog(t, tin + .15, tin + .5), `scale(${(.9 + .1 * ease.outCubic(prog(t, tin + .15, tin + .7))).toFixed(3)})`, (1 - prog(t, tin + .15, tin + .55)) * 8);
    },
  };
}

/** Logo, a line, the email, and the website launching soon. */
function EndCard(parent, heading) {
  const root = h('div', 'end', parent);
  const logo = Logo(root, 280);
  const head = Lines(root, heading, { y: 790, size: 100 });
  const pill = h('div', 'email', root, `<span class="email-sheen"></span><i>${ICON.mail}</i><span>${EMAIL}</span>`);
  const pSheen = pill.querySelector('.email-sheen');
  const soon = h('div', 'soon', root, `<b></b>refract-tech.com · launching soon`);
  return {
    update(t, tin) {
      const on = t > tin - .05; root.style.display = on ? '' : 'none'; if (!on) return;
      logo.update(t, tin, 99, 540, 560);
      head.update(t, tin + .15, 99);
      const p = ease.outExpo(prog(t, tin + .5, tin + 1.2));
      look(pill, p, `translate(540px,1130px) translate(-50%,-50%) translateY(${((1 - p) * 40).toFixed(1)}px)`);
      pSheen.style.transform = `translateX(${(-160 + ((((t - tin - 1.0) % 2.2) + 2.2) % 2.2) / 2.2 * 520).toFixed(1)}%)`;
      const s = ease.outExpo(prog(t, tin + .8, tin + 1.4));
      look(soon, s, `translate(540px,1262px) translate(-50%,-50%) translateY(${((1 - s) * 20).toFixed(1)}px)`);
    },
  };
}

// ------------------------------------------------------------------ episodes
function stageEpisode(hud, key, cards) {
  const S = STAGES[key], acc = C.stages[S.n], DUR = 14.5, CARD = 6.1, END = 12.15;
  hud.style.setProperty('--acc', acc);
  const num = Backdrop(hud, `0${S.n + 1}`);
  const tag = h('div', 'ep-tag', hud, `<b></b>Refract Tech · Step 0${S.n + 1} / 06`);
  const q1 = Lines(hud, S.q1[0], { y: 760 }), q2 = Lines(hud, S.q2[0], { y: 760 });
  const label = h('div', 'ep-label', hud, `Step 0${S.n + 1} · ${S.name}`);
  const msg = Lines(hud, S.msg, { y: 300, size: 80 });
  const card = StageCard(hud, cards[S.n], acc);
  const close = Lines(hud, S.close[0], { y: 790 });
  const end = EndCard(hud, ['Ready to grow?', "*Let's talk.*"]);
  return {
    DUR,
    events: { tick: [S.q1[1], S.q2[1], S.close[1]], whoosh: [CARD], chime: [END + .2], key: S.n },
    update(t) {
      num.update(t, .2, CARD);
      look(tag, prog(t, .1, .5) * (1 - prog(t, CARD - .3, CARD)), `translateY(${((1 - ease.outCubic(prog(t, .1, .6))) * -24).toFixed(1)}px)`);
      q1.update(t, S.q1[1], S.q1[2]); q2.update(t, S.q2[1], S.q2[2]);
      const lk = ease.outExpo(prog(t, CARD, CARD + .6)), lo = prog(t, S.close[1] - .35, S.close[1] - .05);
      look(label, lk * (1 - lo), `translateY(${((1 - lk) * 16).toFixed(1)}px)`);
      label.style.letterSpacing = `${(.26 + (1 - lk) * .25).toFixed(3)}em`;
      msg.update(t, CARD + .3, S.close[1] - .1);
      card.update(t, CARD + .15, S.close[1] - .2);
      close.update(t, S.close[1], S.close[2]);
      end.update(t, END);
    },
  };
}

// ------------------------------------------------------------------ the teaser
// The three things we build, each drawn as line art that draws itself in.
const OFFERS = [
  { title: ['Business', 'websites'], line: 'Fast, clear and built to bring you clients.',
    art: `<rect x="20" y="34" width="200" height="150" rx="16"/><path d="M20 66h200"/><circle cx="40" cy="50" r="4"/><circle cx="54" cy="50" r="4"/><circle cx="68" cy="50" r="4"/>
      <path d="M44 96h86M44 116h60M44 136h74"/><rect x="146" y="92" width="52" height="64" rx="8"/><path d="M44 160h40"/><path d="M168 150l26 32 8-14 16 4z"/>` },
  { title: ['Booking and', 'management systems'], line: 'Bookings, payments and clients together.',
    art: `<rect x="22" y="40" width="196" height="160" rx="16"/><path d="M22 80h196M66 24v32M174 24v32"/>
      <path d="M52 108h20M100 108h20M148 108h20M52 138h20M148 138h20M52 168h20M100 168h20"/><rect x="92" y="126" width="36" height="28" rx="6"/><path d="M100 140l7 7 13-14"/>` },
  { title: ['Custom SaaS', 'platforms'], line: 'Your own software, built to grow with you.',
    art: `<rect x="18" y="30" width="204" height="170" rx="16"/><path d="M76 30v170"/><path d="M34 60h26M34 84h26M34 108h26"/>
      <path d="M96 176V140M126 176V112M156 176V126M186 176V86"/><path d="M96 70h70M96 92h44"/><circle cx="196" cy="62" r="12"/>` },
];
function Offer(parent, o, i) {
  const el = h('div', 'ocard', parent, `
    <div class="o-top"><span>0${i + 1} / 03</span><span class="o-dots">${[0, 1, 2].map(k => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span></div>
    <div class="o-tile"><span class="o-glow"></span><svg viewBox="0 0 240 220" width="290" height="266" fill="none" stroke="url(#og${i})" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <defs><linearGradient id="og${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs>${o.art}</svg></div>
    <div class="o-title">${o.title.map(t => `<div class="o-row"><span>${t}</span></div>`).join('')}</div>
    <div class="o-line">${o.line}</div><span class="o-sheen"></span>`);
  const parts = [...el.querySelectorAll('svg > :not(defs)')];
  parts.forEach(p => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; });
  const tile = el.querySelector('.o-tile'), glow = el.querySelector('.o-glow'), rows = [...el.querySelectorAll('.o-row span')], line = el.querySelector('.o-line'), sheen = el.querySelector('.o-sheen');
  return {
    update(t, tin, tout) {
      const on = t > tin - .05 && t < tout + .45; el.style.display = on ? '' : 'none'; if (!on) return;
      const k = spring(t, tin, 1.3, .74), e = ease.inCubic(prog(t, tout - .05, tout + .4));
      look(el, clamp(k * 2) * (1 - e), { x: (1 - k) * 760 - e * 760, ry: (1 - k) * -34 + e * 34, s: .92 + .08 * clamp(k) });
      const tk = spring(t, tin + .12, 1.8, .5);
      look(tile, 1, { s: .4 + .6 * tk, rz: (1 - tk) * -14 });
      glow.style.opacity = (.55 + .45 * bump(t, tin + .3, tin + 1.0)).toFixed(3);
      parts.forEach((p, j) => { p.style.strokeDashoffset = (1 - tw(t, tin + .2 + j * .045, tin + .65 + j * .045, ease.outCubic)).toFixed(3); });
      rows.forEach((r, j) => { const a = tin + .3 + j * .1, q = ease.outExpo(prog(t, a, a + .7)); look(r, Math.min(1, q * 1.5), `translateY(${((1 - q) * 105).toFixed(1)}%)`, (1 - q) * 6); });
      const lq = ease.outExpo(prog(t, tin + .55, tin + 1.1)); look(line, lq, `translateY(${((1 - lq) * 20).toFixed(1)}px)`);
      look(sheen, bump(t, tin + .6, tin + 1.3), `translateX(${(-130 + prog(t, tin + .6, tin + 1.3) * 260).toFixed(1)}%) rotate(16deg)`);
    },
  };
}

/** The close: the logo builds, the words rise, the email unfolds and types itself, then light pulses out. */
function Closing(parent, heading) {
  const root = h('div', 'end', parent);
  const pulses = [0, 1, 2].map(() => h('div', 'pulse', root));
  const logo = Logo(root, 300);
  const tip = h('div', 'ring-tip', root);
  const head = Lines(root, heading, { y: 800, size: 104 });
  const pill = h('div', 'email', root, `<span class="email-sheen"></span><i>${ICON.mail}</i><span class="e-txt"></span>`);
  const icon = pill.querySelector('i'), txt = pill.querySelector('.e-txt'), pSheen = pill.querySelector('.email-sheen');
  const soon = h('div', 'soon', root, `<b></b>refract-tech.com · launching soon`);
  return {
    update(t, tin) {
      const on = t > tin - .05; root.style.display = on ? '' : 'none'; if (!on) return;
      logo.update(t, tin, 99, 540, 560);
      const ang = (-90 + 360 * tw(t, tin, tin + .9, ease.outCubic)) * Math.PI / 180;
      look(tip, prog(t, tin, tin + .08) * (1 - prog(t, tin + .85, tin + 1.0)), `translate(${(540 + Math.cos(ang) * 140).toFixed(1)}px,${(560 + Math.sin(ang) * 140).toFixed(1)}px) translate(-50%,-50%)`);
      head.update(t, tin + .25, 99);
      // the email: a small round button that unfolds, then the address types itself out
      const open = spring(t, tin + .75, 1.4, .72), full = txt.dataset.full || (txt.dataset.full = EMAIL);
      const n = Math.round(prog(t, tin + 1.0, tin + 1.65) * full.length);
      if (txt.textContent.length !== n) txt.textContent = full.slice(0, n);
      look(pill, clamp(open * 3), `translate(540px,1135px) translate(-50%,-50%) scale(${(.4 + .6 * clamp(open)).toFixed(3)})`);
      pill.style.maxWidth = (130 + 870 * tw(t, tin + .9, tin + 1.6, ease.inOutCubic)).toFixed(0) + 'px';
      look(icon, 1, `rotate(${(-20 * Math.sin(Math.min(1, prog(t, tin + .75, tin + 1.2)) * Math.PI * 2)).toFixed(2)}deg)`);
      pSheen.style.transform = `translateX(${(-160 + ((((t - tin - 1.8) % 1.6) + 1.6) % 1.6) / 1.6 * 520).toFixed(1)}%)`;
      pSheen.style.opacity = t > tin + 1.8 ? '1' : '0';
      const s = ease.outExpo(prog(t, tin + 1.5, tin + 2.0));
      look(soon, s, `translate(540px,1268px) translate(-50%,-50%) translateY(${((1 - s) * 20).toFixed(1)}px)`);
      // and light keeps rippling out of the logo
      pulses.forEach((p, i) => { const u = (((t - tin - 1.6 - i * .55) % 1.65) + 1.65) % 1.65 / 1.65; const live = t > tin + 1.6 + i * .55; look(p, live ? (1 - u) * .7 : 0, `translate(540px,560px) translate(-50%,-50%) scale(${(.75 + u * 1.3).toFixed(3)})`); });
    },
  };
}

function teaser(hud, mark) {
  const DUR = 22.0;
  hud.style.setProperty('--acc', C.purple);
  const world = h('div', 'world', hud);
  const intro = Hook(world, mark);
  const bg = Backdrop(hud, 'R');
  const Q = [
    [Lines(hud, ['Is your business', '*ready to grow online?*'], { y: 760 }), 2.55, 4.7],
    [Lines(hud, ['Does your website', '*bring you new clients?*'], { y: 760 }), 4.85, 6.95],
    [Lines(hud, ['Curious what', '*Refract Tech* does?'], { y: 760 }), 7.1, 8.85],
  ];
  const what = h('div', 'ep-label', hud, 'What we build'); what.style.top = '400px';
  const ITEMS = [9.15, 10.75, 12.35], offers = OFFERS.map((o, i) => Offer(hud, o, i));
  const logo = Logo(hud, 260);
  const idea = Lines(hud, ['From idea', '*to a working product.*'], { y: 820 });
  const soon = Lines(hud, ['Our website is', '*launching soon.*'], { y: 600 });
  const site = h('div', 'site-pill', hud, `<span class="email-sheen"></span>refract-tech.com<em>Soon</em>`);
  const siteSheen = site.querySelector('.email-sheen');
  const end = Closing(hud, ["Can't wait?", "*Let's talk.*"]);
  return {
    DUR, focus: t => intro.focus(t),
    events: { lock: [intro.LOCK], tick: [2.55, 4.85, 7.1], riser: [[8.3, 9.05]], drop: [9.05], item: ITEMS, hit: [14.0], ding: [16.75], end: [18.8], key: 6 },
    update(t) {
      intro.update(t);
      bg.update(t, 7.1, 9.0);
      Q.forEach(([q, a, b]) => q.update(t, a, b));
      const wk = ease.outExpo(prog(t, 9.0, 9.6));
      look(what, wk * (1 - prog(t, 13.75, 14.0)), `translateY(${((1 - wk) * 16).toFixed(1)}px)`);
      what.style.letterSpacing = `${(.26 + (1 - wk) * .3).toFixed(3)}em`;
      offers.forEach((o, i) => o.update(t, ITEMS[i], i < 2 ? ITEMS[i + 1] - .05 : 13.85));
      logo.update(t, 14.0, 16.25, 540, 560);
      idea.update(t, 14.15, 16.25);
      soon.update(t, 16.4, 18.65);
      const sk = spring(t, 16.75, 1.5, .62);
      look(site, clamp(sk * 2) * (1 - prog(t, 18.45, 18.7)), `translate(540px,1000px) translate(-50%,-50%) scale(${(.75 + .25 * sk).toFixed(3)})`);
      siteSheen.style.transform = `translateX(${(-160 + prog(t, 17.1, 17.9) * 520).toFixed(1)}%)`;
      end.update(t, 18.8);
    },
  };
}

// ------------------------------------------------------------------ Discover, the full 20 s reel
// The logo builds; a question; the messy questions every new idea brings swarm around; on the drop
// each one flips to its answer and snaps into a clean plan; the site's Discover card turns in and
// the camera dives into its goals; a lens sweeps the blur off "Clarity first."; the contact close.
const CHAOS = [
  ["Who's it for?", 'Target customers', 290, 700, -7], ['Budget?', 'Scoped budget', 820, 640, 6], ['Which features?', 'Must-have features', 330, 960, 4],
  ['Timeline?', 'Phased roadmap', 820, 900, -5], ['Where to start?', 'A clear first step', 380, 1240, -3], ['Competitors?', 'Market check', 800, 1170, 7],
];
function Note(parent, q, a, x, y, rot, i) {
  const el = h('div', 'note', parent, `<div class="nf"><b></b>${q}</div><div class="nb"><i>${ICON.check}</i>${a}</div>`);
  const back = el.querySelector('.nb'), chk = back.querySelector('i');
  return {
    update(t, tin, snap, tout) {
      const on = t > tin - .05 && t < tout + .4; el.style.display = on ? '' : 'none'; if (!on) return;
      const k = spring(t, tin, 1.7, .5);
      // drifting, restless, until it is resolved
      const restless = 1 - tw(t, snap - .15, snap + .1);
      const jx = Math.sin(t * (2.1 + i * .37) + i) * 26 * restless, jy = Math.cos(t * (1.7 + i * .29) + i * 2) * 20 * restless;
      const m = tw(t, snap, snap + .45, ease.inOutCubic);
      const tx = 540, ty = 795 + i * 108;                          // its row in the plan
      const X = lerp(x + jx, tx, m), Y = lerp(y + jy, ty, m);
      const flip = tw(t, snap + .05, snap + .4, ease.inOutCubic) * 180;
      const e = ease.inCubic(prog(t, tout - .1 + i * .03, tout + .25 + i * .03));
      if (!el.dataset.w0) el.dataset.w0 = el.offsetWidth;
      el.style.width = lerp(+el.dataset.w0, 760, m).toFixed(1) + 'px';
      look(el, clamp(k * 3) * (1 - e), `translate(${X.toFixed(1)}px,${(Y - e * 60).toFixed(1)}px) translate(-50%,-50%) rotate(${(lerp(rot + Math.sin(t * 1.3 + i) * 4 * restless, 0, m) + (1 - clamp(k)) * 30).toFixed(2)}deg) rotateX(${flip.toFixed(1)}deg) scale(${(.4 + .6 * k).toFixed(3)})`);
      chk.style.transform = `scale(${ease.outBack(prog(t, snap + .35, snap + .6)).toFixed(3)})`;
      back.style.setProperty('--g', bump(t, snap + .3, snap + .9).toFixed(3));
    },
  };
}

/** Words under a blur that a moving lens wipes clear, then the whole line comes into focus. */
function Lens(parent, lines, y) {
  const el = h('div', 'lens', parent); el.style.top = y + 'px';
  const html = lines.map(l => `<div class="lrow2">${l.replace(/\*([^*]+)\*/g, '<span class="acc" style="--u:1">$1</span>')}</div>`).join('');
  const blur = h('div', 'lens-blur', el, html), sharp = h('div', 'lens-sharp', el, html);
  const ring = h('div', 'lens-ring', el);
  return {
    update(t, tin, tout) {
      const on = t > tin - .05 && t < tout + .4; el.style.display = on ? '' : 'none'; if (!on) return;
      const show = prog(t, tin, tin + .3) * (1 - prog(t, tout - .2, tout + .2));
      el.style.opacity = show.toFixed(3);
      const u = tw(t, tin + .15, tin + 1.25, ease.inOutSine);
      const lx = 120 + u * 840, ly = 120 + Math.sin(u * Math.PI * 2) * 70;
      const R = 150 + 1200 * tw(t, tin + 1.25, tin + 1.75, ease.inOutCubic);
      const mask = `radial-gradient(circle at ${lx.toFixed(0)}px ${ly.toFixed(0)}px, #000 ${R.toFixed(0)}px, transparent ${(R + 50).toFixed(0)}px)`;
      sharp.style.webkitMaskImage = sharp.style.maskImage = mask;
      look(blur, 1 - prog(t, tin + 1.3, tin + 1.7));
      look(ring, (1 - prog(t, tin + 1.2, tin + 1.45)) * prog(t, tin + .1, tin + .25), `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) translate(-50%,-50%)`);
    },
  };
}

function discoverReel(hud, mark, cards) {
  const DUR = 20.0, acc = C.stages[0];
  hud.style.setProperty('--acc', acc);
  const world = h('div', 'world', hud);
  const intro = Hook(world, mark);
  const num = Backdrop(hud, '01');
  const tag = h('div', 'ep-tag', hud, `<b></b>Refract Tech · Step 01 / 06`);
  const q1 = Lines(hud, ['Have a business idea', '*but no clear plan?*'], { y: 760 });
  const fam = Lines(hud, ['Sound *familiar?*'], { y: 300, size: 84 });
  const plan = h('div', 'plan', hud, `<div class="plan-h"><span>Your discovery plan</span><em>Step 01</em></div>`);
  const planLine = Lines(hud, ['We turn the chaos into', '*a clear, scoped plan.*'], { y: 300, size: 78 });
  const notes = CHAOS.map(([q, a, x, y, r], i) => Note(hud, q, a, x, y, r, i));
  const SNAP = CHAOS.map((_, i) => 7.7 + i * .25), CHAOS_IN = CHAOS.map((_, i) => 4.75 + i * .16);
  const label = h('div', 'ep-label', hud, 'Step 01 · Discover');
  const msg = Lines(hud, ['Goals, users and', '*a prioritised roadmap.*'], { y: 330, size: 80 });
  const card = StageCard(hud, cards[0], acc);
  const lens = Lens(hud, ['Clarity first.', '*Then we build.*'], 780);
  const scan = h('div', 'scan', hud);
  const end = Closing(hud, ['Got an idea?', "*Let's talk.*"]);
  const CARD = 10.05;
  return {
    DUR, focus: t => intro.focus(t),
    events: { lock: [intro.LOCK], tick: [2.65], swirl: [4.7], riser: [[6.3, 7.2]], drop: [7.2], snaps: SNAP, whoosh: [CARD], zoom: [11.25], shimmer: [13.75], end: [16.0] },
    update(t) {
      intro.update(t);
      num.update(t, 2.6, 7.2);
      look(tag, prog(t, 2.6, 2.9) * (1 - prog(t, 4.55, 4.75)), `translateY(${((1 - ease.outCubic(prog(t, 2.6, 3.0))) * -24).toFixed(1)}px)`);
      q1.update(t, 2.65, 4.6);
      fam.update(t, 4.85, 7.15);
      // the plan board: its frame draws in on the drop, the notes fly into its rows
      const pk = spring(t, 7.25, 1.4, .75), po = ease.inCubic(prog(t, 9.75, 10.1));
      look(plan, clamp(pk * 2) * (1 - po), `translateY(${((1 - pk) * 80 - po * 60).toFixed(1)}px) scale(${(.94 + .06 * clamp(pk)).toFixed(3)})`);
      planLine.update(t, 7.3, 9.95);
      notes.forEach((n, i) => n.update(t, CHAOS_IN[i], SNAP[i], 9.75));
      const sc = prog(t, 7.15, 7.75);
      look(scan, sc > 0 && sc < 1 ? Math.sin(Math.PI * sc) : 0, `translateY(${(520 + sc * 1000).toFixed(1)}px)`);
      // the site's Discover card, and a dive into its goals
      const lk = ease.outExpo(prog(t, CARD, CARD + .6));
      look(label, lk * (1 - prog(t, 13.35, 13.6)), `translateY(${((1 - lk) * 16).toFixed(1)}px)`);
      label.style.letterSpacing = `${(.26 + (1 - lk) * .25).toFixed(3)}em`;
      msg.update(t, CARD + .3, 13.5);
      card.update(t, CARD + .15, 13.55);
      const z = track(t, [[11.2, 0], [11.75, 1, ease.inOutCubic], [12.75, 1], [13.2, 0, ease.inOutCubic]]);
      card.zoom(z);
      lens.update(t, 13.7, 15.95);
      end.update(t, 16.0);
    },
  };
}

// ------------------------------------------------------------------ The Padel Lounge × Refract Tech
// A case study: the website Refract Tech designed and built for The Padel Lounge (tplrachaya.com).
// Its real pages, logo and venue photos, with the booking flow acted out on screen.
const PAD = { orange: '#C96A17', cream: '#F4F1EC', navy: '#0B1526', blue: '#2647A6', lime: '#D8EA48' };

/** A finger tap: a soft dot that glides between points and presses. */
function Touch(parent) {
  const el = h('div', 'touch', parent), ring = h('div', 'touch-ring', parent);
  return {
    update(t, path, taps) {
      if (!path || t < path[0][0] || t > path[path.length - 1][0]) { el.style.display = ring.style.display = 'none'; return; }
      el.style.display = ring.style.display = '';
      const [x, y, o] = track(t, path.map(([tt, ...v]) => [tt, v, ease.inOutCubic]));
      let press = 0, r = -1, rp = [x, y];
      for (const c of taps) { press = Math.max(press, bump(t, c - .06, c + .16)); if (t >= c && t < c + .45) { r = prog(t, c, c + .45); rp = track(c, path.map(([tt, ...v]) => [tt, v, ease.inOutCubic])); } }
      look(el, o, `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) scale(${(1 - .25 * press).toFixed(3)})`);
      look(ring, r < 0 ? 0 : (1 - r) * o, `translate(${rp[0].toFixed(1)}px,${rp[1].toFixed(1)}px) translate(-50%,-50%) scale(${(.4 + 1.4 * Math.max(r, 0)).toFixed(3)})`);
    },
  };
}

function padelReel(hud, mark) {
  const DUR = 24.0;
  hud.style.setProperty('--acc', C.purple);
  const world = h('div', 'world', hud);
  const intro = Hook(world, mark);

  // ---- 1 · the collaboration
  const caseLbl = h('div', 'ep-label', hud, 'Case study'); caseLbl.style.top = '470px';
  const rl = Logo(hud, 250);
  const tpl = h('div', 'tpl-mark', hud, `<img src="assets/padel/tpl-mark.png">`);
  const cross = h('div', 'cross', hud, `<svg viewBox="0 0 100 100" width="90" height="90"><path id="x1" d="M20 20L80 80" pathLength="1"/><path id="x2" d="M80 20L20 80" pathLength="1"/></svg>`);
  const x1 = cross.querySelector('#x1'), x2 = cross.querySelector('#x2');
  const collab = Lines(hud, ['Refract Tech ×', '*The Padel Lounge*'], { y: 1050, size: 92 });
  const sub = h('div', 'soon', hud, `<b></b>Website design &amp; development`);

  // ---- 2 · the question
  const q = Lines(hud, ['What if booking a court', '*took ten seconds?*'], { y: 760 });

  // ---- 3 · the website itself, in a phone, under the floodlights
  const meet = Lines(hud, ['Meet', '*The Padel Lounge.*'], { y: 250, size: 84 });
  // the home page section by section (each captured once it had animated in)
  const phone = h('div', 'pphone', hud, `<div class="pscr"><div class="pstrip">${['home-hero', 'home-court', 'home-experience', 'home-gallery', 'home-pricing'].map(n => `<img src="assets/padel/${n}.png">`).join('')}</div></div><span class="pnotch"></span>`);
  const page = phone.querySelector('.pstrip'), SEC = 548 * 2532 / 1170;
  const url = h('div', 'purl', hud, `${ICON.lock}<span>tplrachaya.com</span>`);
  const beams = [0, 1].map(i => h('div', 'beam beam' + i, hud));

  // ---- 4 · booking in three taps, acted out in the site's own style
  const bookH = Lines(hud, ['Booking in', '*three taps.*'], { y: 250, size: 84 });
  const DUR_CH = [['1 hour', '$20', '$15'], ['1.5 hours', '$25', '$20'], ['2 hours', '$30', '$25']];
  const DAYS = [['Today', 26], ['Fri', 27], ['Sat', 28], ['Sun', 29], ['Mon', 30]];
  const book = h('div', 'pbook', hud, `
    <div class="pb-top"><div><div class="pb-k">Book</div><div class="pb-h">Take the court</div></div><div class="pb-bell">${ICON.bell}<b>1</b></div></div>
    <div class="pb-k">How long?</div>
    <div class="pb-chips">${DUR_CH.map(([l, r, hh], i) => `<div class="pb-chip" id="pc${i}"><b>${l}</b><span>${r} regular</span><span class="hh">Happy ${hh}</span></div>`).join('')}</div>
    <div class="pb-price"><span class="pb-old">$25</span><span class="pb-now">$25</span><span class="pb-tag">Happy hour applied</span></div>
    <div class="pb-k">Which day?</div>
    <div class="pb-days">${DAYS.map(([d, n], i) => `<div class="pb-day" id="pd${i}"><small>${d}</small><b>${n}</b></div>`).join('')}</div>
    <div class="pb-btn"><span class="b1">Request the court</span><span class="b2"><i class="spin"></i>Awaiting confirmation</span></div>
    <div class="pb-note">Pay at the venue when you arrive.</div>
    <div class="pb-toast"><i>${ICON.check}</i><div><b>Booking confirmed</b><span>Fri 27 · 1.5 hours · $20</span></div></div>`);
  const $b = sel => book.querySelector(sel);
  const chips = [0, 1, 2].map(i => $b('#pc' + i)), days = [0, 1, 2, 3, 4].map(i => $b('#pd' + i));
  const old = $b('.pb-old'), now = $b('.pb-now'), tag = $b('.pb-tag'), b1 = $b('.b1'), b2 = $b('.b2'), bell = $b('.pb-bell'), badge = bell.querySelector('b'), toast = $b('.pb-toast'), btn = $b('.pb-btn');
  const touch = Touch(hud);

  // ---- 5 · what the site shows off, one at a time
  const featL = h('div', 'ep-label', hud, 'Built for the venue'); featL.style.top = '400px';
  const FEAT = [
    ['02-courtside-branding-beside-the-blue-court.jpg', ['Full panoramic', 'glass court'], 'Glass on every side, built to tournament spec.'],
    ['01-floodlit-entrance-with-neon-tpl-sign.jpg', ['Floodlit', 'until 3 AM'], '8 × 200W LED. Play under the lights.'],
    [null, ['Rewards that', 'bring players back'], 'Play 5 hours, unlock free court time.'],
  ];
  const feats = FEAT.map(([img, title, line], i) => {
    const el = h('div', 'pfeat', hud, `<div class="pf-pic">${img ? `<img src="assets/padel/${img}">` : `<svg viewBox="0 0 300 300" width="300" height="300"><circle cx="150" cy="150" r="118" stroke="rgba(247,245,255,.12)" stroke-width="22" fill="none"/><circle class="pf-ring" cx="150" cy="150" r="118" stroke="${PAD.lime}" stroke-width="22" fill="none" stroke-linecap="round" transform="rotate(-90 150 150)" stroke-dasharray="741.4"/><text x="150" y="150" text-anchor="middle" fill="#F7F5FF" font-size="86" font-weight="600" font-family="Albert Sans">5h</text><text x="150" y="196" text-anchor="middle" fill="${PAD.lime}" font-size="26" font-weight="600" font-family="Albert Sans" letter-spacing="3">FREE COURT</text></svg>`}<span class="pf-n">0${i + 1} / 03</span></div>
      <div class="pf-t">${title.map((t, j) => `<div class="o-row"><span${j ? ' class="lime"' : ''}>${t}</span></div>`).join('')}</div><div class="pf-l">${line}</div>`);
    return { el, img: el.querySelector('img'), ring: el.querySelector('.pf-ring'), rows: [...el.querySelectorAll('.o-row span')], line: el.querySelector('.pf-l') };
  });

  // ---- 6 · built by Refract
  const built = Lines(hud, ['Designed and built by', '*Refract Tech.*'], { y: 690 });
  const badgeR = h('div', 'pbuilt', hud, `<span>Built by</span><img src="assets/padel/refract.png">`);
  const live = h('div', 'site-pill', hud, `<span class="email-sheen"></span>tplrachaya.com<em class="live"><b></b>Live</em>`);
  const liveSheen = live.querySelector('.email-sheen');

  const end = Closing(hud, ['Want a website like this?', "*Let's talk.*"]);
  const T = { collab: 2.6, q: 4.9, site: 7.0, book: 10.0, feat: 13.7, built: 18.5, end: 20.4 };
  const TAPS = [10.65, 11.65, 12.2];
  const FEAT_AT = [13.8, 15.35, 16.9];
  return {
    DUR, focus: t => intro.focus(t),
    events: { lock: [intro.LOCK], collab: [3.25], tick: [T.q], ball: [6.95, 9.95, 18.45], tap: TAPS, bell: [12.85], item: FEAT_AT, end: [T.end] },
    update(t) {
      intro.update(t);
      // the collaboration: the two marks meet, an × draws between them
      const cIn = spring(t, 2.65, 1.3, .7), cOut = ease.inCubic(prog(t, 4.6, 4.9));
      const lk = ease.outExpo(prog(t, 2.7, 3.2));
      look(caseLbl, lk * (1 - cOut), `translateY(${((1 - lk) * 16).toFixed(1)}px)`);
      rl.update(t, 2.65, 4.85, lerp(-200, 300, clamp(cIn)) - cOut * 300, 800);
      look(tpl, clamp(cIn * 2) * (1 - cOut), `translate(${(lerp(1280, 780, clamp(cIn)) + cOut * 300).toFixed(1)}px,800px) translate(-50%,-50%) rotate(${((1 - clamp(cIn)) * 90).toFixed(1)}deg)`);
      look(cross, prog(t, 3.1, 3.2) * (1 - cOut), `translate(540px,800px) translate(-50%,-50%) scale(${(1 + .25 * bump(t, 3.2, 3.6)).toFixed(3)})`);
      x1.style.strokeDashoffset = (1 - tw(t, 3.1, 3.3)).toFixed(3); x2.style.strokeDashoffset = (1 - tw(t, 3.2, 3.4)).toFixed(3);
      collab.update(t, 3.3, 4.8);
      const sk = ease.outExpo(prog(t, 3.7, 4.2));
      look(sub, sk * (1 - cOut), `translate(540px,1300px) translate(-50%,-50%) translateY(${((1 - sk) * 20).toFixed(1)}px)`);
      // the question
      q.update(t, T.q, 6.85);
      // the website, scrolling under floodlights
      meet.update(t, 7.05, 9.85);
      const pk = spring(t, 7.0, 1.2, .75), po = ease.inCubic(prog(t, 9.7, 10.05));
      look(phone, clamp(pk * 2) * (1 - po), { y: (1 - pk) * 500 - po * 80, rx: (1 - clamp(pk)) * 20, ry: Math.sin(t * 1.2) * 4, s: (.9 + .1 * clamp(pk)) * (1 - .05 * po) });
      page.style.transform = `translateY(${(-track(t, [[7.85, 0], [8.45, SEC, ease.inOutCubic], [8.75, SEC], [9.45, SEC * 3, ease.inOutCubic]])).toFixed(1)}px)`;
      look(url, prog(t, 7.3, 7.6) * (1 - po), `translate(540px,486px) translate(-50%,-50%)`);
      beams.forEach((bm, i) => { const u = prog(t, 7.15 + i * .15, 8.6 + i * .15); look(bm, Math.sin(Math.PI * u) * .9, `rotate(${(i ? 1 : -1) * (35 - 50 * ease.inOutSine(u))}deg)`); });
      // booking
      bookH.update(t, T.book + .05, 13.55);
      const bk = spring(t, T.book, 1.25, .75), bo = ease.inCubic(prog(t, 13.45, 13.8));
      look(book, clamp(bk * 2) * (1 - bo), { y: (1 - bk) * 420 - bo * 80, rx: (1 - clamp(bk)) * 14, s: .92 + .08 * clamp(bk) });
      chips.forEach((c, i) => c.classList.toggle('on', i === 1 && t >= TAPS[0]));
      const pr = t < 10.95 ? 25 : Math.round(lerp(25, 20, tw(t, 10.95, 11.35)));
      now.textContent = '$' + pr; look(old, prog(t, 10.95, 11.1)); look(tag, prog(t, 11.2, 11.4), `scale(${(.8 + .2 * ease.outBack(prog(t, 11.2, 11.5))).toFixed(3)})`);
      days.forEach((d, i) => d.classList.toggle('on', i === 1 && t >= TAPS[1]));
      btn.classList.toggle('pressed', t >= TAPS[2]);
      look(b1, 1 - prog(t, TAPS[2], TAPS[2] + .12)); look(b2, prog(t, TAPS[2] + .08, TAPS[2] + .2));
      b2.querySelector('.spin').style.transform = `rotate(${(t * 520) % 360}deg)`;
      const rg = bump(t, 12.85, 13.4);
      bell.style.transform = `rotate(${(Math.sin((t - 12.85) * 40) * 18 * rg).toFixed(2)}deg)`;
      look(badge, prog(t, 12.85, 12.95), `scale(${ease.outBack(prog(t, 12.85, 13.1)).toFixed(3)})`);
      const tk = spring(t, 12.9, 1.6, .62);
      look(toast, clamp(tk * 2), `translateY(${((1 - tk) * -120).toFixed(1)}px)`);
      // the finger lands on the real controls: measured from the card's own layout
      if (!book.dataset.m) { book.dataset.m = 1; const c = el => [110 + el.offsetLeft + el.offsetWidth / 2, 520 + el.offsetTop + el.offsetHeight / 2]; book._pts = [c(chips[1]), c(days[1]), c(btn)]; }
      const [P1, P2, P3] = book._pts;
      touch.update(t, [[10.3, 980, 1700, 0], [10.55, ...P1, 1], [10.7, ...P1, 1], [11.5, ...P2, 1], [11.75, ...P2, 1], [12.05, ...P3, 1], [12.35, ...P3, 1], [12.6, 760, 1650, 0]], TAPS);
      // the venue, one feature at a time
      const fl = ease.outExpo(prog(t, T.feat, T.feat + .5));
      look(featL, fl * (1 - prog(t, 18.2, 18.45)), `translateY(${((1 - fl) * 16).toFixed(1)}px)`);
      feats.forEach((f, i) => {
        const a = FEAT_AT[i], b = i < 2 ? FEAT_AT[i + 1] - .05 : 18.35;
        const on = t > a - .05 && t < b + .45; f.el.style.display = on ? '' : 'none'; if (!on) return;
        const k = spring(t, a, 1.3, .74), e = ease.inCubic(prog(t, b - .05, b + .4));
        look(f.el, clamp(k * 2) * (1 - e), { x: (1 - k) * 760 - e * 760, ry: (1 - k) * -34 + e * 34, s: .92 + .08 * clamp(k) });
        if (f.img) f.img.style.transform = `scale(${(1.12 - .1 * prog(t, a, b + .4)).toFixed(4)}) translateX(${(-12 * prog(t, a, b)).toFixed(1)}px)`;
        if (f.ring) f.ring.style.strokeDashoffset = (741.4 * (1 - tw(t, a + .3, a + 1.2, ease.outCubic))).toFixed(1);
        f.rows.forEach((r, j) => { const s0 = a + .3 + j * .1, qq = ease.outExpo(prog(t, s0, s0 + .7)); look(r, Math.min(1, qq * 1.5), `translateY(${((1 - qq) * 105).toFixed(1)}%)`, (1 - qq) * 6); });
        const lq = ease.outExpo(prog(t, a + .55, a + 1.1)); look(f.line, lq, `translateY(${((1 - lq) * 20).toFixed(1)}px)`);
      });
      // built by Refract, with the credit from the site's own footer
      built.update(t, T.built, 20.25);
      const bb = ease.outExpo(prog(t, 18.9, 19.5)), bOut = prog(t, 20.05, 20.3);
      look(badgeR, bb * (1 - bOut), `translate(540px,1000px) translate(-50%,-50%) translateY(${((1 - bb) * 30).toFixed(1)}px)`);
      const lv = spring(t, 19.2, 1.5, .62);
      look(live, clamp(lv * 2) * (1 - bOut), `translate(540px,1160px) translate(-50%,-50%) scale(${(.8 + .2 * lv).toFixed(3)})`);
      liveSheen.style.transform = `translateX(${(-160 + prog(t, 19.5, 20.2) * 520).toFixed(1)}%)`;
      end.update(t, T.end);
    },
  };
}

// ------------------------------------------------------------------ 60 Days Challenge × Refract Tech
// A case study of the training app Refract Tech built for Eagle Strength's 60 Days Challenge:
// the real app (run with a made-up demo squad), the one-tap check-in, its features, and a new,
// calmer ending: the app's screens become a wall that recedes into the dark and the logo rises.
const CH = { gold: '#F6B912', red: '#E3261C', ink: '#0B0B0C', cream: '#F2EFE7' };

/** The new close: a wall of the app's screens recedes, the logo rises out of the light, the email arrives. */
function Finale(parent, tiles, heading) {
  const root = h('div', 'fin', parent);
  const wall = h('div', 'fin-wall', root, tiles.map(([src, pos]) => `<div class="fin-tile" style="background-image:url(${src});background-position:${pos}"></div>`).join(''));
  const cells = [...wall.children];
  const light = h('div', 'fin-light', root);
  const logo = Logo(root, 300);
  const head = Lines(root, heading, { y: 800, size: 100 });
  const pill = h('div', 'email', root, `<span class="email-sheen"></span><i>${ICON.mail}</i><span class="e-txt"></span>`);
  const txt = pill.querySelector('.e-txt'), pSheen = pill.querySelector('.email-sheen');
  const soon = h('div', 'soon', root, `<b></b>refract-tech.com · launching soon`);
  const veil = h('div', 'fin-veil', root);
  return {
    root,
    update(t, tin, tout) {
      const on = t > tin - .05; root.style.display = on ? '' : 'none'; if (!on) return;
      // the wall: tiles land in a grid, tilt back and recede while a light opens behind them
      const pull = tw(t, tin + .45, tin + 1.6, ease.inOutCubic);
      look(wall, 1 - tw(t, tin + 1.1, tin + 1.6), `translate(540px,900px) translate(-50%,-50%) perspective(1800px) rotateX(${(10 + 26 * pull).toFixed(2)}deg) rotateZ(${(-6 * pull).toFixed(2)}deg) translateZ(${(-1600 * pull).toFixed(1)}px)`);
      cells.forEach((c, i) => { const k = spring(t, tin + i * .06, 1.6, .7); look(c, clamp(k * 2), `translateY(${((1 - k) * 260).toFixed(1)}px) scale(${(.8 + .2 * clamp(k)).toFixed(3)})`); });
      look(light, tw(t, tin + .5, tin + 1.3) * (1 - .45 * tw(t, tin + 1.8, tin + 2.6)), `translate(540px,560px) translate(-50%,-50%) scale(${(.4 + .8 * tw(t, tin + .5, tin + 1.6, ease.outCubic)).toFixed(3)})`);
      // the logo rises out of that light, then everything settles and breathes
      logo.update(t, tin + 1.05, 99, 540, 560 + 40 * (1 - tw(t, tin + 1.05, tin + 1.9, ease.outCubic)));
      head.update(t, tin + 1.45, 99);
      const p = ease.outExpo(prog(t, tin + 1.85, tin + 2.5));
      look(pill, p, `translate(540px,1135px) translate(-50%,-50%) translateY(${((1 - p) * 30).toFixed(1)}px)`);
      const n = Math.round(prog(t, tin + 1.95, tin + 2.55) * 24);
      const full = 'refract@refract-tech.com'; if (txt.textContent.length !== n) txt.textContent = full.slice(0, n);
      pSheen.style.transform = `translateX(${(-160 + prog(t, tin + 2.7, tin + 3.3) * 520).toFixed(1)}%)`;
      const s = ease.outExpo(prog(t, tin + 2.4, tin + 2.9));
      look(soon, s, `translate(540px,1268px) translate(-50%,-50%) translateY(${((1 - s) * 16).toFixed(1)}px)`);
      // a slow fade to night at the very end, so the reel loops cleanly
      look(veil, tw(t, tout - .45, tout, ease.inOutSine) * .85);
    },
  };
}

function challengeReel(hud, mark) {
  const DUR = 24.5;
  hud.style.setProperty('--acc', CH.gold);
  const world = h('div', 'world', hud);
  const intro = Hook(world, mark);

  // ---- 1 · the collaboration
  const caseLbl = h('div', 'ep-label', hud, 'Case study'); caseLbl.style.top = '470px';
  const rl = Logo(hud, 250);
  const eagle = h('div', 'eagle-mark', hud, `<img src="assets/challenge/eagle.png">`);
  const cross = h('div', 'cross', hud, `<svg viewBox="0 0 100 100" width="90" height="90"><path id="cx1" d="M20 20L80 80" pathLength="1"/><path id="cx2" d="M80 20L20 80" pathLength="1"/></svg>`);
  const x1 = cross.querySelector('#cx1'), x2 = cross.querySelector('#cx2');
  const collab = Lines(hud, ['Refract Tech ×', '*60 Days Challenge*'], { y: 1050, size: 92 });
  const sub = h('div', 'soon', hud, `<b></b>Web app design &amp; development`);

  // ---- 2 · the question
  const q = Lines(hud, ['Can a whole squad', '*stay on track for 60 days?*'], { y: 760 });

  // ---- 3 · the app, in a phone
  const meet = Lines(hud, ['Meet the', '*60 Days Challenge.*'], { y: 250, size: 84 });
  const phone = h('div', 'pphone ch-phone', hud, `<div class="pscr"><img src="assets/challenge/full.png"></div><span class="pnotch"></span>`);
  const page = phone.querySelector('img');
  const embers = Array.from({ length: 14 }, (_, i) => h('div', 'ember', hud));

  // ---- 4 · one tap, day done
  const tapH = Lines(hud, ['One tap.', '*Day done.*'], { y: 250, size: 96 });
  const mission = h('div', 'ch-mission', hud, `<img class="m0" src="assets/challenge/mission.png"><img class="m1" src="assets/challenge/mission-done.png"><span class="m-flash"></span>`);
  const m1 = mission.querySelector('.m1'), mflash = mission.querySelector('.m-flash');
  const sparks = Array.from({ length: 18 }, () => h('div', 'spark-g', hud));
  const liveP = h('div', 'ch-live', hud, `<b></b>The whole squad sees it, live`);
  const touch = Touch(hud);

  // ---- 5 · features, one at a time
  const featL = h('div', 'ep-label', hud, 'Built for the squad'); featL.style.top = '400px';
  const FEAT = [
    ['board.png', '0 -10px', ['Live squad', 'board'], "Everyone sees everyone's progress."],
    ['phases.png', '0 -150px', ['A plan for', 'every day'], 'Runs, pushups and hikes, all 60 days.'],
    ['coach.png', '0 -10px', ['Coach in', 'control'], 'Approves athletes, assigns their level.'],
  ];
  const feats = FEAT.map(([img, pos, title, line], i) => {
    const el = h('div', 'pfeat ch-feat', hud, `<div class="pf-pic" style="background-image:url(assets/challenge/${img});background-position:${pos}"><span class="pf-n">0${i + 1} / 03</span></div>
      <div class="pf-t">${title.map((t, j) => `<div class="o-row"><span${j ? ' class="gold"' : ''}>${t}</span></div>`).join('')}</div><div class="pf-l">${line}</div>`);
    return { el, pic: el.querySelector('.pf-pic'), rows: [...el.querySelectorAll('.o-row span')], line: el.querySelector('.pf-l') };
  });

  // ---- 6 · built by Refract
  const built = Lines(hud, ['Designed and built by', '*Refract Tech.*'], { y: 690 });
  const live = h('div', 'site-pill', hud, `<span class="email-sheen"></span>60 Days Challenge<em class="live gold"><b></b>Live</em>`);
  const liveSheen = live.querySelector('.email-sheen');

  const end = Finale(hud, [['assets/challenge/top.png', '0 0'], ['assets/challenge/mission-done.png', '0 0'], ['assets/challenge/board.png', '0 0'],
    ['assets/challenge/coach.png', '0 0'], ['assets/challenge/phases.png', '0 -150px'], ['assets/challenge/poster.jpg', 'center']], ['Have an idea worth building?', "*Let's talk.*"]);
  const T = { collab: 2.6, q: 4.9, app: 7.0, tap: 10.0, feat: 13.7, built: 18.5, end: 20.4 };
  const TAP = 10.95, FEAT_AT = [13.8, 15.35, 16.9];
  return {
    DUR, focus: t => intro.focus(t),
    events: { lock: [intro.LOCK], collab: [3.25], tick: [T.q], whoosh: [6.95, 9.95, 18.45], drop: [TAP], item: FEAT_AT, finale: [T.end], rise: [T.end + 1.05] },
    update(t) {
      intro.update(t);
      // the collaboration
      const cIn = spring(t, 2.65, 1.3, .7), cOut = ease.inCubic(prog(t, 4.6, 4.9));
      const lk = ease.outExpo(prog(t, 2.7, 3.2));
      look(caseLbl, lk * (1 - cOut), `translateY(${((1 - lk) * 16).toFixed(1)}px)`);
      rl.update(t, 2.65, 4.85, lerp(-200, 300, clamp(cIn)) - cOut * 300, 800);
      look(eagle, clamp(cIn * 2) * (1 - cOut), `translate(${(lerp(1280, 780, clamp(cIn)) + cOut * 300).toFixed(1)}px,800px) translate(-50%,-50%) rotate(${((1 - clamp(cIn)) * 90).toFixed(1)}deg)`);
      look(cross, prog(t, 3.1, 3.2) * (1 - cOut), `translate(540px,800px) translate(-50%,-50%) scale(${(1 + .25 * bump(t, 3.2, 3.6)).toFixed(3)})`);
      x1.style.strokeDashoffset = (1 - tw(t, 3.1, 3.3)).toFixed(3); x2.style.strokeDashoffset = (1 - tw(t, 3.2, 3.4)).toFixed(3);
      collab.update(t, 3.3, 4.8);
      const sk = ease.outExpo(prog(t, 3.7, 4.2));
      look(sub, sk * (1 - cOut), `translate(540px,1300px) translate(-50%,-50%) translateY(${((1 - sk) * 20).toFixed(1)}px)`);
      q.update(t, T.q, 6.85);
      // the app
      meet.update(t, 7.05, 9.85);
      const pk = spring(t, 7.0, 1.2, .75), po = ease.inCubic(prog(t, 9.7, 10.05));
      look(phone, clamp(pk * 2) * (1 - po), { y: (1 - pk) * 500 - po * 80, rx: (1 - clamp(pk)) * 20, ry: Math.sin(t * 1.2) * 4, s: (.9 + .1 * clamp(pk)) * (1 - .05 * po) });
      page.style.transform = `translateY(${(-track(t, [[7.85, 0], [8.5, 820, ease.inOutCubic], [8.8, 820], [9.45, 1900, ease.inOutCubic]])).toFixed(1)}px)`;
      embers.forEach((e, i) => { const u = ((t - 7 + i * .37) % 2.4) / 2.4, on = t > 7.0 && t < 10.0; look(e, on ? Math.sin(Math.PI * u) * .8 : 0, `translate(${(140 + (i * 137) % 800 + Math.sin(t * 2 + i) * 20).toFixed(1)}px,${(1650 - u * 1100).toFixed(1)}px) scale(${(.5 + (i % 3) * .3).toFixed(2)})`); });
      // one tap
      tapH.update(t, T.tap + .05, 13.55);
      const mk = spring(t, T.tap, 1.25, .75), mo = ease.inCubic(prog(t, 13.45, 13.8));
      look(mission, clamp(mk * 2) * (1 - mo), { y: (1 - mk) * 420 - mo * 80, rx: (1 - clamp(mk)) * 14, s: (.92 + .08 * clamp(mk)) * (1 + .03 * bump(t, TAP, TAP + .4)) });
      look(m1, prog(t, TAP + .02, TAP + .14)); look(mflash, bump(t, TAP, TAP + .45) * .7);
      sparks.forEach((sp, i) => { const a = (i / sparks.length) * Math.PI * 2, u = prog(t, TAP, TAP + .8), r = ease.outCubic(u) * (180 + (i % 4) * 50); look(sp, u > 0 && u < 1 ? 1 - u : 0, `translate(${(390 + Math.cos(a) * r * 1.4).toFixed(1)}px,${(990 + Math.sin(a) * r).toFixed(1)}px) translate(-50%,-50%) scale(${(1 - u * .6).toFixed(3)})`); });
      const lv0 = spring(t, TAP + .45, 1.5, .62);
      look(liveP, clamp(lv0 * 2) * (1 - mo), `translate(540px,1395px) translate(-50%,-50%) scale(${(.8 + .2 * lv0).toFixed(3)})`);
      if (!mission.dataset.m) { mission.dataset.m = 1; }
      touch.update(t, [[10.35, 980, 1700, 0], [10.8, 390, 990, 1], [11.05, 390, 990, 1], [11.35, 760, 1650, 0]], [TAP]);
      // features
      const fl = ease.outExpo(prog(t, T.feat, T.feat + .5));
      look(featL, fl * (1 - prog(t, 18.2, 18.45)), `translateY(${((1 - fl) * 16).toFixed(1)}px)`);
      feats.forEach((f, i) => {
        const a = FEAT_AT[i], b = i < 2 ? FEAT_AT[i + 1] - .05 : 18.35;
        const on = t > a - .05 && t < b + .45; f.el.style.display = on ? '' : 'none'; if (!on) return;
        const k = spring(t, a, 1.3, .74), e = ease.inCubic(prog(t, b - .05, b + .4));
        look(f.el, clamp(k * 2) * (1 - e), { x: (1 - k) * 760 - e * 760, ry: (1 - k) * -34 + e * 34, s: .92 + .08 * clamp(k) });
        f.pic.style.backgroundSize = `${(860 * (1.06 - .06 * prog(t, a, b + .4))).toFixed(1)}px auto`;
        f.rows.forEach((r, j) => { const s0 = a + .3 + j * .1, qq = ease.outExpo(prog(t, s0, s0 + .7)); look(r, Math.min(1, qq * 1.5), `translateY(${((1 - qq) * 105).toFixed(1)}%)`, (1 - qq) * 6); });
        const lq = ease.outExpo(prog(t, a + .55, a + 1.1)); look(f.line, lq, `translateY(${((1 - lq) * 20).toFixed(1)}px)`);
      });
      // built by
      built.update(t, T.built, 20.25);
      const lv = spring(t, 18.95, 1.5, .62), bOut = prog(t, 20.05, 20.3);
      look(live, clamp(lv * 2) * (1 - bOut), `translate(540px,1010px) translate(-50%,-50%) scale(${(.8 + .2 * lv).toFixed(3)})`);
      liveSheen.style.transform = `translateX(${(-160 + prog(t, 19.3, 20.1) * 520).toFixed(1)}%)`;
      end.update(t, T.end, DUR);
    },
  };
}

// ------------------------------------------------------------------ The Padel Lounge × Refract Tech, v2
// Longer and smoother: straight into the collaboration over a court drawing itself, a padel ball
// and racket that carry the cuts, the site and its booking flow, the venue's admin dashboard
// (rebuilt from the site's own code: requests, the day's schedule, the rewards ladder), the venue,
// and the receding-wall close.
const BALL = `<svg viewBox="0 0 100 100" width="96" height="96"><defs><radialGradient id="bg1" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#F8FF9E"/><stop offset=".55" stop-color="#D8EA48"/><stop offset="1" stop-color="#9DB21E"/></radialGradient></defs>
  <circle cx="50" cy="50" r="46" fill="url(#bg1)"/><path d="M12 30C34 40 34 60 12 72M88 28C66 40 66 60 88 70" stroke="#FFFFF0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/></svg>`;
const RACKET = `<svg viewBox="0 0 220 420" width="220" height="420"><defs><linearGradient id="rk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2A04A"/><stop offset=".5" stop-color="#E8822C"/><stop offset="1" stop-color="#8F4A0E"/></linearGradient></defs>
  <path d="M110 8C170 8 210 52 210 112C210 176 170 232 132 252L126 300H94L88 252C50 232 10 176 10 112C10 52 50 8 110 8Z" fill="url(#rk)"/>
  <path d="M110 22C162 22 196 60 196 112C196 168 162 218 110 236C58 218 24 168 24 112C24 60 58 22 110 22Z" fill="none" stroke="#FFD9A8" stroke-width="3" opacity=".55"/>
  ${Array.from({ length: 26 }, (_, i) => { const r = Math.floor(i / 5), c = i % 5; const x = 54 + c * 28 + (r % 2) * 14, y = 64 + r * 30; return x < 176 ? `<circle cx="${x}" cy="${y}" r="7" fill="#3a1d05" opacity=".75"/>` : ''; }).join('')}
  <rect x="92" y="296" width="36" height="118" rx="12" fill="#1a1410"/>${[0, 1, 2, 3, 4].map(i => `<path d="M92 ${312 + i * 20}L128 ${304 + i * 20}" stroke="#E8822C" stroke-width="5"/>`).join('')}</svg>`;

/** A padel ball with a short motion trail; pose(t) gives {x, y, s, o} or null. */
function Ball(parent) {
  const ghosts = [5, 4, 3, 2, 1].map(k => { const g = h('div', 'ball ghost', parent, BALL); g.dataset.k = k; return g; });
  const el = h('div', 'ball', parent, BALL);
  return {
    update(t, pose) {
      const show = (g, p, o) => { if (!p) { g.style.display = 'none'; return; } g.style.display = ''; look(g, (p.o ?? 1) * o, `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-50%) rotate(${((p.r ?? t * 720) % 360).toFixed(1)}deg) scale(${(p.s ?? 1).toFixed(3)})`); };
      show(el, pose(t), 1);
      ghosts.forEach(g => { const k = +g.dataset.k; show(g, pose(t - k * .022), .32 - k * .055); });
    },
  };
}
/** The racket, swinging about its handle. */
function Racket(parent) {
  const el = h('div', 'racket', parent, RACKET);
  return { update(t, p) { if (!p) { el.style.display = 'none'; return; } el.style.display = ''; look(el, p.o ?? 1, `translate(${p.x}px,${p.y}px) translate(-50%,-90%) rotate(${p.r.toFixed(2)}deg) scale(${(p.s ?? 1).toFixed(3)})`); } };
}
/** A padel court seen from above, its lines drawing themselves. */
function Court(parent) {
  const el = h('div', 'court', parent, `<svg viewBox="0 0 400 800" width="760" height="1520" fill="none" stroke="#F7F5FF" stroke-width="4" stroke-linecap="round">
    <rect class="cl" x="20" y="20" width="360" height="760" pathLength="1"/><path class="cl" d="M20 400H380" pathLength="1" stroke-width="7" stroke="#D8EA48"/>
    <path class="cl" d="M20 140H380M20 660H380M200 140V660" pathLength="1"/></svg>`);
  const lines = [...el.querySelectorAll('.cl')];
  return {
    update(t, a, b, o = 1) {
      const on = t > a - .05 && t < b + .4; el.style.display = on ? '' : 'none'; if (!on) return;
      look(el, prog(t, a, a + .25) * (1 - prog(t, b - .3, b + .2)) * o, `translate(540px,960px) translate(-50%,-50%) perspective(1600px) rotateX(${(52 + 4 * Math.sin(t * .8)).toFixed(2)}deg) scale(${(1.25 + .05 * prog(t, a, b)).toFixed(3)})`);
      lines.forEach((l, i) => { l.style.strokeDasharray = '1'; l.style.strokeDashoffset = (1 - tw(t, a + i * .08, a + .45 + i * .08, ease.outCubic)).toFixed(3); });
    },
  };
}
/** a parabola-ish flight between two points, with an apex height */
const arc = (t, t0, t1, [x0, y0], [x1, y1], hgt) => { const u = (t - t0) / (t1 - t0); return { x: lerp(x0, x1, u), y: lerp(y0, y1, u) - Math.sin(Math.PI * u) * hgt }; };

function padelReel2(hud) {
  const DUR = 31.5;
  hud.style.setProperty('--acc', PAD.orange);
  const court = Court(hud);
  const ball = Ball(hud), racket = Racket(hud);

  // ---- 1 · straight in: the collaboration
  const rl = Logo(hud, 250);
  const tpl = h('div', 'tpl-mark', hud, `<img src="assets/padel/tpl-mark-centered.png">`);
  const flash = h('div', 'pflash', hud);
  const cross = h('div', 'cross', hud, `<svg viewBox="0 0 100 100" width="90" height="90"><path id="px1" d="M20 20L80 80" pathLength="1"/><path id="px2" d="M80 20L20 80" pathLength="1"/></svg>`);
  const x1 = cross.querySelector('#px1'), x2 = cross.querySelector('#px2');
  const collab = Lines(hud, ['Refract Tech ×', '*The Padel Lounge*'], { y: 1050, size: 92 });
  const sub = h('div', 'soon', hud, `<b></b>Website · Booking · Admin dashboard`);

  // ---- 2 · the question
  const q = Lines(hud, ['What if booking a court', '*took ten seconds?*'], { y: 760 });

  // ---- 3 · the website, under the floodlights
  const meet = Lines(hud, ['Meet', '*The Padel Lounge.*'], { y: 250, size: 84 });
  const phone = h('div', 'pphone', hud, `<div class="pscr"><div class="pstrip">${['home-hero', 'home-court', 'home-experience', 'home-gallery', 'home-pricing'].map(n => `<img src="assets/padel/${n}.png">`).join('')}</div></div><span class="pnotch"></span>`);
  const page = phone.querySelector('.pstrip'), SEC = 548 * 2532 / 1170;
  const url = h('div', 'purl', hud, `${ICON.lock}<span>tplrachaya.com</span>`);
  const beams = [0, 1].map(i => h('div', 'beam beam' + i, hud));

  // ---- 4 · booking in three taps
  const bookH = Lines(hud, ['Booking in', '*three taps.*'], { y: 250, size: 84 });
  const DUR_CH = [['1 hour', '$20', '$15'], ['1.5 hours', '$25', '$20'], ['2 hours', '$30', '$25']];
  const DAYS = [['Today', 26], ['Fri', 27], ['Sat', 28], ['Sun', 29], ['Mon', 30]];
  const book = h('div', 'pbook', hud, `
    <div class="pb-top"><div><div class="pb-k">Book</div><div class="pb-h">Take the court</div></div><div class="pb-bell">${ICON.bell}<b>1</b></div></div>
    <div class="pb-k">How long?</div>
    <div class="pb-chips">${DUR_CH.map(([l, r, hh], i) => `<div class="pb-chip" id="qc${i}"><b>${l}</b><span>${r} regular</span><span class="hh">Happy ${hh}</span></div>`).join('')}</div>
    <div class="pb-price"><span class="pb-old">$25</span><span class="pb-now">$25</span><span class="pb-tag">Happy hour applied</span></div>
    <div class="pb-k">Which day?</div>
    <div class="pb-days">${DAYS.map(([d, n], i) => `<div class="pb-day" id="qd${i}"><small>${d}</small><b>${n}</b></div>`).join('')}</div>
    <div class="pb-btn"><span class="b1">Request the court</span><span class="b2"><i class="spin"></i>Awaiting confirmation</span></div>
    <div class="pb-note">Pay at the venue when you arrive.</div>
    <div class="pb-toast"><i>${ICON.check}</i><div><b>Booking confirmed</b><span>Fri 27 · 1.5 hours · $20</span></div></div>`);
  const $b = sel => book.querySelector(sel);
  const chips = [0, 1, 2].map(i => $b('#qc' + i)), days = [0, 1, 2, 3, 4].map(i => $b('#qd' + i));
  const old = $b('.pb-old'), now = $b('.pb-now'), tag = $b('.pb-tag'), b1 = $b('.b1'), b2 = $b('.b2'), bell = $b('.pb-bell'), badge = bell.querySelector('b'), toast = $b('.pb-toast'), btn = $b('.pb-btn');
  const touch = Touch(hud);

  // ---- 5 · the venue's admin dashboard
  const adminH = Lines(hud, ['And a dashboard', '*for the venue.*'], { y: 250, size: 84 });
  const SLOTS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];
  const BOOKED = [1, 4, 6, 7, 9, 10, 13], BLOCKED = [3], HAPPY = [0, 1, 2, 3, 4, 5, 12, 13, 14];
  const LADDER = [['Karim', 4.5, 5], ['Lea', 3, 3], ['Omar', 2.5, 2.5], ['Nour', 1.5, 1.5]];
  const admin = h('div', 'padm', hud, `
    <div class="pa-k">Admin</div><div class="pa-h">Court schedule</div>
    <div class="pa-tabs"><span class="pa-hl"></span>${['Schedule', 'Customers', 'Rewards', 'Prices'].map((s, i) => `<span class="pa-tab" id="pt${i}">${s}</span>`).join('')}</div>
    <div class="pa-view" id="pvA">
      <section class="pa-sec"><div class="pa-st">Requests <b class="pa-count">2</b></div>
        <div class="pa-req" id="rq0"><div><p class="pa-ref">TPL-4821</p><p class="pa-who">Karim · 1.5 hours</p><p class="pa-when">Fri 27 · 18:00 – 19:30 · $20</p></div>
          <div class="pa-act"><span class="pa-acc">Accept</span><span class="pa-dec">Decline</span><span class="pa-ok"><i>${ICON.check}</i>Confirmed</span></div></div>
        <div class="pa-req" id="rq1"><div><p class="pa-ref">TPL-4822</p><p class="pa-who">Lea · 1 hour</p><p class="pa-when">Sat 28 · 23:00 – 00:00 · $15</p></div>
          <div class="pa-act"><span class="pa-acc">Accept</span><span class="pa-dec">Decline</span></div></div>
      </section>
      <div class="pa-toast"><i>${ICON.check}</i><div><b>Karim notified on WhatsApp</b><span>Booking TPL-4821 confirmed</span></div></div>
    </div>
    <div class="pa-view" id="pvB">
      <section class="pa-sec"><div class="pa-st">Choose a day</div>
        <div class="pa-days">${DAYS.map(([d, n], i) => `<div class="pa-day${i === 1 ? ' on' : ''}"><small>${d}</small><b>${n}</b><small>Nov</small></div>`).join('')}</div></section>
      <section class="pa-sec"><div class="pa-st">Court hours · Fri 27</div>
        <div class="pa-grid">${SLOTS.map((s, i) => `<div class="pa-slot" id="sl${i}">${HAPPY.includes(i) ? '<em></em>' : ''}<b>${s}</b><small>${BLOCKED.includes(i) ? 'Blocked' : 'Free'}</small></div>`).join('')}</div>
        <div class="pa-legend"><span><i class="lf"></i>Free</span><span><i class="lb"></i>Booked</span><span><i class="lx"></i>Blocked</span><span><i class="lh"></i>Happy hour</span></div></section>
    </div>
    <div class="pa-view" id="pvC">
      <section class="pa-sec"><div class="pa-st">Rewards ladder</div><p class="pa-sub">Every 5 hours played unlocks a free hour.</p>
        ${LADDER.map(([n], i) => `<div class="pa-rung" id="rg${i}"><span class="pa-av">${n[0]}</span><div class="pa-rb"><div class="pa-rt"><b>${n}</b><span class="pa-hrs"></span></div><div class="pa-bar"><i></i></div></div><span class="pa-free">Free hour unlocked</span></div>`).join('')}
      </section>
    </div>`);
  const $a = sel => admin.querySelector(sel);
  const views = ['#pvA', '#pvB', '#pvC'].map($a), tabs = [0, 1, 2, 3].map(i => $a('#pt' + i)), hl = $a('.pa-hl');
  const rq0 = $a('#rq0'), acc0 = rq0.querySelector('.pa-acc'), dec0 = rq0.querySelector('.pa-dec'), ok0 = rq0.querySelector('.pa-ok'), count = $a('.pa-count'), aToast = $a('.pa-toast');
  const slots = SLOTS.map((_, i) => $a('#sl' + i)), rungs = LADDER.map((_, i) => $a('#rg' + i));

  // ---- 6 · the venue, one feature at a time
  const featL = h('div', 'ep-label', hud, 'Built for the venue'); featL.style.top = '400px';
  const FEAT = [
    ['02-courtside-branding-beside-the-blue-court.jpg', ['Full panoramic', 'glass court'], 'Glass on every side, built to tournament spec.'],
    ['01-floodlit-entrance-with-neon-tpl-sign.jpg', ['Floodlit', 'until 3 AM'], '8 × 200W LED. Play under the lights.'],
    [null, ['Happy hours,', 'priced automatically'], 'Quieter hours cost less, applied at booking.'],
  ];
  const feats = FEAT.map(([img, title, line], i) => {
    const el = h('div', 'pfeat', hud, `<div class="pf-pic">${img ? `<img src="assets/padel/${img}">` : `<div class="hh-card"><div class="hh-row"><span class="hh-old">$20</span><span class="hh-now">$20</span></div><div class="hh-when"><span>12 PM – 5:30 PM</span><span>11:30 PM – 3 AM</span></div></div>`}<span class="pf-n">0${i + 1} / 03</span></div>
      <div class="pf-t">${title.map((t, j) => `<div class="o-row"><span${j ? ' class="lime"' : ''}>${t}</span></div>`).join('')}</div><div class="pf-l">${line}</div>`);
    return { el, img: el.querySelector('img'), hhOld: el.querySelector('.hh-old'), hhNow: el.querySelector('.hh-now'), rows: [...el.querySelectorAll('.o-row span')], line: el.querySelector('.pf-l') };
  });

  // ---- 7 · built by Refract
  const built = Lines(hud, ['Designed and built by', '*Refract Tech.*'], { y: 690 });
  const badgeR = h('div', 'pbuilt', hud, `<span>Built by</span><img src="assets/padel/refract.png">`);
  const live = h('div', 'site-pill', hud, `<span class="email-sheen"></span>tplrachaya.com<em class="live"><b></b>Live</em>`);
  const liveSheen = live.querySelector('.email-sheen');

  // ---- 8 · the close
  const end = Finale(hud, [['assets/padel/home-hero.png', '0 0'], ['assets/padel/book.png', '0 0'], ['assets/padel/home-court.png', '0 0'],
    ['assets/padel/home-gallery.png', '0 0'], ['assets/padel/home-pricing.png', '0 0'], ['assets/padel/01-floodlit-entrance-with-neon-tpl-sign.jpg', 'center']], ['Want a website like this?', "*Let's talk.*"]);
  end.root.classList.add('fin-padel');

  const T = { q: 3.25, site: 5.4, book: 9.55, swing: 13.55, admin: 14.1, feat: 20.5, built: 25.3, end: 27.1 };
  const TAPS = [10.2, 11.2, 11.75], CONF = 12.4, ACCEPT = 15.45, FEAT_AT = [20.6, 22.15, 23.7];
  const BOUNCES = [3.62, 4.02, 4.38];
  const slotAt = i => 16.95 + BOOKED.indexOf(i) * .14;
  return {
    DUR,
    events: {
      pock: [.42, ...BOUNCES, 13.83], x: [.7], tick: [T.q], whoosh: [5.35, 9.5, 20.45, 25.25], tap: [...TAPS, ACCEPT], bell: [CONF], notify: [15.75],
      slots: BOOKED.map(slotAt), tab: [18.7], unlock: [19.45], item: FEAT_AT, end: [T.end], rise: [T.end + 1.05],
      sections: { groove: 2.9, site: T.site, book: T.book, admin: T.admin, feat: T.feat, built: T.built, end: T.end },
    },
    update(t) {
      // ---- the court draws itself; a ball drops in and bounces; the two marks burst out of the bounce
      court.update(t, 0, 3.2, .55);
      const cIn = spring(t, .45, 1.25, .72), cOut = ease.inCubic(prog(t, 2.95, 3.25));
      rl.update(t, .45, 3.2, lerp(540, 300, clamp(cIn)) - cOut * 300, 800);
      look(tpl, clamp(cIn * 2) * (1 - cOut), `translate(${(lerp(540, 780, clamp(cIn)) + cOut * 300).toFixed(1)}px,800px) translate(-50%,-50%) rotate(${((1 - clamp(cIn)) * -120).toFixed(1)}deg) scale(${(.4 + .6 * clamp(cIn)).toFixed(3)})`);
      look(flash, bump(t, .38, .75), `translate(540px,820px) translate(-50%,-50%) scale(${(.4 + 1.4 * prog(t, .38, .75)).toFixed(3)})`);
      look(cross, prog(t, .7, .8) * (1 - cOut), `translate(540px,800px) translate(-50%,-50%) scale(${(1 + .25 * bump(t, .8, 1.2)).toFixed(3)})`);
      x1.style.strokeDashoffset = (1 - tw(t, .7, .9)).toFixed(3); x2.style.strokeDashoffset = (1 - tw(t, .8, 1.0)).toFixed(3);
      collab.update(t, .9, 3.05);
      const sk = ease.outExpo(prog(t, 1.35, 1.85));
      look(sub, sk * (1 - cOut), `translate(540px,1300px) translate(-50%,-50%) translateY(${((1 - sk) * 20).toFixed(1)}px)`);

      // ---- the question, with the ball bouncing across it
      q.update(t, T.q, 5.3);
      // ---- the website
      meet.update(t, T.site + .05, 9.4);
      const pk = spring(t, T.site, 1.0, .8), po = ease.inOutCubic(prog(t, 9.15, 9.55));
      look(phone, clamp(pk * 2) * (1 - po), { y: (1 - pk) * 500 - po * 120, rx: (1 - clamp(pk)) * 18, ry: Math.sin(t * 1.1) * 3.5, s: (.9 + .1 * clamp(pk)) * (1 - .06 * po) });
      page.style.transform = `translateY(${(-track(t, [[6.3, 0], [6.95, SEC, ease.inOutCubic], [7.35, SEC], [8.05, SEC * 3, ease.inOutCubic], [8.45, SEC * 3], [9.0, SEC * 4, ease.inOutCubic]])).toFixed(1)}px)`;
      look(url, prog(t, 5.7, 6.0) * (1 - po), `translate(540px,486px) translate(-50%,-50%)`);
      beams.forEach((bm, i) => { const u = prog(t, 5.55 + i * .15, 7.3 + i * .15); look(bm, Math.sin(Math.PI * u) * .9, `rotate(${(i ? 1 : -1) * (35 - 50 * ease.inOutSine(u))}deg)`); });

      // ---- booking
      bookH.update(t, T.book + .05, 13.45);
      const bk = spring(t, T.book, 1.05, .8), bo = ease.inOutCubic(prog(t, 13.15, 13.6));
      look(book, clamp(bk * 2) * (1 - bo), { y: (1 - bk) * 420 - bo * 60, x: -bo * 120, rx: (1 - clamp(bk)) * 12, rz: -bo * 4, s: .92 + .08 * clamp(bk) });
      chips.forEach((c, i) => c.classList.toggle('on', i === 1 && t >= TAPS[0]));
      now.textContent = '$' + (t < 10.5 ? 25 : Math.round(lerp(25, 20, tw(t, 10.5, 10.9))));
      look(old, prog(t, 10.5, 10.65)); look(tag, prog(t, 10.75, 10.95), `scale(${(.8 + .2 * ease.outBack(prog(t, 10.75, 11.05))).toFixed(3)})`);
      days.forEach((d, i) => d.classList.toggle('on', i === 1 && t >= TAPS[1]));
      btn.classList.toggle('pressed', t >= TAPS[2]);
      look(b1, 1 - prog(t, TAPS[2], TAPS[2] + .12)); look(b2, prog(t, TAPS[2] + .08, TAPS[2] + .2));
      b2.querySelector('.spin').style.transform = `rotate(${(t * 520) % 360}deg)`;
      bell.style.transform = `rotate(${(Math.sin((t - CONF) * 40) * 18 * bump(t, CONF, CONF + .55)).toFixed(2)}deg)`;
      look(badge, prog(t, CONF, CONF + .1), `scale(${ease.outBack(prog(t, CONF, CONF + .25)).toFixed(3)})`);
      const tk = spring(t, CONF + .05, 1.4, .7); look(toast, clamp(tk * 2), `translateY(${((1 - tk) * -120).toFixed(1)}px)`);
      if (!book._pts) { const c = el => [110 + el.offsetLeft + el.offsetWidth / 2, 520 + el.offsetTop + el.offsetHeight / 2]; book._pts = [c(chips[1]), c(days[1]), c(btn)]; }
      // ---- the admin dashboard
      adminH.update(t, T.admin + .05, 20.3);
      const ak = spring(t, T.admin, 1.0, .8), ao = ease.inOutCubic(prog(t, 20.05, 20.5));
      look(admin, clamp(ak * 2) * (1 - ao), { x: (1 - ak) * 700, ry: (1 - ak) * -24, y: -ao * 60, s: (.94 + .06 * clamp(ak)) * (1 - .04 * ao) });
      const view = t < 16.6 ? 0 : t < 18.7 ? 1 : 2;
      views.forEach((v, i) => { const a = [T.admin, 16.6, 18.7][i], b = [16.6, 18.7, 99][i]; const k = ease.outCubic(prog(t, a, a + .4)), e = ease.inCubic(prog(t, b - .1, b + .2)); look(v, k * (1 - e), `translateY(${((1 - k) * 30 - e * 20).toFixed(1)}px)`); v.style.display = t > a - .05 && t < b + .25 ? '' : 'none'; });
      const tabX = [0, 0, 2][view], tk2 = spring(t, 18.7, 1.6, .7);
      if (!admin._tabs) admin._tabs = tabs.map(e => [e.offsetLeft, e.offsetWidth]);
      const [tx0, tw0] = admin._tabs[0], [tx2, tw2] = admin._tabs[2], m = view === 2 ? clamp(tk2) : 0;
      box(hl, lerp(tx0, tx2, m), tabs[0].offsetTop, lerp(tw0, tw2, m), tabs[0].offsetHeight);
      tabs.forEach((e, i) => e.classList.toggle('on', i === tabX));
      // requests: accept, notify
      look(acc0, 1 - prog(t, ACCEPT + .05, ACCEPT + .2)); look(dec0, 1 - prog(t, ACCEPT + .05, ACCEPT + .2)); look(ok0, prog(t, ACCEPT + .1, ACCEPT + .3));
      rq0.classList.toggle('done', t >= ACCEPT + .1);
      count.textContent = t < ACCEPT + .1 ? '2' : '1';
      look(count, 1, `scale(${(1 + .35 * bump(t, ACCEPT + .05, ACCEPT + .4)).toFixed(3)})`);
      const nt = spring(t, 15.75, 1.4, .72); look(aToast, clamp(nt * 2), `translateY(${((1 - nt) * 40).toFixed(1)}px)`);
      // schedule: the day fills in
      slots.forEach((sEl, i) => {
        const appear = ease.outBack(prog(t, 16.7 + i * .03, 17.0 + i * .03));
        const isB = BOOKED.includes(i);
        sEl.classList.toggle('booked', isB && t >= slotAt(i)); sEl.classList.toggle('blocked', BLOCKED.includes(i));
        look(sEl, prog(t, 16.7 + i * .03, 16.85 + i * .03), `scale(${((.7 + .3 * appear) * (1 + (isB ? .08 * bump(t, slotAt(i), slotAt(i) + .3) : 0))).toFixed(3)})`);
        if (isB) sEl.querySelector('small').textContent = t >= slotAt(i) ? 'Booked' : 'Free';
      });
      // rewards: the ladder fills; Karim reaches five hours
      rungs.forEach((r, i) => {
        const [, from, to] = LADDER[i];
        const fill = lerp(0, from, tw(t, 18.85 + i * .08, 19.25 + i * .08, ease.outCubic)) + (to - from) * tw(t, 19.3, 19.45);
        r.querySelector('.pa-bar i').style.transform = `scaleX(${(fill / 5).toFixed(3)})`;
        r.querySelector('.pa-hrs').textContent = `${fill.toFixed(1)} / 5 h`;
        look(r, prog(t, 18.8 + i * .08, 19.0 + i * .08), `translateX(${((1 - ease.outCubic(prog(t, 18.8 + i * .08, 19.2 + i * .08))) * 40).toFixed(1)}px)`);
        if (i === 0) { r.classList.toggle('won', t >= 19.45); look(r.querySelector('.pa-free'), prog(t, 19.45, 19.6), `scale(${ease.outBack(prog(t, 19.45, 19.75)).toFixed(3)})`); }
      });

      // ---- the finger, for the booking taps and the accept
      const AP = admin._accPt || (admin._accPt = (() => { const r = acc0; let x = 90, y = 470, e = r; while (e && e !== admin) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return [x + r.offsetWidth / 2, y + r.offsetHeight / 2]; })());
      const [P1, P2, P3] = book._pts;
      const path = t < 13 ? [[9.85, 980, 1700, 0], [10.1, ...P1, 1], [10.25, ...P1, 1], [11.05, ...P2, 1], [11.3, ...P2, 1], [11.6, ...P3, 1], [11.9, ...P3, 1], [12.15, 760, 1650, 0]]
        : [[15.0, 980, 1700, 0], [15.35, ...AP, 1], [15.6, ...AP, 1], [15.95, 760, 1650, 0]];
      touch.update(t, path, [...TAPS, ACCEPT]);

      // ---- the ball and racket, carrying the cuts
      ball.update(t, x => {
        if (x >= 0 && x < .42) return { ...arc(x, 0, .42, [880, 1700], [540, 820], 520), s: .9 };                       // dropped in, bounce
        if (x >= .42 && x < .9) return { ...arc(x, .42, .9, [540, 820], [540, 560], 120), s: 1 - .9 * prog(x, .6, .9), o: 1 - prog(x, .75, .9) };
        if (x >= 3.35 && x < BOUNCES[0]) return { ...arc(x, 3.35, BOUNCES[0], [-60, 500], [230, 700], 120), s: .7 };    // across the question
        if (x >= BOUNCES[0] && x < BOUNCES[1]) return { ...arc(x, BOUNCES[0], BOUNCES[1], [230, 700], [560, 700], 170), s: .7 };
        if (x >= BOUNCES[1] && x < BOUNCES[2]) return { ...arc(x, BOUNCES[1], BOUNCES[2], [560, 700], [860, 700], 140), s: .7 };
        if (x >= BOUNCES[2] && x < 4.9) return { ...arc(x, BOUNCES[2], 4.9, [860, 700], [1200, 420], 160), s: .7 };
        if (x >= 13.3 && x < 13.83) return { ...arc(x, 13.3, 13.83, [1140, 1300], [330, 980], 260), s: .9 };          // fed to the racket
        if (x >= 13.83 && x < 14.25) return { ...arc(x, 13.83, 14.25, [330, 980], [1250, 560], 120), s: .9 + .5 * prog(x, 13.83, 14.25) };
        return null;
      });
      const sw = tw(t, 13.6, 13.95, ease.inOutCubic), sOut = prog(t, 13.95, 14.25);
      racket.update(t, t > 13.45 && t < 14.3 ? { x: lerp(120, 250, sw), y: 1240, r: lerp(-70, 35, sw) + sOut * 20, o: prog(t, 13.45, 13.6) * (1 - sOut), s: 1.15 } : null);

      // ---- the venue
      const fl = ease.outExpo(prog(t, T.feat, T.feat + .5));
      look(featL, fl * (1 - prog(t, 25.0, 25.3)), `translateY(${((1 - fl) * 16).toFixed(1)}px)`);
      feats.forEach((f, i) => {
        const a = FEAT_AT[i], b = i < 2 ? FEAT_AT[i + 1] - .05 : 25.15;
        const on = t > a - .05 && t < b + .5; f.el.style.display = on ? '' : 'none'; if (!on) return;
        const k = spring(t, a, 1.1, .8), e = ease.inOutCubic(prog(t, b - .1, b + .45));
        look(f.el, clamp(k * 2) * (1 - e), { x: (1 - k) * 760 - e * 760, ry: (1 - k) * -30 + e * 30, s: .93 + .07 * clamp(k) });
        if (f.img) f.img.style.transform = `scale(${(1.12 - .1 * prog(t, a, b + .4)).toFixed(4)}) translateX(${(-12 * prog(t, a, b)).toFixed(1)}px)`;
        if (f.hhNow) { f.hhNow.textContent = '$' + Math.round(lerp(20, 15, tw(t, a + .5, a + .9))); look(f.hhOld, prog(t, a + .5, a + .65)); }
        f.rows.forEach((r, j) => { const s0 = a + .3 + j * .1, qq = ease.outExpo(prog(t, s0, s0 + .7)); look(r, Math.min(1, qq * 1.5), `translateY(${((1 - qq) * 105).toFixed(1)}%)`, (1 - qq) * 6); });
        const lq = ease.outExpo(prog(t, a + .55, a + 1.1)); look(f.line, lq, `translateY(${((1 - lq) * 20).toFixed(1)}px)`);
      });
      // ---- built by
      built.update(t, T.built, 27.0);
      const bb = ease.outExpo(prog(t, 25.7, 26.3)), bOut = prog(t, 26.8, 27.1);
      look(badgeR, bb * (1 - bOut), `translate(540px,1000px) translate(-50%,-50%) translateY(${((1 - bb) * 30).toFixed(1)}px)`);
      const lv = spring(t, 26.0, 1.4, .7);
      look(live, clamp(lv * 2) * (1 - bOut), `translate(540px,1160px) translate(-50%,-50%) scale(${(.8 + .2 * lv).toFixed(3)})`);
      liveSheen.style.transform = `translateX(${(-160 + prog(t, 26.2, 26.9) * 520).toFixed(1)}%)`;
      end.update(t, T.end, DUR);
    },
  };
}

// ------------------------------------------------------------------ build and render
async function paintCards() {
  const logo = await loadCardAssets();
  return ART_KEYS.map(key => {
    const cv = document.createElement('canvas'); cv.width = CARD_W * 2; cv.height = CARD_H * 2;
    const g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); paintCard(g, key, logo); return cv;
  });
}
const ep = new URLSearchParams(location.search).get('ep') || 'teaser';
const sky = Sky(document.getElementById('sky'));
window.ready = (async () => {
  await document.fonts.ready;
  const hud = document.getElementById('hud');
  const mark = new Image(); mark.src = 'assets/r-mark.png'; await mark.decode();
  const E = ep === 'teaser' ? teaser(hud, mark) : ep === 'discover' ? discoverReel(hud, mark, await paintCards()) : ep === 'padel' ? padelReel2(hud) : ep === 'padel-v1' ? padelReel(hud, mark) : ep === 'challenge' ? challengeReel(hud, mark) : stageEpisode(hud, ep, await paintCards());
  window.DURATION = E.DUR;
  window.EVENTS = { duration: E.DUR, ...E.events };
  window.render = t => {
    const f = E.focus && E.focus(t);
    sky.draw(t, f ? track(t, [[0, .1], [.5, .3], [1.3, .85], [2.6, 1]]) : 1, f || { x: 540, y: 980, r: 900, a: .32 + .08 * Math.sin(t * 1.1) });
    E.update(t);
  };
  await Promise.all([...document.images].map(i => (i.complete ? i.decode() : new Promise(r => { i.onload = r; i.onerror = r; }).then(() => i.decode())).catch(() => {})));
  window.render(0);
})();
