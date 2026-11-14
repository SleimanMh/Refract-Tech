// Colour for the whole site from one place: the page tokens, a colour per process stage, and the
// night sky. The Refract Tech palette: midnight navy, electric violet, soft purple, coral orange
// and cloud white, with the stages running from violet to coral like the ring around the logo.

export interface Palette {
  /** page tokens, written onto :root as CSS custom properties */
  css: Record<string, string>;
  /** one colour per stage, in order: Discover … Evolve */
  stages: string[];
  /** the night sky behind everything: aurora curtain colours (low, middle, crown) and the sky's top and horizon */
  sky: { aurora: [string, string, string]; top: string; horizon: string };
}

/** The five brand colours, by name. */
export const BRAND = {
  navy: '#11112B',
  violet: '#713DE8',
  purple: '#B66CFA',
  coral: '#FF906B',
  white: '#F7F5FF',
} as const;

export const palette: Palette = {
  css: {
    '--bg': BRAND.navy, '--bg-2': '#1B1A40',
    '--ink': BRAND.white, '--ink-2': '#CFCAE8', '--ink-3': '#9A94BF', '--ink-4': '#635E8C',
    // the accent tokens keep their historical names; --gold is the main accent
    '--gold': BRAND.purple, '--gold-2': BRAND.violet, '--lav': BRAND.violet, '--aqua': BRAND.purple, '--coral': BRAND.coral,
  },
  // violet to coral in six steps, lightened a touch at the violet end so labels stay legible on navy
  stages: ['#8B5CF0', '#9D66F4', '#B66CFA', '#D17AD6', '#EB86A0', '#FF906B'],
  sky: { aurora: [BRAND.coral, BRAND.purple, BRAND.violet], top: BRAND.navy, horizon: '#231A52' },
};

/**
 * How far the aurora's hues have drifted at a given time, in radians: a slow, narrow swing that keeps
 * it within the brand's violets, pinks and corals.
 */
export const auroraHue = (seconds: number) => Math.sin(seconds * Math.PI * 2 / 140) * .3;

/** A display-space colour as 0…1 components. */
export function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Write the page tokens onto the document, including the stage colours. */
export function applyPalette() {
  const s = document.documentElement.style;
  Object.entries(palette.css).forEach(([k, v]) => s.setProperty(k, v));
  palette.stages.forEach((c, i) => s.setProperty(`--c${i + 1}`, c));
  s.setProperty('--stage', palette.stages[0]);
}
