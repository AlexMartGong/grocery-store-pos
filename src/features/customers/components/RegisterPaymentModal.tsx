import { useEffect, useId, useState, type SyntheticEvent } from "react";
import { AlertCircle, Loader2, Wallet } from "lucide-react";
import axios from "axios";
import { Modal } from "../../../shared/components/ui/Modal";
import { registerPayment } from "../api/customersApi";
import { mapCustomersError } from "../utils/errorMessages";
import type { CustomerResponse } from "../types";
import type { ApiErrorResponse } from "../../auth/types";

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Pick<CustomerResponse, "id" | "full_name" | "outstanding_balance"> | null;
  onSuccess: () => void | Promise<void>;
}

const formatMoney = (value: string) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-3 text-base text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-300/40"
  }`;

export const RegisterPaymentModal = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: RegisterPaymentModalProps) => {
  const amountId = useId();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setAmount("");
    setSubmitting(false);
    setError(null);
    setFieldErrors({});
  }, [isOpen]);

  if (!customer) return null;

  const balance = Number(customer.outstanding_balance);
  if (!Number.isFinite(balance) || balance <= 0) return null;

  const parsed = parseFloat(amount);
  const exceedsBalance = Number.isFinite(parsed) && parsed > balance;
  const isDisabled =
    submitting ||
    !amount ||
    !Number.isFinite(parsed) ||
    parsed <= 0 ||
    exceedsBalance;

  const safeClose = () => {
    if (!submitting) onClose();
  };

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      const payload = Number(amount).toFixed(2);
      await registerPayment(customer.id, payload);
      await onSuccess();
      onClose();
    } catch (err) {
      if (
        axios.isAxiosError<ApiErrorResponse>(err) &&
        err.response?.data?.fields
      ) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapCustomersError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={safeClose}
      title="Registrar abono"
      description={customer.full_name}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Deuda actual
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-600">
            {formatMoney(customer.outstanding_balance)}
          </p>
        </div>

        <div>
          <label
            htmlFor={amountId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Monto a abonar
          </label>
          <div className="relative">
            <Wallet
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id={amountId}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={customer.outstanding_balance}
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={submitting}
              className={`${inputClass(!!fieldErrors.amount)} pl-9 tabular-nums`}
            />
          </div>
          {fieldErrors.amount && (
            <p className="mt-1 text-sm text-rose-500">{fieldErrors.amount}</p>
          )}
          {exceedsBalance && !fieldErrors.amount && (
            <p className="mt-1 text-sm text-rose-500">
              El monto no puede exceder la deuda actual.
            </p>
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

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={safeClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar abono"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
