import { Fragment, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  DollarSign,
  History,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { deleteProduct, getProducts } from "../api/productsApi";
import { mapProductsError } from "../utils/errorMessages";
import { useAuthStore } from "../../auth/store/authStore";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import { ProductImage } from "../../../shared/components/ui/ProductImage";
import { QuickPriceModal } from "./QuickPriceModal";
import { AdjustStockModal } from "./AdjustStockModal";
import { ProductKardexModal } from "./ProductKardexModal";
import type { ProductResponse, UnitOfMeasure } from "../types";

const PAGE_SIZE = 20;
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

const UNIT_LABEL: Record<UnitOfMeasure, string> = {
  PIECE: "pza",
  KILO: "kg",
};

const formatMoney = (value: string) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

const ThumbFallback = () => (
  <div
    aria-hidden="true"
    className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-400"
  >
    <Package className="h-5 w-5" />
  </div>
);

interface StockBadge {
  className: string;
  label: string;
  ariaLabel: string;
}

const stockBadge = (current: string, minimum: string, name: string): StockBadge | null => {
  const cur = Number(current);
  const min = Number(minimum);
  if (!Number.isFinite(cur)) return null;
  if (cur <= 0) {
    return {
      className: "bg-rose-100 text-rose-700 ring-rose-200",
      label: "Agotado",
      ariaLabel: `${name} agotado`,
    };
  }
  if (Number.isFinite(min) && cur <= min) {
    return {
      className: "bg-amber-100 text-amber-700 ring-amber-200",
      label: "Bajo",
      ariaLabel: `${name} con stock por debajo del mínimo`,
    };
  }
  return null;
};

export const ProductsList = () => {
  const navigate = useNavigate();
  const isOwner = useAuthStore((s) => s.user?.role === "OWNER");

  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ACTIVE");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [priceModalProduct, setPriceModalProduct] = useState<ProductResponse | null>(null);
  const [stockModalProduct, setStockModalProduct] = useState<ProductResponse | null>(null);
  const [kardexProduct, setKardexProduct] = useState<ProductResponse | null>(null);

  // A new search sends the list back to page 0 — adjusted during render, not in an effect.
  const [pageSearch, setPageSearch] = useState(debouncedSearch);
  if (pageSearch !== debouncedSearch) {
    setPageSearch(debouncedSearch);
    setPage(0);
  }

  const fetchProducts = useCallback(() => {
    const active = activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE";
    return getProducts(page, PAGE_SIZE, active, debouncedSearch || undefined);
  }, [page, activeFilter, debouncedSearch]);
  const { data, loading, error, reload, reportError } = useAsyncData(
    fetchProducts,
    mapProductsError,
  );
  const products: ProductResponse[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const onDelete = async (product: ProductResponse) => {
    try {
      await deleteProduct(product.id);
      setConfirmDeleteId(null);
      reload();
    } catch (err) {
      reportError(mapProductsError(err));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Productos</h1>
              <p className="text-sm text-slate-500">Catálogo e inventario de tu tienda</p>
            </div>
          </div>
          {isOwner && (
            <Link
              to="/pos/products/new"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </Link>
          )}
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="activeFilter" className="text-sm text-slate-600">
            Mostrar
          </label>
          <select
            id="activeFilter"
            value={activeFilter}
            onChange={(e) => {
              setPage(0);
              setActiveFilter(e.target.value as ActiveFilter);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          >
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="ALL">Todos</option>
          </select>
          <div className="relative flex-1 min-w-48">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              aria-label="Buscar productos"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
            />
          </div>
        </div>

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
          {!loading && products.length === 0 && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Sin productos.
            </li>
          )}
          {!loading &&
            products.map((p) => {
              const badge = stockBadge(p.current_stock, p.minimum_stock, p.name);
              return (
                <li
                  key={p.id}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <ProductImage
                        src={p.image_url}
                        alt={p.name}
                        className="h-10 w-10 shrink-0 rounded-md bg-slate-100 object-cover"
                        fallback={<ThumbFallback />}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="font-mono text-xs text-slate-500">
                          {p.barcode ?? "—"}
                        </p>
                      </div>
                    </div>
                    {badge && (
                      <span
                        aria-label={badge.ariaLabel}
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span>
                      <span className="text-slate-500">Precio:</span>{" "}
                      <span className="font-medium">{formatMoney(p.sale_price)}</span>
                    </span>
                    <span>
                      <span className="text-slate-500">Stock:</span>{" "}
                      <span className="font-medium">
                        {p.current_stock} {UNIT_LABEL[p.unit_of_measure]}
                      </span>
                    </span>
                  </div>

                  {confirmDeleteId === p.id ? (
                    <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                      <p className="text-sm text-rose-700">
                        ¿Eliminar &ldquo;{p.name}&rdquo;?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void onDelete(p)}
                          className="flex-1 rounded-md bg-rose-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => navigate(`/pos/products/${p.id}/edit`)}
                          className="inline-flex flex-1 min-w-32 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setPriceModalProduct(p)}
                          className="inline-flex flex-1 min-w-32 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        >
                          <DollarSign className="h-4 w-4" /> Precio
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setStockModalProduct(p)}
                        className="inline-flex flex-1 min-w-32 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <PackagePlus className="h-4 w-4" /> Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setKardexProduct(p)}
                        className="inline-flex flex-1 min-w-32 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <History className="h-4 w-4" /> Historial
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="inline-flex flex-1 min-w-32 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      )}
                    </div>
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
                <th className="w-14 px-4 py-3 font-medium">
                  <span className="sr-only">Imagen</span>
                </th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium text-right">Precio</th>
                <th className="px-4 py-3 font-medium text-right">Costo</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
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
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Sin productos.
                  </td>
                </tr>
              )}
              {!loading &&
                products.map((p) => {
                  const badge = stockBadge(p.current_stock, p.minimum_stock, p.name);
                  return (
                    <Fragment key={p.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <ProductImage
                            src={p.image_url}
                            alt={p.name}
                            className="h-10 w-10 rounded-md bg-slate-100 object-cover"
                            fallback={<ThumbFallback />}
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-900">
                          {p.barcode ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(p.sale_price)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          {formatMoney(p.purchase_cost)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="tabular-nums">
                              {p.current_stock} {UNIT_LABEL[p.unit_of_measure]}
                            </span>
                            {badge && (
                              <span
                                aria-label={badge.ariaLabel}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => navigate(`/pos/products/${p.id}/edit`)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </button>
                            )}
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => setPriceModalProduct(p)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                              >
                                <DollarSign className="h-3.5 w-3.5" /> Precio
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setStockModalProduct(p)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              <PackagePlus className="h-3.5 w-3.5" /> Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => setKardexProduct(p)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                              <History className="h-3.5 w-3.5" /> Historial
                            </button>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {confirmDeleteId === p.id && (
                        <tr className="bg-rose-50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <p className="flex-1 text-sm text-rose-700">
                                ¿Eliminar producto &ldquo;{p.name}&rdquo;?
                              </p>
                              <button
                                type="button"
                                onClick={() => void onDelete(p)}
                                className="rounded-md bg-rose-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

      <QuickPriceModal
        isOpen={priceModalProduct !== null}
        product={priceModalProduct}
        onClose={() => setPriceModalProduct(null)}
        onSaved={reload}
      />
      <AdjustStockModal
        isOpen={stockModalProduct !== null}
        product={stockModalProduct}
        onClose={() => setStockModalProduct(null)}
        onSaved={reload}
      />
      <ProductKardexModal
        isOpen={kardexProduct !== null}
        productId={kardexProduct?.id ?? null}
        productName={kardexProduct?.name ?? null}
        onClose={() => setKardexProduct(null)}
      />
    </div>
  );
};
