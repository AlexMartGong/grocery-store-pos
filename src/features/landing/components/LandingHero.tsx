import { Link } from "react-router-dom";
import { Check, LogIn, MessageCircle } from "lucide-react";
import { DEMO_MESSAGE, buildSalesWhatsAppUrl } from "../constants/landingData";
import { HeroPosMockup } from "./HeroPosMockup";

const HIGHLIGHTS = [
  "PC, tablet y celular",
  "Báscula y lector de códigos",
  "Ticket térmico",
] as const;

const CTA_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

export const LandingHero = () => (
  <section
    aria-labelledby="hero-titulo"
    className="relative isolate overflow-hidden bg-slate-900 text-white"
  >
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(148_163_184/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.07)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
    </div>

    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-emerald-300 motion-safe:animate-landing-rise">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Punto de venta en la nube para tu mostrador
        </p>

        <h1
          id="hero-titulo"
          className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight motion-safe:animate-landing-rise motion-safe:[animation-delay:80ms] sm:text-5xl lg:text-6xl"
        >
          Cobra rápido, pesa exacto y cierra caja{" "}
          <span className="text-emerald-400">sin faltantes.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-slate-300 motion-safe:animate-landing-rise motion-safe:[animation-delay:160ms]">
          VentaCore es el punto de venta para abarrotes, fruterías, cremerías y comercios
          minoristas: báscula en vivo, lector de códigos, fiado, inventario y cortes de caja en
          una sola pantalla.
        </p>

        <div className="mt-8 flex flex-col gap-3 motion-safe:animate-landing-rise motion-safe:[animation-delay:240ms] sm:flex-row">
          <a
            href={buildSalesWhatsAppUrl(DEMO_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CTA_BASE} bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-400`}
          >
            <MessageCircle aria-hidden className="h-5 w-5" />
            Solicitar demo por WhatsApp
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
          <Link
            to="/login"
            className={`${CTA_BASE} border border-slate-700 bg-slate-800 hover:bg-slate-700 focus-visible:ring-indigo-400`}
          >
            <LogIn aria-hidden className="h-5 w-5" />
            Iniciar sesión
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 motion-safe:animate-landing-rise motion-safe:[animation-delay:320ms]">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check aria-hidden className="h-4 w-4 text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="motion-safe:animate-landing-rise motion-safe:[animation-delay:200ms]">
        <HeroPosMockup />
      </div>
    </div>
  </section>
);
