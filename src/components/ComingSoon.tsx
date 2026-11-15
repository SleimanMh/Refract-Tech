import { useEffect, useRef, useState } from 'react';
import markUrl from '../assets/brand/r-mark.png';
import '../styles/soon.css';
import { Sky } from './Sky';

// The page visitors see until the website launches: the same night sky and brand as the site, the
// logo drawing its own ring with three little lights in orbit, a short message, and the email.

const EMAIL = 'refract@refract-tech.com';
const STEPS = ['Discover', 'Design', 'Build'];

export default function ComingSoon() {
  const root = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // a gentle depth that follows the pointer, on desktop only
  useEffect(() => {
    const el = root.current;
    if (!el || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const on = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3));
        el.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3));
      });
    };
    addEventListener('pointermove', on);
    return () => { removeEventListener('pointermove', on); cancelAnimationFrame(raf); };
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.location.href = `mailto:${EMAIL}`; }
  };

  return (
    <div className="soon-page" ref={root}>
      <Sky />

      {/* three of the site's stage cards, drifting behind the message */}
      <div className="soon-cards" aria-hidden="true">
        {STEPS.map((s, i) => (
          <div className={`soon-card c${i}`} key={s}>
            <span className="sc-k">0{i + 1} / {s}</span>
            <i className="sc-l l1" /><i className="sc-l l2" /><i className="sc-l l3" />
            <span className="sc-flow"><b /><b /><b /></span>
          </div>
        ))}
      </div>

      <main className="soon">
        <div className="soon-logo" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="soon-ring">
            <defs>
              <linearGradient id="soonRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#713DE8" /><stop offset=".5" stopColor="#B66CFA" /><stop offset="1" stopColor="#FF906B" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="92" />
          </svg>
          <span className="soon-orbit"><i /><i /><i /></span>
          <img src={markUrl} alt="" />
        </div>
        <p className="soon-brand">Refract <b>Tech</b></p>

        <p className="soon-pill"><span className="soon-dot" />Launching soon</p>
        <h1 className="soon-title">
          <span className="r1">Something big</span>
          <span className="r2">is <em>coming.</em></span>
        </h1>
        <p className="soon-lede">
          We are putting the finishing touches on our new website. In the meantime, we are already turning ideas
          into digital products.
        </p>
        <ul className="soon-tags" aria-label="What we build">
          <li>Websites</li><li>Booking systems</li><li>Custom SaaS</li>
        </ul>

        <div className="soon-cta">
          <a className="soon-mail" href={`mailto:${EMAIL}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg>
            <span>{EMAIL}</span>
          </a>
          <button type="button" className="soon-copy" onClick={copy} aria-live="polite">{copied ? 'Copied' : 'Copy'}</button>
        </div>
        <p className="soon-hint">Have an idea already? Write to us.</p>
      </main>

      <footer className="soon-foot">© {new Date().getFullYear()} Refract Tech · <a href={`mailto:${EMAIL}`}>{EMAIL}</a></footer>
    </div>
  );
}
