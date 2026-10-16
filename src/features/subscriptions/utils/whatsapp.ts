import { formatBillingDate, formatMoney } from "./format";
import type { UpcomingBillingResponse } from "../types";

const MEXICO_COUNTRY_CODE = "52";
const NATIONAL_NUMBER_LENGTH = 10;

/**
 * Builds a wa.me deep link, or `null` when the store has no usable number so the caller can
 * disable the action instead of opening a broken chat.
 *
 * Stored numbers are free-text (`stores.whatsapp` is a plain VARCHAR(20)), so they arrive with
 * spaces, dashes, a leading `+`, and sometimes the country code already attached — prefixing
 * blindly would produce `525255...`.
 */
export const buildWhatsAppUrl = (
  whatsapp: string | null | undefined,
  message: string,
): string | null => {
  if (!whatsapp) return null;

  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < NATIONAL_NUMBER_LENGTH) return null;

  const e164 =
    digits.length === NATIONAL_NUMBER_LENGTH ? `${MEXICO_COUNTRY_CODE}${digits}` : digits;

  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
};

/** Pre-filled renewal notice for a due subscription. */
export const renewalNotice = (billing: UpcomingBillingResponse): string =>
  `Hola ${billing.store_name}, te recordamos que tu suscripción del sistema de punto de venta ` +
  `vence el ${formatBillingDate(billing.next_billing_date)} por ${formatMoney(billing.amount_due)}. ` +
  `¿Te apoyamos con el pago?`;
