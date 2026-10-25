import { useCallback, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  FileText,
  Wallet,
} from "lucide-react";
import { getShiftHistory } from "../api/cashApi";
import { mapCashShiftError } from "../utils/errorMessages";
import { formatMoney, formatSaleDate } from "../../sales/utils/format";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import type { CashShiftResponse, CashShiftStatus } from "../types";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<CashShiftStatus, string> = {
  OPEN: "Abierto",
  CLOSED: "Cerrado",
};

const STATUS_BADGE: Record<CashShiftStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-200 text-slate-600 ring-slate-300",
};

type DiffDisplay = {
  label: string;
  color: string;
  Icon: typeof ArrowDownCircle;
};

// color + icon (never color alone — WCAG 1.4.1), mirrors CloseShiftModal.
const diffDisplay = (difference: string | null): DiffDisplay | null => {
  if (difference === null) return null;
  const n = Number(difference);
  if (!Number.isFinite(n)) return null;
  if (n < -0.0049)
    return { label: "Faltante", color: "text-rose-600", Icon: ArrowDownCircle };
  if (n > 0.0049)
    return { label: "Sobrante", color: "text-emerald-600", Icon: ArrowUpCircle };
  return { label: "Exacto", color: "text-slate-600", Icon: CheckCircle2 };
};

export const CashShiftsScreen = () => {
  const [page, setPage] = useState(0);

  const fetchShifts = useCallback(() => getShiftHistory({ page, size: PAGE_SIZE }), [page]);
  const { data, loading, error } = useAsyncData(fetchShifts, mapCashShiftError);
  const shifts: CashShiftResponse[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Historial de cortes de caja
            </h1>
            <p className="text-sm text-slate-500">
              Consulta los turnos de caja: fondo inicial, balance esperado y
              diferencias.
            </p>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {loading && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Cargando...
            </li>
          )}
          {!loading && shifts.length === 0 && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Sin cortes registrados.
            </li>
          )}
          {!loading &&
            shifts.map((s) => {
              const diff = diffDisplay(s.difference);
              return (
                <li
                  key={s.id}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Apertura
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatSaleDate(s.opened_at)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[s.status]}`}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Cierre</span>
                    <span className="tabular-nums text-slate-700">
                      {s.closed_at ? formatSaleDate(s.closed_at) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Fondo inicial</span>
                    <span className="tabular-nums font-medium text-slate-900">
                      {formatMoney(s.opening_balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Balance esperado</span>
                    <span className="tabular-nums text-slate-700">
                      {s.expected_balance !== null
                        ? formatMoney(s.expected_balance)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Diferencia</span>
                    {diff ? (
                      <span
                        className={`inline-flex items-center gap-1.5 tabular-nums font-semibold ${diff.color}`}
                      >
                        <diff.Icon aria-hidden className="h-4 w-4 shrink-0" />
                        {formatMoney(s.difference!)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  {s.notes && (
                    <p className="flex items-start gap-1.5 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <FileText aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{s.notes}</span>
                    </p>
                  )}
                </li>
              );
            })}
        </ul>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Apertura</th>
                <th className="px-4 py-3 font-medium">Cierre</th>
                <th className="px-4 py-3 text-right font-medium">Fondo inicial</th>
                <th className="px-4 py-3 text-right font-medium">Balance esperado</th>
                <th className="px-4 py-3 text-right font-medium">Diferencia</th>
                <th className="px-4 py-3 text-center font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && shifts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Sin cortes registrados.
                  </td>
                </tr>
              )}
              {!loading &&
                shifts.map((s) => {
                  const diff = diffDisplay(s.difference);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[s.status]}`}
                        >
                          {STATUS_LABEL[s.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatSaleDate(s.opened_at)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.closed_at ? formatSaleDate(s.closed_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                        {formatMoney(s.opening_balance)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {s.expected_balance !== null
                          ? formatMoney(s.expected_balance)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {diff ? (
                          <span
                            className={`inline-flex items-center justify-end gap-1.5 tabular-nums font-semibold ${diff.color}`}
                            title={diff.label}
                          >
                            <diff.Icon aria-hidden className="h-4 w-4 shrink-0" />
                            {formatMoney(s.difference!)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.notes ? (
                          <span
                            title={s.notes}
                            aria-label={s.notes}
                            className="inline-flex justify-center text-slate-500"
                          >
                            <FileText aria-hidden className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Go to previous page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              aria-label="Go to next page"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
