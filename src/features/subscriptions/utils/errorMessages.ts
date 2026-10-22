import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

// Codes for the admin subscription endpoints (/admin/plans, /admin/subscriptions/*,
// /admin/stores/:id/subscription). The backend's ErrorResponse.message is always null, so this
// map is the only source of user-facing text — every message here has to stand on its own.
export const SUBSCRIPTIONS_ERROR_MESSAGES: Record<string, string> = {
  plan_not_found: "Ese plan ya no está disponible. Recarga el catálogo e inténtalo de nuevo.",
  subscription_not_found: "La tienda no tiene una suscripción activa.",
  station_limit_exceeded:
    "La tienda tiene más cajas activas de las que permite este plan. Desactiva cajas o elige un plan superior.",
  store_not_found: "No se encontró la tienda.",
  validation_failed: "Revisa los campos marcados e inténtalo de nuevo.",
  forbidden: "No tienes permiso para esta acción.",
  conflict: "La suscripción cambió mientras editabas. Recarga e inténtalo de nuevo.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e inténtalo de nuevo.";
const GENERIC_ERROR = "Algo salió mal. Inténtalo de nuevo.";

export function mapSubscriptionsError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && SUBSCRIPTIONS_ERROR_MESSAGES[code]) return SUBSCRIPTIONS_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
