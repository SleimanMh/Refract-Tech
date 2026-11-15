// Films the 60 Days Challenge app (github.com/SleimanMh/60-days-challenge) for the case-study reel,
// running locally with the demo squad from challenge-demo.js. Serve the app's public/ folder first:
//   (cd <repo>/public && python3 -m http.server 4280)   then   node scripts/capture-challenge.js
// Writes reel/assets/challenge/.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'assets', 'challenge'), URL = 'http://localhost:4280/index.html';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const open = async (owner = false) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript({ path: path.join(__dirname, 'challenge-demo.js') });
    if (owner) await ctx.addInitScript(() => { window.__owner = true; });
    await ctx.route(/gstatic|firebase|googletagmanager/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
    return p;
  };
  const p = await open();
  const shot = async (name, o = {}) => { await p.screenshot({ path: path.join(OUT, name + '.png'), ...o }); console.log('shot', name); };
  const el = async (name, sel) => { await p.locator(sel).first().screenshot({ path: path.join(OUT, name + '.png') }); console.log('shot', name); };
  await shot('top');
  await shot('full', { fullPage: true });
  await el('mission', '#mission');
  await el('board', '#board');
  await el('phases', '#phases');
  // today's tile in the plan (.tile.is-today), with the two rows around it, before and after the check-in
  const tile = async name => {
    const box = await p.evaluate(() => { const t = document.querySelector('#phases .tile.is-today'); t.scrollIntoView({ block: 'center' }); const r = t.getBoundingClientRect(); return { y: r.y, h: r.height }; });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: 0, y: Math.max(0, box.y - box.h * 1.1), width: 390, height: box.h * 3.25 } }); console.log('shot', name);
  };
  await tile('grid-today');
  await p.evaluate(() => document.getElementById('mission').scrollIntoView({ block: 'center' }));
  await p.locator('#mission button').first().click(); await p.waitForTimeout(600);
  await el('mission-done', '#mission');
  await tile('grid-today-done');
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  await shot('board-after', { fullPage: false });
  // the coach's view: levels to assign
  const q = await open(true);
  await q.evaluate(() => document.getElementById('admin-sec')?.scrollIntoView({ block: 'start' })); await q.waitForTimeout(400);
  await q.screenshot({ path: path.join(OUT, 'coach.png') }); console.log('shot coach');
  for (const f of ['eagle.png', 'poster.jpg']) fs.copyFileSync(path.join(process.env.APP_PUBLIC || '/home/user/sleimanmh/60-days-challenge/public', f), path.join(OUT, f));
  await b.close();
})();
