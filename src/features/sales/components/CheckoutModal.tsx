import { useEffect, useState, type SyntheticEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  NotebookPen,
  X,
} from "lucide-react";
import { useCartTotal, usePosStore } from "../store/posStore";
import { usePosCustomers } from "../hooks/usePosCustomers";
import { createSale } from "../api/salesApi";
import { mapSalesError } from "../utils/errorMessages";
import { formatMoney } from "../utils/format";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import type {
  CartItem,
  CreateSaleRequest,
  SalePaymentMethod,
  SaleResponse,
} from "../types";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (sale: SaleResponse, tenderedAmount: number, cartItems: CartItem[]) => void;
}

const HIGH_CREDIT_THRESHOLD = 0.9;

const QUICK_CASH = [50, 100, 200, 500, 1000] as const;
const QUICK_COINS = [1, 2, 5, 10, 20] as const;

interface MethodConfig {
  value: SalePaymentMethod;
  label: string;
  icon: typeof Banknote;
  needsCustomer: boolean;
}

const METHODS: MethodConfig[] = [
  { value: "CASH", label: "Efectivo", icon: Banknote, needsCustomer: false },
  { value: "CARD", label: "Tarjeta", icon: CreditCard, needsCustomer: false },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowRightLeft, needsCustomer: false },
  { value: "CREDIT", label: "Crédito", icon: NotebookPen, needsCustomer: true },
];

export const CheckoutModal = ({ open, onClose, onSuccess }: CheckoutModalProps) => {
  const cart = usePosStore((s) => s.cart);
  const selectedCustomerId = usePosStore((s) => s.selectedCustomerId);
  const clearCart = usePosStore((s) => s.clearCart);
  const total = useCartTotal();
  const { customers } = usePosCustomers();

  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [isMixed, setIsMixed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { render, show } = useModalAnimation(open, {
    onClose,
    closeOnEscape: !submitting,
  });

  useEffect(() => {
    if (!open) return;
    setPaymentMethod(null);
    setAmountPaid("");
    setIsMixed(false);
    setSubmitting(false);
    setError(null);
  }, [open]);

  if (!render) return null;

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) ?? null;

  const creditLimit = selectedCustomer ? Number(selectedCustomer.credit_limit) : 0;
  const creditUsed = selectedCustomer ? Number(selectedCustomer.outstanding_balance) : 0;
  const creditAvailable = selectedCustomer
    ? Math.max(0, creditLimit - creditUsed)
    : 0;
  const isHighCredit =
    selectedCustomer && creditLimit > 0 && creditUsed >= HIGH_CREDIT_THRESHOLD * creditLimit;

  const paidNumber = Number(amountPaid);
  const paidValid = Number.isFinite(paidNumber) && paidNumber >= 0;
  const change = paidValid ? paidNumber - total : 0;
  const showCalculator = paymentMethod === "CASH";
  const canShowMixedSwitch =
    paymentMethod === "CASH" &&
    paidValid &&
    paidNumber > 0 &&
    paidNumber < total &&
    !!selectedCustomerId;

  const effectiveMethod: SalePaymentMethod | null =
    paymentMethod === "CASH" && isMixed ? "MIXED" : paymentMethod;

  const canSubmit = (() => {
    if (!effectiveMethod || cart.length === 0 || submitting) return false;
    if (effectiveMethod === "CASH") return paidValid && paidNumber >= total;
    if (effectiveMethod === "MIXED")
      return paidValid && paidNumber > 0 && paidNumber < total && !!selectedCustomerId;
    if (effectiveMethod === "CREDIT") return !!selectedCustomerId;
    return true;
  })();

  const handleQuickCash = (value: number) => {
    setAmountPaid((prev) => ((parseFloat(prev || "0") || 0) + value).toString());
  };

  const handleSelectMethod = (m: MethodConfig) => {
    if (m.needsCustomer && !selectedCustomerId) return;
    setPaymentMethod(m.value);
    setIsMixed(false);
    setError(null);
    if (m.value !== "CASH") {
      setAmountPaid("");
    }
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!canSubmit || !effectiveMethod) return;
    setSubmitting(true);
    setError(null);

    const totalStr = total.toFixed(2);
    let amountPaidStr: string;
    switch (effectiveMethod) {
      case "CARD":
      case "TRANSFER":
        amountPaidStr = totalStr;
        break;
      case "CREDIT":
        amountPaidStr = "0";
        break;
      case "CASH":
      case "MIXED":
        amountPaidStr = paidNumber.toFixed(2);
        break;
    }

    const req: CreateSaleRequest = {
      payment_method: effectiveMethod,
      ...(selectedCustomerId ? { customer_id: selectedCustomerId } : {}),
      amount_paid: amountPaidStr,
      items: cart.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity.toString(),
        unit_price: i.unitPrice.toString(),
      })),
    };

    try {
      const sale = await createSale(req);
      const currentCart = usePosStore.getState().cart;
      const tenderedAmount =
        effectiveMethod === "CASH" || effectiveMethod === "MIXED" ? paidNumber : 0;
      clearCart();
      onSuccess(sale, tenderedAmount, currentCart);
    } catch (err) {
      setError(mapSalesError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => !submitting && onClose()}
      aria-hidden="true"
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className={`relative flex max-h-[95vh] w-full max-w-2xl transform flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-3xl ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="checkout-title" className="text-lg font-semibold text-slate-900">
            Cobrar venta
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total a pagar
            </p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight text-slate-900">
              {formatMoney(total)}
            </p>
            {selectedCustomer && (
              <span
                className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  isHighCredit
                    ? "bg-rose-50 text-rose-700"
                    : "bg-indigo-50 text-indigo-700"
                }`}
              >
                {isHighCredit && (
                  <AlertTriangle aria-hidden className="h-3 w-3" />
                )}
                {selectedCustomer.full_name} · Disponible {formatMoney(creditAvailable)}
              </span>
            )}
          </div>

          <fieldset className="mt-6">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Método de pago
            </legend>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {METHODS.map((m) => {
                const disabled = m.needsCustomer && !selectedCustomerId;
                const active = paymentMethod === m.value;
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleSelectMethod(m)}
                    disabled={disabled}
                    aria-pressed={active}
                    title={
                      disabled
                        ? "Selecciona un cliente para vender a crédito"
                        : undefined
                    }
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 md:py-6 ${
                      disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                        : active
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon aria-hidden className="h-7 w-7" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {showCalculator && (
            <div className="mt-6">
              <label
                htmlFor="amount-paid"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Monto recibido
              </label>
              <input
                id="amount-paid"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-6 text-center text-3xl font-bold text-slate-900 focus-visible:border-indigo-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
              />
              <div className="mt-4 flex flex-col gap-2">
                <div className="grid grid-cols-6 gap-2">
                  {QUICK_CASH.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleQuickCash(value)}
                      aria-label={`Sumar $${value}`}
                      className="h-12 rounded-lg bg-slate-100 font-semibold text-slate-800 transition-colors transition-transform active:scale-95 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    >
                      ${value}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountPaid(total.toFixed(2))}
                    aria-label="Monto exacto"
                    className="h-12 rounded-lg bg-indigo-600 font-semibold text-white transition-colors transition-transform active:scale-95 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    Exacto
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {QUICK_COINS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleQuickCash(value)}
                      aria-label={`Sumar $${value}`}
                      className="h-12 rounded-lg bg-slate-100 font-semibold text-slate-800 transition-colors transition-transform active:scale-95 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    >
                      ${value}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountPaid("")}
                    aria-label="Limpiar monto"
                    className="h-12 rounded-lg bg-rose-100 font-semibold text-rose-700 transition-colors transition-transform active:scale-95 hover:bg-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <div
                className="mt-3 text-center text-xl font-semibold"
                aria-live="polite"
              >
                {amountPaid === "" ? (
                  <span className="text-slate-400">Ingresa un monto</span>
                ) : !paidValid ? (
                  <span className="text-rose-600">Monto no válido</span>
                ) : change >= 0 ? (
                  <span className="text-emerald-600">
                    Cambio: {formatMoney(change)}
                  </span>
                ) : (
                  <span className="text-amber-600">
                    Falta: {formatMoney(-change)}
                  </span>
                )}
              </div>

              {canShowMixedSwitch && (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-indigo-300">
                  <input
                    type="checkbox"
                    checked={isMixed}
                    onChange={(e) => setIsMixed(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">
                      El resto a crédito (Pago Mixto)
                    </p>
                    <p className="text-xs text-slate-500">
                      Se cargará {formatMoney(total - paidNumber)} al saldo de
                      {" "}
                      {selectedCustomer?.full_name}
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}

          {paymentMethod === "CREDIT" && selectedCustomer && (
            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
              Se cargará {formatMoney(total)} al saldo de{" "}
              <span className="font-semibold">{selectedCustomer.full_name}</span>.
              Disponible tras la venta:{" "}
              <span className="font-semibold">
                {formatMoney(Math.max(0, creditAvailable - total))}
              </span>
              .
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-lg font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 aria-hidden className="h-5 w-5" />
                Confirmar venta · {formatMoney(total)}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
