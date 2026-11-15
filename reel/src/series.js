// "Meet Refract Tech": short reels for Instagram that speak to business owners. A teaser, then one
// episode per stage of the process. Each asks the viewer a question about their website or their
// business, shows that stage's card from the website, and ends on the email address.
// Open series.html?ep=teaser | discover | design | build | connect | launch | evolve.
import { ART_KEYS, CARD_H, CARD_W, loadCardAssets, paintCard } from '../assets/cardArt-series.js';
import { bump, clamp, ease, h, look, prog, spring, track, tw } from './lib.js';
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
  const E = ep === 'teaser' ? teaser(hud, mark) : stageEpisode(hud, ep, await paintCards());
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
