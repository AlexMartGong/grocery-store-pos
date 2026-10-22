import { useState } from "react";
import { CreditCard, Layers, Plus, RefreshCw } from "lucide-react";
import { useSubscriptionsOverview } from "../hooks/useSubscriptionsOverview";
import { SubscriptionKpiHeader } from "./SubscriptionKpiHeader";
import { UpcomingBillingsTable } from "./UpcomingBillingsTable";
import { ChangePlanModal } from "./ChangePlanModal";
import { PlansCatalogModal } from "./PlansCatalogModal";
import type { StoreOption } from "./StorePicker";

export const SubscriptionsScreen = () => {
  const { summary, billings, loading, error, reload } = useSubscriptionsOverview();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [planTarget, setPlanTarget] = useState<StoreOption | null>(null);

  const openChangePlan = (store: StoreOption | null) => {
    setPlanTarget(store);
    setChangePlanOpen(true);
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <CreditCard size={20} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Suscripciones</h1>
            <p className="text-sm text-slate-500">Planes, cobros y renovaciones</p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => reload()}
              disabled={loading}
              aria-label="Sincronizar métricas de suscripciones"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden />
              Sincronizar
            </button>
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Layers size={16} aria-hidden />
              Ver planes
            </button>
            <button
              type="button"
              onClick={() => openChangePlan(null)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <Plus size={16} aria-hidden />
              Asignar plan
            </button>
          </div>
        </header>

        <SubscriptionKpiHeader summary={summary} loading={loading} error={error} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Próximos cobros</h2>
          <p className="text-sm text-slate-500">
            Renovaciones de los próximos 7 días, incluidas las que ya vencieron.
          </p>
          <UpcomingBillingsTable
            billings={billings}
            loading={loading}
            error={error}
            onChangePlan={(billing) =>
              openChangePlan({ id: billing.store_id, name: billing.store_name })
            }
          />
        </section>
      </div>

      <ChangePlanModal
        open={changePlanOpen}
        store={planTarget}
        onClose={() => setChangePlanOpen(false)}
        onSuccess={() => void reload()}
      />

      <PlansCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
};
