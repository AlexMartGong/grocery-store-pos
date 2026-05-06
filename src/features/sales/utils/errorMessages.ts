import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const SALES_ERROR_MESSAGES: Record<string, string> = {
  invalid_mixed_payment:
    "El pago mixto requiere un monto pagado mayor a 0 y menor al total de la venta.",
  credit_limit_exceeded: "El cliente excedería su límite de crédito con esta venta.",
  customer_required: "Selecciona un cliente para ventas a crédito o mixtas.",
  product_not_found: "Uno de los productos del carrito no existe o está inactivo.",
  customer_not_found: "El cliente seleccionado no existe.",
  conflict: "La operación fue rechazada por el servidor (posible inconsistencia de stock).",
  validation_failed: "Revisa los datos de la venta y vuelve a intentar.",
  forbidden: "No tienes permiso para registrar ventas.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e intenta de nuevo.";
const GENERIC_ERROR = "Ocurrió un error al procesar la venta. Intenta de nuevo.";

export function mapSalesError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && SALES_ERROR_MESSAGES[code]) return SALES_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
