import { create } from "zustand";
import type { CartItem, UnitOfMeasure } from "../types";

interface ProductForCart {
  id: string;
  name: string;
  barcode: string | null;
  sale_price: string;
  unit_of_measure: UnitOfMeasure;
}

interface PosState {
  cart: CartItem[];
  selectedCustomerId: string | null;
  addItem: (product: ProductForCart, quantity?: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
}

const sanitizeQty = (value: number) => Number(value.toFixed(3));
const sanitizePrice = (value: number) => Number(value.toFixed(2));

export const usePosStore = create<PosState>()((set) => ({
  cart: [],
  selectedCustomerId: null,
  addItem: (product, quantity = 1) =>
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = sanitizeQty(existing.quantity + quantity);
        return {
          cart: state.cart.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: newQty, subtotal: sanitizePrice(newQty * i.unitPrice) }
              : i,
          ),
        };
      }
      const unitPrice = Number(product.sale_price);
      const safeQty = sanitizeQty(quantity);
      return {
        cart: [
          ...state.cart,
          {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            quantity: safeQty,
            unitPrice,
            subtotal: sanitizePrice(safeQty * unitPrice),
            unitOfMeasure: product.unit_of_measure,
          },
        ],
      };
    }),
  updateItemQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) return state;
      const safeQty = sanitizeQty(quantity);
      return {
        cart: state.cart.map((i) =>
          i.productId === productId
            ? { ...i, quantity: safeQty, subtotal: sanitizePrice(safeQty * i.unitPrice) }
            : i,
        ),
      };
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
