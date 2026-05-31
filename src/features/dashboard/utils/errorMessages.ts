import axios from "axios";
import type { ApiErrorResponse } from "../../auth/types";

export const DASHBOARD_ERROR_MESSAGES: Record<string, string> = {
  forbidden: "No tienes permiso para ver el dashboard.",
};

const NETWORK_ERROR = "Error de red. Verifica tu conexión e inténtalo de nuevo.";
const GENERIC_ERROR = "No se pudo cargar el dashboard. Inténtalo de nuevo.";

export function mapDashboardError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && DASHBOARD_ERROR_MESSAGES[code]) return DASHBOARD_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
