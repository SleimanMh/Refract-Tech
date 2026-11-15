// The master timeline: builds every scene, then window.render(t) draws the frame at time t.
import { bump, ease, h, look, prog, track } from './lib.js';
import { C, Cursor, Headline, Sky, StepRail, Streak } from './ui.js';
import { Code, Connect, Hook, Launch, Product, STORY_EVENTS, TL } from './story.js';
import { Close, FIN_EVENTS, Services, Site } from './finale.js';

export const DURATION = 23.5;
const world = document.getElementById('world'), hud = document.getElementById('hud'), fx = document.getElementById('fx');
const sky = Sky(document.getElementById('sky'));

// scenes, back to front
const connect = Connect(world);
const launch = Launch(world);       // the browser window sits behind the product…
const product = Product(world);
launch.front(world);                 // …its deploy card, status and dashboard in front of it
const code = Code(world);
const hook = Hook(world);
const services = Services(world);
const site = Site(world);
const close = Close(world);

// ---- words, one message per transformation
const hookLine = Headline(hud, [['Your idea.'], ['Built beyond', true], ['ordinary.', true]], { align: 'center', y: 560, size: 128, weight: 500, width: 1000, lh: 1.02 });
const STEPS = [
  ['Discover', 'From idea', 'to impact.'], ['Design', 'Designed to', 'stand out.'], ['Build', 'Engineered', 'to perform.'],
  ['Connect', 'Connected', 'to everything.'], ['Launch', 'Ready for', 'the world.'], ['Evolve', 'Built', 'to evolve.'],
];
const stepKeys = ['discover', 'design', 'build', 'connect', 'launch', 'evolve'];
const steps = STEPS.map(([name, a, b], i) => Headline(hud, [[a], [b, true]], { label: `0${i + 1} · ${name}`, labelColor: C.stages[i], size: 98 }));
const rail = StepRail(hud);
const stepAt = t => stepKeys.reduce((p, k) => p + prog(t, TL[k][0], TL[k][0] + .35), 0);
const svcLabel = Headline(hud, [], { label: 'What we build', labelColor: C.purple });
const SVC = [['Web platforms', '& custom software.'], ['Mobile', 'applications.'], ['Automation,', 'AI & integrations.']];
const svcHeads = SVC.map(([a, b]) => Headline(hud, [[a], [b, true]], { y: 280, size: 94 }));

// ---- the pointer: one path per moment it acts
const cursor = Cursor(document.getElementById('cur'));
const PATHS = [
  [[3.42, 1130, 1580, 0], [3.58, 990, 1320, 1], [3.9, 618, 782, 1, ease.outCubic], [3.98, 618, 782, 1], [4.38, 780, 1260, 1], [4.5, 830, 1380, 0]],
  [[5.72, 990, 1620, 0], [5.88, 900, 1460, 1], [6.06, 556, 1262, 1, ease.outCubic], [6.14, 556, 1262, 1], [6.42, 720, 1470, 0]],
  [[7.92, 1010, 1660, 0], [8.04, 900, 1560, 1], [8.17, 640, 1432, 1, ease.outCubic], [8.24, 640, 1432, 1], [8.5, 780, 1560, 0]],
  [[14.32, 1000, 1600, 0], [14.45, 880, 1380, 1], [14.71, 262, 1006, 1, ease.outCubic], [14.79, 262, 1006, 1], [15.1, 640, 1200, 1], [15.42, 900, 1480, 0]],
  [[21.72, 1010, 1720, 0], [21.86, 920, 1580, 1], [22.15, 640, 1292, 1, ease.outCubic], [22.24, 640, 1292, 1], [22.85, 700, 1372, 1], [23.2, 720, 1400, 0]],
];
const CLICKS = [3.95, 6.1, 8.2, 14.75, 22.2];

// ---- light that ties the cuts together, and flashes on the big moments
const streak = Streak(fx);
const CUTS = [[2.45, .55], [8.55, .6, -1], [11.3, .5], [14.0, .5], [18.45, .45], [20.05, .5, -1]];
const flash = h('div', '', fx); flash.id = 'flash';

window.render = t => {
  const lvl = t < 2.5 ? track(t, [[0, .1], [.5, .3], [1.3, .85], [2.5, 1]]) : close.sky(t);
  sky.draw(t, lvl, hook.focus(t) || close.focus(t) || { x: 540, y: 1040, r: 860, a: .3 + .5 * bump(t, 10.9, 11.9) });

  hook.update(t); connect.update(t); launch.update(t); product.update(t); code.update(t);
  services.update(t); site.update(t); close.update(t);

  hookLine.update(t, 1.36, 2.42);
  stepKeys.forEach((k, i) => steps[i].update(t, TL[k][0] + (i ? .02 : -.02), TL[k][1] - .02));
  rail.update(t, 2.45, 13.98, stepAt);
  svcLabel.update(t, 14.02, 18.32);
  svcHeads.forEach((hd, i) => hd.update(t, 14.02 + i * 1.5, i < 2 ? 15.47 + i * 1.5 : 18.32));

  const path = PATHS.find(p => t >= p[0][0] && t <= p[p.length - 1][0]);
  cursor.update(t, path, CLICKS);
  streak.update(t, CUTS);
  const fl = Math.max(bump(t, .42, .7), bump(t, 11.24, 11.6) * .7, bump(t, 20.55, 20.95) * .75);
  look(flash, fl);
};

// ---- the soundtrack's cue sheet
const E = {};
for (const src of [STORY_EVENTS, FIN_EVENTS]) for (const [k, v] of Object.entries(src)) E[k] = (E[k] || []).concat(v);
E.frag = Array.from({ length: 14 }, (_, i) => +(.62 + i * .045).toFixed(3));
E.duration = DURATION;
window.EVENTS = E;
window.DURATION = DURATION;

window.ready = (async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => (i.complete ? i.decode() : new Promise(r => { i.onload = r; i.onerror = r; }).then(() => i.decode())).catch(() => {})));
  window.render(0);
})();
