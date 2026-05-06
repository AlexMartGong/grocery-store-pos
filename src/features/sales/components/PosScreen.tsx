import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
import { CartSidebar } from "./CartSidebar";
import { CheckoutModal } from "./CheckoutModal";
import { SaleSummaryModal } from "./SaleSummaryModal";
import { useCartItemCount, useCartTotal } from "../store/posStore";
import { formatMoney, formatSaleId } from "../utils/format";
import type { SaleResponse } from "../types";

export const PosScreen = () => {
  const itemCount = useCartItemCount();
  const total = useCartTotal();

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cartDrawerOpen]);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 6000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  const openCheckout = () => {
    setCartDrawerOpen(false);
    setCheckoutOpen(true);
  };

  const handleSaleSuccess = (sale: SaleResponse) => {
    setLastSale(sale);
    setCheckoutOpen(false);
    setToastVisible(true);
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col bg-slate-50 md:-m-8 md:flex-row">
      <section className="relative flex-1 overflow-hidden">
        <ProductGrid />
      </section>

      <aside className="hidden w-96 shrink-0 border-l border-slate-200 md:flex md:flex-col">
        <CartSidebar onCheckout={openCheckout} />
      </aside>

      {itemCount > 0 && !cartDrawerOpen && (
        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          aria-label={`Abrir carrito con ${itemCount} artículos, total ${formatMoney(total)}`}
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-slate-900 px-4 py-4 text-white shadow-2xl transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 md:hidden"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag aria-hidden className="h-5 w-5" />
            <span className="font-semibold">
              Carrito ({itemCount} {itemCount === 1 ? "artículo" : "artículos"})
            </span>
          </span>
          <span className="text-lg font-extrabold">{formatMoney(total)}</span>
        </button>
      )}

      <div
        className={`fixed inset-0 z-40 md:hidden ${
          cartDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        role="presentation"
        aria-hidden={!cartDrawerOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ease-out ${
            cartDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setCartDrawerOpen(false)}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ticket actual"
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            cartDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <CartSidebar
            onCheckout={openCheckout}
            onClose={() => setCartDrawerOpen(false)}
          />
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleSaleSuccess}
      />

      <SaleSummaryModal
        sale={summaryOpen ? lastSale : null}
        onClose={() => setSummaryOpen(false)}
      />

      {toastVisible && lastSale && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg"
        >
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0" />
          <div className="flex items-center gap-3 text-sm">
            <p className="font-semibold">
              Venta #{formatSaleId(lastSale.id)} registrada
            </p>
            <button
              type="button"
              onClick={() => {
                setSummaryOpen(true);
                setToastVisible(false);
              }}
              className="rounded-md bg-emerald-700 px-3 py-1.5 font-medium transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Ver ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
