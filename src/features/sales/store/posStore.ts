import { create } from "zustand";
import type { CartItem, UnitOfMeasure } from "../types";

interface ProductForCart {
  id: string;
  name: string;
  barcode: string | null;
  sale_price: string;
  unit_of_measure: UnitOfMeasure;
  current_stock: string;
}

interface PosState {
  cart: CartItem[];
  selectedCustomerId: string | null;
  /** `false` (cart untouched) when the line total would exceed the product's stock. */
  addItem: (product: ProductForCart, quantity?: number) => boolean;
  /**
   * `false` (cart untouched) for a non-positive quantity, a missing line or an **increase** above
   * its stock. Decreases always pass, so a line left over stock by `syncStock` can be reduced.
   */
  updateItemQuantity: (productId: string, quantity: number) => boolean;
  /** Refreshes `currentStock` of the matching lines; quantities are never touched. */
  syncStock: (products: ReadonlyArray<Pick<ProductForCart, "id" | "current_stock">>) => void;
  removeItem: (productId: string) => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
}

const sanitizeQty = (value: number) => Number(value.toFixed(3));
const sanitizePrice = (value: number) => Number(value.toFixed(2));

/**
 * UX pre-check only — the backend (`insufficient_stock`) stays the source of truth. Compared at
 * 3 decimals so float drift (0.1 + 0.2) never rejects a legal quantity. Non-finite stock fails open.
 */
export const exceedsStock = (lineQty: number, stock: number): boolean =>
  Number.isFinite(stock) && sanitizeQty(lineQty) > sanitizeQty(stock);

/** How much more of a product fits in the cart given what is already there. */
export const remainingStock = (stock: number, inCart: number): number =>
  Number.isFinite(stock) ? Math.max(0, sanitizeQty(stock - inCart)) : 0;

export const usePosStore = create<PosState>()((set, get) => ({
  cart: [],
  selectedCustomerId: null,
  addItem: (product, quantity = 1) => {
    const currentStock = Number(product.current_stock);
    const existing = get().cart.find((i) => i.productId === product.id);
    const newQty = sanitizeQty((existing?.quantity ?? 0) + quantity);
    if (exceedsStock(newQty, currentStock)) return false;
    if (existing) {
      // Refresh the stock snapshot: a new scan/fetch is fresher than the one already in the cart.
      set((state) => ({
        cart: state.cart.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: newQty,
                subtotal: sanitizePrice(newQty * i.unitPrice),
                currentStock,
              }
            : i,
        ),
      }));
      return true;
    }
    const unitPrice = Number(product.sale_price);
    set((state) => ({
      cart: [
        ...state.cart,
        {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          quantity: newQty,
          unitPrice,
          subtotal: sanitizePrice(newQty * unitPrice),
          unitOfMeasure: product.unit_of_measure,
          currentStock,
        },
      ],
    }));
    return true;
  },
  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) return false;
    const item = get().cart.find((i) => i.productId === productId);
    if (!item) return false;
    const safeQty = sanitizeQty(quantity);
    if (safeQty > item.quantity && exceedsStock(safeQty, item.currentStock)) return false;
    set((state) => ({
      cart: state.cart.map((i) =>
        i.productId === productId
          ? { ...i, quantity: safeQty, subtotal: sanitizePrice(safeQty * i.unitPrice) }
          : i,
      ),
    }));
    return true;
  },
  syncStock: (products) =>
    set((state) => {
      const fresh = new Map(products.map((p) => [p.id, Number(p.current_stock)]));
      let changed = false;
      const cart = state.cart.map((i) => {
        const stock = fresh.get(i.productId);
        if (stock === undefined || !Number.isFinite(stock) || stock === i.currentStock) return i;
        changed = true;
        return { ...i, currentStock: stock };
      });
      // Same state on a no-op sync, so subscribers don't re-render.
      return changed ? { cart } : state;
    }),
  removeItem: (productId) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.productId !== productId),
    })),
  setCustomer: (customerId) => set({ selectedCustomerId: customerId }),
  clearCart: () => set({ cart: [], selectedCustomerId: null }),
}));

export const useCartTotal = () =>
  usePosStore((s) => sanitizePrice(s.cart.reduce((sum, i) => sum + i.subtotal, 0)));

export const useCartItemCount = () =>
  usePosStore((s) => Number(s.cart.reduce((sum, i) => sum + i.quantity, 0).toFixed(3)));

export type { ProductForCart };
