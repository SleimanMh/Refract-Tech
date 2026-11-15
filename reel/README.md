# Refract Tech — Instagram reel

A 24 s, 1080 × 1920, 30 fps reel made only of the Refract Tech website: its own stage cards
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
npm run encode         # → out/Refract-Tech-reel-v3.mp4
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
| 0–2.3 | A spark shatters into pieces of the site's card, which assemble; the camera pushes through — "Your idea. Built into a product." |
| 2.3–4.3 | The site's hero, full width; the camera dives into its card deck |
| 4.3–13.7 | The six stage cards, opening and turning like the site's deck, each with its step and heading |
| 13.7–17 | What we build: the site's Web, Mobile and Automation & AI cards in a 3D carousel |
| 17–19 | Our expertise: the six-step chain of disciplines |
| 19–20.5 | refract-tech.com scrolling to the contact form |
| 20.5–24 | The form shatters and gathers into the logo; "Let's build what's next." and the domain |
