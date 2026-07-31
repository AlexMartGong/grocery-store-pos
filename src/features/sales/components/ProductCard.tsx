import { AlertTriangle } from "lucide-react";
import type { ProductResponse } from "../../products/types";
import { ProductImage } from "../../../shared/components/ui/ProductImage";
import { formatMoney, getInitials, pastelColorFromId } from "../utils/format";

const stockTone = (current: string, minimum: string) => {
  const cur = Number(current);
  const min = Number(minimum);
  if (!Number.isFinite(cur) || cur <= 0) {
    return { className: "text-rose-600", label: "Agotado", warn: true };
  }
  if (Number.isFinite(min) && cur <= min) {
    return {
      className: "text-amber-600",
      label: `${cur} en stock (bajo)`,
      warn: true,
    };
  }
  return { className: "text-emerald-600", label: `${cur} en stock`, warn: false };
};

export const ProductCard = ({
  product,
  onAdd,
}: {
  product: ProductResponse;
  onAdd: (product: ProductResponse) => void;
}) => {
  const tone = stockTone(product.current_stock, product.minimum_stock);
  const outOfStock = Number(product.current_stock) <= 0;
  const initials = getInitials(product.name);
  const palette = pastelColorFromId(product.id);

  return (
    <button
      type="button"
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      aria-label={`Agregar ${product.name} al carrito${outOfStock ? " (agotado)" : ""}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
        outOfStock
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-95"
      }`}
    >
      <div className="relative flex h-24 w-full shrink-0 items-center justify-center bg-slate-50/60 p-2">
        <ProductImage
          src={product.image_url}
          alt=""
          className="max-h-full max-w-full object-contain"
          fallback={
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${palette}`}
              aria-hidden="true"
            >
              {initials}
            </div>
          }
        />
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900" title={product.name}>
            {product.name}
          </p>
          {product.barcode && (
            <p className="truncate text-xs text-slate-400">{product.barcode}</p>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="text-lg font-bold text-slate-800">
            {formatMoney(product.sale_price)}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${tone.className}`}
            title={tone.label}
          >
            {tone.warn && <AlertTriangle aria-hidden className="h-3.5 w-3.5" />}
            {tone.label}
          </span>
        </div>
      </div>
    </button>
  );
};
