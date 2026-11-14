# Refract Tech

Marketing site for Refract Tech. Its story is a deck of cards: closed beside the hero, it fans open as the visitor scrolls, the six stages of the process come forward one at a time while the ones done turn away like pages, and the cards gather again under the finished product.

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

The build uses a relative base, so `dist/` can be served from any folder or static host.

## Stack

- React 19 + TypeScript, built with Vite
- The deck is plain DOM: each card is a 2D canvas drawn once, moved with CSS 3D transforms (no WebGL)
- GSAP (ScrollTrigger and ScrollTo) for scroll progress and click navigation

## How it is organised

| Concern | Where |
| --- | --- |
| Process content and capabilities | `src/data/process.ts` |
| Story state model (one progress value → every visual) | `src/story/progress.ts` |
| Scroll and navigation coordination | `src/story/controller.ts` |
| Card artwork per stage | `src/deck/cardArt.ts` |
| The deck and its choreography | `src/components/Deck.tsx` |
| Night sky behind the page | `src/components/Sky.tsx` |
| Brand palette | `src/theme.ts` |
| Accessible HTML for the story | `src/components/Story.tsx` |
| Header, what we build, expertise, contact, footer | `src/components/Sections.tsx` |

### The state model

Scroll position is the single source of truth. On desktop the story section is pinned with CSS `position: sticky` and ScrollTrigger reports its progress `p` (0–1). A damped copy of `p` drives everything through `stateFromProgress(p)`:

Closed (0–0.06) → Opening (0.06–0.18) → Exploring stages 1–6 (0.18–0.84) → Reassembling (0.84–0.95) → Complete.

Clicking a stage label scrolls the page to that stage's rest point, so scrolling, clicking, resizing and reversing never start competing animations. Wheel input is never intercepted; a click-triggered scroll stops as soon as the visitor scrolls themselves.

### Layouts

- **Wide (desktop):** the deck left, process copy right, pinned story of about 6.6 viewport heights. Phones use the same pinned story with the deck above the stage chips.
- **Stacked (whenever reduced motion is on):** a smaller pinned deck and stage chips at the top, with each stage as an ordinary section below. The deck jumps between rest states instead of travelling.

## Content status

- The "What we build" cards describe services. Their "Plan a …" links fill in the contact form's "What do you need?" field.
- The contact form sends enquiries through Web3Forms; WhatsApp is linked from a floating button and the footer.

## Earlier design exploration

`design/` holds the standalone concept pages from the design phase.
