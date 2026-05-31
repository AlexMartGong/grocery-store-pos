import type { ReactNode } from "react";
import { AlertCircle, Loader2, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { formatMoney } from "../../sales/utils/format";
import type { SalesTodayResponse } from "../types";

interface SalesTodayCardProps {
  data: SalesTodayResponse | null;
  loading: boolean;
  error: string | null;
}

const MetricTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
    <div className="flex items-center gap-2 text-slate-500">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

export const SalesTodayCard = ({ data, loading, error }: SalesTodayCardProps) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600">Ventas del Día</h2>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <TrendingUp size={16} aria-hidden />
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 size={24} className="animate-spin" aria-label="Cargando ventas del día" />
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

      {!loading && !error && data && (
        <>
          <p className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
            {formatMoney(data.dayTotal)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Total general</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricTile
              label="Tickets Emitidos"
              value={String(data.tickets)}
              icon={<ReceiptText size={14} aria-hidden />}
            />
            <MetricTile
              label="Efectivo / Caja Real"
              value={formatMoney(data.dayCollected)}
              icon={<Wallet size={14} aria-hidden />}
            />
            <MetricTile
              label="Fiado / Cuentas por Cobrar"
              value={formatMoney(data.dayOnCredit)}
              icon={<AlertCircle size={14} aria-hidden />}
            />
          </div>
        </>
      )}
    </article>
  );
};
