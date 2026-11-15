// "Meet Refract Tech": short reels for Instagram that speak to business owners. A teaser, then one
// episode per stage of the process. Each asks the viewer a question about their website or their
// business, shows that stage's card from the website, and ends on the email address.
// Open series.html?ep=teaser | discover | design | build | connect | launch | evolve.
import { ART_KEYS, CARD_H, CARD_W, loadCardAssets, paintCard } from '../assets/cardArt-series.js';
import { bump, clamp, ease, h, look, prog, spring, tw } from './lib.js';
import { C, ICON, Sky } from './ui.js';

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

function teaser(hud) {
  const DUR = 12.0;
  hud.style.setProperty('--acc', C.purple);
  const mark = Backdrop(hud, 'R');
  const q1 = Lines(hud, ['Is your business', '*ready to grow online?*'], { y: 760 });
  const q2 = Lines(hud, ['Curious what', '*Refract Tech* does?'], { y: 760 });
  const what = h('div', 'ep-label', hud, 'What we build');
  const OFFER = [['globe', 'Business websites'], ['calendar', 'Booking and management systems'], ['grid', 'Custom SaaS platforms']];
  const pills = OFFER.map(([ic, s], i) => { const p = h('div', 'offer', hud, `<i>${ICON[ic]}</i><span>${s}</span>`); p.style.top = (680 + i * 200) + 'px'; return p; });
  const logo = Logo(hud, 240);
  const idea = Lines(hud, ['From idea', '*to a working product.*'], { y: 820 });
  const soon = Lines(hud, ['Our website is', '*launching soon.*'], { y: 600 });
  const site = h('div', 'site-pill', hud, `<span class="email-sheen"></span>refract-tech.com<em>Soon</em>`);
  const siteSheen = site.querySelector('.email-sheen');
  const end = EndCard(hud, ["Can't wait?", "*Let's talk.*"]);
  return {
    DUR,
    events: { tick: [.2, 2.7, 5.0, 7.4, 9.0], chime: [10.65], key: 6 },
    update(t) {
      mark.update(t, .1, 5.0);
      q1.update(t, .2, 2.55); q2.update(t, 2.7, 4.85);
      const wk = ease.outExpo(prog(t, 5.0, 5.6));
      look(what, wk * (1 - prog(t, 7.0, 7.25)), `translateY(${((1 - wk) * 16).toFixed(1)}px)`);
      what.style.top = '560px';
      pills.forEach((p, i) => { const a = 5.15 + i * .28, k = ease.outExpo(prog(t, a, a + .7)), e = ease.inCubic(prog(t, 7.0 + i * .04, 7.3 + i * .04)); look(p, Math.min(1, k * 1.5) * (1 - e), `translateX(-50%) translateY(${((1 - k) * 60 - e * 40).toFixed(1)}px)`, (1 - k) * 6); });
      logo.update(t, 7.4, 8.85, 540, 560);
      idea.update(t, 7.55, 8.85);
      soon.update(t, 9.0, 10.35);
      const sk = ease.outExpo(prog(t, 9.35, 10.0));
      look(site, sk * (1 - prog(t, 10.2, 10.4)), `translate(540px,1000px) translate(-50%,-50%) translateY(${((1 - sk) * 40).toFixed(1)}px)`);
      siteSheen.style.transform = `translateX(${(-160 + prog(t, 9.6, 10.3) * 520).toFixed(1)}%)`;
      end.update(t, 10.45);
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
  const E = ep === 'teaser' ? teaser(hud) : stageEpisode(hud, ep, await paintCards());
  window.DURATION = E.DUR;
  window.EVENTS = { duration: E.DUR, ...E.events };
  window.render = t => { sky.draw(t, 1, { x: 540, y: 980, r: 900, a: .32 + .08 * Math.sin(t * 1.1) }); E.update(t); };
  await Promise.all([...document.images].map(i => (i.complete ? i.decode() : new Promise(r => { i.onload = r; i.onerror = r; }).then(() => i.decode())).catch(() => {})));
  window.render(0);
})();
