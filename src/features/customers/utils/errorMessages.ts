import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const CUSTOMERS_ERROR_MESSAGES: Record<string, string> = {
  customer_not_found: "Cliente no encontrado.",
  validation_failed: "Revisa los campos marcados e intenta de nuevo.",
  forbidden: "No tienes permiso para esta acción.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión.";
const GENERIC_ERROR = "Ocurrió un error. Intenta de nuevo.";

export function mapCustomersError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && CUSTOMERS_ERROR_MESSAGES[code]) return CUSTOMERS_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
