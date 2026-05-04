import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const INVENTORY_ERROR_MESSAGES: Record<string, string> = {
  product_not_found: "Producto no encontrado.",
  reason_not_allowed: "Motivo no permitido para ajuste manual.",
  validation_failed: "Revisa los campos del ajuste.",
  forbidden: "No tienes permisos para esta acción.",
  conflict: "No se puede completar el ajuste.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e inténtalo de nuevo.";
const GENERIC_ERROR = "Algo salió mal. Inténtalo de nuevo.";

export function mapInventoryError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && INVENTORY_ERROR_MESSAGES[code]) return INVENTORY_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
