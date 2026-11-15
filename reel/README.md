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
