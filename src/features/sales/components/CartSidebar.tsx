import { useState } from "react";
import {
  AlertTriangle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { usePosStore, useCartItemCount, useCartTotal } from "../store/posStore";
import { usePosCustomers } from "../hooks/usePosCustomers";
import { formatMoney } from "../utils/format";
import { QuantityModal } from "./QuantityModal";
import type { CartItem } from "../types";
import type { CustomerResponse } from "../../customers/types";

interface CartSidebarProps {
  onCheckout: () => void;
  onClose?: () => void;
}

const HIGH_CREDIT_THRESHOLD = 0.9;

const creditAvailable = (c: CustomerResponse): number => {
  const limit = Number(c.credit_limit);
  const used = Number(c.outstanding_balance);
  if (!Number.isFinite(limit) || !Number.isFinite(used)) return 0;
  return Math.max(0, limit - used);
};

const isHighCredit = (c: CustomerResponse): boolean => {
  const limit = Number(c.credit_limit);
  const used = Number(c.outstanding_balance);
  if (!Number.isFinite(limit) || limit <= 0) return false;
  return used >= HIGH_CREDIT_THRESHOLD * limit;
};

const formatQty = (item: CartItem): string => {
  if (item.unitOfMeasure === "KILO") return `${item.quantity.toFixed(3)} kg`;
  return Number.isInteger(item.quantity)
    ? `${item.quantity} pz`
    : `${item.quantity.toFixed(1)} pz`;
};

export const CartSidebar = ({ onCheckout, onClose }: CartSidebarProps) => {
  const cart = usePosStore((s) => s.cart);
  const selectedCustomerId = usePosStore((s) => s.selectedCustomerId);
  const updateItemQuantity = usePosStore((s) => s.updateItemQuantity);
  const removeItem = usePosStore((s) => s.removeItem);
  const setCustomer = usePosStore((s) => s.setCustomer);
  const clearCart = usePosStore((s) => s.clearCart);
  const total = useCartTotal();
  const itemCount = useCartItemCount();

  const { customers, loading: customersLoading } = usePosCustomers();
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) ?? null;

  const handleDecrement = (item: CartItem) => {
    if (item.unitOfMeasure === "KILO") {
      // Flat −1 would corrupt a weighed fraction (e.g. 0.750 kg). Reuse the
      // QuantityModal flow so the cashier types the corrected weight.
      setEditingItem(item);
      return;
    }
    if (item.quantity <= 1) {
      removeItem(item.productId);
    } else {
      updateItemQuantity(item.productId, item.quantity - 1);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white shadow-[-8px_0_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4 md:px-5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Ticket actual</h2>
          {itemCount > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {itemCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && !confirmClear && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              aria-label="Limpiar carrito"
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Limpiar
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar carrito"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:hidden"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {confirmClear && (
        <div
          role="alertdialog"
          aria-label="Confirmar vaciar carrito"
          className="flex items-center justify-between gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>¿Vaciar el carrito?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                clearCart();
                setConfirmClear(false);
              }}
              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Sí, vaciar
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200 px-4 py-3 md:px-5">
        <label
          htmlFor="pos-customer"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          Cliente
        </label>
        <div className="relative">
          <UserRound
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <select
            id="pos-customer"
            value={selectedCustomerId ?? ""}
            onChange={(e) => setCustomer(e.target.value || null)}
            disabled={customersLoading}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-700 shadow-sm focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:opacity-50"
          >
            <option value="">Público (sin crédito)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>
        {selectedCustomer && (
          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isHighCredit(selectedCustomer)
                ? "bg-rose-50 text-rose-700"
                : "bg-indigo-50 text-indigo-700"
            }`}
            aria-label={
              isHighCredit(selectedCustomer)
                ? "Cliente cerca de su límite de crédito"
                : `Crédito disponible ${formatMoney(creditAvailable(selectedCustomer))}`
            }
          >
            {isHighCredit(selectedCustomer) && (
              <AlertTriangle aria-hidden className="h-3 w-3" />
            )}
            Disponible: {formatMoney(creditAvailable(selectedCustomer))}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
            <ShoppingCart aria-hidden className="h-10 w-10" />
            <p className="text-sm font-medium">El carrito está vacío</p>
            <p className="text-xs">Toca un producto para agregarlo</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cart.map((item) => (
              <li key={item.productId} className="px-4 py-3 md:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-slate-900"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatMoney(item.unitPrice)} c/u
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatMoney(item.subtotal)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDecrement(item)}
                      aria-label={`Disminuir cantidad de ${item.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      <Minus aria-hidden className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      aria-label={`Editar cantidad de ${item.name}`}
                      title="Clic para editar cantidad"
                      className="min-w-14 rounded-lg px-2 py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    >
                      {formatQty(item)}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateItemQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label={`Aumentar cantidad de ${item.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      <Plus aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 md:px-5">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatMoney(total)}</span>
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-sm font-medium text-slate-600">Total</span>
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {formatMoney(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-4 text-lg font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.99] active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cart.length === 0 ? "Carrito vacío" : `Cobrar ${formatMoney(total)}`}
        </button>
      </div>

      <QuantityModal
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onConfirm={(value) => {
          if (editingItem) updateItemQuantity(editingItem.productId, value);
          setEditingItem(null);
        }}
        initialValue={editingItem?.quantity ?? 1}
        unitOfMeasure={editingItem?.unitOfMeasure ?? "PIECE"}
        productName={editingItem?.name ?? ""}
      />
    </div>
  );
};
