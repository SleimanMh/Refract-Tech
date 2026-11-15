// Stills of the live site as a phone shows it, sharp enough to fill most of a 1080 px wide frame.
// Needs the site served locally:  npm run build && npx vite preview --port 4173
// Writes reel/assets/site/{header,hero,stage,work,work2,contact}.png at 3x (1170 px wide).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'assets', 'site');
const W = 390, H = 844;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.waitForSelector('.deck-stage.is-ready', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(2500);
  const shot = async (name, clip) => { await p.screenshot({ path: path.join(OUT, name + '.png'), clip }); console.log('shot', name); };
  await shot('header', { x: 0, y: 0, width: W, height: 64 });
  // hide the fixed chrome so the stills stack into one continuous page
  await p.addStyleTag({ content: '.site-header,a.wa{visibility:hidden!important}' });
  await shot('hero');
  const story = await p.evaluate(() => { const s = document.querySelector('.story'); return { top: s.offsetTop, range: s.offsetHeight - innerHeight }; });
  const centre = i => .18 + .11 * i + .11 * .42 * .5;
  await p.evaluate(y => window.scrollTo(0, y), story.top + centre(1) * story.range);
  await p.waitForTimeout(2500); await shot('stage');
  for (const [id, name, dy] of [['work', 'work', 0], ['work', 'work2', H], ['contact', 'contact', 0]]) {
    await p.evaluate(([id, dy]) => { const el = document.getElementById(id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + dy); }, [id, dy]);
    await p.waitForTimeout(2200); await shot(name);
  }
  await b.close();
})();
