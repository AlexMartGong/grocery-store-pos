import { Link } from "react-router-dom";

const NAV_LINKS = [
  { href: "#funciones", label: "Funciones" },
  { href: "#planes", label: "Planes" },
] as const;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

/**
 * Sticky h-16 header. Logo on the left, anchors + login on the right: the center stays empty
 * because PwaUpdatePrompt sits in this band from md up.
 */
export const LandingNavbar = () => (
  <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 text-white backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
      <a
        href="#inicio"
        aria-label="VentaCore, ir al inicio"
        className={`flex items-center gap-2.5 rounded-lg py-2.5 pr-2 ${FOCUS_RING}`}
      >
        <img src="/logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
        <span className="text-lg font-semibold tracking-tight">VentaCore</span>
      </a>

      <div className="flex items-center gap-2">
        <nav aria-label="Secciones de la página" className="hidden items-center md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:text-white ${FOCUS_RING}`}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          to="/login"
          className={`rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 ${FOCUS_RING}`}
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  </header>
);
