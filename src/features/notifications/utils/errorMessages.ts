import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const NOTIFICATIONS_ERROR_MESSAGES: Record<string, string> = {
  notification_not_found: "La notificación ya no existe.",
  forbidden: "No tienes permiso para gestionar notificaciones.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e intenta de nuevo.";
const GENERIC_ERROR = "Ocurrió un error con las notificaciones. Intenta de nuevo.";

export function mapNotificationsError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && NOTIFICATIONS_ERROR_MESSAGES[code]) return NOTIFICATIONS_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
