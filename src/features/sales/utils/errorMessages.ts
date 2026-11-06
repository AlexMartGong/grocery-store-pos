import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const SALES_ERROR_MESSAGES: Record<string, string> = {
  invalid_mixed_payment:
    "El pago mixto requiere un monto pagado mayor a 0 y menor al total de la venta.",
  credit_limit_exceeded: "El cliente excedería su límite de crédito con esta venta.",
  customer_required: "Selecciona un cliente para ventas a crédito o mixtas.",
  product_not_found: "Uno de los productos del carrito no existe o está inactivo.",
  customer_not_found: "El cliente seleccionado no existe.",
  insufficient_stock: "Uno de los productos del carrito no tiene stock suficiente.",
  conflict: "La operación fue rechazada por el servidor (posible inconsistencia de stock).",
  validation_failed: "Revisa los datos de la venta y vuelve a intentar.",
  forbidden: "No tienes permiso para registrar ventas.",
  sale_not_found: "La venta ya no existe o pertenece a otra tienda.",
  sale_already_canceled: "Esta venta ya fue cancelada previamente.",
};

/**
 * Codes whose backend `message` is written in Spanish for the cashier and names the culprit
 * (`Stock insuficiente para "X": disponible 1, solicitado 3.`), so it wins over the static text.
 * Every other `InvalidResourceStateException` code sends an English message — keep those map-first.
 */
const PREFER_SERVER_MESSAGE = new Set(["insufficient_stock"]);

const NETWORK_ERROR = "Error de red. Verifica tu conexión e intenta de nuevo.";
const GENERIC_ERROR = "Ocurrió un error al procesar la venta. Intenta de nuevo.";

export function mapSalesError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    const message = err.response.data?.message;
    if (code && message && PREFER_SERVER_MESSAGE.has(code)) return message;
    if (code && SALES_ERROR_MESSAGES[code]) return SALES_ERROR_MESSAGES[code];
    if (message) return message;
  }
  return GENERIC_ERROR;
}

export function isInsufficientStockError(err: unknown): boolean {
  return (
    axios.isAxiosError<ApiErrorResponse>(err) &&
    err.response?.data?.error === "insufficient_stock"
  );
}
