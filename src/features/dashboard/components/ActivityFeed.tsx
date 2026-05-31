import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Activity, AlertCircle, Loader2, Tag } from "lucide-react";
import { getAuditLogs } from "../api/dashboardApi";
import type { AuditLogResponse } from "../types";
import { formatRelativeTime } from "../../notifications/utils/relativeTime";

const mapAuditError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const code = err.response?.data?.error as string | undefined;
    if (code === "forbidden") return "No tienes permiso para ver la actividad.";
  }
  return "No se pudo cargar la actividad reciente.";
};

const ItemIcon = ({ action }: { action: string }) => {
  const Icon = action === "PRICE_CHANGED" ? Tag : Activity;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
      <Icon size={16} aria-hidden />
    </span>
  );
};

const ItemBody = ({ log }: { log: AuditLogResponse }) => {
  if (log.action === "PRICE_CHANGED") {
    const oldPrice = String(log.details.oldPrice ?? "");
    const newPrice = String(log.details.newPrice ?? "");
    return (
      <p className="text-sm text-gray-700">
        <span className="font-medium text-gray-900">{log.userName}</span> actualizó un precio de{" "}
        <span className="line-through text-gray-500">${oldPrice}</span> a{" "}
        <span className="font-semibold text-emerald-600">${newPrice}</span>
      </p>
    );
  }
  return (
    <p className="text-sm text-gray-700">
      <span className="font-medium text-gray-900">{log.userName}</span> · {log.action} en{" "}
      {log.entityType}
    </p>
  );
};

export const ActivityFeed = () => {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs();
      setLogs(data.content);
    } catch (err) {
      setError(mapAuditError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
      <header className="mb-4 flex items-center gap-2">
        <Activity size={18} className="text-slate-500" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">Actividad Reciente</h2>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 size={22} className="animate-spin" aria-label="Cargando" />
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">Sin actividad reciente</p>
      )}

      {!loading && !error && logs.length > 0 && (
        <ul className="space-y-4">
          {logs.map((log) => (
            <li key={log.id} className="flex items-start gap-3">
              <ItemIcon action={log.action} />
              <div className="min-w-0 flex-1">
                <ItemBody log={log} />
                <span className="text-xs text-slate-400">{formatRelativeTime(log.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
