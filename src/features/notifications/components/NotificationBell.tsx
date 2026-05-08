import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Loader2, RotateCcw } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import { NotificationItem } from "./NotificationItem";

export const NotificationBell = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const fetchUnread = useNotificationStore((s) => s.fetchUnread);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const clearError = useNotificationStore((s) => s.clearError);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={
            unreadCount > 0
              ? `Notificaciones, ${unreadCount} sin leer`
              : "Notificaciones"
          }
          aria-haspopup="menu"
          aria-expanded={open}
          className="relative flex items-center rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-5 text-white"
            >
              {badgeText}
            </span>
          )}
        </button>

        {open && (
          <div
            role="menu"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white shadow-xl md:absolute md:inset-auto md:bottom-auto md:right-0 md:mt-2 md:max-h-96 md:w-96 md:rounded-xl md:border"
          >
            <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-slate-300 md:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Notificaciones</h3>
              <button
                type="button"
                onClick={() => void fetchUnread()}
                disabled={isLoading}
                aria-label="Actualizar notificaciones"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-start justify-between gap-2 border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            <div className="overflow-y-auto md:max-h-96" style={{ maxHeight: "calc(85vh - 52px)" }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-slate-400">
                  <BellOff size={28} aria-hidden="true" />
                  <p className="text-sm">Sin notificaciones nuevas</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={(id) => void markAsRead(id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
