// The master timeline: builds every scene, then window.render(t) draws the frame at time t.
// Everything on screen is the Refract Tech website: its cards, its hero, its services, its chain.
import { bump, ease, h, look, prog, track } from './lib.js';
import { C, Cursor, Headline, Sky, StepRail, Streak } from './ui.js';
import { Chain, Deck, Hero, Hook, paintCards, STAGE_AT, Work } from './scenes.js';
import { Close, Site } from './finale.js';

export const DURATION = 24.0;
const FIN = .5;   // the finale's own clock runs this far behind the reel's
const world = document.getElementById('world'), hud = document.getElementById('hud'), fx = document.getElementById('fx');
const sky = Sky(document.getElementById('sky'));

const STAGES = [
  ['Discover', 'Understand', 'what matters.'], ['Design', 'Give the idea', 'a clear form.'], ['Build', 'Make every', 'interaction work.'],
  ['Connect', 'Connect the', 'intelligence.'], ['Launch', 'Bring it', 'into the world.'], ['Evolve', 'Keep making', 'it better.'],
];

async function build() {
  const cards = await paintCards();
  const S = {
    hero: Hero(world), deck: Deck(world, cards), work: Work(world), chain: Chain(world),
    site: Site(world), close: Close(world), hook: Hook(world, cards),
  };
  // ---- words
  const W = {
    hook: Headline(hud, [['Your idea.'], ['Built into', true], ['a product.', true]], { align: 'center', y: 560, size: 128, weight: 500, width: 1000, lh: 1.02 }),
    site: Headline(hud, [], { label: 'refract-tech.com', labelColor: C.purple }),
    steps: STAGES.map(([name, a, b], i) => Headline(hud, [[a], [b, true]], { label: `Step 0${i + 1} · ${name}`, labelColor: C.stages[i], size: 84 })),
    work: Headline(hud, [['Products we'], ['bring to life.', true]], { label: 'What we build', labelColor: C.purple, size: 94 }),
    chain: Headline(hud, [['Every discipline'], ['your product needs.', true]], { label: 'Our expertise', labelColor: C.purple, size: 88 }),
  };
  const rail = StepRail(hud);
  const cursor = Cursor(document.getElementById('cur'));
  const PATHS = [
    [[14.05, 1000, 1640, 0], [14.18, 880, 1540, 1], [14.48, 300, 1345, 1, ease.outCubic], [14.6, 300, 1345, 1], [14.85, 560, 1480, 1], [15.0, 700, 1600, 0]],
    [[22.22, 1010, 1720, 0], [22.36, 920, 1580, 1], [22.65, 640, 1292, 1, ease.outCubic], [22.74, 640, 1292, 1], [23.35, 700, 1372, 1], [23.7, 720, 1400, 0]],
  ];
  const CLICKS = [14.55, 22.7];
  const streak = Streak(fx);
  const CUTS = [[2.25, .5], [13.75, .5, -1], [16.95, .5], [18.95, .45], [20.55, .5, -1]];
  const flash = h('div', '', fx); flash.id = 'flash';

  window.render = t => {
    const f = t - FIN;
    const lvl = t < 2.4 ? track(t, [[0, .1], [.5, .3], [1.3, .85], [2.4, 1]]) : S.close.sky(f);
    sky.draw(t, lvl, S.hook.focus(t) || S.close.focus(f) || { x: 540, y: 1060, r: 900, a: .35 });
    world.style.perspectiveOrigin = '540px 1040px';
    S.hook.update(t); S.hero.update(t); S.deck.update(t, S.hero.DECK); S.work.update(t); S.chain.update(t);
    S.site.update(f); S.close.update(f);

    W.hook.update(t, 1.36, 2.3);
    W.site.update(t, 2.35, 3.95);
    W.steps.forEach((w, i) => w.update(t, i ? STAGE_AT(i) - .3 : 4.7, i < 5 ? STAGE_AT(i + 1) - .32 : 13.25));
    rail.update(t, 4.7, 13.3, x => prog(x, 4.7, 5.0) + S.deck.stageF(x));
    W.work.update(t, 13.78, 16.8);
    W.chain.update(t, 17.0, 18.85);

    cursor.update(t, PATHS.find(p => t >= p[0][0] && t <= p[p.length - 1][0]), CLICKS);
    streak.update(t, CUTS);
    look(flash, Math.max(bump(t, .42, .7), bump(t, 21.05, 21.45) * .75));
  };

  // ---- the soundtrack's cue sheet
  window.EVENTS = {
    duration: DURATION, groove: [2.3, 19.0], siteSec: [19.0, 20.5], logo: [21.12],
    spark: [0.02], flash: [0.48], frag: S.hook.arrivals,
    whoosh: [1.25, 3.85, ...[1, 2, 3, 4, 5].map(i => STAGE_AT(i) - .45), 13.25, 13.75, 16.7, 18.9],
    hit: [2.3, 4.6, 13.75, 17.0], tick: [0, 1, 2, 3, 4, 5].map(i => STAGE_AT(i)), sweep: [0, 1, 2, 3, 4, 5].map(i => STAGE_AT(i) + .8),
    pop: [0, 1, 2, 3, 4, 5].map(i => 17.2 + i * .14), click: CLICKS, riser: [[18.35, 19.0]], shatter: [20.5],
    success: [18.0], swipe: [14.85, 15.95],
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
