// Refract Tech — website launch reel (~17 s, loops). Built for Reels ranking: the logo and the news land in
// the first half-second, cuts every 2–3 s keep watch time up, a "send them this" beat invites sends, and the
// last frame flows back into the first so it replays seamlessly. No logo outro; a small mark stays in the corner.
import { bez, bump, clamp, ease, h, lerp, look, prog, spring, track, tw } from './lib.js';
import { C, Headline, Sky } from './ui.js';
import { Deck, Hero, paintCards, STAGE_AT } from './scenes.js';
import { Site } from './finale.js';

const BAR = 4 * 60 / 140, START = .08;
export const DURATION = +(START + 10 * BAR).toFixed(3);          // ten bars: the loop lands on the beat
const T = { hero: 1.6, deck: 3.85, site: 9.65, send: 12.35, cta: 14.75 };
const NAMES = ['Discover', 'Design', 'Build', 'Connect', 'Launch', 'Evolve'];

const world = document.getElementById('world'), hud = document.getElementById('hud'), fx = document.getElementById('fx');
const sky = Sky(document.getElementById('sky'));

async function build() {
  const cards = await paintCards();
  const hero = Hero(world), deck = Deck(world, cards), site = Site(world);
  // skip the second work panel on the way down: the scroll goes straight from what we build to the contact form
  world.querySelector('.strip img[src$="work2.png"]').remove();
  const SH = 1948; site.scrollAt = t => track(t, [[18.5, 2 * SH], [18.95, 2 * SH], [19.75, 3 * SH, ease.inOutQuint]]);

  // ---- hook: the R slams in with a shockwave, the news lands with it
  const hk = h('div', 'layer', fx);
  const glow = h('div', 'logo-glow', hk), rings = [h('div', 'hk-ring', hk), h('div', 'hk-ring r2', hk)];
  const ring = h('div', 'logo-ring', hk, `<svg viewBox="0 0 420 420" width="420" height="420"><defs><linearGradient id="lrH" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#713DE8"/><stop offset=".5" stop-color="#B66CFA"/><stop offset="1" stop-color="#FF906B"/></linearGradient></defs><circle cx="210" cy="210" r="196" stroke="url(#lrH)" stroke-width="9" fill="none"/></svg>`);
  const mark = h('img', 'logo-mark', hk); mark.src = 'assets/r-mark.png';
  const sparks = Array.from({ length: 28 }, (_, i) => { const e = h('div', 'spk', hk); const c = ['#B66CFA', '#FF906B', '#F7F5FF', '#713DE8'][i % 4]; e.style.background = c; e.style.boxShadow = `0 0 16px ${c}`; return { e, a: i / 28 * 6.283 + (i % 3) * .2, r: 260 + (i * 97) % 380 }; });
  const news = Headline(hud, [['Our new website'], ['is live.', true]], { align: 'center', y: 940, size: 130, weight: 600, width: 1040 });
  const flash = h('div', '', fx); flash.id = 'flash';

  // ---- the corner mark that carries the brand the whole way
  const mk = h('div', 'mk', hud, `<img src="assets/r-mark.png"><span>Refract <b>Tech</b></span>`);

  // ---- words over each section
  const heroL = h('div', 'lbl', hud, 'refract-tech.com'); heroL.style.color = C.purple;
  const deckH = Headline(hud, [['From idea'], ['to launch.', true]], { y: 236, size: 96 });
  const step = h('div', 'lbl', hud); step.style.top = '1690px';
  const sendH = Headline(hud, [['Know someone'], ['with a big idea?'], ['Send them this.', true]], { align: 'center', y: 640, size: 112, weight: 600, width: 1040 });
  const plane = h('div', 'plane', hud, `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M22 3L9.2 10.2M22 3l-6.5 18-3.5-8.6L3 9.2 22 3z"/></svg>`);
  const trail = h('div', 'trail', hud);
  const ctaH = Headline(hud, [['Your next product'], ['starts here.', true]], { align: 'center', y: 560, size: 108, weight: 600, width: 1040 });
  const domain = h('div', 'domain', hud, `<span class="sheen2"></span><span class="d-t">refract-tech.com</span>`);
  const sheen = domain.querySelector('.sheen2');
  const badge = h('div', 'badge', hud, `<i></i>Live now`);
  const bio = h('div', 'bio', hud, 'Link in bio');
  const loop = h('div', 'loopflash', fx);

  // each borrowed scene runs on its own clock; these maps fit them into the reel's pace
  const heroT = t => track(t, [[T.hero, 2.25], [2.4, 3.0, ease.linear], [3.4, 3.7, ease.linear], [T.deck + .15, 4.35, ease.linear]]);
  const DK = [[T.deck, 3.95], [4.6, 5.0]]; let r = 4.6;
  for (let i = 0; i < 5; i++) { r += .5; DK.push([r, STAGE_AT(i) + 1]); r += .25; DK.push([r, STAGE_AT(i + 1)]); }
  DK.push([r += .55, 13.15], [r += .4, 13.7], [T.site + .05, 14.1]);
  const deckT = t => track(t, DK.map(([a, b]) => [a, b, ease.linear]));
  const siteT = t => track(t, [[T.site - .05, 18.35, ease.linear], [10.1, 18.95, ease.linear], [11.5, 19.75, ease.linear], [T.send + .05, 20.01, ease.linear]]);
  const CUTS = [T.hero, T.deck, T.site, T.send, T.cta];

  window.render = t => {
    sky.draw(t, 1, { x: 540, y: t < T.hero ? 640 : 1000, r: 900, a: t < T.hero ? .6 : .35 });
    world.style.perspectiveOrigin = '540px 1040px';
    hero.update(t >= T.hero - .05 && t < T.deck + .2 ? heroT(t) : 0);
    deck.update(t >= T.deck - .05 && t < T.site + .1 ? deckT(t) : 0, hero.DECK);
    site.update(t >= T.site - .1 && t < T.send + .1 ? siteT(t) : 0);

    // hook
    hk.style.display = t < T.hero + .1 ? '' : 'none';
    const out = ease.inCubic(prog(t, T.hero - .3, T.hero));
    const s = ease.outExpo(prog(t, START, START + .25)), at = (x, y) => `translate(${x}px,${y}px) translate(-50%,-50%)`;
    look(mark, clamp(s * 3) * (1 - out), `${at(540, 640)} scale(${(1 + (1 - s) * 2.6 + out * 2).toFixed(3)})`, (1 - s) * 16);
    look(ring, clamp(s * 2) * (1 - out), `${at(540, 640)} scale(${(.7 + .3 * s + out * 1.5).toFixed(3)}) rotate(${(t * 40).toFixed(1)}deg)`);
    look(glow, (.6 + .4 * bump(t, START, START + .5)) * (1 - out), `${at(540, 640)} scale(1.2)`);
    rings.forEach((rg, i) => { const u = prog(t, START + .05 + i * .08, START + .75 + i * .08); look(rg, u > 0 && u < 1 ? 1 - u : 0, `${at(540, 640)} scale(${(.3 + ease.outCubic(u) * 3.6).toFixed(3)})`); });
    sparks.forEach(({ e, a, r: rr }) => { const u = prog(t, START + .05, START + .9), d = ease.outCubic(u) * rr; look(e, u > 0 && u < 1 ? 1 - u * u : 0, `translate(${(540 + Math.cos(a) * d).toFixed(1)}px,${(640 + Math.sin(a) * d + u * u * 140).toFixed(1)}px) scale(${(1.2 - u * .6).toFixed(3)})`); });
    news.update(t, START + .12, T.hero - .1);
    look(flash, Math.max(bump(t, 0, START + .35), bump(t, T.cta - .05, T.cta + .3) * .5));

    // corner mark and section words
    look(mk, prog(t, T.hero, T.hero + .3) * (1 - prog(t, DURATION - .35, DURATION - .15)), `translateX(${((1 - ease.outExpo(prog(t, T.hero, T.hero + .5))) * -60).toFixed(1)}px)`);
    look(heroL, prog(t, T.hero + .1, T.hero + .35) * (1 - prog(t, T.deck - .2, T.deck)));
    deckH.update(t, T.deck + .05, T.site - .05);
    const sf = deck.stageF(deckT(t)), cur = Math.min(5, Math.round(sf));
    const on = t > T.deck + .7 && t < T.site - .1;
    step.innerHTML = `<span style="color:${C.stages[cur]}">0${cur + 1} · ${NAMES[cur]}</span>`;
    look(step, on ? 1 : 0, `scale(${(1 + .08 * Math.max(0, 1 - Math.abs(sf - cur) * 4)).toFixed(3)})`);

    // send them this: a paper plane streaks across
    sendH.update(t, T.send + .05, T.cta - .05);
    const pu = prog(t, T.send + 1.2, T.send + 1.9), pp = bez([-100, 1500], [300, 1300], [700, 1500], [1180, 1200], ease.inOutSine(pu));
    look(plane, pu > 0 && pu < 1 ? 1 : 0, `translate(${pp[0].toFixed(1)}px,${pp[1].toFixed(1)}px) translate(-50%,-50%) rotate(-10deg)`);
    look(trail, pu > 0 && pu < 1 ? .9 * Math.sin(Math.PI * pu) : 0, `translate(${(pp[0] - 600).toFixed(1)}px,${pp[1].toFixed(1)}px) rotate(-8deg)`);

    // the call: the address, live now, link in bio
    ctaH.update(t, T.cta + .05, 99);
    const dk = spring(t, T.cta + .45, 1.4, .62);
    look(domain, clamp(dk * 2), `${at(540, 1010)} scale(${(.75 + .25 * dk).toFixed(3)})`);
    sheen.style.transform = `translateX(${(-160 + (((t - T.cta - .9) % 1.3 + 1.3) % 1.3) / 1.3 * 520).toFixed(1)}%)`;
    const bk = spring(t, T.cta + .8, 1.6, .55);
    look(badge, clamp(bk * 2), `${at(540, 1150)} scale(${(.6 + .4 * bk).toFixed(3)})`);
    look(bio, prog(t, T.cta + 1.1, T.cta + 1.35), `${at(540, 1270)}`);
    // the last frames flash back to the hook's dark, so the replay is seamless
    look(loop, tw(t, DURATION - .3, DURATION));
  };

  window.EVENTS = {
    duration: DURATION, style: 'jersey', start: START, loop: true,
    clash: [START], slam: [START + .12], slash: [], cuts: [...CUTS, DURATION + 1], outro: [DURATION + 1], lock: [DURATION + 1], cta: [T.cta],
    item: [...[0, 1, 2, 3, 4, 5].map(i => DK.find(([, b]) => b === STAGE_AT(i))?.[0]).filter(Boolean), T.send + 1.2],
  };
  window.render(0);
}

window.DURATION = DURATION;
window.ready = (async () => {
  await document.fonts.ready;
  await build();
  await Promise.all([...document.images].map(i => (i.complete ? i.decode() : new Promise(r => { i.onload = r; i.onerror = r; }).then(() => i.decode())).catch(() => {})));
  window.render(0);
})();
