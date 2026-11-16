# Refract Tech — Instagram reel

A 34 s, 1080 × 1920, 30 fps reel made only of the Refract Tech website: its own stage cards
(drawn by the site's `src/deck/cardArt.ts`, bundled into `assets/cardArt.js`), its hero, its
service cards, its expertise chain and its contact form. Every frame is drawn by
`window.render(t)`, captured with Playwright, motion-blurred from three sub-frames and encoded
with ffmpeg. The soundtrack is original, synthesized from the same cue sheet.

## Make the video

```bash
npm run build && npx vite preview --port 4173     # in the site root: serve the live site
cd reel
node ../node_modules/.bin/esbuild ../src/deck/cardArt.ts --bundle --format=esm --loader:.png=dataurl --outfile=assets/cardArt.js   # after card art changes
npm run capture        # stills of the real site → assets/site/
npm run render         # sub-frames → out/samples/, cue sheet → out/events.json
npm run music          # soundtrack → out/music.wav
npm run encode         # → out/Refract-Tech-reel-v5.mp4
```

Review single frames without a full render: `node scripts/render.js --stills 1.5 7.6 21.2`
(→ `out/stills/`).

## Structure

| File | What it holds |
| --- | --- |
| `src/main.js` | Master timeline: scene order, headlines, step rail, cursor paths, light cuts, cue sheet |
| `src/scenes.js` | Hook (spark → the site's card), hero, the six-card deck, service carousel, expertise chain |
| `src/finale.js` | The live site scrolling to the contact form, which shatters into the logo |
| `src/ui.js` | Reusable parts: sky, `Headline`, `StepRail`, `Cursor`, `Streak`, icons, palette |
| `src/lib.js` | Easing, springs, keyframe `track`, DOM helpers |
| `scripts/` | Site capture, frame renderer, soundtrack synth, encoder |

## Timeline

| s | Scene |
| --- | --- |
| 0–3.4 | The logo builds itself: a spark draws the ring, the R flies together from shards and locks, the name and tag rise in |
| 3.4–6.7 | The site's hero, held to be read; the camera dives into its card deck |
| 6.7–22.5 | The six stage cards, opening and turning like the site's deck; each rests about 2.2 s |
| 22.5–26.9 | The cards gather; our expertise: the six-step chain of disciplines |
| 26.9–29.6 | refract-tech.com scrolling to the contact form, held |
| 29.6–34 | The form shatters and gathers into the logo; "Let's build what's next." and the domain |

Pacing lives in one place: the time map `WARP` in `src/main.js` says how much longer each part of
the scene clock is held (`HOLD` for the cards). The service-card carousel (`Work` in
`src/scenes.js`) is kept but not in the timeline.

The soundtrack plays one sound per event (see the cue sheet in `src/main.js`); only the music
carries an echo, so no effect is ever heard twice.

## "Meet Refract Tech" series

Short business-focused reels (`series.html?ep=…`, `src/series.js`): a 22 s teaser (the logo
building itself, three questions, the three things we build one at a time, the website launching
soon, an animated contact close; its own soundtrack in `scripts/teaser_music.py`), and one 14.5 s episode per stage that
asks the viewer a question about their website or business, shows that stage's card, and ends on
the email address. The cards come from `assets/cardArt-series.js`, the site's card art with the
Connect card worded around bookings, payments and calendars.

```bash
bash scripts/series.sh                  # all seven → out/series/<ep>/Refract-Tech-<n>-<ep>.mp4
bash scripts/series.sh discover build   # just those
```

## The Padel Lounge × Refract Tech (case study)

`series.html?ep=padel` (v2; the first cut is `?ep=padel-v1`): a 31.5 s reel on the website Refract Tech built for The Padel Lounge
(tplrachaya.com): the two logos meeting, the real site in a phone under floodlights, the booking
flow acted out (length, day, request, confirmation bell), the venue's features with its own photos,
the venue's admin dashboard (rebuilt from the site's own code: requests, schedule, rewards ladder),
the "Built by refract" credit, and the receding-wall close. A padel ball, racket and court carry the
cuts. Soundtrack: `scripts/padel_music2.py` (Latin house, plucked guitar, ball pocks in the groove).

```bash
npm run capture-padel                                                     # → assets/padel/
node scripts/render.js --page "series.html?ep=padel" --out out/series/padel --scale 2 --quality 96
python3 scripts/padel_music2.py out/series/padel2   # render with --out out/series/padel2
```

## 60 Days Challenge × Refract Tech (case study)

`series.html?ep=challenge`: a 24.5 s reel on the training app Refract Tech built for Eagle Strength's
60 Days Challenge. The app (github.com/SleimanMh/60-days-challenge) is filmed running locally
with a made-up demo squad (`scripts/challenge-demo.js`), so no real athletes appear. Ends on a new,
calmer close (`Finale`: the app's screens recede as a wall, the logo rises, a slow fade) with a
warm piano ending in `scripts/challenge_music.py`.

```bash
(cd <60-days-challenge>/public && python3 -m http.server 4280) &
node scripts/capture-challenge.js                                         # → assets/challenge/
node scripts/render.js --page "series.html?ep=challenge" --out out/series/challenge --scale 2 --quality 96
python3 scripts/challenge_music.py out/series/challenge
```

## Eagle Strength — 60 Days Challenge (their own reel, no Refract branding)

`eagle.html` + `src/eagle.js`: 25 s in Eagle Strength's black, gold and red with the app's type
(Barlow Condensed, Permanent Marker). Motivation and calisthenics first (animated athletes doing
pushups, pull-ups, a plank and a run, with live counters), consistency as a 60-day streak, then
the app (the one-tap check-in, the squad board), the two levels with their real numbers, and
"Day 1 starts now". Cuts sit on a 140 BPM grid; soundtrack `scripts/eagle_music.py` (phonk-style).

```bash
node scripts/render.js --page eagle.html --out out/eagle --scale 2 --quality 96
python3 scripts/eagle_music.py out/eagle
```
