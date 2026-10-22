import type { ReactNode } from "react";
import { AlertCircle, BadgeCheck, CalendarClock, Layers, Loader2 } from "lucide-react";
import { formatMoney } from "../utils/format";
import type { SubscriptionSummaryResponse } from "../types";

interface SubscriptionKpiHeaderProps {
  summary: SubscriptionSummaryResponse | null;
  loading: boolean;
  error: string | null;
}

interface KpiCardProps {
  label: string;
  icon: ReactNode;
  iconClass: string;
  loading: boolean;
  error: string | null;
  children: ReactNode;
}

const KpiCard = ({ label, icon, iconClass, loading, error, children }: KpiCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:p-6">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-medium text-slate-600">{label}</h2>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </span>
    </div>

    {loading && (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 size={24} className="animate-spin" aria-label={`Cargando ${label}`} />
      </div>
    )}

    {!loading && error && (
      <div
        role="alert"
        className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
      >
        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
        <span>{error}</span>
      </div>
    )}

    {!loading && !error && children}
  </article>
);

export const SubscriptionKpiHeader = ({ summary, loading, error }: SubscriptionKpiHeaderProps) => {
  // The backend seeds every sellable tier, zero-count ones included, in ascending price order.
  const tiers = Object.entries(summary?.tier_distribution ?? {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label="Suscripciones activas"
        icon={<BadgeCheck size={16} aria-hidden />}
        iconClass="bg-emerald-100 text-emerald-600"
        loading={loading}
        error={error}
      >
        {summary && (
          <>
            <p className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
              {summary.active_subscriptions}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
              Tiendas facturando
            </p>
          </>
        )}
      </KpiCard>

      <KpiCard
        label="Cobros próximos 7 días"
        icon={<CalendarClock size={16} aria-hidden />}
        iconClass="bg-amber-100 text-amber-600"
        loading={loading}
        error={error}
      >
        {summary && (
          <>
            <p className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
              {summary.due_next_7_days}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
              {formatMoney(summary.due_next_7_days_amount)} por cobrar
            </p>
          </>
        )}
      </KpiCard>

      <KpiCard
        label="Distribución por plan"
        icon={<Layers size={16} aria-hidden />}
        iconClass="bg-indigo-100 text-indigo-600"
        loading={loading}
        error={error}
      >
        {summary && tiers.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">Sin planes configurados.</p>
        )}
        {summary && tiers.length > 0 && (
          <ul className="mt-4 space-y-2">
            {tiers.map(([code, count]) => (
              <li key={code} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-700">{code}</span>
                <span className="inline-flex min-w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-slate-700">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </KpiCard>
    </div>
  );
};
