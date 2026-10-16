import { Check, Minus, Monitor } from "lucide-react";
import { formatMoney } from "../utils/format";
import type { BillingCycle, SubscriptionPlanResponse } from "../types";

interface PlanTierCardProps {
  plan: SubscriptionPlanResponse;
  cycle: BillingCycle;
  /** Omit to render a read-only card (the catalog view). */
  onSelect?: (code: string) => void;
  selected?: boolean;
  disabled?: boolean;
  /** Radio group name — required whenever `onSelect` is given. */
  groupName?: string;
}

const Entitlement = ({ label, included }: { label: string; included: boolean }) => (
  <li className={`flex items-center gap-2 ${included ? "text-slate-700" : "text-slate-400"}`}>
    {included ? (
      <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
    ) : (
      <Minus aria-hidden className="h-3.5 w-3.5 shrink-0" />
    )}
    <span>{label}</span>
    <span className="sr-only">{included ? " incluido" : " no incluido"}</span>
  </li>
);

const PlanBody = ({ plan, cycle }: { plan: SubscriptionPlanResponse; cycle: BillingCycle }) => {
  const yearly = cycle === "YEARLY";
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-900">{plan.name}</span>
        <span className="font-mono text-[11px] uppercase text-slate-400">{plan.code}</span>
      </div>

      <div className="mt-2">
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          {formatMoney(yearly ? plan.yearly_fee : plan.monthly_fee)}
        </p>
        <p className="text-xs text-slate-500">{yearly ? "por año" : "por mes"}</p>
        {yearly && (
          <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            2 meses gratis
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-center gap-2 text-slate-700">
          <Monitor aria-hidden className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span>
            {plan.max_stations} {plan.max_stations === 1 ? "caja" : "cajas"}
          </span>
        </li>
        <Entitlement label="Alertas al dueño" included={plan.includes_notifications} />
        <Entitlement label="Facturación electrónica" included={plan.includes_invoicing} />
      </ul>
    </>
  );
};

/**
 * One tier. Selectable when `onSelect` is given — the native radio stays in the DOM (visually
 * hidden) so keyboard arrow-key navigation and screen-reader grouping work for free; styling
 * hangs off `selected` rather than replacing the control.
 */
export const PlanTierCard = ({
  plan,
  cycle,
  onSelect,
  selected = false,
  disabled = false,
  groupName,
}: PlanTierCardProps) => {
  const base = "rounded-xl border p-4 text-left transition";

  if (!onSelect) {
    return (
      <div className={`${base} border-slate-200 bg-white`}>
        <PlanBody plan={plan} cycle={cycle} />
        {plan.description && <p className="mt-3 text-xs text-slate-500">{plan.description}</p>}
      </div>
    );
  }

  return (
    <label
      className={`${base} block cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 ${
        selected
          ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="radio"
        name={groupName}
        value={plan.code}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(plan.code)}
        className="sr-only"
      />
      <PlanBody plan={plan} cycle={cycle} />
    </label>
  );
};
