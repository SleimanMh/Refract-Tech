// The creation story, 0 – 14 s, told by one set of elements that keeps transforming:
// a spark assembles into a product card; the camera pushes through it into a raw idea; the idea
// splits into requirements; the requirements morph into a wireframe that polishes into a real
// interface; the interface explodes into its engineering layers and snaps back working; it pulls
// out into a network of services, launches into a live browser, and becomes a dashboard that grows.
import { bez, bump, box, clamp, ease, fmt, h, lerp, live, look, prog, rng, spring, T, track, tw } from './lib.js';
import { C, ICON } from './ui.js';

export const TL = {
  hook: [0, 2.5], discover: [2.5, 4.5], design: [4.5, 6.5], build: [6.5, 8.5],
  connect: [8.5, 10.5], launch: [10.5, 12.0], evolve: [12.0, 14.0],
};

/** events the soundtrack follows (seconds) */
export const STORY_EVENTS = {
  spark: [0.02], flash: [0.48], frag: [], whoosh: [1.3, 4.45, 6.45, 8.5, 10.75, 11.95], hit: [2.5, 4.5, 6.5, 8.5, 11.3, 12.0],
  tick: [3.35, 3.5, 3.95], pop: [2.95, 3.02, 3.09, 3.16, 9.0, 9.05, 9.1, 9.15, 9.2, 9.25], sweep: [5.3],
  click: [3.95, 6.1, 8.2], type: [[7.0, 7.65]], snap: [7.85], success: [8.25, 11.25], blip: [], boom: [11.3], count: [[12.2, 13.0]],
};

const hills = (top = '#2a2363', mid = '#713DE8', hill = '#B66CFA', glow = '#FF906B') => `
<svg viewBox="0 0 400 200" preserveAspectRatio="none" width="100%" height="100%">
  <defs><linearGradient id="sk${top.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
  <radialGradient id="sun${top.slice(1)}" cx=".66" cy=".42" r=".4"><stop offset="0" stop-color="${glow}" stop-opacity=".95"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>
  <rect width="400" height="200" fill="url(#sk${top.slice(1)})"/><rect width="400" height="200" fill="url(#sun${top.slice(1)})"/>
  <path d="M0 200 L0 150 C60 120 90 105 130 128 C170 150 200 92 260 70 C300 56 340 96 400 112 L400 200Z" fill="${hill}" opacity=".75"/>
  <path d="M0 200 L0 172 C70 150 120 160 170 168 C230 178 300 140 400 150 L400 200Z" fill="#11112B" opacity=".55"/>
</svg>`;

// ===================================================================== hook
export function Hook(world) {
  const root = h('div', 'layer', world);
  const glow = h('div', 'spark-glow', root);
  const spark = h('div', 'spark', root);
  const flare = h('div', 'flare', root);
  const flareV = h('div', 'flare flare-v', root);

  // the card, as on the site: logo, label, headline, flow, picture, deliverables
  const card = h('div', 'hook-card', root);
  box(card, 160, 500, 760, 1000);
  const bg = h('div', 'hook-bg glass', card);
  const F = [];
  const frag = (x, y, w, hh, html, cls = '') => { const el = h('div', 'frag ' + cls, card, html); box(el, x, y, w, hh); F.push({ el, x, y, w, h: hh }); return el; };
  frag(48, 46, 420, 64, `<img src="assets/r-mark.png" style="height:54px"><span class="wordmark">Refract <b>Tech</b></span>`, 'row');
  frag(48, 150, 400, 30, `<span class="label" style="color:${C.ink3}">Your product</span>`);
  frag(48, 190, 664, 80, `<span class="card-h">Products for a</span>`);
  frag(48, 264, 664, 80, `<span class="card-h" style="color:${C.purple}">brighter tomorrow.</span>`);
  frag(48, 372, 664, 70, `<svg viewBox="0 0 680 70" width="664" height="70" fill="none" stroke="#CFCAE8" stroke-width="2.4">
    <circle cx="14" cy="35" r="13"/><path d="M28 35H170"/><circle cx="186" cy="35" r="14" fill="#B66CFA" stroke="none"/>
    <path d="M202 35H330M320 25l10 10-10 10"/><circle cx="372" cy="35" r="13" fill="#713DE8" stroke="none"/>
    <path d="M386 35c64 0 64 34 124 34 50 0 50-34 90-34"/><circle cx="646" cy="35" r="30"/><circle cx="646" cy="35" r="18" stroke="#F7F5FF" stroke-width="3"/><circle cx="646" cy="35" r="6" fill="#F7F5FF" stroke="none"/></svg>`);
  frag(48, 462, 664, 250, hills(), 'pic');
  frag(48, 742, 300, 16, '', 'barline');
  frag(48, 772, 200, 12, '', 'barline dim');
  frag(578, 732, 134, 52, `<span class="dot-live"></span>Live`, 'pill-live');
  ['Discover to launch', 'One coherent team', 'Ongoing care'].forEach((s, i) => frag(48, 818 + i * 58, 664, 58, `<span>${s}</span>${ICON.arrow}`, 'card-row'));
  const R = rng(5);
  F.forEach((f, i) => { f.rz = (R() - .5) * 120; f.z = 200 + R() * 500; f.side = R() > .5 ? 1 : -1; f.at = .5 + i * .045; });

  // shards of interface that rush past as the camera goes through the card
  const shards = Array.from({ length: 16 }, (_, i) => {
    const el = h('div', 'shard ' + ['', 'pill', 'dot', 'line'][i % 4], root);
    const a = R() * Math.PI * 2, r0 = 60 + R() * 170;
    return { el, dx: Math.cos(a) * r0, dy: Math.sin(a) * r0 * 1.3, at: 1.32 + R() * .55, sp: 2.4 + R() * 1.6, rz: R() * 90 };
  });

  return {
    focus(t) { return t < 2.4 ? { x: 540, y: 1000, r: 520 + 300 * tw(t, .3, 1.2), a: Math.max(tw(t, 0, .45) * .9 * (1 - tw(t, 1.6, 2.4)), .1) } : null; },
    update(t) {
      if (!live(root, t, 0, 2.6)) return;
      // the spark: grows out of darkness, flashes, then gives way to the pieces it sends out
      const g = ease.outExpo(prog(t, 0, .45)), fl = bump(t, .4, .75);
      const sOut = 1 - tw(t, .6, 1.0);
      look(spark, (g * .9 + fl * .1) * sOut, `translate(540px,1000px) translate(-50%,-50%) scale(${(.06 + g * .55 + fl * 1.1).toFixed(3)})`);
      look(glow, (g * .7 + fl * .3) * (1 - tw(t, .9, 1.6)), `translate(540px,1000px) translate(-50%,-50%) scale(${(.3 + g * .7 + fl * .6).toFixed(3)})`);
      look(flare, (g * .7 + fl) * sOut, `translate(540px,1000px) translate(-50%,-50%) scaleX(${(.1 + g * .6 + fl * 1.6).toFixed(3)})`);
      look(flareV, (g * .5 + fl * .6) * sOut, `translate(540px,1000px) translate(-50%,-50%) scaleY(${(.1 + g * .5 + fl).toFixed(3)})`);

      // the card assembles from the light, then the camera drives through its picture
      const tilt = 1 - tw(t, .5, 1.35, ease.outCubic);
      const push = ease.inCubic(prog(t, 1.1, 1.95));
      const cam = { rx: 12 * tilt, ry: -10 * tilt, s: 1.1 + push * 7.5, y: -push * 60 };
      look(card, 1 - tw(t, 1.28, 1.62), T(cam), prog(t, 1.18, 1.55) * 18);
      card.style.transformOrigin = '380px 590px';
      const b = spring(t, .82, 1.4, .7);
      look(bg, prog(t, .8, 1.05), { s: .82 + .18 * b });
      for (const f of F) {
        const k = spring(t, f.at, 1.5, .62), u = clamp(k);
        const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
        const dx = (380 - cx) * (1 - k), dy = (500 - cy) * (1 - k);
        const swirl = Math.sin(Math.PI * u) * 110 * f.side;
        look(f.el, clamp((t - f.at) * 7), { x: dx + swirl * .4, y: dy - swirl * .6, z: f.z * (1 - k), rz: f.rz * (1 - u), s: .06 + .94 * u });
      }
      for (const s of shards) {
        const x = t - s.at;
        if (x < 0 || x > .9) { s.el.style.visibility = 'hidden'; continue; }
        const sc = Math.exp(x * s.sp);
        look(s.el, bump(t, s.at, s.at + .9) * .8, `translate(${(540 + s.dx * sc).toFixed(1)}px,${(1040 + s.dy * sc).toFixed(1)}px) rotate(${s.rz}deg) scale(${(sc * .6).toFixed(3)})`, Math.max(0, sc - 2) * 2.5);
      }
    },
  };
}

// ===================================================================== product storyline
// the requirement nodes (discover) and the interface blocks they become (design onwards)
const NODE = [[80, 580, 430, 280], [570, 580, 430, 280], [80, 1190, 430, 280], [570, 1190, 430, 280]];
const UIB = [[170, 600, 740, 96], [170, 720, 740, 340], [170, 1084, 740, 250], [170, 1358, 740, 128]];
const RAD = { node: [34, 34, 34, 34], wire: [18, 24, 22, 64], ui: [20, 30, 30, 64] };
const HUB = [230, 925, 620, 200], FRAME = [130, 560, 820, 970];
const TAGS = ['&lt;Header /&gt;', '&lt;Hero session={next} /&gt;', '&lt;SlotPicker /&gt;', '&lt;BookButton /&gt;'];

export function Product(world) {
  const root = h('div', 'layer product', world);
  const grid = h('div', 'blueprint', root); box(grid, 90, 520, 900, 1050);
  const frame = h('div', 'frame glass', root);
  const hubC = h('div', 'hub-c', frame, `<span class="hub-spark"></span><div><div class="label" style="color:${C.coral}">Raw idea</div><div class="hub-t">“Booking in one tap.”</div></div>`);
  const svg = h('div', 'links', root, `<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">${[0, 1, 2, 3].map(i => `<path id="ln${i}" stroke="${C.stages[i]}" stroke-width="3" stroke-linecap="round"/><circle id="pl${i}" r="8" fill="#F7F5FF"/>`).join('')}</svg>`);
  const lines = [0, 1, 2, 3].map(i => svg.querySelector('#ln' + i)), pulses = [0, 1, 2, 3].map(i => svg.querySelector('#pl' + i));

  const node = [
    `<div class="label" style="color:${C.stages[0]}">Users</div><div class="avatars">${['L', 'K', 'M', '+'].map((a, i) => `<i class="av av${i}">${a}</i>`).join('')}</div><div class="node-t">Members &amp; coaches</div>`,
    `<div class="label" style="color:${C.stages[1]}">Goals</div>${['Book in seconds', 'Pay online', 'Fewer no-shows'].map((s, i) => `<div class="chk" id="chk${i}"><i>${ICON.check}</i>${s}</div>`).join('')}`,
    `<div class="label" style="color:${C.stages[2]}">Must-haves</div><div class="chips">${['Calendar', 'Payments', 'Reminders', 'Profiles'].map(s => `<span class="chip">${s}</span>`).join('')}</div>`,
    `<div class="label" style="color:${C.stages[3]}">Roadmap</div>${[['MVP', .05, .45, C.purple], ['Launch', .35, .7, C.violet], ['Grow', .6, 1, C.coral]].map(([s, a, b, c], i) => `<div class="gantt"><span>${s}</span><b id="gb${i}" style="--a:${a};--b:${b};background:${c}"></b></div>`).join('')}`,
  ];
  const wire = [
    `<i class="w-circle" style="left:20px;top:22px"></i><i class="w-bar" style="left:88px;top:40px;width:150px"></i><i class="w-bar" style="right:96px;top:40px;width:60px"></i><i class="w-circle" style="right:20px;top:22px"></i>`,
    `<i class="w-cross" style="inset:18px"></i><i class="w-bar" style="left:44px;bottom:84px;width:200px"></i><i class="w-bar" style="left:44px;bottom:50px;width:320px;height:18px"></i>`,
    `<i class="w-bar" style="left:32px;top:34px;width:180px"></i>${[0, 1, 2].map(i => `<i class="w-box" style="left:${32 + i * 236}px;top:104px;width:204px;height:110px"></i>`).join('')}`,
    `<i class="w-bar" style="left:270px;top:56px;width:200px;height:16px"></i>`,
  ];
  const ui = [
    `<span class="nova-mark"></span><span class="nova-name">Nova</span><span class="ui-bell">${ICON.bell}<b></b></span><i class="av av0 ui-av">L</i>`,
    `<div class="ui-pic">${hills('#241d5c', '#5b35c9', '#B66CFA', '#FF906B')}</div><div class="ui-hero-t"><div class="label" style="color:#F7F5FF;opacity:.8">Next session</div><div class="ui-hero-h">Padel · Court 2</div></div><span class="ui-time">Fri · 18:30</span>`,
    `<div class="ui-row-h">Today<span>2 courts free</span></div>${['17:00', '18:30', '20:00'].map((s, i) => `<span class="slot" id="slot${i}">${s}</span>`).join('')}`,
    `<div class="btn-a"><span>Book a session</span><i>${ICON.arrow}</i></div><div class="btn-b"><i>${ICON.check}</i><span>Booked · 18:30</span></div>`,
  ];
  const B = [0, 1, 2, 3].map(i => {
    const el = h('div', 'blk blk' + i, root);
    const bgN = h('div', 'bg-node', el), bgW = h('div', 'bg-wire', el), bgU = h('div', 'bg-ui', el);
    const cN = h('div', 'c c-node', el, node[i]); box(cN, 0, 0, NODE[i][2], NODE[i][3]);
    const cW = h('div', 'c', el, wire[i]); box(cW, 0, 0, UIB[i][2], UIB[i][3]);
    const cU = h('div', 'c c-ui', el, ui[i]); box(cU, 0, 0, UIB[i][2], UIB[i][3]);
    const tag = h('div', 'tag mono', root, TAGS[i]);
    return { el, bgN, bgW, bgU, cN, cW, cU, tag };
  });
  const sheenWrap = h('div', 'sheen-wrap', root); box(sheenWrap, ...FRAME);
  const sheen = h('div', 'sheen', sheenWrap);
  const toast = h('div', 'toast glass', root, `<i>${ICON.check}</i>Confirmation sent`);
  const $ = sel => root.querySelector(sel);
  const chk = [0, 1, 2].map(i => $('#chk' + i)), gb = [0, 1, 2].map(i => $('#gb' + i)), slots = [0, 1, 2].map(i => $('#slot' + i));
  const avs = [...root.querySelectorAll('.avatars .av')], chips = [...root.querySelectorAll('.chips .chip')];
  const btnA = $('.btn-a'), btnB = $('.btn-b');

  const lerpBox = (a, b, k) => a.map((v, j) => lerp(v, b[j], k));
  const hubCenter = [HUB[0] + HUB[2] / 2, HUB[1] + HUB[3] / 2];

  /** camera for the whole product, by time */
  function camera(t) {
    // discover: a slow turn; design: tilted wireframe, then straight on and pushed in;
    // build: turned to show its layers; connect: pulled far back; launch: driven forward
    const c = { x: 0, y: 0, rx: 0, ry: 0, rz: 0, s: 1 };
    if (t < 4.5) { c.ry = lerp(7, -4, tw(t, 2.5, 4.5, ease.inOutSine)); c.rx = 4; c.s = lerp(.97, 1.01, prog(t, 2.5, 4.5)); }
    else if (t < 6.5) {
      const w = tw(t, 4.5, 5.1), st = tw(t, 5.35, 5.9), z = tw(t, 5.75, 6.4, ease.inOutQuint);
      c.rx = lerp(lerp(4, 12, w), 0, st); c.ry = lerp(lerp(-4, -9, w), 0, st);
      c.s = lerp(lerp(1.01, .93, w), 1, st) * lerp(1, 1.1, z);
    } else if (t < 8.5) {
      const e = tw(t, 6.5, 7.0), back = tw(t, 7.72, 8.1, ease.inOutQuint), k = e * (1 - back);
      c.rx = 24 * k; c.ry = -26 * k; c.rz = 4 * k; c.x = -95 * k; c.y = 20 * k; c.s = lerp(1.1, .76, e) * (1 - back) + back * 1.0;
    } else if (t < 10.5) {
      const p = tw(t, 8.5, 9.0, ease.inOutQuint);
      c.s = lerp(1.0, .46, p) * (1 + .05 * prog(t, 9.0, 10.5));
    } else {
      const k = spring(t, 10.8, 1.25, .66), sw = bump(t, 10.8, 11.45);
      c.s = lerp(.48, 1, k); c.rx = -14 * sw; c.y = -6 * sw;
      c.y += -40 * tw(t, 11.95, 12.3); c.s *= 1 - .04 * tw(t, 11.95, 12.3);
    }
    return c;
  }

  return {
    camera,
    update(t) {
      if (!live(root, t, 2.1, 12.35)) return;
      const cam = camera(t);
      look(root, 1 - tw(t, 12.0, 12.3), cam);

      // ---- frame: the idea's hub, which grows into the product's own card
      const em = ease.outExpo(prog(t, 2.2, 2.85)), pulse = bump(t, 2.8, 3.05) * .06;
      const fk = tw(t, 4.45, 5.05);
      const fb = lerpBox(HUB, FRAME, fk);
      box(frame, fb[0], fb[1], fb[2], fb[3]);
      frame.style.borderRadius = lerp(100, 46, fk) + 'px';
      look(frame, em, { s: (.3 + .7 * em) * (1 + pulse) * (1 - .12 * tw(t, 2.95, 3.4) * (1 - fk)), z: -260 * (1 - em) }, (1 - em) * 14);
      frame.style.transformOrigin = '50% 50%';
      look(hubC, 1 - prog(t, 4.4, 4.6));
      const sep = clamp(tw(t, 6.5, 7.0) * (1 - spring(t, 7.72, 1.9, .5)), 0, 1);   // never past flat: the card stays behind its interface
      frame.style.transform += ` translateZ(${(-200 * sep - 2).toFixed(1)}px)`;
      frame.style.boxShadow = `0 60px 140px -50px rgba(0,0,0,.9), 0 0 ${(160 * bump(t, 10.5, 11.6)).toFixed(0)}px ${(30 * bump(t, 10.5, 11.6)).toFixed(0)}px rgba(182,108,250,.5)`;
      look(grid, sep * .9, `translateZ(${(-380 * sep).toFixed(1)}px)`);

      // ---- nodes → wireframe → interface
      const zs = [60, -60, 150, 240];
      for (let i = 0; i < 4; i++) {
        const b = B[i];
        const out = spring(t, 2.92 + i * .07, 1.3, .7);
        const small = [hubCenter[0] - 60, hubCenter[1] - 40, 120, 80];
        const m = tw(t, 4.5 + i * .05, 5.05 + i * .05);
        const nb = lerpBox(small, NODE[i], out);
        const bb = m > 0 ? lerpBox(NODE[i], UIB[i], m) : nb;
        box(b.el, bb[0], bb[1], bb[2], bb[3]);
        const pol = tw(t, 5.32 + i * .1, 5.55 + i * .1);
        const r = m < 1 ? lerp(RAD.node[i], RAD.wire[i], m) : lerp(RAD.wire[i], RAD.ui[i], pol);
        b.el.style.borderRadius = r.toFixed(1) + 'px';
        let press = 0;
        if (i === 3) press = bump(t, 8.14, 8.34) * .05;
        look(b.el, clamp((t - 2.92 - i * .07) * 6), { z: zs[i] * sep, s: 1 - press });
        b.el.style.transformOrigin = '50% 50%';
        b.bgN.style.opacity = (1 - prog(t, 4.55, 4.9)).toFixed(3);
        b.bgW.style.opacity = (prog(t, 4.6, 4.95) * (1 - pol)).toFixed(3);
        b.bgU.style.opacity = pol.toFixed(3);
        look(b.cN, 1 - prog(t, 4.45, 4.65));
        look(b.cW, prog(t, 4.85, 5.1) * (1 - pol));
        look(b.cU, pol);
        // component tags beside each layer while the product is opened up
        const tg = prog(t, 6.85 + i * .07, 7.0 + i * .07) * (1 - prog(t, 7.62, 7.78));
        box(b.tag, UIB[i][0] + UIB[i][2] - 20, UIB[i][1] - 26);
        look(b.tag, tg, `translate(-100%,0) translateZ(${(zs[i] * sep + 2).toFixed(1)}px) translateY(${((1 - tg) * 12).toFixed(1)}px)`);
      }
      // the light that polishes the wireframe into an interface
      const sw = prog(t, 5.25, 5.85);
      const sv = bump(t, 5.25, 5.85) + bump(t, 7.85, 8.15);
      sheenWrap.style.display = sv > 0 ? '' : 'none';
      look(sheen, sv, `translateY(${(-300 + (sw > 0 && sw < 1 ? sw : prog(t, 7.85, 8.15)) * 1300).toFixed(1)}px) rotate(-10deg)`);

      // ---- the links from the idea to its requirements
      for (let i = 0; i < 4; i++) {
        const out = clamp(spring(t, 2.92 + i * .07, 1.3, .7));
        const n = NODE[i], c = [n[0] + n[2] / 2, n[1] + n[3] / 2];
        const tip = [lerp(hubCenter[0], c[0], out), lerp(hubCenter[1], c[1], out)];
        const p1 = [hubCenter[0], lerp(hubCenter[1], tip[1], .6)], p2 = [tip[0], lerp(hubCenter[1], tip[1], .4)];
        lines[i].setAttribute('d', `M${hubCenter[0]} ${hubCenter[1]}C${p1} ${p2} ${tip}`);
        const draw = 1 - tw(t, 4.38, 4.62);
        lines[i].style.opacity = (out * draw * .85).toFixed(3);
        const u = ((t - 3.3) * 1.1 + i * .27) % 1;
        const [px, py] = bez(hubCenter, p1, p2, tip, u);
        pulses[i].setAttribute('cx', px.toFixed(1)); pulses[i].setAttribute('cy', py.toFixed(1));
        pulses[i].style.opacity = (prog(t, 3.3, 3.5) * draw * Math.sin(u * Math.PI)).toFixed(3);
      }
      svg.style.display = t < 4.7 ? '' : 'none';

      // ---- small things coming alive inside the nodes
      avs.forEach((a, i) => look(a, 1, { s: ease.outBack(prog(t, 3.25 + i * .06, 3.55 + i * .06)) }));
      [3.35, 3.5, 3.95].forEach((at, i) => chk[i].classList.toggle('on', t >= at));
      chips.forEach((c, i) => look(c, prog(t, 3.3 + i * .08, 3.45 + i * .08), { y: (1 - ease.outBack(prog(t, 3.3 + i * .08, 3.6 + i * .08))) * 24 }));
      gb.forEach((b, i) => b.style.setProperty('--p', tw(t, 3.4 + i * .12, 3.9 + i * .12, ease.outCubic).toFixed(3)));
      // the chosen time slot, then the booking going through
      slots.forEach((s, i) => s.classList.toggle('on', i === 1 && t >= 6.1));
      look(btnA, 1 - prog(t, 8.22, 8.32)); look(btnB, prog(t, 8.24, 8.36), { s: .9 + .1 * ease.outBack(prog(t, 8.24, 8.5)) });
      const tk = spring(t, 8.3, 1.6, .6), tOut = tw(t, 8.6, 8.9);
      look(toast, clamp(tk * 3) * (1 - tOut), { x: 0, y: (1 - tk) * -80, z: 300 });
    },
  };
}

// ===================================================================== code panel (build)
export function Code(world) {
  const root = h('div', 'code glass', world);
  box(root, 470, 1170, 560, 360);
  const L = [
    ['<span class="k">export function</span> <span class="f">BookButton</span>() {'],
    ['  <span class="k">const</span> slot = <span class="f">useSlot</span>();'],
    ['  <span class="k">return</span> <span class="f">api</span>.<span class="f">book</span>(slot);'],
    ['}'],
  ];
  const rows = L.map(([html]) => h('div', 'code-row', root, html));
  const lens = L.map(([html]) => html.replace(/<[^>]+>/g, '').length);
  const pass = h('div', 'code-pass', root, `<i>${ICON.check}</i>128 tests passed`);
  const bar = h('div', 'code-bar', root);
  return {
    update(t) {
      if (!live(root, t, 6.8, 8.0)) return;
      const k = spring(t, 6.85, 1.5, .7), out = tw(t, 7.65, 7.9, ease.inCubic);
      look(root, clamp(k * 2) * (1 - out), { x: (1 - k) * 160 + out * -180, y: out * -60, s: 1 - out * .25, rz: (1 - k) * 4 });
      // type the code, one character at a time
      const total = lens.reduce((a, b) => a + b, 0);
      let n = Math.floor(prog(t, 7.0, 7.55) * total);
      rows.forEach((r, i) => { const v = clamp(n / lens[i]); n -= lens[i]; r.style.clipPath = `inset(0 ${(100 - v * 100).toFixed(1)}% 0 0)`; });
      look(pass, prog(t, 7.55, 7.62), { y: (1 - prog(t, 7.55, 7.65)) * 10 });
      bar.style.transform = `scaleX(${tw(t, 7.0, 7.6).toFixed(3)})`;
    },
  };
}

// ===================================================================== connect
const NET = [
  ['Payments', 'card', -122], ['Calendar', 'calendar', -58], ['AI assistant', 'spark', 0],
  ['Email', 'mail', 58], ['Analytics', 'chart', 122], ['CRM', 'users', 180],
];
export function Connect(world) {
  const root = h('div', 'layer', world);
  const cx = 540, cy = 1060, rx = 360, ry = 440;
  const svg = h('div', 'links', root, `<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF0"/><stop offset=".5" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient>
    <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>
    ${NET.map((_, i) => `<path id="cl${i}" stroke="url(#lg)" stroke-width="3.5" stroke-linecap="round"/>`).join('')}
    <path id="xa" stroke="#B66CFA" stroke-width="2.5" stroke-dasharray="2 12" stroke-linecap="round"/><path id="xb" stroke="#FF906B" stroke-width="2.5" stroke-dasharray="2 12" stroke-linecap="round"/>
    ${NET.map((_, i) => `<circle id="cp${i}a" r="16" fill="#B66CFA" filter="url(#gl)"/><circle id="cq${i}a" r="7" fill="#F7F5FF"/><circle id="cp${i}b" r="16" fill="#FF906B" filter="url(#gl)"/><circle id="cq${i}b" r="7" fill="#F7F5FF"/>`).join('')}
  </svg>`);
  const q = id => svg.querySelector('#' + id);
  const pos = NET.map(([, , a]) => [cx + rx * Math.sin(a * Math.PI / 180), cy - ry * Math.cos(a * Math.PI / 180)]);
  const tiles = NET.map(([name, icon], i) => h('div', 'net glass', root, `<i style="color:${C.stages[i]}">${ICON[icon]}</i><span>${name}</span>`));
  const curve = (i, k) => {
    const [x, y] = pos[i], tx = lerp(cx, x, k), ty = lerp(cy, y, k);
    const p1 = [cx + (x - cx) * .15, cy + (y - cy) * .55], p2 = [cx + (x - cx) * .75, cy + (y - cy) * .9];
    return [[cx, cy], p1, p2, [tx, ty]];
  };
  return {
    pos,
    update(t) {
      if (!live(root, t, 8.7, 10.95)) return;
      const zoom = 1 + .05 * prog(t, 9.0, 10.5);
      root.style.transform = `scale(${zoom.toFixed(4)})`; root.style.transformOrigin = `${cx}px ${cy}px`;
      NET.forEach((_, i) => {
        const at = 8.95 + i * .05;
        const k = spring(t, at, 1.4, .62), back = tw(t, 10.45 + i * .03, 10.8 + i * .03, ease.inCubic);
        const r = k * (1 - back);
        const [x, y] = pos[i];
        box(tiles[i], 0, 0);
        look(tiles[i], clamp(k * 2) * (1 - back), `translate(${lerp(cx, x, r).toFixed(1)}px,${lerp(cy, y, r).toFixed(1)}px) translate(-50%,-50%) scale(${(.3 + .7 * clamp(r)).toFixed(3)})`);
        const P = curve(i, clamp(r));
        const d = `M${P[0]}C${P[1]} ${P[2]} ${P[3]}`;
        const ln = q('cl' + i); ln.setAttribute('d', d);
        ln.style.opacity = (tw(t, at, at + .4) * (1 - back)).toFixed(3);
        ['a', 'b'].forEach((s, j) => {
          let u = ((t - 9.3) * .95 + i * .17 + j * .5) % 1; if (j) u = 1 - u;
          const [px, py] = bez(...P, u);
          const o = prog(t, 9.3, 9.5) * (1 - back) * Math.sin(u * Math.PI);
          for (const id of ['cp', 'cq']) { const c = q(id + i + s); c.setAttribute('cx', px.toFixed(1)); c.setAttribute('cy', py.toFixed(1)); c.style.opacity = (o * (id === 'cp' ? .8 : 1)).toFixed(3); }
        });
      });
      // the services also talk to each other
      const arc = (a, b, bend) => { const [x1, y1] = pos[a], [x2, y2] = pos[b]; return `M${x1} ${y1}Q${(x1 + x2) / 2 + bend} ${(y1 + y2) / 2} ${x2} ${y2}`; };
      q('xa').setAttribute('d', arc(2, 5, 0)); q('xb').setAttribute('d', arc(0, 3, 60));
      const xo = tw(t, 9.55, 9.9) * (1 - tw(t, 10.4, 10.6));
      for (const id of ['xa', 'xb']) { q(id).style.opacity = (xo * .9).toFixed(3); q(id).style.strokeDashoffset = (-t * 60).toFixed(1); }
    },
  };
}

// ===================================================================== launch + evolve
export function Launch(world) {
  const root = h('div', 'layer', world);
  const fr = h('div', 'layer');
  const win = h('div', 'window', root); box(win, 100, 462, 880, 1092);
  const bar = h('div', 'win-bar', win, `<span class="dots"><i></i><i></i><i></i></span>
    <span class="url">${ICON.lock}<span class="u1">nova.app</span><span class="u2">nova.app/<b>insights</b></span></span>`);
  const prog1 = h('div', 'win-prog', win);
  const u1 = bar.querySelector('.u1'), u2 = bar.querySelector('.u2');
  const live1 = h('div', 'status', fr, `<span class="dot-live"></span>Live`);
  const deploy = h('div', 'deploy glass', fr, `<div class="label" style="color:${C.ink3}">Deploying to production</div>
    <div class="steps">${['Build', 'Test', 'Deploy'].map((s, i) => `<span class="st" id="st${i}"><i>${ICON.check}</i>${s}</span>`).join('<b class="sep"></b>')}</div><div class="dbar"><i></i></div>`);
  const st = [0, 1, 2].map(i => deploy.querySelector('#st' + i)), dbar = deploy.querySelector('.dbar i');
  const ring = h('div', 'shock', fr);

  // the dashboard the product becomes once it is live
  const dash = h('div', 'dash', fr); box(dash, 130, 570, 820, 960);
  dash.innerHTML = `
    <div class="d-head"><span>Insights</span><span class="pill-v">v2.4 live</span></div>
    <div class="kpis">
      <div class="kpi glass-soft"><div class="k-l">Bookings</div><div class="k-v" id="kv0">0</div><div class="k-d">↑ 38%</div></div>
      <div class="kpi glass-soft"><div class="k-l">Uptime</div><div class="k-v" id="kv1">99.0%</div><div class="k-d">30 days</div></div>
      <div class="kpi glass-soft"><div class="k-l">Rating</div><div class="k-v" id="kv2">4.0</div><div class="k-d k-star">${ICON.star}${ICON.star}${ICON.star}${ICON.star}${ICON.star}</div></div>
    </div>
    <div class="chart glass-soft"><div class="c-t">Weekly bookings</div>
      <svg viewBox="0 0 780 360" width="780" height="360" fill="none">
        <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B66CFA" stop-opacity=".45"/><stop offset="1" stop-color="#B66CFA" stop-opacity="0"/></linearGradient>
        <linearGradient id="ln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8B5CF0"/><stop offset=".6" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient>
        <clipPath id="cc"><rect id="ccr" x="0" y="0" width="0" height="360"/></clipPath></defs>
        ${[0, 1, 2, 3].map(i => `<path d="M30 ${80 + i * 70}H750" stroke="rgba(247,245,255,.08)" stroke-width="2"/>`).join('')}
        <g clip-path="url(#cc)"><path id="area" fill="url(#ar)"/><path id="line" stroke="url(#ln)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
        <circle id="end" r="11" fill="#FF906B"/><circle id="endr" r="11" stroke="#FF906B" stroke-width="3"/>
      </svg>
      <div class="tip" id="tip">+38%<span>this month</span></div>
    </div>
    <div class="rel">${[['Faster search', 12.9], ['Smart reminders', 13.05], ['Group bookings', 99]].map(([s], i) => `<div class="rel-r" id="rl${i}"><i>${ICON.check}</i>${s}</div>`).join('')}</div>`;
  const vals = [.18, .26, .24, .36, .33, .47, .45, .6, .68, .86];
  const pts = vals.map((v, i) => [30 + i * 80, 320 - v * 260]);
  const smooth = pts.map((p, i) => (i ? `C${pts[i - 1][0] + 40} ${pts[i - 1][1]} ${p[0] - 40} ${p[1]} ${p[0]} ${p[1]}` : `M${p[0]} ${p[1]}`)).join('');
  const d$ = s => dash.querySelector(s);
  d$('#line').setAttribute('d', smooth); d$('#area').setAttribute('d', smooth + 'L750 360L30 360Z');
  const end = pts[pts.length - 1];
  const kv = [0, 1, 2].map(i => d$('#kv' + i)), rl = [0, 1, 2].map(i => d$('#rl' + i));

  return {
    front(w) { w.appendChild(fr); },
    update(t) {
      if (!live(root, t, 10.85, 14.25)) { fr.style.display = 'none'; return; }
      fr.style.display = '';
      // the zoom into the growing line, and back out
      const z = track(t, [[13.05, 0], [13.45, 1, ease.inOutQuint], [13.92, 0, ease.inOutQuint]]);
      const out = tw(t, 13.92, 14.2);
      const sc = 1 + z * .42 + out * .06, Y = 1180;
      // while zoomed, the dashboard fades out under the headline instead of running into it
      const m0 = Y + (500 - Y) / sc, m1 = Y + (640 - Y) / sc;
      const mask = z > .001 ? `linear-gradient(180deg, transparent ${m0.toFixed(0)}px, #000 ${m1.toFixed(0)}px)` : 'none';
      for (const r of [root, fr]) { r.style.transformOrigin = `880px ${Y}px`; look(r, 1 - out, { s: sc }, out * 6); r.style.webkitMaskImage = r.style.maskImage = mask; }

      const wk = tw(t, 10.95, 11.25, ease.outCubic);
      look(win, wk, { s: 1.06 - .06 * wk });
      prog1.style.transform = `scaleX(${tw(t, 10.9, 11.25).toFixed(3)})`;
      prog1.style.opacity = (1 - prog(t, 11.3, 11.5)).toFixed(3);
      look(u1, 1 - prog(t, 12.0, 12.15)); look(u2, prog(t, 12.05, 12.2));
      // the deploy card ticks through its pipeline, then folds into the status pill
      const dIn = spring(t, 10.85, 1.6, .7), m = tw(t, 11.25, 11.55, ease.inOutQuint);
      const from = [260, 960, 560, 230], to = [796, 486, 150, 50];
      const bb = from.map((v, i) => lerp(v, to[i], m));
      box(deploy, bb[0], bb[1], bb[2], bb[3]);
      deploy.style.borderRadius = lerp(36, 25, m) + 'px';
      look(deploy, clamp(dIn * 2) * (1 - prog(t, 11.4, 11.55)), { s: .85 + .15 * clamp(dIn), z: 0 });
      [10.98, 11.08, 11.18].forEach((at, i) => st[i].classList.toggle('on', t >= at));
      dbar.style.transform = `scaleX(${tw(t, 10.9, 11.2).toFixed(3)})`;
      box(live1, 796, 486, 150, 50);
      look(live1, prog(t, 11.42, 11.58), { s: 1 + .25 * bump(t, 11.45, 11.75) });
      const sk = prog(t, 11.28, 11.95);
      look(ring, (1 - sk) * .9 * (sk > 0 ? 1 : 0), `translate(540px,1010px) translate(-50%,-50%) scale(${(.2 + ease.outCubic(sk) * 3.2).toFixed(3)})`);

      // the dashboard
      const dk = tw(t, 12.05, 12.45, ease.outCubic);
      look(dash, dk, { y: (1 - dk) * 60 });
      dash.querySelectorAll('.kpi').forEach((k, i) => look(k, prog(t, 12.1 + i * .07, 12.3 + i * .07), { y: (1 - ease.outBack(prog(t, 12.1 + i * .07, 12.45 + i * .07))) * 40 }));
      const cu = ease.outCubic(prog(t, 12.2, 13.0));
      kv[0].textContent = fmt(Math.round(12480 * cu));
      kv[1].textContent = (99 + .98 * cu).toFixed(2) + '%';
      kv[2].textContent = (4 + .9 * cu).toFixed(1);
      const lk = tw(t, 12.3, 13.1, ease.inOutSine);
      d$('#ccr').setAttribute('width', (30 + lk * 740).toFixed(1));
      const ex = 30 + lk * 720;
      // the end of the line rides along as it is drawn
      let ey = pts[0][1];
      for (let i = 1; i < pts.length; i++) if (ex <= pts[i][0]) { const u = (ex - pts[i - 1][0]) / 80; ey = lerp(pts[i - 1][1], pts[i][1], ease.inOutSine(u)); break; } else ey = pts[i][1];
      for (const id of ['#end', '#endr']) { const c = d$(id); c.setAttribute('cx', ex.toFixed(1)); c.setAttribute('cy', ey.toFixed(1)); }
      d$('#end').style.opacity = prog(t, 12.3, 12.4).toFixed(3);
      const pr = t > 13.1 ? ((t - 13.1) % .8) / .8 : 0;
      d$('#endr').setAttribute('r', (11 + pr * 26).toFixed(1)); d$('#endr').style.opacity = (t > 13.1 ? (1 - pr) * .9 : 0).toFixed(3);
      look(d$('#tip'), prog(t, 13.1, 13.2), { s: ease.outBack(prog(t, 13.1, 13.35)), y: 0 });
      rl.forEach((r, i) => { r.classList.toggle('on', t >= [12.9, 13.05, 99][i]); look(r, prog(t, 12.4 + i * .08, 12.6 + i * .08)); });
      void end;
    },
  };
}
