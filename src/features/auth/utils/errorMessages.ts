import axios from "axios";
import type { ApiErrorResponse } from "../types";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Usuario o contraseña incorrectos.",
  store_inactive:
    "El acceso a esta tienda se encuentra suspendido. Por favor, comunícate con el administrador para restablecer el servicio.",
  store_not_found: "Tienda no encontrada. Verifica el código de la tienda.",
  validation_failed: "Revisa los campos marcados e intenta de nuevo.",
  conflict: "La solicitud entra en conflicto con el estado actual.",
};

const NETWORK_ERROR =
  "Error de red. Verifica tu conexión e intenta de nuevo.";
const GENERIC_ERROR = "Algo salió mal. Intenta de nuevo.";

export function mapAuthError(err: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    if (!err.response) return NETWORK_ERROR;
    const code = err.response.data?.error;
    if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
    if (err.response.data?.message) return err.response.data.message;
  }
  return GENERIC_ERROR;
}
