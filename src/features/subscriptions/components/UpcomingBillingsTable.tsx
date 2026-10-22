import { AlertCircle, AlertTriangle, CalendarClock, Clock, MessageCircle, Repeat } from "lucide-react";
import { daysUntil, formatBillingDate, formatMoney } from "../utils/format";
import { buildWhatsAppUrl, renewalNotice } from "../utils/whatsapp";
import type { BillingCycle, UpcomingBillingResponse } from "../types";

interface UpcomingBillingsTableProps {
  billings: UpcomingBillingResponse[];
  loading: boolean;
  error: string | null;
  onChangePlan: (billing: UpcomingBillingResponse) => void;
}

const CYCLE_LABEL: Record<BillingCycle, string> = {
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

interface DueBadge {
  className: string;
  label: string;
  ariaLabel: string;
  icon: typeof Clock;
}

/**
 * Urgency cue for the due date. Colour is never the only signal — each state also carries its own
 * icon and its own wording (WCAG 1.4.1).
 *
 * "Vencido" is reachable here on purpose: a subscription stays ACTIVE through the billing
 * scheduler's grace period, so late payers keep showing up in the collection window.
 */
const dueBadge = (nextBillingDate: string): DueBadge => {
  const days = daysUntil(nextBillingDate);

  if (days === null) {
    return {
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      label: "Sin fecha",
      ariaLabel: "Sin fecha de cobro",
      icon: CalendarClock,
    };
  }
  if (days < 0) {
    const late = Math.abs(days);
    return {
      className: "bg-rose-100 text-rose-700 ring-rose-200",
      label: "Vencido",
      ariaLabel: `Vencido hace ${late} ${late === 1 ? "día" : "días"}`,
      icon: AlertTriangle,
    };
  }
  if (days === 0) {
    return {
      className: "bg-amber-100 text-amber-700 ring-amber-200",
      label: "Hoy",
      ariaLabel: "Vence hoy",
      icon: Clock,
    };
  }
  return {
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    label: `En ${days} ${days === 1 ? "día" : "días"}`,
    ariaLabel: `Vence en ${days} ${days === 1 ? "día" : "días"}`,
    icon: CalendarClock,
  };
};

const DueChip = ({ nextBillingDate }: { nextBillingDate: string }) => {
  const badge = dueBadge(nextBillingDate);
  const Icon = badge.icon;
  return (
    <span
      aria-label={badge.ariaLabel}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {badge.label}
    </span>
  );
};

const WhatsAppAction = ({
  billing,
  compact,
}: {
  billing: UpcomingBillingResponse;
  compact?: boolean;
}) => {
  const href = buildWhatsAppUrl(billing.whatsapp, renewalNotice(billing));
  const size = compact ? "px-3 py-2" : "flex-1 min-w-32 px-3 py-2.5";
  const base = `inline-flex items-center justify-center gap-1.5 rounded-lg border text-sm ${size}`;

  if (!href) {
    return (
      <span
        title="Esta tienda no tiene un número de WhatsApp registrado"
        className={`${base} cursor-not-allowed border-slate-200 bg-white text-slate-400`}
      >
        <MessageCircle aria-hidden className="h-4 w-4" />
        WhatsApp
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Enviar recordatorio de cobro a ${billing.store_name} por WhatsApp`}
      className={`${base} border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
    >
      <MessageCircle aria-hidden className="h-4 w-4" />
      WhatsApp
    </a>
  );
};

export const UpcomingBillingsTable = ({
  billings,
  loading,
  error,
  onChangePlan,
}: UpcomingBillingsTableProps) => {
  const changePlanClass = (compact: boolean) =>
    `inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white text-sm text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      compact ? "px-3 py-2" : "flex-1 min-w-32 px-3 py-2.5"
    }`;

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
      >
        <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list — hidden on md+ */}
      <ul className="space-y-3 md:hidden">
        {loading && (
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
            Cargando...
          </li>
        )}
        {!loading && billings.length === 0 && (
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
            No hay cobros en los próximos 7 días.
          </li>
        )}
        {!loading &&
          billings.map((b) => (
            <li
              key={b.store_id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-900">{b.store_name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBillingDate(b.next_billing_date)} · {CYCLE_LABEL[b.billing_cycle]}
                  </p>
                </div>
                <DueChip nextBillingDate={b.next_billing_date} />
              </div>

              <p className="text-lg font-semibold tabular-nums text-slate-900">
                {formatMoney(b.amount_due)}
              </p>

              <div className="flex flex-wrap gap-2">
                <WhatsAppAction billing={b} />
                <button
                  type="button"
                  onClick={() => onChangePlan(b)}
                  className={changePlanClass(false)}
                >
                  <Repeat aria-hidden className="h-4 w-4" />
                  Cambiar plan
                </button>
              </div>
            </li>
          ))}
      </ul>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tienda</th>
              <th className="w-28 px-4 py-3 font-medium">Ciclo</th>
              <th className="w-56 px-4 py-3 font-medium">Vence</th>
              <th className="w-32 px-4 py-3 text-right font-medium">Monto</th>
              <th className="w-64 px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && billings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No hay cobros en los próximos 7 días.
                </td>
              </tr>
            )}
            {!loading &&
              billings.map((b) => (
                <tr key={b.store_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{b.store_name}</td>
                  <td className="px-4 py-3">{CYCLE_LABEL[b.billing_cycle]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {formatBillingDate(b.next_billing_date)}
                      </span>
                      <DueChip nextBillingDate={b.next_billing_date} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {formatMoney(b.amount_due)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <WhatsAppAction billing={b} compact />
                      <button
                        type="button"
                        onClick={() => onChangePlan(b)}
                        className={changePlanClass(true)}
                      >
                        <Repeat aria-hidden className="h-4 w-4" />
                        Cambiar plan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
