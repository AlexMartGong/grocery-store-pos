import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, PackageX } from "lucide-react";
import { getProductsToRestock } from "../api/dashboardApi";
import { mapDashboardError } from "../utils/errorMessages";
import type { ProductToRestockResponse } from "../types";

const PAGE_SIZE = 5;

interface StockBadge {
  className: string;
  label: string;
  ariaLabel: string;
}

// Mirrors ProductsList.stockBadge: rose = Agotado, amber = Bajo. The endpoint only
// returns products at/below minimum, so a badge is expected for every row.
const stockBadge = (current: string, minimum: string, name: string): StockBadge => {
  const cur = Number(current);
  if (Number.isFinite(cur) && cur <= 0) {
    return {
      className: "bg-rose-100 text-rose-700 ring-rose-200",
      label: "Agotado",
      ariaLabel: `${name} agotado`,
    };
  }
  return {
    className: "bg-amber-100 text-amber-700 ring-amber-200",
    label: "Bajo",
    ariaLabel: `${name} con stock por debajo del mínimo (${current} de ${minimum})`,
  };
};

const formatStock = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : value;
};

// The parent remounts this widget via a changing `key` to force a refresh
// (e.g. the dashboard "Sincronizar" button), so no refresh prop is needed here.
export const ProductsToRestockCard = () => {
  const [items, setItems] = useState<ProductToRestockResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductsToRestock(page, PAGE_SIZE);
      setItems(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(mapDashboardError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <header className="mb-4 flex items-center gap-2">
        <PackageX size={18} className="text-slate-500" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">Productos por Agotar</h2>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 size={22} className="animate-spin" aria-label="Cargando productos" />
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">
          Sin productos por agotar 🎉
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Stock actual</th>
                  <th className="px-4 py-3 font-medium">Mínimo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => {
                  const badge = stockBadge(p.currentStock, p.minimumStock, p.name);
                  return (
                    <tr key={p.productId}>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center font-semibold text-rose-600">
                          <AlertTriangle aria-hidden className="mr-1 inline h-4 w-4" />
                          {formatStock(p.currentStock)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatStock(p.minimumStock)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          aria-label={badge.ariaLabel}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {items.map((p) => {
              const badge = stockBadge(p.currentStock, p.minimumStock, p.name);
              return (
                <li
                  key={p.productId}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <span
                      aria-label={badge.ariaLabel}
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center text-sm font-semibold text-rose-600">
                    <AlertTriangle aria-hidden className="mr-1 inline h-4 w-4" />
                    {formatStock(p.currentStock)}
                    <span className="ml-1 font-normal text-slate-500">
                      / mínimo {formatStock(p.minimumStock)}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!loading && !error && totalPages > 1 && (
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
      )}
    </section>
  );
};
