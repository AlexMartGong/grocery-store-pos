import { create } from "zustand";
import type { CartItem } from "../types";

interface ProductForCart {
  id: string;
  name: string;
  barcode: string | null;
  sale_price: string;
}

interface PosState {
  cart: CartItem[];
  selectedCustomerId: string | null;
  addItem: (product: ProductForCart) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>()((set) => ({
  cart: [],
  selectedCustomerId: null,
  addItem: (product) =>
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  subtotal: (i.quantity + 1) * i.unitPrice,
                }
              : i,
          ),
        };
      }
      const unitPrice = Number(product.sale_price);
      return {
        cart: [
          ...state.cart,
          {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            quantity: 1,
            unitPrice,
            subtotal: unitPrice,
          },
        ],
      };
    }),
  updateItemQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) return state;
      return {
        cart: state.cart.map((i) =>
          i.productId === productId
            ? { ...i, quantity, subtotal: quantity * i.unitPrice }
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
  usePosStore((s) => s.cart.reduce((sum, i) => sum + i.subtotal, 0));

export const useCartItemCount = () =>
  usePosStore((s) => s.cart.reduce((sum, i) => sum + i.quantity, 0));
