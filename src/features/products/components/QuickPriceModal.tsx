import axios from "axios";
import { useState, type SyntheticEvent } from "react";
import { AlertCircle, Save } from "lucide-react";
import { Modal } from "../../../shared/components/ui/Modal";
import { updateProductPrices } from "../api/productsApi";
import { mapProductsError } from "../utils/errorMessages";
import type { ApiErrorResponse } from "../../auth/types";
import type { ProductResponse } from "../types";

interface QuickPriceModalProps {
  isOpen: boolean;
  product: ProductResponse | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const QuickPriceModal = ({ isOpen, product, onClose, onSaved }: QuickPriceModalProps) => {
  const [salePrice, setSalePrice] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-seed the form whenever a different product is passed in.
  const [seededFor, setSeededFor] = useState<typeof product>(null);
  if (product !== seededFor) {
    setSeededFor(product);
    if (product) {
      setSalePrice(product.sale_price);
      setPurchaseCost(product.purchase_cost);
      setError(null);
      setFieldErrors({});
    }
  }

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await updateProductPrices(product.id, {
        ...(salePrice !== "" ? { sale_price: salePrice } : {}),
        ...(purchaseCost !== "" ? { purchase_cost: purchaseCost } : {}),
      });
      onSaved();
      onClose();
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapProductsError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambio rápido de precios"
      description={product ? `Producto: ${product.name}` : undefined}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="qp-sale" className="block text-sm font-medium text-slate-700">
            Precio de venta
          </label>
          <input
            id="qp-sale"
            name="sale_price"
            type="number"
            step="0.01"
            min="0"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            inputMode="decimal"
            className={inputClass(Boolean(fieldErrors.sale_price))}
          />
          {fieldErrors.sale_price && (
            <p className="mt-1 text-sm text-rose-500">{fieldErrors.sale_price}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="qp-cost" className="block text-sm font-medium text-slate-700">
            Costo de compra
          </label>
          <input
            id="qp-cost"
            name="purchase_cost"
            type="number"
            step="0.01"
            min="0"
            value={purchaseCost}
            onChange={(e) => setPurchaseCost(e.target.value)}
            inputMode="decimal"
            className={inputClass(Boolean(fieldErrors.purchase_cost))}
          />
          {fieldErrors.purchase_cost && (
            <p className="mt-1 text-sm text-rose-500">{fieldErrors.purchase_cost}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? "Guardando..." : "Guardar precios"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
