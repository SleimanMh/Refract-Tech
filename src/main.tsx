import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import ComingSoon from './components/ComingSoon';
import { showFullSite } from './launch';
import './styles/global.css';
import { applyPalette } from './theme';

// The full site loads only when it is shown, so the coming-soon page stays light.
const App = lazy(() => import('./App'));

applyPalette();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showFullSite() ? <Suspense fallback={null}><App /></Suspense> : <ComingSoon />}
  </StrictMode>,
);
