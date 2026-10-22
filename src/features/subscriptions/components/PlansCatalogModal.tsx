import { useState } from "react";
import { AlertCircle, Layers, Loader2, X } from "lucide-react";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import { usePlansCatalog } from "../hooks/usePlansCatalog";
import { PlanTierCard } from "./PlanTierCard";
import type { BillingCycle } from "../types";

interface PlansCatalogModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Read-only tier catalog. Hand-rolled shell rather than the shared `Modal` primitive because that
 * one is capped at `max-w-md`, too narrow to lay three tiers side by side.
 */
export const PlansCatalogModal = ({ open, onClose }: PlansCatalogModalProps) => {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const { plans, loading, error } = usePlansCatalog(open);
  const { render, show } = useModalAnimation(open, { onClose });

  if (!render) return null;

  const cycleButton = (value: BillingCycle, label: string) => (
    <button
      type="button"
      onClick={() => setCycle(value)}
      aria-pressed={cycle === value}
      className={`rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        cycle === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plans-catalog-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[95vh] w-full max-w-3xl transform flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Layers aria-hidden className="h-5 w-5" />
            </div>
            <div>
              <h2 id="plans-catalog-title" className="text-lg font-semibold text-slate-900">
                Catálogo de planes
              </h2>
              <p className="text-sm text-slate-500">Precios y límites de cada nivel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {cycleButton("MONTHLY", "Mensual")}
            {cycleButton("YEARLY", "Anual")}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 aria-label="Cargando planes" className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && plans.length === 0 && (
            <p className="py-12 text-center text-slate-400">No hay planes activos.</p>
          )}

          {!loading && !error && plans.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanTierCard key={plan.id} plan={plan} cycle={cycle} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
