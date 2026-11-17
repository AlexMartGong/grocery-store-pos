import { Check, MessageCircle, Monitor } from "lucide-react";
import { buildSalesWhatsAppUrl } from "../constants/landingData";
import type { LandingBillingCycle, LandingPlan } from "../types";
import { CYCLE_UNIT, formatPrice, planContactMessage, planPrice } from "../utils/pricing";

interface LandingPlanCardProps {
  plan: LandingPlan;
  cycle: LandingBillingCycle;
}

export const LandingPlanCard = ({ plan, cycle }: LandingPlanCardProps) => (
  <article
    className={`relative flex h-full flex-col rounded-2xl bg-white p-4 md:p-8 ${
      plan.featured
        ? "border-2 border-indigo-600 shadow-xl shadow-indigo-100"
        : "border border-slate-200 shadow-sm"
    }`}
  >
    {plan.featured && (
      <p className="absolute -top-3 left-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white md:left-8">
        Más popular
      </p>
    )}

    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
    {/* lg:min-h-10 = two lines, so prices line up across the three columns. */}
    <p className="mt-1 text-sm text-slate-600 lg:min-h-10">{plan.tagline}</p>

    <p className="mt-6 flex items-baseline gap-2">
      <span className="font-mono text-4xl font-bold tabular-nums tracking-tight text-slate-900">
        {formatPrice(planPrice(plan, cycle))}
      </span>
      <span className="text-sm text-slate-600">MXN / {CYCLE_UNIT[cycle]}</span>
    </p>
    <p className="mt-2 flex min-h-6 items-center text-sm text-slate-600">
      {cycle === "YEARLY" ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          2 meses gratis
        </span>
      ) : (
        <>o {formatPrice(plan.yearlyPrice)} al año (2 meses gratis)</>
      )}
    </p>

    <ul className="mt-6 flex-1 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-700">
      <li className="flex items-start gap-2 font-semibold text-slate-900">
        <Monitor aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
        {plan.stations}
      </li>
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          {feature}
        </li>
      ))}
    </ul>

    <a
      href={buildSalesWhatsAppUrl(planContactMessage(plan, cycle))}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        plan.featured ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-900 hover:bg-slate-700"
      }`}
    >
      <MessageCircle aria-hidden className="h-4 w-4" />
      Contratar {plan.name}
      <span className="sr-only"> por WhatsApp (se abre en una pestaña nueva)</span>
    </a>
  </article>
);
