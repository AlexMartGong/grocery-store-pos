import { useState } from "react";
import { INFO_MESSAGE, LANDING_PLANS, buildSalesWhatsAppUrl } from "../constants/landingData";
import type { LandingBillingCycle } from "../types";
import { CYCLE_LABEL } from "../utils/pricing";
import { LandingPlanCard } from "./LandingPlanCard";

const CYCLES: readonly LandingBillingCycle[] = ["MONTHLY", "YEARLY"];

export const LandingPricing = () => {
  const [cycle, setCycle] = useState<LandingBillingCycle>("MONTHLY");

  return (
    <section
      id="planes"
      aria-labelledby="planes-titulo"
      className="scroll-mt-16 bg-white py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Planes</p>
          <h2
            id="planes-titulo"
            className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
          >
            Un plan para cada tamaño de tienda
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Empieza con una caja y crece cuando tu negocio lo pida.
          </p>
        </header>

        {/* Native radios (visually hidden) keep arrow-key navigation and screen-reader grouping. */}
        <div className="mt-8 flex justify-center">
          <fieldset>
            <legend className="sr-only">Ciclo de facturación</legend>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {CYCLES.map((value) => (
                <label
                  key={value}
                  className={`relative flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 ${
                    cycle === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="landing-billing-cycle"
                    value={value}
                    checked={cycle === value}
                    onChange={() => setCycle(value)}
                    className="sr-only"
                  />
                  {CYCLE_LABEL[value]}
                  {value === "YEARLY" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Ahorra 2 meses
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <ul className="mx-auto mt-10 grid max-w-md gap-6 lg:max-w-none lg:grid-cols-3">
          {LANDING_PLANS.map((plan) => (
            <li key={plan.code}>
              <LandingPlanCard plan={plan} cycle={cycle} />
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-slate-600">
          Precios en pesos mexicanos (MXN). ¿No sabes cuál te conviene?{" "}
          <a
            href={buildSalesWhatsAppUrl(INFO_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded py-2.5 font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Escríbenos por WhatsApp
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </p>
      </div>
    </section>
  );
};
