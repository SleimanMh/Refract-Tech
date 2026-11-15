# Refract Tech — Instagram reel (V2)

A 23.5 s, 1080 × 1920, 30 fps brand reel, built as a deterministic HTML scene: every frame is
drawn by `window.render(t)`, captured with Playwright, motion-blurred from three sub-frames and
encoded with ffmpeg. The soundtrack is original, synthesized from the same cue sheet.

## Make the video

```bash
npm run build && npx vite preview --port 4173     # in the site root: serve the live site
cd reel
npm run capture        # stills of the real site → assets/site/
npm run render         # sub-frames → out/samples/, cue sheet → out/events.json
npm run music          # soundtrack → out/music.wav
npm run encode         # → out/Refract-Tech-reel-v2.mp4
```

Review single frames without a full render: `node scripts/render.js --stills 1.5 7.6 21.2`
(→ `out/stills/`). Open `index.html` over any local server and call `render(t)` in the console
to scrub.

## Structure

| File | What it holds |
| --- | --- |
| `src/main.js` | Master timeline: scene order, headlines, step rail, cursor paths, light cuts, cue sheet |
| `src/story.js` | 0–14 s: spark → card hook, then one product transformed through the six steps |
| `src/finale.js` | 14–23.5 s: services carousel, the real website, shatter into the logo |
| `src/ui.js` | Reusable parts: sky, `Headline`, `StepRail`, `Cursor`, `Streak`, icons, palette |
| `src/lib.js` | Easing, springs, keyframe `track`, DOM helpers |
| `scripts/` | Site capture, frame renderer, soundtrack synth, encoder |

## Timeline

| s | Scene | Message |
| --- | --- | --- |
| 0–2.5 | Spark assembles the Refract Tech card; camera pushes through | Your idea. Built beyond ordinary. |
| 2.5–4.5 | Discover: raw idea splits into requirement nodes | From idea to impact. |
| 4.5–6.5 | Design: nodes morph to wireframe, polish into UI | Designed to stand out. |
| 6.5–8.5 | Build: layers explode with code, snap back working | Engineered to perform. |
| 8.5–10.5 | Connect: services wired to the product, data flowing | Connected to everything. |
| 10.5–12 | Launch: deploy pipeline, product lands live in a browser | Ready for the world. |
| 12–14 | Evolve: the live product becomes a growing dashboard | Built to evolve. |
| 14–18.5 | What we build: web, mobile, automation & AI demos | |
| 18.5–20 | refract-tech.com scrolling in a large browser | |
| 20–23.5 | The site shatters and gathers into the logo; domain CTA | Let's build what's next. |
