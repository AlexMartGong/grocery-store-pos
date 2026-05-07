import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ListOrdered, Loader2, ReceiptText } from "lucide-react";
import { getSales } from "../api/salesApi";
import { getProductById } from "../../products/api/productsApi";
import { mapSalesError } from "../utils/errorMessages";
import { formatMoney, formatSaleDate, formatSaleId } from "../utils/format";
import { SaleSummaryModal } from "./SaleSummaryModal";
import type { CartItem, SalePaymentMethod, SaleResponse } from "../types";

const PAGE_SIZE = 20;

const METHOD_LABEL: Record<SalePaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

const METHOD_BADGE: Record<SalePaymentMethod, string> = {
  CASH: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  CARD: "bg-sky-100 text-sky-700 ring-sky-200",
  TRANSFER: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  CREDIT: "bg-amber-100 text-amber-700 ring-amber-200",
  MIXED: "bg-violet-100 text-violet-700 ring-violet-200",
};

const customerLabel = (id: string | null): string =>
  id ? `Cliente #${id.slice(0, 8).toUpperCase()}` : "Público General";

export const SalesList = () => {
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
  const [modalCartItems, setModalCartItems] = useState<CartItem[]>([]);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSales({ page, size: PAGE_SIZE });
      setSales(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(mapSalesError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openSale = async (sale: SaleResponse) => {
    setLoadingDetailId(sale.id);
    setError(null);
    try {
      const uniqueIds = Array.from(new Set(sale.items.map((i) => i.product_id)));
      const products = await Promise.all(
        uniqueIds.map((id) =>
          getProductById(id).catch(() => null),
        ),
      );
      const productById = new Map(
        products
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .map((p) => [p.id, p]),
      );
      const items: CartItem[] = sale.items.map((i) => {
        const p = productById.get(i.product_id);
        return {
          productId: i.product_id,
          name: p?.name ?? "Producto",
          barcode: p?.barcode ?? null,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unit_price),
          subtotal: Number(i.subtotal),
          unitOfMeasure: p?.unit_of_measure ?? "PIECE",
        };
      });
      setModalCartItems(items);
      setSelectedSale(sale);
    } catch (err) {
      setError(mapSalesError(err));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const closeModal = () => {
    setSelectedSale(null);
    setModalCartItems([]);
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
            <ListOrdered className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Historial de ventas
            </h1>
            <p className="text-sm text-slate-500">
              Consulta y reimprime tickets de ventas anteriores
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
          {!loading && sales.length === 0 && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Sin ventas registradas.
            </li>
          )}
          {!loading &&
            sales.map((s) => (
              <li
                key={s.id}
                className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      #{formatSaleId(s.id)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatSaleDate(s.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${METHOD_BADGE[s.payment_method]}`}
                  >
                    {METHOD_LABEL[s.payment_method]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-600">
                    {customerLabel(s.customer_id)}
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {formatMoney(s.total_amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void openSale(s)}
                  disabled={loadingDetailId === s.id}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingDetailId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ReceiptText className="h-4 w-4" />
                  )}
                  {loadingDetailId === s.id ? "Cargando..." : "Ver ticket"}
                </button>
              </li>
            ))}
        </ul>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Sin ventas registradas.
                  </td>
                </tr>
              )}
              {!loading &&
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      #{formatSaleId(s.id)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatSaleDate(s.created_at)}
                    </td>
                    <td className="px-4 py-3">{customerLabel(s.customer_id)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${METHOD_BADGE[s.payment_method]}`}
                      >
                        {METHOD_LABEL[s.payment_method]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatMoney(s.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => void openSale(s)}
                          disabled={loadingDetailId === s.id}
                          className="inline-flex w-32 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingDetailId === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ReceiptText className="h-3.5 w-3.5" />
                          )}
                          {loadingDetailId === s.id ? "Cargando..." : "Ver ticket"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <SaleSummaryModal
        sale={selectedSale}
        cartItems={modalCartItems}
        onClose={closeModal}
      />
    </div>
  );
};
