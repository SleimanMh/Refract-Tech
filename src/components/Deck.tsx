import { useEffect, useRef } from 'react';
import { ART_KEYS, CARD_H, CARD_W, loadCardAssets, paintCard } from '../deck/cardArt';
import { story } from '../story/controller';
import { StoryState, clamp, glide, lerp, smooth } from '../story/progress';

// The story's visual: the six stage cards and the finished product, held as one deck in 3D space.
// Closed, the deck rests at an angle beside the hero. Scrolling fans it open: the active card faces
// the visitor, the cards still to come wait in a stack behind it, and the cards done turn away to the
// left like pages. At the end the cards gather again under the finished product. Each card is a flat
// canvas drawn once; while the visitor scrolls only their CSS transforms change, which the browser's
// compositor handles without repainting anything.

type Kind = 'desk' | 'phone' | 'stack';
interface Geo { kind: Kind; w: number; h: number; cw: number; ch: number; sc: number }
interface Pose { x: number; y: number; z: number; ry: number; rx: number; rz: number; o: number; shade: number }

const FINAL = ART_KEYS.length - 1;

/** The deck closed: cards stacked, fanned a little, turned toward the copy and tilted back. */
const stacked = (d: number, sc: number): Pose => ({
  x: d * 10 * sc, y: -d * 9 * sc, z: -d * 26, ry: -24, rx: 10, rz: -5 + d * 2.4, o: d > 6 ? 0 : 1, shade: Math.min(.55, d * .11),
});

/** The deck open, for a card k steps from the active one (negative once it is done). */
function flowing(k: number, sc: number): Pose {
  if (k >= 0) {
    // waiting: behind the active card, a little to the right, each turned a little more
    return { x: k * 40 * sc, y: -k * 16 * sc, z: -k * 110, ry: 6 - k * 9, rx: 2, rz: k * 1.2, o: 1 - smooth(3.2, 4.4, k), shade: Math.min(.6, k * .2) };
  }
  // done: turns away to the left like a page and recedes
  const t = -k;
  return { x: -t * 300 * sc, y: t * 10 * sc, z: -t * 170, ry: 6 + t * 56, rx: 2, rz: -t * 2, o: 1 - smooth(.7, 1.7, t), shade: Math.min(.7, t * .5) };
}

function measure(stage: HTMLElement, mode: 'wide' | 'stack'): Geo {
  const w = stage.clientWidth, h = stage.clientHeight;
  const kind: Kind = mode === 'stack' ? 'stack' : w < 900 ? 'phone' : 'desk';
  const ch = kind === 'desk' ? Math.min(h * .6, w * .38, 560)
    : kind === 'phone' ? Math.min(h - 64 - 200, w * .74 * 1.5)
    : h * .84;
  return { kind, w, h, ch, cw: ch * CARD_W / CARD_H, sc: ch / 520 };
}

/** Where the deck sits on screen, and at what size, for a given state. */
function anchorOf(g: Geo, s: StoryState) {
  const e = glide(s.open);
  if (g.kind === 'desk') return { x: g.w * lerp(.72, .355, e), y: g.h * lerp(.53, .5, e), scale: lerp(.92, 1, e) };
  if (g.kind === 'phone') {
    const stagesY = (64 + (g.h - 180)) / 2;
    return { x: g.w * .5, y: lerp(g.h * .3, stagesY, e), scale: lerp(.62, 1, e) };
  }
  return { x: g.w * .5, y: g.h * .5, scale: 1 };
}

const transformOf = (p: Pose) =>
  `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,${p.z.toFixed(1)}px) rotateY(${p.ry.toFixed(2)}deg) rotateX(${p.rx.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg)`;

export function Deck({ mode }: { mode: 'wide' | 'stack' }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const shadeRefs = useRef<HTMLSpanElement[]>([]);
  const sheenRefs = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const stage = stageRef.current!, anchor = anchorRef.current!, tilt = tiltRef.current!;
    let geo = measure(stage, mode);
    let logo: HTMLImageElement | null = null;
    let painted = { cw: 0, ch: 0 };

    // draw every card at the size it is shown, sharp on high-density screens
    const paint = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvasRefs.current.forEach((cv, i) => {
        cv.width = Math.round(geo.cw * dpr); cv.height = Math.round(geo.ch * dpr);
        const g = cv.getContext('2d')!;
        g.setTransform(cv.width / CARD_W, 0, 0, cv.height / CARD_H, 0, 0);
        paintCard(g, ART_KEYS[i], logo);
      });
      painted = { cw: geo.cw, ch: geo.ch };
    };

    const layout = (s: StoryState) => {
      const a = anchorOf(geo, s);
      stage.style.setProperty('--cw', `${geo.cw}px`); stage.style.setProperty('--ch', `${geo.ch}px`);
      stage.style.perspectiveOrigin = `${a.x}px ${a.y}px`;
      anchor.style.transform = `translate3d(${a.x}px,${a.y}px,0) scale(${a.scale})`;
      // a gentle tilt toward the pointer on desktop; CSS eases it
      const pt = geo.kind === 'desk' && story.finePointer && !story.reduce ? story.pointer : { x: 0, y: 0 };
      tilt.style.transform = `rotateY(${(pt.x * 5).toFixed(2)}deg) rotateX(${(-pt.y * 3.5).toFixed(2)}deg)`;

      const opening = s.p < .5;
      const split = clamp((s.open - .02) / .98);
      cardRefs.current.forEach((el, i) => {
        // closed, the first card lies on top; at the end the finished product does, the last stage under it
        const depth = opening ? i : i === FINAL ? 0 : FINAL - i;
        const t = glide(clamp(split * 1.7 - depth * .11));
        const k = i - s.stageF;
        const A = stacked(depth, geo.sc);
        const B = i === FINAL ? { ...flowing(Math.max(k, 1), geo.sc), o: 0 } : flowing(k, geo.sc);
        const p: Pose = {
          x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), z: lerp(A.z, B.z, t),
          ry: lerp(A.ry, B.ry, t), rx: lerp(A.rx, B.rx, t), rz: lerp(A.rz, B.rz, t),
          o: lerp(A.o, B.o, t), shade: lerp(A.shade, B.shade, t),
        };
        // as the deck fans open (or gathers) each card lifts on its own little arc
        const arc = Math.sin(Math.PI * t), side = depth % 2 ? 1 : -.7;
        p.y -= arc * 70 * geo.sc * side; p.z += arc * 90; p.rz += arc * 9 * side;
        // the finished product only appears as the deck gathers at the end
        if (i === FINAL && opening) p.o = 0;
        // a stage hovered in the bar lifts its card
        if (story.hover === i && s.process > .5 && k > -.5) { p.z += 40; p.y -= 12 * geo.sc; }
        el.style.transform = transformOf(p);
        el.style.opacity = p.o.toFixed(3);
        el.style.visibility = p.o < .005 ? 'hidden' : 'visible';
        shadeRefs.current[i].style.opacity = p.shade.toFixed(3);
        // a band of light passes over each card as it becomes the active one
        const q = 1 - k, sheen = sheenRefs.current[i];
        if (s.process > .5 && q > 0 && q < 1) { sheen.style.opacity = '1'; sheen.style.transform = `translateX(${(-150 + q * 300).toFixed(1)}%)`; }
        else sheen.style.opacity = '0';
      });
    };

    const relayout = () => {
      geo = measure(stage, mode);
      if (logo && (Math.abs(geo.cw - painted.cw) > 2 || Math.abs(geo.ch - painted.ch) > 2)) paint();
      layout(story.state);
    };

    story.onFrame = layout;
    layout(story.state);
    // show the deck once its type and logo are in, so it never appears with fallback lettering
    let shown = false;
    const show = () => { if (!shown) { shown = true; stage.classList.add('is-ready'); } };
    loadCardAssets().then(img => { logo = img; geo = measure(stage, mode); paint(); layout(story.state); show(); });
    const fallback = window.setTimeout(() => { if (!logo) { paint(); show(); } }, 1600);

    let raf = 0;
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(relayout); };
    window.addEventListener('resize', onResize);
    return () => {
      story.onFrame = null;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf); window.clearTimeout(fallback);
    };
  }, [mode]);

  return (
    <div className="deck-stage" ref={stageRef} aria-hidden="true">
      <div className="deck-anchor" ref={anchorRef}>
        <div className="deck-glow" />
        <div className="deck-tilt" ref={tiltRef}>
          {ART_KEYS.map((key, i) => (
            <div className="dcard" key={key} ref={el => { if (el) cardRefs.current[i] = el; }}>
              <div className="dcard-float" style={{ animationDelay: `${-i * .9}s` }}>
                <canvas ref={el => { if (el) canvasRefs.current[i] = el; }} />
                <span className="dcard-shade" ref={el => { if (el) shadeRefs.current[i] = el; }} />
                <span className="dcard-sheen-clip"><span className="dcard-sheen" ref={el => { if (el) sheenRefs.current[i] = el; }} /></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
