const RTF = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });

const FALLBACK_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const ts = d.getTime();
  if (Number.isNaN(ts) || ts <= 0) return "";

  const diffSec = Math.round((Date.now() - ts) / 1000);
  if (diffSec < 30) return "hace un momento";
  if (diffSec < 60) return RTF.format(-diffSec, "second");

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return RTF.format(-diffMin, "minute");

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return RTF.format(-diffHour, "hour");

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return RTF.format(-diffDay, "day");

  return FALLBACK_FMT.format(d);
};
