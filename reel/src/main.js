// The master timeline: builds every scene, then window.render(t) draws the frame at time t.
// Everything on screen is the Refract Tech website: its cards, its hero, its services, its chain.
import { bump, ease, h, look, prog, track } from './lib.js';
import { C, Cursor, Headline, Sky, StepRail, Streak } from './ui.js';
import { Chain, Deck, Hero, Hook, paintCards, STAGE_AT, Work } from './scenes.js';
import { Close, Site } from './finale.js';

export const DURATION = 27.0;
const FIN = 3.5;   // the finale's own clock runs this far behind the reel's
const world = document.getElementById('world'), hud = document.getElementById('hud'), fx = document.getElementById('fx');
const sky = Sky(document.getElementById('sky'));

const STAGES = [
  ['Discover', 'Understand', 'what matters.'], ['Design', 'Give the idea', 'a clear form.'], ['Build', 'Make every', 'interaction work.'],
  ['Connect', 'Connect the', 'intelligence.'], ['Launch', 'Bring it', 'into the world.'], ['Evolve', 'Keep making', 'it better.'],
];

async function build() {
  const cards = await paintCards();
  const mark = new Image(); mark.src = 'assets/r-mark.png'; await mark.decode();
  const S = {
    hero: Hero(world), deck: Deck(world, cards), work: Work(world), chain: Chain(world),
    site: Site(world), close: Close(world), hook: Hook(world, mark),
  };
  // ---- words
  const W = {
    site: Headline(hud, [], { label: 'refract-tech.com', labelColor: C.purple }),
    steps: STAGES.map(([name, a, b], i) => Headline(hud, [[a], [b, true]], { label: `Step 0${i + 1} · ${name}`, labelColor: C.stages[i], size: 84 })),
    work: Headline(hud, [['Products we'], ['bring to life.', true]], { label: 'What we build', labelColor: C.purple, size: 94 }),
    chain: Headline(hud, [['Every discipline'], ['your product needs.', true]], { label: 'Our expertise', labelColor: C.purple, size: 88 }),
  };
  const rail = StepRail(hud);
  const cursor = Cursor(document.getElementById('cur'));
  const PATHS = [
    [[14.05, 1000, 1640, 0], [14.18, 880, 1540, 1], [14.48, 300, 1345, 1, ease.outCubic], [14.6, 300, 1345, 1], [15.1, 560, 1480, 1], [15.4, 700, 1600, 0]],
    [[25.22, 1010, 1720, 0], [25.36, 920, 1580, 1], [25.65, 640, 1292, 1, ease.outCubic], [25.74, 640, 1292, 1], [26.35, 700, 1372, 1], [26.7, 720, 1400, 0]],
  ];
  const CLICKS = [14.55, 25.7];
  const streak = Streak(fx);
  const CUTS = [[13.75, .5, -1], [19.95, .5], [21.95, .45], [23.55, .5, -1]];
  const flash = h('div', '', fx); flash.id = 'flash';

  window.render = t => {
    const f = t - FIN;
    const lvl = t < 2.6 ? track(t, [[0, .1], [.5, .3], [1.3, .85], [2.6, 1]]) : S.close.sky(f);
    sky.draw(t, lvl, S.hook.focus(t) || S.close.focus(f) || { x: 540, y: 1060, r: 900, a: .35 });
    world.style.perspectiveOrigin = '540px 1040px';
    S.hook.update(t); S.hero.update(t); S.deck.update(t, S.hero.DECK); S.work.update(t); S.chain.update(t);
    S.site.update(f); S.close.update(f);

    W.site.update(t, 2.5, 3.95);
    W.steps.forEach((w, i) => w.update(t, i ? STAGE_AT(i) - .3 : 4.7, i < 5 ? STAGE_AT(i + 1) - .32 : 13.25));
    rail.update(t, 4.7, 13.3, x => prog(x, 4.7, 5.0) + S.deck.stageF(x));
    W.work.update(t, 13.78, 19.8);
    W.chain.update(t, 20.0, 21.85);

    cursor.update(t, PATHS.find(p => t >= p[0][0] && t <= p[p.length - 1][0]), CLICKS);
    streak.update(t, CUTS);
    look(flash, Math.max(bump(t, .42, .7) * .8, bump(t, 1.06, 1.4) * .55, bump(t, 24.05, 24.45) * .75));
  };

  // ---- the soundtrack's cue sheet: one sound for each thing that happens, never two at once
  window.EVENTS = {
    duration: DURATION, groove: [2.6, 22.0], siteSec: [22.0, 23.5], logo: [24.12],
    lock: [S.hook.LOCK],                                    // the R locks together
    whoosh: [2.2, 3.85, ...[1, 2, 3, 4, 5].map(i => STAGE_AT(i) - .45), 13.2, 15.75, 17.85, 19.75],
    hit: [13.75],                                           // into what we build
    reveal: [20.9],                                         // the chain lights up
    click: CLICKS, riser: [[21.35, 22.0]], shatter: [23.5],
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
