import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const PRODUCTS_ERROR_MESSAGES: Record<string, string> = {
  product_not_found: "Producto no encontrado.",
  product_barcode_taken: "Ese código de barras ya está en uso.",
  validation_failed: "Revisa los campos resaltados e inténtalo de nuevo.",
  forbidden: "No tienes permisos para esta acción.",
  conflict: "No se puede completar la operación.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e inténtalo de nuevo.";
const GENERIC_ERROR = "Algo salió mal. Inténtalo de nuevo.";

export function mapProductsError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && PRODUCTS_ERROR_MESSAGES[code]) return PRODUCTS_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
