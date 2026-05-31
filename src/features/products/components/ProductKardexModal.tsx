import { useCallback, useEffect, useId, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  X,
} from "lucide-react";
import { getProductMovements } from "../../inventory/api/inventoryApi";
import { mapInventoryError } from "../../inventory/utils/errorMessages";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import type { InventoryMovementResponse } from "../../inventory/types";

interface ProductKardexModalProps {
  isOpen: boolean;
  productId: string | null;
  productName: string | null;
  onClose: () => void;
}

const PAGE_SIZE = 20;

const REASON_LABEL: Record<string, string> = {
  RESTOCK: "Reabasto",
  SALE: "Venta",
  LOSS: "Merma",
  ADJUSTMENT: "Ajuste",
  CANCELLATION: "Cancelación",
};

// Epoch-safe date formatter (mirrors sales/utils/format.formatSaleDate). Defined locally to avoid a
// cross-feature import — same pattern as ProductsList's own local formatMoney.
const formatDate = (iso: string | null | undefined): string => {
  const d = iso ? new Date(iso) : new Date();
  const valid = Number.isFinite(d.getTime()) && d.getFullYear() > 1970;
  const safe = valid ? d : new Date();
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(safe);
};

interface SignedQty {
  text: string;
  className: string;
  Icon: typeof ArrowUpRight | null;
}

// The +/− sign is real text, so meaning is conveyed beyond color (WCAG 1.4.1).
const signedQty = (quantity: number): SignedQty => {
  if (quantity > 0) {
    return {
      text: `+${quantity}`,
      className: "text-emerald-600",
      Icon: ArrowUpRight,
    };
  }
  if (quantity < 0) {
    return { text: `${quantity}`, className: "text-rose-600", Icon: ArrowDownRight };
  }
  return { text: "0", className: "text-slate-500", Icon: null };
};

export const ProductKardexModal = ({
  isOpen,
  productId,
  productName,
  onClose,
}: ProductKardexModalProps) => {
  const titleId = useId();
  const { render, show } = useModalAnimation(isOpen, { onClose });

  const [movements, setMovements] = useState<InventoryMovementResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isOpen || !productId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProductMovements(productId, page, PAGE_SIZE);
      setMovements(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(mapInventoryError(err));
    } finally {
      setLoading(false);
    }
  }, [isOpen, productId, page]);

  useEffect(() => {
    setPage(0);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[90vh] w-full max-w-2xl transform flex-col rounded-t-2xl bg-white p-4 shadow-xl transition-all duration-300 ease-out sm:rounded-2xl sm:p-6 ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <History className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                Historial de movimientos
              </h2>
              {productName && (
                <p className="text-sm text-slate-500">{productName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mobile cards */}
          <ul className="space-y-3 overflow-y-auto sm:hidden">
            {loading && (
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-400">
                Cargando...
              </li>
            )}
            {!loading && movements.length === 0 && (
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-400">
                Sin movimientos.
              </li>
            )}
            {!loading &&
              movements.map((m) => {
                const q = signedQty(m.quantity);
                return (
                  <li
                    key={m.id}
                    className="space-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {REASON_LABEL[m.reason] ?? m.reason}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold tabular-nums ${q.className}`}
                      >
                        {q.Icon && <q.Icon aria-hidden className="h-4 w-4" />}
                        {q.text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(m.createdAt)}</p>
                    {m.notes && <p className="text-sm text-slate-600">{m.notes}</p>}
                  </li>
                );
              })}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-y-auto rounded-xl border border-slate-200 sm:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && movements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Sin movimientos.
                    </td>
                  </tr>
                )}
                {!loading &&
                  movements.map((m) => {
                    const q = signedQty(m.quantity);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDate(m.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {REASON_LABEL[m.reason] ?? m.reason}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{m.notes ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center justify-end gap-1 font-semibold tabular-nums ${q.className}`}
                          >
                            {q.Icon && <q.Icon aria-hidden className="h-4 w-4" />}
                            {q.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
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
    </div>
  );
};
