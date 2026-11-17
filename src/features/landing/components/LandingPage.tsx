import { LandingFeatures } from "./LandingFeatures";
import { LandingFooter } from "./LandingFooter";
import { LandingHero } from "./LandingHero";
import { LandingNavbar } from "./LandingNavbar";
import { LandingPricing } from "./LandingPricing";

/** Public marketing page shown at `/` to visitors without a store session (see HomeRedirect). */
export const LandingPage = () => (
  <div id="inicio" className="min-h-screen bg-slate-900">
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      Saltar al contenido
    </a>
    <LandingNavbar />
    <main id="contenido">
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
    </main>
    <LandingFooter />
  </div>
);
