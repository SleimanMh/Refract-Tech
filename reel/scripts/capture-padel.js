// Captures The Padel Lounge website (tplrachaya.com) for the case-study reel: phone-sized 3× stills
// of each page and section, its logos and gallery photos. Writes reel/assets/padel/.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'assets', 'padel'), BASE = 'https://tplrachaya.com';
const W = 390, H = 844;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const settle = async () => { await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(1800); };
  const shot = async (name, opts = {}) => { await p.screenshot({ path: path.join(OUT, name + '.png'), ...opts }); console.log('shot', name); };
  await p.goto(BASE, { waitUntil: 'networkidle' }); await settle();
  await shot('home-hero');
  await shot('home-full', { fullPage: true });
  for (const id of ['court', 'experience', 'gallery', 'pricing']) {
    await p.evaluate(id => document.getElementById(id)?.scrollIntoView(), id); await p.waitForTimeout(1500);
    await shot('home-' + id);
  }
  for (const page of ['book', 'guide', 'programs', 'contact']) {
    await p.goto(BASE + '/' + page, { waitUntil: 'networkidle' }).catch(() => {}); await settle();
    await shot(page); await shot(page + '-full', { fullPage: true });
  }
  // the brand files and photos, straight from the site (curl goes through the network proxy)
  const html = require('child_process').execFileSync('curl', ['-sSL', BASE + '/'], { encoding: 'utf8' });
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/(?:gallery\/[^"]+\.(?:jpg|png|webp)|logo-mark\.svg|refract\.png))"/g)].map(m => m[1]))];
  for (const a of assets) { require('child_process').execFileSync('curl', ['-sSL', '-o', path.join(OUT, path.basename(a)), BASE + a]); console.log('saved', a); }
  // the TPL mark as a transparent PNG, for the collaboration lockup
  const svg = fs.readFileSync(path.join(OUT, 'logo-mark.svg'), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/width="\d+" height="\d+"/, 'width="1000" height="1000"');
  const sp = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  await sp.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`); await sp.waitForTimeout(400);
  await sp.screenshot({ path: path.join(OUT, 'tpl-mark.png'), omitBackground: true }); console.log('saved tpl-mark.png');
  require('child_process').execFileSync('python3', ['-I', path.join(__dirname, 'center_logo.py'), path.join(OUT, 'tpl-mark.png'), path.join(OUT, 'tpl-mark-centered.png'), '.04']);
  await b.close();
})();
