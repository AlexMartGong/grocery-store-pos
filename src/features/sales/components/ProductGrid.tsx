import { AlertCircle, Camera, PackageSearch, Search } from "lucide-react";
import { usePosProducts } from "../hooks/usePosProducts";
import type { ProductResponse } from "../../products/types";
import { ProductCard } from "./ProductCard";

const SkeletonCard = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="h-24 w-full animate-pulse bg-slate-200" />
    <div className="flex flex-col gap-2 p-3">
      <div className="space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
    </div>
  </div>
);

interface ProductGridProps {
  onProductClick: (product: ProductResponse) => void;
  onOpenCameraScanner?: () => void;
}

export const ProductGrid = ({ onProductClick, onOpenCameraScanner }: ProductGridProps) => {
  const { products, loading, error, searchInput, setSearchInput } = usePosProducts();

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur md:px-6 md:py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              aria-label="Buscar producto por nombre o código de barras"
              data-allow-scanner="true"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
            />
          </div>
          {onOpenCameraScanner && (
            <button
              type="button"
              onClick={onOpenCameraScanner}
              aria-label="Escanear código con la cámara"
              title="Escanear con cámara"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Camera aria-hidden className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <PackageSearch aria-hidden className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              No se encontraron productos
            </p>
            <p className="text-xs text-slate-400">
              Prueba con otro término de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={onProductClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
