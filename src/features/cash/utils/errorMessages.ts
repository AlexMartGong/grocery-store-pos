import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const CASH_SHIFT_ERROR_MESSAGES: Record<string, string> = {
  shift_already_open: "Ya hay una caja abierta para este usuario.",
  open_shift_not_found: "No hay una caja abierta.",
  validation_failed: "Revisa los datos del turno e intenta de nuevo.",
  forbidden: "No tienes permiso para gestionar la caja.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e intenta de nuevo.";
const GENERIC_ERROR = "Ocurrió un error al procesar la caja. Intenta de nuevo.";

export function mapCashShiftError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && CASH_SHIFT_ERROR_MESSAGES[code]) return CASH_SHIFT_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
