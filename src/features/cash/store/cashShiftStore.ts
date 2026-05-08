import { create } from "zustand";
import { closeShift, getCurrentShift, openShift } from "../api/cashApi";
import type { CashShiftResponse } from "../types";
import { mapCashShiftError } from "../utils/errorMessages";

interface CashShiftState {
  currentShift: CashShiftResponse | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchCurrentShift: () => Promise<void>;
  open: (opening_balance: string) => Promise<boolean>;
  close: (real_balance: string, notes?: string) => Promise<CashShiftResponse | null>;
  clearCurrentShift: () => void;
  clearError: () => void;
  reset: () => void;
}

const INITIAL = {
  currentShift: null,
  isLoading: false,
  error: null,
  hasFetched: false,
} as const;

export const useCashShiftStore = create<CashShiftState>()((set) => ({
  ...INITIAL,
  fetchCurrentShift: async () => {
    set({ isLoading: true, error: null });
    try {
      const shift = await getCurrentShift();
      set({ currentShift: shift, hasFetched: true, isLoading: false });
    } catch (err) {
      set({
        error: mapCashShiftError(err),
        hasFetched: true,
        isLoading: false,
      });
    }
  },
  open: async (opening_balance) => {
    set({ isLoading: true, error: null });
    try {
      const shift = await openShift(opening_balance);
      set({ currentShift: shift, isLoading: false });
      return true;
    } catch (err) {
      set({ error: mapCashShiftError(err), isLoading: false });
      return false;
    }
  },
  close: async (real_balance, notes) => {
    set({ isLoading: true, error: null });
    try {
      const closed = await closeShift(real_balance, notes);
      set({ isLoading: false });
      return closed;
    } catch (err) {
      set({ error: mapCashShiftError(err), isLoading: false });
      return null;
    }
  },
  clearCurrentShift: () => set({ currentShift: null, error: null }),
  clearError: () => set({ error: null }),
  reset: () => set({ ...INITIAL }),
}));
