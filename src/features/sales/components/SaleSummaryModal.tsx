import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import type { SalePaymentMethod, SaleResponse } from "../types";
import { formatMoney, formatSaleDate, formatSaleId } from "../utils/format";

interface SaleSummaryModalProps {
  sale: SaleResponse | null;
  onClose: () => void;
}

const METHOD_LABEL: Record<SalePaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

export const SaleSummaryModal = ({ sale, onClose }: SaleSummaryModalProps) => {
  const open = sale != null;
  const [render, setRender] = useState(open);
  const [show, setShow] = useState(false);
  const [cached, setCached] = useState<SaleResponse | null>(sale);

  useEffect(() => {
    if (!sale) return;
    const raf = requestAnimationFrame(() => setCached(sale));
    return () => cancelAnimationFrame(raf);
  }, [sale]);

  useEffect(() => {
    if (open) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setRender(true);
        raf2 = requestAnimationFrame(() => setShow(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    const raf = requestAnimationFrame(() => setShow(false));
    const t = setTimeout(() => setRender(false), 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [render, onClose]);

  const current = sale ?? cached;
  if (!render || !current) return null;
  const showCredit =
    current.payment_method === "CREDIT" || current.payment_method === "MIXED";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-summary-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[95vh] w-full max-w-lg transform flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-3xl ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="sale-summary-title" className="text-lg font-semibold text-slate-900">
              Ticket de venta
            </h2>
            <p className="text-xs text-slate-500">
              #{formatSaleId(current.id)} · {formatSaleDate(current.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Método
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {METHOD_LABEL[current.payment_method]}
            </span>
          </div>

          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
            {current.items.map((item) => {
              const qty = Number(item.quantity);
              const price = Number(item.unit_price);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      {Number.isFinite(qty) ? qty : item.quantity} ×{" "}
                      {formatMoney(price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatMoney(item.subtotal)}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Total</dt>
              <dd className="font-semibold text-slate-900">
                {formatMoney(current.total_amount)}
              </dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Pagado</dt>
              <dd>{formatMoney(current.amount_paid)}</dd>
            </div>
            {showCredit && (
              <div className="flex justify-between text-amber-700">
                <dt>A crédito</dt>
                <dd className="font-semibold">
                  {formatMoney(current.amount_credited)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <Printer aria-hidden className="h-4 w-4" />
            Imprimir ticket
          </button>
        </div>
      </div>
    </div>
  );
};
