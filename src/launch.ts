// Until the website launches, visitors see the "coming soon" page instead of the full site.
//
// To launch: set SITE_LAUNCHED to true below (or set VITE_SITE_LAUNCHED=true in the Vercel project's
// environment variables) and redeploy. Nothing else changes: the full site is all still here.
// Meanwhile the team can see the full site at /?preview=site.
export const SITE_LAUNCHED = false;

export function showFullSite(): boolean {
  if (SITE_LAUNCHED || import.meta.env.VITE_SITE_LAUNCHED === 'true') return true;
  return new URLSearchParams(window.location.search).get('preview') === 'site';
}
