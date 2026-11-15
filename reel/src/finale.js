// 14 – 23.5 s: what we build (a 3D carousel of three living product demos), the real website
// scrolling in a large browser, then the site shattering and gathering into the Refract Tech logo.
import { bump, box, clamp, ease, h, lerp, live, look, prog, spring, track, tw } from './lib.js';
import { C, ICON } from './ui.js';

export const FIN = { services: [14.0, 18.5], site: [18.5, 20.0], close: [20.0, 23.5] };
export const FIN_EVENTS = {
  whoosh: [15.4, 16.9, 18.1], hit: [14.0, 15.45, 16.95, 18.5], click: [14.75, 22.2], tap: [15.95], swipe: [16.05], ping: [16.35],
  pop: [17.15, 17.55], type: [[17.55, 18.0]], riser: [[17.7, 18.5]], shatter: [20.0], logo: [20.62], blip: [],
};

// ---------------------------------------------------------------- the three service demos
const webDemo = () => `
  <div class="app glass-soft">
    <div class="side">
      <div class="side-h"><span class="nova-mark sm"></span>Nova <span style="opacity:.55">Admin</span></div>
      ${[['Overview', 'grid'], ['Bookings', 'calendar'], ['Members', 'users'], ['Reports', 'chart']].map(([s, i], k) => `<div class="side-i" id="si${k}">${ICON[i]}<span>${s}</span></div>`).join('')}
      <div class="side-hl" id="shl"></div>
    </div>
    <div class="main">
      <div class="view" id="vA"><div class="m-h">Bookings<span class="m-sub">Today</span></div>
        ${[['L', 'Lea M.', '17:00', 'Paid'], ['K', 'Karim S.', '18:30', 'Paid'], ['M', 'Maya T.', '19:00', 'Pending'], ['O', 'Omar H.', '20:00', 'Paid']].map(([a, n, tm, s], i) => `<div class="tr"><i class="av av${i % 3}">${a}</i><span class="tn">${n}</span><span class="tt">${tm}</span><span class="ts ${s === 'Paid' ? 'ok' : ''}">${s}</span></div>`).join('')}
      </div>
      <div class="view" id="vB"><div class="m-h">Reports<span class="m-sub">Revenue <b>↑ 24%</b></span></div>
        <div class="bars">${[.38, .52, .44, .66, .58, .84].map((v, i) => `<i style="--v:${v}" id="bar${i}"></i>`).join('')}</div>
        <div class="expand" id="exp"><div class="ex-r"><span>Peak hour</span><b>19:00</b></div><div class="ex-r"><span>Top court</span><b>Court 2</b></div></div>
      </div>
    </div>
  </div>`;
const phoneA = `
  <div class="ph-status"><span>9:41</span><span class="ph-isl"></span><span>●●●</span></div>
  <div class="scr" id="scrA"><div class="ph-hi">Good evening,</div><div class="ph-name">Lea</div>
    <div class="ph-card"><div class="ph-pic"></div><div class="ph-ct"><div class="label" style="color:#F7F5FF;opacity:.75">Next session</div><div class="ph-ch">Court 2 · 18:30</div></div></div>
    <div class="ph-row"><i>${ICON.users}</i>Coaching<span>Sat 10:00</span></div><div class="ph-row"><i>${ICON.calendar}</i>Open match<span>Sun</span></div>
    <div class="ph-btn">Book again</div></div>
  <div class="scr" id="scrB"><div class="ph-ok"><i>${ICON.check}</i></div><div class="ph-hi" style="text-align:center">You're booked</div><div class="ph-name" style="text-align:center;font-size:40px">Court 2 · Fri 18:30</div>
    <div class="qr">${Array.from({ length: 49 }, (_, i) => `<i style="opacity:${[0, 1, 2, 4, 6, 7, 8, 13, 14, 20, 21, 27, 28, 34, 35, 40, 41, 42, 44, 46, 48, 10, 17, 24, 31, 16, 30, 38].includes(i) ? 1 : .12}"></i>`).join('')}</div></div>`;
const phoneB = `
  <div class="ph-status"><span>9:41</span><span class="ph-isl"></span><span>●●●</span></div>
  <div class="ph-hi" style="margin-top:30px">Your progress</div>
  <svg viewBox="0 0 200 200" class="ring-p"><circle cx="100" cy="100" r="80" stroke="rgba(247,245,255,.12)" stroke-width="16" fill="none"/><circle id="rp" cx="100" cy="100" r="80" stroke="url(#rg2)" stroke-width="16" fill="none" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="502.6"/>
    <defs><linearGradient id="rg2"><stop offset="0" stop-color="#8B5CF0"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs><text x="100" y="112" text-anchor="middle" fill="#F7F5FF" font-size="40" font-family="Albert Sans" font-weight="500">12</text></svg>
  <div class="ph-row"><i>${ICON.star}</i>Level up<span>3 to go</span></div>`;
const aiDemo = () => `
  <div class="chat glass-soft">
    <div class="chat-h"><span class="ai-av">${ICON.spark}</span>Nova Assistant<span class="online"></span></div>
    <div class="bub me" id="b1">Which slots fill up fastest?</div>
    <div class="bub ai" id="b2"><span class="typing" id="typ"><i></i><i></i><i></i></span><span id="b2t"></span></div>
  </div>
  <div class="flow glass-soft">
    <svg viewBox="0 0 800 200" width="800" height="200" fill="none"><path d="M120 100H680" stroke="url(#fl)" stroke-width="3" stroke-dasharray="4 10"/>
      <defs><linearGradient id="fl"><stop offset="0" stop-color="#8B5CF0"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs>
      <circle id="fp0" cy="100" r="9" fill="#F7F5FF"/><circle id="fp1" cy="100" r="9" fill="#FF906B"/></svg>
    ${[['Form', 'form'], ['AI', 'spark'], ['CRM', 'db'], ['Email', 'mail']].map(([s, i], k) => `<div class="fn" id="fn${k}" style="left:${40 + k * 186}px"><i style="color:${C.stages[k + 1]}">${ICON[i]}</i><span>${s}</span></div>`).join('')}
  </div>`;
const AI_REPLY = 'Evenings, 18:00–21:00. I’ve opened two extra courts for Friday.';

export function Services(world) {
  const root = h('div', 'layer carousel', world);
  const mk = (i, inner, chips) => {
    const el = h('div', 'svc glass', root, `<div class="svc-in">${inner}</div><div class="svc-chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div><span class="svc-n">0${i + 1}</span>`);
    box(el, 110, 540, 860, 1000);
    return el;
  };
  const cards = [
    mk(0, webDemo(), ['Portals', 'Marketplaces', 'SaaS', 'Custom software']),
    mk(1, `<div class="phone back">${phoneB}</div><div class="phone front">${phoneA}</div><div class="notif glass-soft"><span class="nova-mark sm"></span><div><b>Nova</b><span>Your court is ready in 15 min</span></div><em>now</em></div><div class="touch"></div>`, ['iOS', 'Android', 'One codebase']),
    mk(2, aiDemo(), ['Assistants', 'Workflows', 'APIs', 'Integrations']),
  ];
  const q = s => root.querySelector(s);
  const si = [0, 1, 2, 3].map(i => q('#si' + i)), shl = q('#shl'), vA = q('#vA'), vB = q('#vB'), exp = q('#exp');
  const bars = [...root.querySelectorAll('.bars i')];
  const scrA = q('#scrA'), scrB = q('#scrB'), notif = q('.notif'), touch = q('.touch'), rp = q('#rp');
  const b1 = q('#b1'), b2 = q('#b2'), typ = q('#typ'), b2t = q('#b2t'), fns = [0, 1, 2, 3].map(i => q('#fn' + i)), fps = [q('#fp0'), q('#fp1')];

  const pos = t => spring(t, 15.45, 1.3, .62) + spring(t, 16.95, 1.3, .62) + ease.inExpo(prog(t, 18.0, 18.5)) * 1.8;
  return {
    /** where card i's point (lx, ly) sits on screen when it faces the camera */
    at: (lx, ly) => [110 + lx, 540 + ly],
    update(t) {
      if (!live(root, t, 13.9, 18.55)) return;
      const c = pos(t), enter = 1 - spring(t, 14.0, 1.15, .78);
      cards.forEach((el, i) => {
        let d = i - c; if (i > 0) d += enter * 1.4;
        const a = Math.abs(d);
        const o = (i === 0 ? prog(t, 13.92, 14.12) : prog(t, 14.0, 14.25)) * (1 - clamp(a - 1.7)) * (1 - prog(t, 18.38, 18.52));
        const s0 = i === 0 ? 1 + .05 * (1 - tw(t, 13.92, 14.3, ease.outCubic)) : 1;
        look(el, o, { x: d * 610, z: -a * 480, ry: -d * 34, s: s0 }, Math.min(a, 1.4) * 7 + bump(t, 18.05, 18.5) * 10);
        el.style.zIndex = String(100 - Math.round(a * 10));
      });

      // web: the cursor opens Reports; the highlight slides over magnetically; the panel unfolds
      const sl = spring(t, 14.75, 1.7, .55);
      box(shl, 20, lerp(234, 402, sl), 196, 66);
      si.forEach((s, i) => s.classList.toggle('on', (t < 14.8 && i === 1) || (t >= 14.8 && i === 3)));
      look(vA, 1 - prog(t, 14.8, 14.95), { x: -40 * prog(t, 14.8, 14.95) });
      look(vB, prog(t, 14.85, 15.0), { x: 40 * (1 - prog(t, 14.85, 15.0)) });
      bars.forEach((b, i) => b.style.setProperty('--p', tw(t, 14.9 + i * .05, 15.3 + i * .05, ease.outBack).toFixed(3)));
      exp.style.height = (tw(t, 15.05, 15.4, ease.outCubic) * 190).toFixed(1) + 'px';

      // mobile: a tap, a swipe to the ticket, a notification, the progress ring filling
      const sw = tw(t, 16.02, 16.3, ease.inOutQuint);
      look(scrA, 1 - sw * .8, { x: -sw * 300 }); look(scrB, sw, { x: (1 - sw) * 300 });
      const nk = spring(t, 16.35, 1.5, .62);
      look(notif, clamp(nk * 2) * (1 - prog(t, 16.95, 17.1)), { y: (1 - nk) * -160 });
      const tp = track(t, [[15.7, [440, 860]], [15.95, [300, 712], ease.outCubic]]);
      look(touch, prog(t, 15.7, 15.8) * (1 - prog(t, 16.05, 16.2)), `translate(${tp[0]}px,${tp[1]}px) translate(-50%,-50%) scale(${(1 - .25 * bump(t, 15.9, 16.05)).toFixed(3)})`);
      rp.style.strokeDashoffset = (502.6 * (1 - .78 * tw(t, 15.4, 16.4, ease.outCubic))).toFixed(1);

      // AI: a question, the assistant thinking, its answer streaming, the workflow it sets off
      look(b1, prog(t, 17.15, 17.3), { y: (1 - ease.outBack(prog(t, 17.15, 17.45))) * 30, s: .9 + .1 * ease.outBack(prog(t, 17.15, 17.45)) });
      look(b2, prog(t, 17.35, 17.45), { y: (1 - ease.outCubic(prog(t, 17.35, 17.55))) * 20 });
      typ.style.display = t < 17.6 ? '' : 'none';
      [...typ.children].forEach((d, i) => { d.style.transform = `translateY(${(-8 * Math.max(0, Math.sin((t * 9) - i * .9))).toFixed(1)}px)`; });
      b2t.textContent = t < 17.6 ? '' : AI_REPLY.slice(0, Math.round(prog(t, 17.6, 18.05) * AI_REPLY.length));
      fns.forEach((f, i) => { const k = ease.outBack(prog(t, 17.05 + i * .07, 17.35 + i * .07)); look(f, prog(t, 17.05 + i * .07, 17.2 + i * .07), { s: .6 + .4 * k }); f.classList.toggle('on', t > 17.6 && ((t - 17.6) * 3) % 4 >= i && ((t - 17.6) * 3) % 4 < i + 1); });
      fps.forEach((p, j) => { const u = ((t - 17.4) * .8 + j * .5) % 1; p.setAttribute('cx', (120 + u * 560).toFixed(1)); p.style.opacity = (t > 17.4 ? Math.sin(u * Math.PI) : 0).toFixed(3); });
    },
  };
}

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
    scrollAt: t => track(t, [[18.95, 0], [19.75, 2 * SH, ease.inOutQuint]]),
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
    <div class="site-view" style="left:0;top:${BAR}px;width:${SW}px;height:${BROWSER[3] - BAR}px"><img src="assets/site/work.png" style="width:${SW}px;display:block"><img class="site-head" src="assets/site/header.png"></div></div>`;
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
