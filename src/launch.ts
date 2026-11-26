// The website is launched: visitors see the full site.
//
// To put the "coming soon" page back in front of it, set SITE_LAUNCHED to false below and redeploy
// (VITE_SITE_LAUNCHED=true in the Vercel project's environment variables still forces the full site,
// and /?preview=site always shows it).
export const SITE_LAUNCHED = true;

export function showFullSite(): boolean {
  if (SITE_LAUNCHED || import.meta.env.VITE_SITE_LAUNCHED === 'true') return true;
  return new URLSearchParams(window.location.search).get('preview') === 'site';
}
