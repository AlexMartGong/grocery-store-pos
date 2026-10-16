// Local formatters, duplicated rather than imported cross-feature — same policy as ProductsList's
// own formatMoney and ProductKardexModal's formatDate.

export const formatMoney = (value: string | number): string => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

const DATE_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Formats an ISO LocalDate ("2026-08-14"). `timeZone: "UTC"` is load-bearing: `new Date` parses a
 * bare date as UTC midnight, which renders as the *previous* day in America/Mexico_City.
 * `formatSaleDate` in sales/utils/format.ts handles timestamps, not date-only strings.
 */
export const formatBillingDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return DATE_FMT.format(d);
};

/** Whole days from today to `iso`. Negative when already past due, 0 when it falls today. */
export const daysUntil = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const target = new Date(iso);
  if (!Number.isFinite(target.getTime())) return null;
  // Compare UTC midnights on both sides so a timezone offset can never shift the count by a day.
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - todayUtc) / 86_400_000);
};
