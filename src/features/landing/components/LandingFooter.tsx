import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { INFO_MESSAGE, WHATSAPP_DISPLAY, buildSalesWhatsAppUrl } from "../constants/landingData";

// Module-level: reading the clock during render is impure.
const CURRENT_YEAR = new Date().getFullYear();

const LINK_CLASS =
  "inline-flex items-center gap-2 rounded-lg py-2.5 font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

export const LandingFooter = () => (
  <footer className="border-t border-slate-800 bg-slate-900 text-slate-400">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white">
          <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" />
          VentaCore
        </p>
        <p className="mt-2 max-w-sm text-sm">
          Punto de venta en la nube para abarrotes, fruterías, cremerías y comercios minoristas.
        </p>
      </div>

      <nav
        aria-label="Acceso y contacto"
        className="flex flex-col text-sm sm:flex-row sm:items-center sm:gap-8"
      >
        <Link to="/login" className={LINK_CLASS}>
          Acceso a clientes
        </Link>
        <a
          href={buildSalesWhatsAppUrl(INFO_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          <MessageCircle aria-hidden className="h-4 w-4" />
          <span>
            WhatsApp <span className="font-mono tabular-nums">{WHATSAPP_DISPLAY}</span>
          </span>
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </nav>
    </div>

    <div className="border-t border-slate-800">
      <p className="mx-auto max-w-6xl px-4 py-5 text-sm">
        © {CURRENT_YEAR} VentaCore. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);
