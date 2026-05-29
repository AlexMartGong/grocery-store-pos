import axios from "axios";
import { useEffect, useState, type SyntheticEvent } from "react";
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, PackagePlus } from "lucide-react";
import { Modal } from "../../../shared/components/ui/Modal";
import { adjustStock } from "../../inventory/api/inventoryApi";
import { mapInventoryError } from "../../inventory/utils/errorMessages";
import type { InventoryReason } from "../../inventory/types";
import type { ApiErrorResponse } from "../../auth/types";
import type { ProductResponse } from "../types";

interface AdjustStockModalProps {
  isOpen: boolean;
  product: ProductResponse | null;
  onClose: () => void;
  onSaved: () => void;
}

const REASON_OPTIONS: Array<{ value: InventoryReason; label: string }> = [
  { value: "RESTOCK", label: "Reabasto (RESTOCK)" },
  { value: "LOSS", label: "Merma (LOSS)" },
  { value: "ADJUSTMENT", label: "Ajuste (ADJUSTMENT)" },
];

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const AdjustStockModal = ({ isOpen, product, onClose, onSaved }: AdjustStockModalProps) => {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<InventoryReason>("RESTOCK");
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT">("IN");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!product) return;
    setQuantity("");
    setReason("RESTOCK");
    setAdjustmentType("IN");
    setNotes("");
    setError(null);
    setFieldErrors({});
  }, [product]);

  const isOutflow =
    reason === "LOSS" || (reason === "ADJUSTMENT" && adjustmentType === "OUT");
  const helpText = isOutflow
    ? "Se restará del stock actual."
    : "Se sumará al stock actual.";

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    const magnitude = quantity.trim().replace(/^[+-]/, "");
    const signedQuantity =
      isOutflow && magnitude !== "" ? `-${magnitude}` : magnitude;
    try {
      await adjustStock({
        product_id: product.id,
        quantity: signedQuantity,
        reason,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      onSaved();
      onClose();
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapInventoryError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar stock"
      description={
        product
          ? `Producto: ${product.name} · Stock actual: ${product.current_stock}`
          : undefined
      }
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
          <label htmlFor="adj-quantity" className="block text-sm font-medium text-slate-700">
            Cantidad
          </label>
          <input
            id="adj-quantity"
            name="quantity"
            type="number"
            step="1"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            inputMode="decimal"
            className={inputClass(Boolean(fieldErrors.quantity))}
          />
          {fieldErrors.quantity ? (
            <p className="mt-1 text-sm text-rose-500">{fieldErrors.quantity}</p>
          ) : (
            <p className="text-xs text-slate-500">{helpText}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="adj-reason" className="block text-sm font-medium text-slate-700">
            Motivo
          </label>
          <select
            id="adj-reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as InventoryReason)}
            required
            className={inputClass(Boolean(fieldErrors.reason))}
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldErrors.reason && (
            <p className="mt-1 text-sm text-rose-500">{fieldErrors.reason}</p>
          )}

          {reason === "ADJUSTMENT" && (
            <div
              role="group"
              aria-label="Dirección del ajuste"
              className="mt-2 grid grid-cols-2 gap-3"
            >
              {(
                [
                  { value: "IN", label: "Entrada", icon: ArrowDownToLine },
                  { value: "OUT", label: "Salida", icon: ArrowUpFromLine },
                ] as const
              ).map((opt) => {
                const active = adjustmentType === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAdjustmentType(opt.value)}
                    aria-pressed={active}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="adj-notes" className="block text-sm font-medium text-slate-700">
            Notas <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="adj-notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className={inputClass(Boolean(fieldErrors.notes))}
          />
          {fieldErrors.notes && (
            <p className="mt-1 text-sm text-rose-500">{fieldErrors.notes}</p>
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
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PackagePlus className="h-4 w-4" />
            {submitting ? "Aplicando..." : "Aplicar ajuste"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
