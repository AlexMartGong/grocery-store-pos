import { useEffect, useState, type SyntheticEvent } from "react";
import { AlertCircle, CreditCard, Loader2, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import { changePlan } from "../api/subscriptionsApi";
import { usePlansCatalog } from "../hooks/usePlansCatalog";
import { useStoreSubscription } from "../hooks/useStoreSubscription";
import { mapSubscriptionsError } from "../utils/errorMessages";
import { formatBillingDate, formatMoney } from "../utils/format";
import { PlanTierCard } from "./PlanTierCard";
import { StorePicker, type StoreOption } from "./StorePicker";
import type { ApiErrorResponse } from "../../auth/types";
import type { BillingCycle } from "../types";

interface ChangePlanModalProps {
  open: boolean;
  onClose: () => void;
  /** Prefilled target. Pass `null` to let the admin pick a store inside the modal. */
  store: StoreOption | null;
  onSuccess: () => void;
}

export const ChangePlanModal = ({ open, onClose, store, onSuccess }: ChangePlanModalProps) => {
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(store);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { plans, loading: plansLoading, error: plansError } = usePlansCatalog(open);
  const { subscription: current, loading: currentLoading } = useStoreSubscription(
    open ? (selectedStore?.id ?? null) : null,
  );
  const { render, show } = useModalAnimation(open, {
    onClose,
    closeOnEscape: !submitting,
  });

  // Start from the caller's store (and a clean form) every time the modal opens.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setSelectedStore(store);
      setPlanCode(null);
      setCycle("MONTHLY");
      setSubmitting(false);
      setError(null);
      setFieldErrors({});
    });
    return () => cancelAnimationFrame(raf);
  }, [open, store]);

  // Preselect where the store already is, so "switch to yearly" is two clicks.
  useEffect(() => {
    if (!current) return;
    const raf = requestAnimationFrame(() => {
      setPlanCode(current.plan_code);
      setCycle(current.billing_cycle);
    });
    return () => cancelAnimationFrame(raf);
  }, [current]);

  if (!render) return null;

  const safeClose = () => {
    if (!submitting) onClose();
  };

  const selectedPlan = plans.find((p) => p.code === planCode) ?? null;
  const isUnchanged =
    current != null && current.plan_code === planCode && current.billing_cycle === cycle;
  const canSubmit = !submitting && selectedStore != null && planCode != null;

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!selectedStore || !planCode) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await changePlan(selectedStore.id, { plan_code: planCode, billing_cycle: cycle });
      toast.success(`Plan actualizado para ${selectedStore.name}`);
      onSuccess();
      onClose();
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      // A 409 station_limit_exceeded lands here: the modal stays open with the tier cards live,
      // so the admin can pick a bigger plan without starting over.
      setError(mapSubscriptionsError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cycleButton = (value: BillingCycle, label: string) => (
    <button
      type="button"
      onClick={() => setCycle(value)}
      disabled={submitting}
      aria-pressed={cycle === value}
      className={`rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 ${
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
      onClick={safeClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-plan-title"
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
              <CreditCard aria-hidden className="h-5 w-5" />
            </div>
            <div>
              <h2 id="change-plan-title" className="text-lg font-semibold text-slate-900">
                Asignar plan
              </h2>
              <p className="text-sm text-slate-500">
                {selectedStore?.name ?? "Elige la tienda a suscribir"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={safeClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Tienda</legend>
            <StorePicker
              value={selectedStore}
              onChange={setSelectedStore}
              disabled={submitting}
            />
          </fieldset>

          {selectedStore && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              {currentLoading && <span className="text-slate-500">Consultando plan actual...</span>}
              {!currentLoading && !current && (
                <span className="text-slate-500">Sin suscripción activa.</span>
              )}
              {!currentLoading && current && (
                <span className="text-slate-700">
                  Plan actual: <strong>{current.plan_name}</strong> ·{" "}
                  {current.billing_cycle === "YEARLY" ? "Anual" : "Mensual"} ·{" "}
                  {formatMoney(current.amount_due)} · próximo cobro{" "}
                  {formatBillingDate(current.next_billing_date)}
                </span>
              )}
            </div>
          )}

          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {cycleButton("MONTHLY", "Mensual")}
            {cycleButton("YEARLY", "Anual")}
          </div>

          {plansLoading && (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 aria-label="Cargando planes" className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!plansLoading && plansError && (
            <p role="alert" className="text-sm text-rose-500">
              {plansError}
            </p>
          )}

          {!plansLoading && !plansError && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Plan</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanTierCard
                    key={plan.id}
                    plan={plan}
                    cycle={cycle}
                    groupName="plan-tier"
                    selected={planCode === plan.code}
                    disabled={submitting}
                    onSelect={setPlanCode}
                  />
                ))}
              </div>
              {fieldErrors.planCode && (
                <p className="mt-1 text-sm text-rose-500">{fieldErrors.planCode}</p>
              )}
              {fieldErrors.billingCycle && (
                <p className="mt-1 text-sm text-rose-500">{fieldErrors.billingCycle}</p>
              )}
            </fieldset>
          )}

          {selectedPlan && (
            <p aria-live="polite" className="text-sm text-slate-600">
              Se cobrará{" "}
              <strong className="tabular-nums">
                {formatMoney(cycle === "YEARLY" ? selectedPlan.yearly_fee : selectedPlan.monthly_fee)}
              </strong>{" "}
              {cycle === "YEARLY" ? "al año" : "al mes"}
              {isUnchanged && " — es el plan y ciclo que ya tiene."}
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={safeClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
