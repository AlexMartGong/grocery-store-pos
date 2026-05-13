import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Printer, Wifi, X } from "lucide-react";
import type { CartItem, SalePaymentMethod, SaleResponse } from "../types";
import { formatMoney, formatSaleDate, formatSaleId } from "../utils/format";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import { printTicket } from "../../../shared/api/agentApi";
import { mapSaleToTicketDTO } from "../utils/ticketAdapter";
import { playBeep, playErrorBeep, vibrate } from "../../../shared/utils/feedback";
import { useSettingsStore } from "../../settings/store/settingsStore";

interface SaleSummaryModalProps {
  sale: SaleResponse | null;
  tenderedAmount?: number;
  cartItems?: CartItem[];
  onClose: () => void;
  onPrintFeedback?: (ok: boolean, message: string) => void;
  employeeName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
}

const METHOD_LABEL: Record<SalePaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

export const SaleSummaryModal = ({
  sale,
  tenderedAmount,
  cartItems,
  onClose,
  onPrintFeedback,
  employeeName,
  customerName,
  customerPhone,
}: SaleSummaryModalProps) => {
  const open = sale != null;
  const [cached, setCached] = useState<SaleResponse | null>(sale);
  const [isPrinting, setIsPrinting] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { render, show } = useModalAnimation(open, { onClose });

  useEffect(() => {
    if (!sale) return;
    const raf = requestAnimationFrame(() => setCached(sale));
    return () => cancelAnimationFrame(raf);
  }, [sale]);

  const current = sale ?? cached;
  if (!render || !current) return null;

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const dto = mapSaleToTicketDTO(current, cartItems ?? [], {
        cashReceived: tenderedAmount,
        employeeName,
        customerName,
        customerPhone,
      });
      const res = await printTicket(dto);
      if (res.success) {
        setNetworkError(false);
        playBeep();
        vibrate(50);
        onPrintFeedback?.(true, `Ticket #${res.ticketId} impreso`);
      } else {
        playErrorBeep();
        vibrate([60, 50, 60]);
        onPrintFeedback?.(
          false,
          `Error de impresión: ${res.error ?? "desconocido"}`,
        );
      }
    } catch (err) {
      playErrorBeep();
      vibrate([60, 50, 60]);
      if (axios.isAxiosError(err) && err.code === "ERR_NETWORK") {
        setNetworkError(true);
      }
      onPrintFeedback?.(false, "No se pudo conectar al agente local");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleAutoDiscover = async () => {
    setIsScanning(true);
    try {
      const ok = await useSettingsStore.getState().autoDiscoverAgent();
      if (ok) {
        setNetworkError(false);
        onPrintFeedback?.(true, "Caja encontrada. Reintentando...");
        await handlePrint();
      } else {
        onPrintFeedback?.(false, "No se encontró ninguna caja en la red local");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const showCredit =
    current.payment_method === "CREDIT" || current.payment_method === "MIXED";
  const showCash =
    (current.payment_method === "CASH" || current.payment_method === "MIXED") &&
    (tenderedAmount ?? 0) > 0;
  const showChange =
    current.payment_method === "CASH" &&
    (tenderedAmount ?? 0) > Number(current.total_amount);

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
            disabled={isScanning}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
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
              const name =
                cartItems?.find((c) => c.productId === item.product_id)?.name ?? "Producto";
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">
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
            {showCredit && (
              <div className="flex justify-between text-amber-700">
                <dt>A crédito</dt>
                <dd className="font-semibold">
                  {formatMoney(current.amount_credited)}
                </dd>
              </div>
            )}
            {showCash && (
              <div className="flex justify-between text-slate-600">
                <dt>Efectivo recibido</dt>
                <dd>{formatMoney(tenderedAmount ?? 0)}</dd>
              </div>
            )}
            {showChange && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Cambio</dt>
                <dd className="font-bold text-emerald-600">
                  {formatMoney((tenderedAmount ?? 0) - Number(current.total_amount))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isScanning}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar
          </button>
          {networkError && (
            <button
              type="button"
              onClick={() => void handleAutoDiscover()}
              disabled={isScanning || isPrinting}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isScanning ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi aria-hidden className="h-4 w-4" />
              )}
              {isScanning ? "Buscando..." : "Buscar caja en la red"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handlePrint()}
            disabled={isPrinting || isScanning}
            className="flex w-40 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPrinting ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Printer aria-hidden className="h-4 w-4" />
            )}
            {isPrinting ? "Imprimiendo..." : "Imprimir ticket"}
          </button>
        </div>
      </div>
    </div>
  );
};
