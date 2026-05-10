import { useEffect, useState, type SyntheticEvent } from "react";
import axios from "axios";
import { AlertCircle, Ban, Loader2 } from "lucide-react";
import { Modal } from "../../../shared/components/ui/Modal";
import { cancelSale } from "../api/salesApi";
import { mapSalesError } from "../utils/errorMessages";
import { formatMoney, formatSaleId } from "../utils/format";
import type { ApiErrorResponse } from "../../auth/types";
import type { CancellationReason, SaleStatus } from "../types";

interface CancelSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: { id: string; total_amount: string; status: SaleStatus } | null;
  onSuccess: () => void;
}

const REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: "CASHIER_ERROR", label: "Error de cajero" },
  { value: "CUSTOMER_REGRET", label: "Cliente cambió de opinión" },
  { value: "WRONG_PRODUCT", label: "Producto equivocado" },
  { value: "OTHER", label: "Otro" },
];

const inputClass = (hasError: boolean): string =>
  `w-full rounded-md border px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-400 focus:ring-slate-300/40"
  }`;

export const CancelSaleModal = ({ isOpen, onClose, sale, onSuccess }: CancelSaleModalProps) => {
  const [reason, setReason] = useState<CancellationReason>("CASHIER_ERROR");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => {
      setReason("CASHIER_ERROR");
      setNotes("");
      setError(null);
      setFieldErrors({});
      setSubmitting(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!sale) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await cancelSale(sale.id, reason, notes.trim() || undefined);
      onSuccess();
      onClose();
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapSalesError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancelar Venta"
      description="Esta acción no se puede deshacer."
    >
      {sale && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3">
            <p className="text-sm font-semibold text-rose-700">
              ¿Estás seguro de que deseas cancelar la venta #{formatSaleId(sale.id)}?
            </p>
            <p className="mt-1 text-sm text-rose-600">
              Total a cancelar:{" "}
              <span className="font-semibold tabular-nums">{formatMoney(sale.total_amount)}</span>
            </p>
          </div>

          <div>
            <label
              htmlFor="cancel-reason"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Motivo <span className="text-rose-600">*</span>
            </label>
            <select
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as CancellationReason)}
              required
              disabled={submitting}
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
          </div>

          <div>
            <label
              htmlFor="cancel-notes"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Notas (opcional)
            </label>
            <textarea
              id="cancel-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={submitting}
              placeholder="Detalles adicionales sobre la cancelación..."
              className={inputClass(Boolean(fieldErrors.notes))}
            />
            {fieldErrors.notes && (
              <p className="mt-1 text-sm text-rose-500">{fieldErrors.notes}</p>
            )}
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

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Conservar Venta
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              {submitting ? "Cancelando..." : "Confirmar Cancelación"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
