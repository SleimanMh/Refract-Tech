// Renders the reel frame by frame with Playwright.
//   node scripts/render.js                → out/samples/s00000.jpg …  (3 sub-frames per frame, for motion blur)
//   node scripts/render.js --stills 0.3 1.5 …  → out/stills/t0.30.png … (single frames, for review)
// Options: --samples N (default 3), --workers N (default 3), --from F --to F (frame range)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), FPS = 30;
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
// --page series.html?ep=discover renders another page; --out sets where frames and the cue sheet go
const PAGE = opt('page', 'index.html'), OUT = path.resolve(ROOT, opt('out', 'out'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(d); } });
});
async function page(browser) {
  // --scale 2 renders every frame at 2160 × 3840 (4K) from the same 1080 × 1920 layout
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: +opt('scale', 1) });
  p.on('pageerror', e => console.error('pageerror', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await p.goto('http://localhost:4191/' + PAGE, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.ready);
  return p;
}
(async () => {
  await new Promise(r => server.listen(4191, r));
  const si = args.indexOf('--stills');
  if (si >= 0) {
    const times = args.slice(si + 1).filter(a => /^[0-9.]+$/.test(a)).map(Number);
    fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
    const b = await chromium.launch(); const p = await page(b);
    for (const t of times) { await p.evaluate(t => window.render(t), t); await p.screenshot({ path: path.join(OUT, 'stills', `t${t.toFixed(2)}.png`) }); }
    await b.close(); server.close(); return;
  }
  const S = +opt('samples', 3), W = +opt('workers', 3);
  const dir = path.join(OUT, 'samples'); fs.mkdirSync(dir, { recursive: true });
  const probe = await chromium.launch(); const pp = await page(probe);
  const meta = await pp.evaluate(() => ({ duration: window.DURATION, events: window.EVENTS }));
  fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(meta.events, null, 1));
  await probe.close();
  const from = +opt('from', 0), to = +opt('to', Math.round(meta.duration * FPS));
  let next = from * S; const last = to * S, t0 = Date.now(); let done = 0;
  // sub-frame j of frame f is shown at f/30 + j/(30·S)·½ — a 180° shutter
  await Promise.all(Array.from({ length: W }, async () => {
    const b = await chromium.launch(); const p = await page(b);
    while (next < last) {
      const k = next++, f = Math.floor(k / S), j = k % S;
      const t = f / FPS + (j / S) * (.5 / FPS);
      await p.evaluate(t => window.render(t), t);
      await p.screenshot({ path: path.join(dir, `s${String(k).padStart(5, '0')}.jpg`), type: 'jpeg', quality: +opt('quality', 94) });
      if (++done % 150 === 0) console.log(`${done}/${last - from * S} samples, ${Math.round((Date.now() - t0) / 1000)}s`);
    }
    await b.close();
  }));
  console.log('done in', Math.round((Date.now() - t0) / 1000) + 's');
  server.close();
})();
