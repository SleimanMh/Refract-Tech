// The master timeline: builds every scene, then window.render(T) draws the frame at reel time T.
// Everything on screen is the Refract Tech website: its logo, hero, stage cards, chain and contact form.
//
// The scenes are written on their own "scene clock". A time map turns reel time into scene time,
// so the moments meant to be read (each card at rest, the hero, the chain, the form, the logo) are
// held longer while the movements between them keep their pace, and parts can be cut out whole.
import { bump, ease, h, look, prog, track } from './lib.js';
import { C, Cursor, Headline, Sky, StepRail, Streak } from './ui.js';
import { Chain, Deck, Hero, Hook, paintCards, STAGE_AT } from './scenes.js';
import { Close, Site } from './finale.js';

const LATE = 5.85;  // the chain and the finale were written on a clock this far ahead (the cut service cards)
const FIN = 3.5;    // and the finale's own clock runs this far behind that one

// [scene from, scene to, stretch]: each stretch of scene time plays `stretch` times slower.
// The chain and the finale run on the late clock, LATE ahead, so they follow the deck directly.
const HOLD = 2.2;   // how much longer a card stays at rest, so every line on it can be read
const WARP = [
  [0, 1.15, 1],                 // the spark, the ring, the R locking together
  [1.15, 2.15, 1.7],            // the name and tag: read
  [2.15, 2.7, 1],               // into the website
  [2.7, 3.7, 1.9],              // the hero: read
  [3.7, 5.0, 1.1],              // into its deck, which opens
  ...[0, 1, 2, 3, 4].flatMap(i => [[STAGE_AT(i), STAGE_AT(i) + 1, HOLD], [STAGE_AT(i) + 1, STAGE_AT(i + 1), 1.2]]),
  [STAGE_AT(5), 13.15, 2.8],    // the last stage: read
  [13.15, 21.0 - LATE, 1.15],   // the deck gathers and leaves as the expertise chain builds
  [21.0 - LATE, 21.75 - LATE, 2.6],    // the chain is read
  [21.75 - LATE, 22.45 - LATE, 1],     // into the website
  [22.45 - LATE, 23.25 - LATE, 1.6],   // scrolling, slower
  [23.25 - LATE, 23.5 - LATE, 3],      // the contact form: read
  [23.5 - LATE, 25.0 - LATE, 1.1],     // it shatters into the logo
  [25.0 - LATE, 27.0 - LATE, 1.4],     // the close, held
];
let acc = 0;
const SEG = WARP.map(([a, b, s]) => { const T0 = acc; acc += (b - a) * s; return { a, b, s, T0, T1: acc }; });
export const DURATION = +acc.toFixed(3);
/** scene time at reel time T */
const sceneAt = T => { for (const g of SEG) if (T <= g.T1) return g.a + Math.max(0, T - g.T0) / g.s; return SEG[SEG.length - 1].b; };
/** reel time of a scene time, or null when that part is cut */
const reelAt = t => { for (const g of SEG) if (t >= g.a && t <= g.b) return +(g.T0 + (t - g.a) * g.s).toFixed(3); return null; };

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
    hero: Hero(world), deck: Deck(world, cards), chain: Chain(world),
    site: Site(world), close: Close(world), hook: Hook(world, mark),
  };
  // ---- words
  const W = {
    site: Headline(hud, [], { label: 'refract-tech.com', labelColor: C.purple }),
    steps: STAGES.map(([name, a, b], i) => Headline(hud, [[a], [b, true]], { label: `Step 0${i + 1} · ${name}`, labelColor: C.stages[i], size: 84 })),
    chain: Headline(hud, [['Every discipline'], ['your product needs.', true]], { label: 'Our expertise', labelColor: C.purple, size: 88 }),
  };
  const rail = StepRail(hud);
  const cursor = Cursor(document.getElementById('cur'));
  const PATHS = [
    [[25.22, 1010, 1720, 0], [25.36, 920, 1580, 1], [25.65, 640, 1292, 1, ease.outCubic], [25.74, 640, 1292, 1], [26.35, 700, 1372, 1], [26.7, 720, 1400, 0]],
  ];
  const CLICKS = [25.7];
  const streak = Streak(fx);
  const CUTS = [[21.95, .45], [23.55, .5, -1]];
  const flash = h('div', '', fx); flash.id = 'flash';

  window.render = T => {
    const t = sceneAt(T), tl = t + LATE, f = tl - FIN;
    const lvl = t < 2.6 ? track(t, [[0, .1], [.5, .3], [1.3, .85], [2.6, 1]]) : S.close.sky(f);
    sky.draw(T, lvl, S.hook.focus(t) || S.close.focus(f) || { x: 540, y: 1060, r: 900, a: .35 });
    world.style.perspectiveOrigin = '540px 1040px';
    S.hook.update(t); S.hero.update(t); S.deck.update(t, S.hero.DECK); S.chain.update(tl);
    S.site.update(f); S.close.update(f);

    W.site.update(t, 2.5, 3.95);
    W.steps.forEach((w, i) => w.update(t, i ? STAGE_AT(i) - .3 : 4.7, i < 5 ? STAGE_AT(i + 1) - .32 : 13.25));
    rail.update(t, 4.7, 13.3, x => prog(x, 4.7, 5.0) + S.deck.stageF(x));
    W.chain.update(tl, 20.0, 21.85);

    cursor.update(tl, PATHS.find(p => tl >= p[0][0] && tl <= p[p.length - 1][0]), CLICKS);
    streak.update(tl, CUTS);
    look(flash, Math.max(bump(t, .42, .7) * .8, bump(t, 1.06, 1.4) * .55, bump(tl, 24.05, 24.45) * .75));
  };

  // ---- the soundtrack's cue sheet, in reel time: one sound for each thing that happens
  const at = list => list.map(reelAt).filter(x => x !== null), late = list => at(list.map(x => x - LATE));
  window.EVENTS = {
    duration: DURATION, groove: [...at([2.6]), ...late([22.0])], siteSec: late([22.0, 23.5]), logo: late([24.12]),
    lock: at([S.hook.LOCK]),                                                        // the R locks together
    whoosh: at([2.2, 3.85, ...[1, 2, 3, 4, 5].map(i => STAGE_AT(i) - .45), 13.4]),  // between scenes and cards
    reveal: late([20.9]),                                                           // the chain lights up
    click: late(CLICKS), riser: [late([21.35, 22.0])], shatter: late([23.5]),
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
